from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ChangeLogResponse(BaseModel):
    id: int
    product_id: int
    user_id: Optional[int] = None
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
