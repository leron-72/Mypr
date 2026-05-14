from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ProductGroupCreate(BaseModel):
    name: str
    code: str
    parent_id: Optional[int] = None
    description: Optional[str] = None


class ProductGroupUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    parent_id: Optional[int] = None
    description: Optional[str] = None


class ProductGroupResponse(BaseModel):
    id: int
    name: str
    code: str
    parent_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductGroupTree(BaseModel):
    id: int
    name: str
    code: str
    parent_id: Optional[int] = None
    description: Optional[str] = None
    children: List["ProductGroupTree"] = []

    model_config = {"from_attributes": True}


ProductGroupTree.model_rebuild()
