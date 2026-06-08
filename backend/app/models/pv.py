from sqlalchemy import Column, Integer, String, Float, LargeBinary, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class PV(Base):
    __tablename__ = "pvs"

    id                  = Column(Integer, primary_key=True, index=True)
    agent_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    num_permis_chiffre  = Column(LargeBinary, nullable=False)
    iv                  = Column(LargeBinary, nullable=False)
    plaque              = Column(String, nullable=False)
    type_infraction     = Column(String, nullable=False)
    lieu                = Column(String, nullable=False)
    montant             = Column(Float, nullable=False)
    signature           = Column(String, nullable=False)
    date_creation       = Column(String, nullable=False)
    statut              = Column(String, default="en_attente")