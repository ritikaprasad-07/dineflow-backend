"""
DineFlow — Persistence layer.

A thin SQLite wrapper (stdlib only) for storing *completed* orders so the
analytics dashboard can survive a server restart. Active sessions stay in
memory, per the spec.
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Iterator

DB_PATH = Path(__file__).parent / "dineflow.db"


def init_db() -> None:
    """Create the completed_orders table if it doesn't already exist."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS completed_orders (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                table_id        INTEGER NOT NULL,
                customer_name   TEXT    NOT NULL,
                items_json      TEXT    NOT NULL,
                subtotal        REAL    NOT NULL,
                gst             REAL    NOT NULL,
                grand_total     REAL    NOT NULL,
                payment_method  TEXT    NOT NULL,
                completed_at    TEXT    NOT NULL
            )
            """
        )
        conn.commit()


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def save_order(order: dict) -> int:
    """Insert a completed order. Returns the new row's primary key."""
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO completed_orders
                (table_id, customer_name, items_json, subtotal, gst,
                 grand_total, payment_method, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order["table_id"],
                order["customer_name"],
                json.dumps(order["items"]),
                order["subtotal"],
                order["gst"],
                order["grand_total"],
                order["payment_method"],
                order["completed_at"],
            ),
        )
        return cursor.lastrowid  # type: ignore[return-value]


def _row_to_order(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "table_id": row["table_id"],
        "customer_name": row["customer_name"],
        "items": json.loads(row["items_json"]),
        "subtotal": row["subtotal"],
        "gst": row["gst"],
        "grand_total": row["grand_total"],
        "payment_method": row["payment_method"],
        "completed_at": row["completed_at"],
    }


def get_todays_orders() -> list[dict]:
    today = datetime.now().date().isoformat()
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM completed_orders WHERE date(completed_at) = ? ORDER BY completed_at",
            (today,),
        ).fetchall()
    return [_row_to_order(r) for r in rows]


def get_all_orders() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM completed_orders ORDER BY completed_at DESC"
        ).fetchall()
    return [_row_to_order(r) for r in rows]
