from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log(db: Session, actor: str, action: str,
        target: str | None = None, detail: str | None = None,
        ip_address: str | None = None):
    db.add(AuditLog(actor=actor, action=action,
                    target=target, detail=detail, ip_address=ip_address))
    db.commit()