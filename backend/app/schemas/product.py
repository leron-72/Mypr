from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator
import re
from app.models.product import ProductStatus


PART_NUMBER_REGEX = re.compile(r"^\d{3}\.(0[1-9]|[12]\d|30)\.\d{4}$")


class ProductCreate(BaseModel):
    part_number: str
    name: str
    description: Optional[str] = None
    group_id: Optional[int] = None
    unit: Optional[str] = None
    weight: Optional[Decimal] = None
    material: Optional[str] = None
    status: ProductStatus = ProductStatus.draft

    @field_validator("part_number")
    @classmethod
    def validate_part_number(cls, v: str) -> str:
        if not PART_NUMBER_REGEX.match(v):
            raise ValueError(
                "Part number must match format NNN.CC.SSSS where NNN is 000-129, CC is 01-30, SSSS is 0001-9999"
            )
        parts = v.split(".")
        nnn = int(parts[0])
        ssss = int(parts[2])
        if nnn > 129:
            raise ValueError("NNN (product type) must be between 000 and 129")
        if ssss < 1:
            raise ValueError("SSSS (sequential) must be between 0001 and 9999")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    group_id: Optional[int] = None
    unit: Optional[str] = None
    weight: Optional[Decimal] = None
    material: Optional[str] = None
    status: Optional[ProductStatus] = None


class ProductResponse(BaseModel):
    id: int
    part_number: str
    name: str
    description: Optional[str] = None
    group_id: Optional[int] = None
    unit: Optional[str] = None
    weight: Optional[Decimal] = None
    material: Optional[str] = None
    status: ProductStatus
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    size: int
    pages: int
