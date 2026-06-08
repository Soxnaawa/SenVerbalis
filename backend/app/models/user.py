from sqlalchemy import Column, Integer, String
from app.models.pv import Base

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role     = Column(String, nullable=False)  # admin, supervisor, agent, citizen
