"""
DineFlow — Master menu.

The menu is exposed as a categorised dictionary. Each dish carries a stable
short ID (category-prefixed) so the frontend can reference items without
relying on display names.
"""

from typing import Optional

MENU: dict[str, list[dict]] = {
    "Indian": [
        {"id": "IN01", "name": "Paneer Butter Masala", "price": 350},
        {"id": "IN02", "name": "Dal Makhani",          "price": 280},
        {"id": "IN03", "name": "Veg Dum Biryani",      "price": 320},
        {"id": "IN04", "name": "Garlic Naan",          "price":  65},
        {"id": "IN05", "name": "Mutton Rogan Josh",    "price": 480},
    ],
    "Italian": [
        {"id": "IT01", "name": "Margherita Pizza",        "price": 450},
        {"id": "IT02", "name": "Penne Arrabbiata Pasta",  "price": 380},
        {"id": "IT03", "name": "Classic Lasagna",         "price": 420},
        {"id": "IT04", "name": "Mushroom Risotto",        "price": 460},
        {"id": "IT05", "name": "Tiramisu",                "price": 300},
    ],
    "Chinese": [
        {"id": "CH01", "name": "Veg Hakka Noodles",       "price": 280},
        {"id": "CH02", "name": "Veg Manchurian Gravy",    "price": 260},
        {"id": "CH03", "name": "Chilli Chicken",          "price": 340},
        {"id": "CH04", "name": "Burnt Garlic Fried Rice", "price": 290},
        {"id": "CH05", "name": "Sweet Corn Soup",         "price": 180},
    ],
    "Starters": [
        {"id": "ST01", "name": "Crispy Corn",            "price": 180},
        {"id": "ST02", "name": "Paneer Tikka",           "price": 280},
        {"id": "ST03", "name": "Peri Peri French Fries", "price": 160},
        {"id": "ST04", "name": "Hara Bhara Kabab",       "price": 220},
        {"id": "ST05", "name": "Chicken Malai Tikka",    "price": 350},
    ],
    "French": [
        {"id": "FR01", "name": "Ratatouille",       "price": 520},
        {"id": "FR02", "name": "French Onion Soup", "price": 350},
        {"id": "FR03", "name": "Quiche Lorraine",   "price": 450},
        {"id": "FR04", "name": "Butter Croissant",  "price": 180},
        {"id": "FR05", "name": "Crème Brûlée",      "price": 320},
    ],
}


def get_dish(dish_id: str) -> Optional[dict]:
    """Return the dish dict (with its category) for a given dish_id, or None."""
    for category, dishes in MENU.items():
        for dish in dishes:
            if dish["id"] == dish_id:
                return {**dish, "category": category}
    return None
