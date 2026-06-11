from sqlalchemy.orm import Session
from app.models.user import User, Role
from app.core.security import hasher_mot_de_passe

def get_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()

def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_all(db: Session, skip: int = 0, limit: int = 50) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, username: str, email: str,
                plain_password: str, role: Role, created_by: str) -> User:
    user = User(
        username=username,
        email=email,
        hashed_password=hasher_mot_de_passe(plain_password),
        role=role,
        created_by=created_by,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def desactiver_user(db: Session, username: str) -> User | None:
    user = get_by_username(db, username)
    if user:
        user.is_active = False
        db.commit()
        db.refresh(user)
    return user