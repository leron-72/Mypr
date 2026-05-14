from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class FileAttachmentResponse(BaseModel):
    id: int
    product_id: int
    filename: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
