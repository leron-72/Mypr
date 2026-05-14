from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class BOMItemCreate(BaseModel):
    child_product_id: int
    quantity: Decimal
    unit: Optional[str] = None
    is_optional: bool = False
    notes: Optional[str] = None
    version_id: Optional[int] = None


class BOMItemUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    is_optional: Optional[bool] = None
    notes: Optional[str] = None
    version_id: Optional[int] = None


class BOMItemResponse(BaseModel):
    id: int
    parent_product_id: int
    child_product_id: int
    quantity: Decimal
    unit: Optional[str] = None
    is_optional: bool
    notes: Optional[str] = None
    version_id: Optional[int] = None
    created_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BOMTreeNode(BaseModel):
    id: int
    parent_product_id: int
    child_product_id: int
    child_part_number: str
    child_name: str
    quantity: Decimal
    unit: Optional[str] = None
    is_optional: bool
    notes: Optional[str] = None
    children: List["BOMTreeNode"] = []

    model_config = {"from_attributes": True}


BOMTreeNode.model_rebuild()
