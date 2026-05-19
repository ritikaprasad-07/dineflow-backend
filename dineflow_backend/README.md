# DineFlow Backend (FastAPI)

Backend for the **DineFlow POS & Analytics System** — handles tables, the
master menu, live order sessions, billing with 5% GST, payment recording,
and end-of-day analytics.

## Project layout

```
dineflow_backend/
├── main.py            # FastAPI app + all routes
├── menu.py            # Master menu (5 categories, 25 dishes)
├── models.py          # Pydantic request models
├── database.py        # SQLite persistence for completed orders
├── requirements.txt
└── dineflow.db        # auto-created at first run
```

## Run it

```bash
cd dineflow_backend
pip install -r requirements.txt
python main.py
```

The server boots on `http://localhost:8000`.

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:**      http://localhost:8000/redoc

CORS is open (`*`) so a React dev server on any port can hit it directly.

## State model

| Layer            | Where                    | What                                     |
|------------------|--------------------------|------------------------------------------|
| Active sessions  | `active_tables` (dict)   | Live table state — wiped on restart      |
| Completed orders | `dineflow.db` (SQLite)   | Persisted; powers the analytics endpoint |
| Menu             | `menu.py` (constant)     | Static, edited in code                   |

Each entry in `active_tables`:

```python
{
    "status": "available" | "occupied" | "ordered" | "billed",
    "customer_name": str | None,
    "items": [
        {"dish_id": "IN01", "dish": "Paneer Butter Masala",
         "category": "Indian", "price": 350,
         "time": "14:30", "timestamp": "2026-05-19T14:30:12"},
        ...
    ],
    "subtotal": 0.0,
    "session_started_at": "2026-05-19T14:25:01" | None,
}
```

## API reference

### Setup & menu
| Method | Path             | Body                          | Notes |
|--------|------------------|-------------------------------|-------|
| GET    | `/`              | —                             | Health / meta |
| POST   | `/api/setup`     | `{"total_tables": 10}`        | (Re)initialise tables; clears state |
| GET    | `/api/menu`      | —                             | Full categorised menu |

### Tables
| Method | Path                                       | Body                          |
|--------|--------------------------------------------|-------------------------------|
| GET    | `/api/tables`                              | —                             |
| GET    | `/api/tables/{id}`                         | —                             |
| POST   | `/api/tables/{id}/occupy`                  | `{"customer_name": "Aarav"}`  |
| POST   | `/api/tables/{id}/order`                   | `{"dish_id": "IN01"}`         |
| DELETE | `/api/tables/{id}/order/{item_index}`      | —                             |
| POST   | `/api/tables/{id}/reset`                   | —                             |

### Billing
| Method | Path                          | Body                                     |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/tables/{id}/bill`       | —                                        |
| POST   | `/api/tables/{id}/checkout`   | `{"payment_method": "cash"\|"card"\|"upi"}` |

### Analytics
| Method | Path                       | Returns                                                  |
|--------|----------------------------|----------------------------------------------------------|
| GET    | `/api/analytics/daily`     | `total_revenue`, `total_orders`, `popular_dishes`, `peak_hours`, `payment_breakdown` |
| GET    | `/api/analytics/orders`    | Full historical order list                               |

## Status transitions

```
available ──occupy──▶ occupied ──order──▶ ordered ──bill──▶ billed
    ▲                                                          │
    └──────────────────── checkout ────────────────────────────┘
                       (saves to SQLite,
                        clears the session)
```

## Bill math

```
gst_amount  = round(subtotal * 0.05, 2)
grand_total = round(subtotal + gst_amount, 2)
```

## Quick cURL smoke test

```bash
curl -s -X POST localhost:8000/api/setup -H 'content-type: application/json' \
     -d '{"total_tables": 5}' | head

curl -s -X POST localhost:8000/api/tables/2/occupy \
     -H 'content-type: application/json' \
     -d '{"customer_name": "Aarav Sharma"}'

curl -s -X POST localhost:8000/api/tables/2/order \
     -H 'content-type: application/json' -d '{"dish_id": "IN01"}'

curl -s -X POST localhost:8000/api/tables/2/bill

curl -s -X POST localhost:8000/api/tables/2/checkout \
     -H 'content-type: application/json' \
     -d '{"payment_method": "upi"}'

curl -s localhost:8000/api/analytics/daily | python -m json.tool
```

## Next step

Backend is wired and validated. The React frontend can now talk to:
`http://localhost:8000` for menu, table state, ordering, billing, and analytics.
