import re
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import Role


def _valider_mot_de_passe(v: str) -> str:
    if len(v) < 12:
        raise ValueError("Minimum 12 caractères.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Au moins une majuscule requise.")
    if not re.search(r"[a-z]", v):
        raise ValueError("Au moins une minuscule requise.")
    if not re.search(r"\d", v):
        raise ValueError("Au moins un chiffre requis.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-]", v):
        raise ValueError("Au moins un caractère spécial requis.")
    return v


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role

    @field_validator("password")
    @classmethod
    def force_mot_de_passe_robuste(cls, v):
        return _valider_mot_de_passe(v)


class UserOut(BaseModel):
    id: UUID
    username: str
    email: str
    role: Role
    is_active: bool
    created_at: datetime
    created_by: str | None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: Role


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def force_mot_de_passe_robuste(cls, v):
        return _valider_mot_de_passe(v)
