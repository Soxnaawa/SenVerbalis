import uuid
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base


class PV(Base):
    __tablename__ = "pvs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    num_permis_chiffre = Column(String, nullable=False)
    iv = Column(String, nullable=False)
    num_permis_hash = Column(String, index=True, nullable=False)
    plaque = Column(String, nullable=False)
    type_infraction = Column(String, nullable=False)
    lieu = Column(String, nullable=False)
    montant = Column(Float, nullable=False)
    signature = Column(String, nullable=False)
    date_creation = Column(String, nullable=False)
    statut = Column(String, default="en_attente")

    agent = relationship("User", back_populates="pvs")

    @property
    def agent_username(self) -> str:
        return self.agent.username if self.agent else "Inconnu"
