from sqlalchemy.orm import Session
from app.models.pv import PV
from app.services.pvs import preparer_pv, verifier_integrite_pv


def creer_pv(
    db: Session,
    agent_id: int,
    num_permis_chiffre: str,
    iv: str,
    num_permis_hash: str,
    plaque: str,
    type_infraction: str,
    lieu: str,
    montant: float
) -> PV:
    """Crée un PV signé et chiffré en base."""
    donnees = preparer_pv(
        agent_id, num_permis_chiffre, iv, num_permis_hash,
        plaque, type_infraction, lieu, montant
    )
    pv = PV(**donnees)
    db.add(pv)
    db.commit()
    db.refresh(pv)
    return pv


def get_pvs_agent(db: Session, agent_id: int) -> list[PV]:
    """Retourne les PV d'un agent."""
    return db.query(PV).filter(PV.agent_id == agent_id).all()


def get_pvs_citoyen(db: Session, num_permis_hash: str) -> list[PV]:
    """Retourne les PV d'un citoyen par hash de permis."""
    return db.query(PV).filter(PV.num_permis_hash == num_permis_hash).all()


def get_tous_pvs(db: Session) -> list[PV]:
    """Retourne tous les PV — pour le superviseur."""
    return db.query(PV).all()


def get_pv_by_id(db: Session, pv_id: str) -> PV | None:
    """Retourne un PV par son ID."""
    return db.query(PV).filter(PV.id == pv_id).first()


def maj_statut_pv(db: Session, pv_id: str, nouveau_statut: str) -> PV | None:
    """Met à jour le statut d'un PV."""
    pv = get_pv_by_id(db, pv_id)
    if not pv:
        return None
    pv.statut = nouveau_statut
    db.commit()
    db.refresh(pv)
    return pv


def verifier_pv(db: Session, pv_id: str) -> tuple[bool, str]:
    """Vérifie l'intégrité d'un PV."""
    pv = get_pv_by_id(db, pv_id)
    if not pv:
        return False, "PV introuvable"
    return verifier_integrite_pv(pv)