import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base

class Role(str, enum.Enum):
    ADMIN       = "admin"
    AGENT       = "agent"
    SUPERVISEUR = "superviseur"
    CITOYEN     = "citoyen"
from sqlalchemy import Column, Integer, String
from app.models.pv import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username        = Column(String(80), unique=True, nullable=False, index=True)
    email           = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role            = Column(PgEnum(Role), nullable=False)
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime(timezone=True),
                             default=lambda: datetime.now(timezone.utc))
    created_by      = Column(String(80), nullable=True)
    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role     = Column(String, nullable=False)  # admin, supervisor, agent, citizen
