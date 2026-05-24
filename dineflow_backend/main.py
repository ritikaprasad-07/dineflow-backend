"""
DineFlow — FastAPI application entrypoint.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Security:
    Every /api/* route requires an `x-access-pin` header matching DINEFLOW_PIN
    (defaults to "7788"). Set DINEFLOW_PIN in production.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_all_orders, get_todays_orders, init_db, save_order
from menu import MENU, get_dish
from models import CheckoutRequest, OccupyRequest, OrderItemRequest, SetupRequest

# ─── Config ──────────────────────────────────────────────────────────────
GST_RATE = 0.05
DEFAULT_TABLE_COUNT = 10
ACCESS_PIN = os.getenv("DINEFLOW_PIN", "7788")

STATUS_AVAILABLE = "available"
STATUS_OCCUPIED = "occupied"
STATUS_ORDERED = "ordered"
STATUS_BILLED = "billed"


# ─── Security dependency ─────────────────────────────────────────────────
def require_pin(
    x_access_pin: Optional[str] = Header(default=None, alias="x-access-pin"),
) -> bool:
    if not x_access_pin or x_access_pin != ACCESS_PIN:
        raise HTTPException(status_code=401, detail="Invalid or missing access PIN")
    return True


# ─── State ───────────────────────────────────────────────────────────────
active_tables: dict[int, dict[str, Any]] = {}
total_tables_count: int = 0


def _empty_table() -> dict[str, Any]:
    return {
        "status": STATUS_AVAILABLE,
        "customer_name": None,
        "items": [],
        "subtotal": 0.0,
        "session_started_at": None,
    }


def _reset_to_count(n: int) -> None:
    global active_tables, total_tables_count
    total_tables_count = n
    active_tables = {i: _empty_table() for i in range(1, n + 1)}


def _require_table(table_id: int) -> dict[str, Any]:
    if table_id not in active_tables:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")
    return active_tables[table_id]


def _recompute_subtotal(table: dict[str, Any]) -> None:
    table["subtotal"] = round(sum(item["price"] for item in table["items"]), 2)


# ─── Lifespan + app setup ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _reset_to_count(DEFAULT_TABLE_COUNT)
    yield


app = FastAPI(
    title="DineFlow POS API",
    version="1.1.0",
    description="Backend for the DineFlow restaurant POS & analytics system.",
    lifespan=lifespan,
)

# allow_headers=["*"] permits the custom x-access-pin header
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── PUBLIC ROUTE (no PIN — Render health-check) ─────────────────────────
@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "service": "DineFlow POS API",
        "status": "ok",
        "docs": "/docs",
        "total_tables": total_tables_count,
        "gst_rate": GST_RATE,
        "auth": "PIN required for /api/*",
    }


# ─── PROTECTED ROUTES (PIN-gated) ────────────────────────────────────────
api = APIRouter(prefix="/api", dependencies=[Depends(require_pin)], tags=["api"])


@api.post("/setup")
def setup_restaurant(req: SetupRequest) -> dict:
    _reset_to_count(req.total_tables)
    return {"total_tables": total_tables_count, "tables": active_tables}


@api.get("/menu")
def get_menu() -> dict:
    return MENU


@api.get("/tables")
def list_tables() -> dict:
    return {"total": total_tables_count, "tables": active_tables}


@api.get("/tables/{table_id}")
def get_table(table_id: int) -> dict:
    return _require_table(table_id)


@api.post("/tables/{table_id}/occupy")
def occupy_table(table_id: int, req: OccupyRequest) -> dict:
    table = _require_table(table_id)
    if table["status"] != STATUS_AVAILABLE:
        raise HTTPException(400, f"Table {table_id} is currently '{table['status']}'.")
    table["status"] = STATUS_OCCUPIED
    table["customer_name"] = req.customer_name.strip()
    table["session_started_at"] = datetime.now().isoformat(timespec="seconds")
    return table


@api.post("/tables/{table_id}/order")
def add_order_item(table_id: int, req: OrderItemRequest) -> dict:
    table = _require_table(table_id)
    if table["status"] not in (STATUS_OCCUPIED, STATUS_ORDERED):
        raise HTTPException(
            400, f"Cannot add items while status is '{table['status']}'."
        )
    dish = get_dish(req.dish_id)
    if dish is None:
        raise HTTPException(404, f"Dish '{req.dish_id}' not found")
    now = datetime.now()
    table["items"].append(
        {
            "dish_id": dish["id"],
            "dish": dish["name"],
            "category": dish["category"],
            "price": dish["price"],
            "time": now.strftime("%H:%M"),
            "timestamp": now.isoformat(timespec="seconds"),
        }
    )
    _recompute_subtotal(table)
    table["status"] = STATUS_ORDERED
    return table


@api.delete("/tables/{table_id}/order/{item_index}")
def remove_order_item(table_id: int, item_index: int) -> dict:
    table = _require_table(table_id)
    if not (0 <= item_index < len(table["items"])):
        raise HTTPException(404, "Item index out of range")
    table["items"].pop(item_index)
    _recompute_subtotal(table)
    if not table["items"]:
        table["status"] = STATUS_OCCUPIED
    return table


@api.post("/tables/{table_id}/bill")
def generate_bill(table_id: int) -> dict:
    table = _require_table(table_id)
    if table["status"] not in (STATUS_ORDERED, STATUS_BILLED):
        raise HTTPException(400, f"No order to bill (status: {table['status']}).")
    subtotal = round(table["subtotal"], 2)
    gst_amount = round(subtotal * GST_RATE, 2)
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


@api.post("/tables/{table_id}/checkout")
def checkout_table(table_id: int, req: CheckoutRequest) -> dict:
    table = _require_table(table_id)
    if table["status"] not in (STATUS_ORDERED, STATUS_BILLED):
        raise HTTPException(400, f"Nothing to check out (status: {table['status']}).")
    if not table["items"]:
        raise HTTPException(400, "Cannot check out an empty order.")
    subtotal = round(table["subtotal"], 2)
    gst_amount = round(subtotal * GST_RATE, 2)
    grand_total = round(subtotal + gst_amount, 2)
    record = {
        "table_id": table_id,
        "customer_name": table["customer_name"],
        "items": table["items"],
        "subtotal": subtotal,
        "gst": gst_amount,
        "grand_total": grand_total,
        "payment_method": req.payment_method,
        "completed_at": datetime.now().isoformat(timespec="seconds"),
    }
    order_id = save_order(record)
    active_tables[table_id] = _empty_table()
    return {"order_id": order_id, **record}


@api.post("/tables/{table_id}/reset")
def reset_table(table_id: int) -> dict:
    _require_table(table_id)
    active_tables[table_id] = _empty_table()
    return active_tables[table_id]


@api.get("/analytics/daily")
def daily_analytics() -> dict:
    orders = get_todays_orders()
    total_revenue = round(sum(o["grand_total"] for o in orders), 2)

    dish_stats: dict[str, dict] = {}
    for order in orders:
        for item in order["items"]:
            s = dish_stats.setdefault(
                item["dish"],
                {
                    "name": item["dish"],
                    "category": item.get("category"),
                    "count": 0,
                    "revenue": 0.0,
                },
            )
            s["count"] += 1
            s["revenue"] += item["price"]
    popular_dishes = sorted(dish_stats.values(), key=lambda d: d["count"], reverse=True)
    for d in popular_dishes:
        d["revenue"] = round(d["revenue"], 2)

    hourly_counts = {h: 0 for h in range(24)}
    hourly_revenue = {h: 0.0 for h in range(24)}
    for order in orders:
        h = datetime.fromisoformat(order["completed_at"]).hour
        hourly_counts[h] += 1
        hourly_revenue[h] += order["grand_total"]

    peak_hours = [
        {
            "hour": h,
            "label": f"{h:02d}:00",
            "order_count": hourly_counts[h],
            "revenue": round(hourly_revenue[h], 2),
        }
        for h in range(24)
    ]

    payment_breakdown: dict[str, float] = {}
    for order in orders:
        pm = order["payment_method"]
        payment_breakdown[pm] = payment_breakdown.get(pm, 0.0) + order["grand_total"]
    payment_breakdown = {k: round(v, 2) for k, v in payment_breakdown.items()}

    return {
        "date": datetime.now().date().isoformat(),
        "total_revenue": total_revenue,
        "total_orders": len(orders),
        "popular_dishes": popular_dishes,
        "peak_hours": peak_hours,
        "payment_breakdown": payment_breakdown,
    }


@api.get("/analytics/orders")
def all_orders() -> dict:
    orders = get_all_orders()
    return {"count": len(orders), "orders": orders}


app.include_router(api)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
