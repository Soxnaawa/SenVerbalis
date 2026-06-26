from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class AuditLogResponse(BaseModel):
    id: UUID
    timestamp: datetime
    actor: str
    action: str
    target: Optional[str] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None

    model_config = {"from_attributes": True}
