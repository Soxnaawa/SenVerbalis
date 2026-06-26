from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log(
    db: Session,
    actor: str,
    action: str,
    target: str | None = None,
    detail: str | None = None,
    ip_address: str | None = None,
):
    db.add(
        AuditLog(
            actor=actor,
            action=action,
            target=target,
            detail=detail,
            ip_address=ip_address,
        )
    )
    db.commit()


def get_all(db: Session, skip: int = 0, limit: int = 50) -> list[AuditLog]:
    """Retourne la liste des logs d'audit triés par date décroissante."""
    return (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
