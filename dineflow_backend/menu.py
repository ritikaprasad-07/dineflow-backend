"""
DineFlow — Master menu.

The menu is exposed as a categorised dictionary. Each dish carries a stable
short ID (category-prefixed) so the frontend can reference items without
relying on display names.
"""

from typing import Optional

MENU: dict[str, list[dict]] = {
    "The Dum Handi Biryani": [
        {"id": "BIR01-H", "name": "Classic Chicken Dum Biryani (Half)", "price": 80},
        {"id": "BIR01-F", "name": "Classic Chicken Dum Biryani (Full)", "price": 140},
        {"id": "BIR02-H", "name": "Tandoori Chicken Biryani (Half)", "price": 90},
        {"id": "BIR02-F", "name": "Tandoori Chicken Biryani (Full)", "price": 160},
        {"id": "BIR03-H", "name": "Hyderabadi Chicken Biryani (Half)", "price": 100},
        {"id": "BIR03-F", "name": "Hyderabadi Chicken Biryani (Full)", "price": 180},
        {"id": "BIR04-H", "name": "Green Chicken Biryani (Half)", "price": 100},
        {"id": "BIR04-F", "name": "Green Chicken Biryani (Full)", "price": 180},
    ],
    "Add-Ons": [
        # Note: The flyer didn't list prices for these, so I put 120 as a placeholder! Change as needed.
        {"id": "ADD01", "name": "Chicken Lollipop", "price": 120},
        {"id": "ADD02", "name": "Chicken", "price": 65},
    ],
    "Beverages": [
        # Note: Placeholder prices again!
        {"id": "BEV01", "name": "Soft Drink", "price": 20},
        {"id": "BEV02", "name": "Sol Kadhi", "price": 50},
    ],
}


def get_dish(dish_id: str) -> Optional[dict]:
    """Return the dish dict (with its category) for a given dish_id, or None."""
    for category, dishes in MENU.items():
        for dish in dishes:
            if dish["id"] == dish_id:
                return {**dish, "category": category}
    return None
