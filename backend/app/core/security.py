import logging
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
from app.core.config import settings

logger = logging.getLogger("senverbalis.security")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hasher_mot_de_passe(plain: str) -> str:
    return pwd_context.hash(plain)

def verifier_mot_de_passe(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def creer_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload["iat"] = datetime.now(timezone.utc)
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    logger.info("Token généré pour : %s", data.get("sub"))
    return token

def decoder_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])