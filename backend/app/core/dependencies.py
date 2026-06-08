import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.security import decoder_token
from app.crud import user as user_crud
from app.models.user import Role, User

logger = logging.getLogger("senverbalis.auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    erreur = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session invalide ou expirée.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decoder_token(token)
        username: str = payload.get("sub")
        if not username:
            raise erreur
    except JWTError:
        logger.warning("Token JWT invalide ou expiré.")
        raise erreur

    user = user_crud.get_by_username(db, username)
    if not user or not user.is_active:
        raise erreur
    return user

def require_role(*roles: Role):
    """RBAC — vérification strictement côté serveur."""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            logger.warning(
                "Accès refusé — '%s' (rôle=%s) vers ressource réservée à %s",
                current_user.username, current_user.role, roles
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès interdit : droits insuffisants."
            )
        return current_user
    return checker