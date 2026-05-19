"""
DineFlow — FastAPI application entrypoint.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

OpenAPI docs at:    http://localhost:8000/docs
ReDoc at:           http://localhost:8000/redoc
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import (
    get_all_orders,
    get_todays_orders,
    init_db,
    save_order,
)
from menu import MENU, get_dish
from models import (
    CheckoutRequest,
    OccupyRequest,
    OrderItemRequest,
    SetupRequest,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GST_RATE = 0.05                # 5% GST as per spec
DEFAULT_TABLE_COUNT = 10       # Initial table count until the owner runs setup

# Valid statuses (used purely for documentation / sanity checks)
STATUS_AVAILABLE = "available"
STATUS_OCCUPIED  = "occupied"
STATUS_ORDERED   = "ordered"
STATUS_BILLED    = "billed"

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

active_tables: dict[int, dict[str, Any]] = {}
total_tables_count: int = 0


def _empty_table() -> dict[str, Any]:
    """Return a fresh, available table session."""
    return {
        "status": STATUS_AVAILABLE,
        "customer_name": None,
        "items": [],
        "subtotal": 0.0,
        "session_started_at": None,
    }


def _reset_to_count(n: int) -> None:
    """(Re)initialise the active_tables dict for ``n`` tables."""
    global active_tables, total_tables_count
    total_tables_count = n
    active_tables = {i: _empty_table() for i in range(1, n + 1)}


def _require_table(table_id: int) -> dict[str, Any]:
    if table_id not in active_tables:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")
    return active_tables[table_id]


def _recompute_subtotal(table: dict[str, Any]) -> None:
    table["subtotal"] = round(sum(item["price"] for item in table["items"]), 2)


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _reset_to_count(DEFAULT_TABLE_COUNT)
    yield
    # nothing to tear down — SQLite connections are per-request


app = FastAPI(
    title="DineFlow POS API",
    version="1.0.0",
    description="Backend for the DineFlow restaurant POS & analytics system.",
    lifespan=lifespan,
)

# Permissive CORS for local dev with a React app on a different port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# System / meta
# ---------------------------------------------------------------------------

@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "service": "DineFlow POS API",
        "status": "ok",
        "docs": "/docs",
        "total_tables": total_tables_count,
        "gst_rate": GST_RATE,
    }


@app.post("/api/setup", tags=["setup"])
def setup_restaurant(req: SetupRequest) -> dict:
    """
    Initialise (or reset) the restaurant with a given number of tables.
    All active sessions are cleared.
    """
    _reset_to_count(req.total_tables)
    return {"total_tables": total_tables_count, "tables": active_tables}


@app.get("/api/menu", tags=["menu"])
def get_menu() -> dict:
    """Return the full categorised menu."""
    return MENU


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------

@app.get("/api/tables", tags=["tables"])
def list_tables() -> dict:
    """Snapshot of every active table session."""
    return {"total": total_tables_count, "tables": active_tables}


@app.get("/api/tables/{table_id}", tags=["tables"])
def get_table(table_id: int) -> dict:
    return _require_table(table_id)


@app.post("/api/tables/{table_id}/occupy", tags=["tables"])
def occupy_table(table_id: int, req: OccupyRequest) -> dict:
    """Open a session on an available table by recording the customer's name."""
    table = _require_table(table_id)
    if table["status"] != STATUS_AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail=f"Table {table_id} is currently '{table['status']}', not available.",
        )

    name = req.customer_name.strip()
    table["status"] = STATUS_OCCUPIED
    table["customer_name"] = name
    table["session_started_at"] = datetime.now().isoformat(timespec="seconds")
    return table


@app.post("/api/tables/{table_id}/order", tags=["tables"])
def add_order_item(table_id: int, req: OrderItemRequest) -> dict:
    """Append a menu item (with a timestamp) to a table's running order."""
    table = _require_table(table_id)
    if table["status"] not in (STATUS_OCCUPIED, STATUS_ORDERED):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot add items to table {table_id} "
                f"while status is '{table['status']}'. Occupy it first."
            ),
        )

    dish = get_dish(req.dish_id)
    if dish is None:
        raise HTTPException(status_code=404, detail=f"Dish '{req.dish_id}' not found")

    now = datetime.now()
    item = {
        "dish_id":   dish["id"],
        "dish":      dish["name"],
        "category":  dish["category"],
        "price":     dish["price"],
        "time":      now.strftime("%H:%M"),       # display-friendly
        "timestamp": now.isoformat(timespec="seconds"),
    }
    table["items"].append(item)
    _recompute_subtotal(table)
    table["status"] = STATUS_ORDERED
    return table


@app.delete("/api/tables/{table_id}/order/{item_index}", tags=["tables"])
def remove_order_item(table_id: int, item_index: int) -> dict:
    """Remove a single item from a table's running order by position."""
    table = _require_table(table_id)
    if not (0 <= item_index < len(table["items"])):
        raise HTTPException(status_code=404, detail="Item index out of range")

    table["items"].pop(item_index)
    _recompute_subtotal(table)
    if not table["items"]:
        # Drop back to 'occupied' so the card flips from blue → yellow.
        table["status"] = STATUS_OCCUPIED
    return table


