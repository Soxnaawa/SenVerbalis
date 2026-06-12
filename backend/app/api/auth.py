import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.config import settings
from app.core.security import verifier_mot_de_passe, creer_token
from app.core.dependencies import get_current_user, require_role
from app.crud import user as user_crud
from app.crud import audit as audit_crud
from app.models.user import Role, User
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserOut

logger = logging.getLogger("senverbalis.api.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentification"])


limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    user = user_crud.get_by_username(db, payload.username)

    # Réponse générique — ne révèle pas si le username existe (Fail-Safe)
    if not user or not verifier_mot_de_passe(payload.password, user.hashed_password):
        audit_crud.log(db, actor=payload.username, action="LOGIN_FAILED",
                       detail="Identifiants incorrects", ip_address=ip)
        logger.warning("Échec login '%s' depuis %s", payload.username, ip)
        raise HTTPException(status_code=401, detail="Identifiants incorrects.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé.")

    token = creer_token({"sub": user.username, "role": user.role})
    audit_crud.log(db, actor=user.username, action="LOGIN_SUCCESS", ip_address=ip)
    logger.info("Connexion réussie '%s' rôle=%s", user.username, user.role)

    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        role=user.role,
    )


@router.post("/logout", status_code=200)
def logout(request: Request, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    ip = request.client.host if request.client else "unknown"
    audit_crud.log(db, actor=current_user.username, action="LOGOUT", ip_address=ip)
    logger.info("Déconnexion '%s'", current_user.username)
    return {"message": "Déconnexion enregistrée. Supprime le token côté client."}


@router.post("/users", response_model=UserOut, status_code=201,
             dependencies=[Depends(require_role(Role.ADMIN))])
def create_user(payload: UserCreate, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    if user_crud.get_by_username(db, payload.username):
        raise HTTPException(status_code=409, detail="Nom d'utilisateur déjà pris.")
    if user_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email déjà enregistré.")

    new_user = user_crud.create_user(
        db, payload.username, payload.email,
        payload.password, payload.role, current_user.username
    )
    audit_crud.log(db, actor=current_user.username, action="USER_CREATED",
                   target=new_user.username, detail=f"Rôle : {new_user.role}")
    logger.info("Compte créé '%s' rôle=%s par '%s'",
                new_user.username, new_user.role, current_user.username)
    return new_user


@router.get("/users", response_model=list[UserOut],
            dependencies=[Depends(require_role(Role.ADMIN))])
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return user_crud.get_all(db, skip=skip, limit=limit)


@router.delete("/users/{username}", status_code=200,
               dependencies=[Depends(require_role(Role.ADMIN))])
def deactivate_user(username: str, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de désactiver son propre compte.")
    user = user_crud.desactiver_user(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    audit_crud.log(db, actor=current_user.username,
                   action="USER_DEACTIVATED", target=username)
    return {"message": f"Compte '{username}' désactivé."}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user