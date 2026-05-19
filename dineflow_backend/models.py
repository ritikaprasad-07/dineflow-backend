"""Pydantic request models for incoming JSON payloads."""

from pydantic import BaseModel, Field
from typing import Literal


class SetupRequest(BaseModel):
    total_tables: int = Field(..., ge=1, le=100, description="Number of tables in the restaurant (1–100)")


class OccupyRequest(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=80)


class OrderItemRequest(BaseModel):
    dish_id: str = Field(..., description="Dish ID from the master menu (e.g. 'IN01')")


class CheckoutRequest(BaseModel):
    payment_method: Literal["cash", "card", "upi"]