@app.post("/api/tables/{table_id}/bill", tags=["billing"])
def generate_bill(table_id: int) -> dict:
    """
    Calculate subtotal + 5% GST and flip the table to 'billed' state
    (red card, waiting for payment).
    """
    table = _require_table(table_id)
    if table["status"] not in (STATUS_ORDERED, STATUS_BILLED):
        raise HTTPException(
            status_code=400,
            detail=f"Table {table_id} has no order to bill (status: {table['status']}).",
        )

    subtotal    = round(table["subtotal"], 2)
    gst_amount  = round(subtotal * GST_RATE, 2)
    grand_total = round(subtotal + gst_amount, 2)

    table["status"] = STATUS_BILLED
    return {
        "table_id": table_id,
        "customer_name": table["customer_name"],
        "items": table["items"],
        "subtotal": subtotal,
        "gst_rate": GST_RATE,
        "gst_amount": gst_amount,
        "grand_total": grand_total,
    }


@app.post("/api/tables/{table_id}/checkout", tags=["billing"])
def checkout_table(table_id: int, req: CheckoutRequest) -> dict:
    """
    Record the payment method, persist the completed order, and
    return the table to the available pool.
    """
    table = _require_table(table_id)
    if table["status"] not in (STATUS_ORDERED, STATUS_BILLED):
        raise HTTPException(
            status_code=400,
            detail=f"Nothing to check out on table {table_id} (status: {table['status']}).",
        )
    if not table["items"]:
        raise HTTPException(status_code=400, detail="Cannot check out an empty order.")

    subtotal    = round(table["subtotal"], 2)
    gst_amount  = round(subtotal * GST_RATE, 2)
    grand_total = round(subtotal + gst_amount, 2)

    order_record = {
        "table_id":       table_id,
        "customer_name":  table["customer_name"],
        "items":          table["items"],
        "subtotal":       subtotal,
        "gst":            gst_amount,
        "grand_total":    grand_total,
        "payment_method": req.payment_method,
        "completed_at":   datetime.now().isoformat(timespec="seconds"),
    }
    order_id = save_order(order_record)

    # Free the table back up.
    active_tables[table_id] = _empty_table()

    return {"order_id": order_id, **order_record}


@app.post("/api/tables/{table_id}/reset", tags=["tables"])
def reset_table(table_id: int) -> dict:
    """Cancel a session without saving an order (e.g. customer walked out)."""
    _require_table(table_id)
    active_tables[table_id] = _empty_table()
    return active_tables[table_id]


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@app.get("/api/analytics/daily", tags=["analytics"])
def daily_analytics() -> dict:
    """
    Aggregate today's completed orders:
      - total revenue (₹)
      - peak hours (order count per hour, 0–23)
      - popular dishes (frequency-ranked)
      - payment-method breakdown
    """
    orders = get_todays_orders()

    total_revenue = round(sum(o["grand_total"] for o in orders), 2)
    total_orders  = len(orders)

    # Dish frequencies
    dish_stats: dict[str, dict] = {}
    for order in orders:
        for item in order["items"]:
            name = item["dish"]
            stats = dish_stats.setdefault(
                name, {"name": name, "category": item.get("category"), "count": 0, "revenue": 0.0}
            )
            stats["count"]   += 1
            stats["revenue"] += item["price"]
    popular_dishes = sorted(dish_stats.values(), key=lambda d: d["count"], reverse=True)
    for d in popular_dishes:
        d["revenue"] = round(d["revenue"], 2)

    # Hourly buckets (0–23)
    hourly_counts: dict[int, int]   = {h: 0   for h in range(24)}
    hourly_revenue: dict[int, float] = {h: 0.0 for h in range(24)}
    for order in orders:
        hour = datetime.fromisoformat(order["completed_at"]).hour
        hourly_counts[hour]  += 1
        hourly_revenue[hour] += order["grand_total"]

    peak_hours = [
        {
            "hour": h,
            "label": f"{h:02d}:00",
            "order_count": hourly_counts[h],
            "revenue": round(hourly_revenue[h], 2),
        }
        for h in range(24)
    ]

    # Payment-method totals
    payment_breakdown: dict[str, float] = {}
    for order in orders:
        pm = order["payment_method"]
        payment_breakdown[pm] = payment_breakdown.get(pm, 0.0) + order["grand_total"]
    payment_breakdown = {k: round(v, 2) for k, v in payment_breakdown.items()}

    return {
        "date":              datetime.now().date().isoformat(),
        "total_revenue":     total_revenue,
        "total_orders":      total_orders,
        "popular_dishes":    popular_dishes,
        "peak_hours":        peak_hours,
        "payment_breakdown": payment_breakdown,
    }


@app.get("/api/analytics/orders", tags=["analytics"])
def all_orders() -> dict:
    """Full historical dump of completed orders (newest first)."""
    orders = get_all_orders()
    return {"count": len(orders), "orders": orders}


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
