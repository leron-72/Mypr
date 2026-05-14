from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.product_version import VersionType


class ProductVersionCreate(BaseModel):
    version_type: VersionType
    version_number: str
    revision_letter: Optional[str] = None
    changes_description: Optional[str] = None


class ProductVersionResponse(BaseModel):
    id: int
    product_id: int
    version_type: VersionType
    version_number: str
    revision_letter: Optional[str] = None
    changes_description: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
