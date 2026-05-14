from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str | None = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
