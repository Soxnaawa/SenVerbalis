import logging
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt
from app.core.config import settings

logger = logging.getLogger("senverbalis.security")

def hasher_mot_de_passe(plain: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode('utf-8'), salt).decode('utf-8')

def verifier_mot_de_passe(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        logger.error("Erreur lors de la vérification du mot de passe: %s", e)
        return False

def creer_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload["iat"] = datetime.now(timezone.utc)
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    logger.info("Token généré pour : %s", data.get("sub"))
    return token

def decoder_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])