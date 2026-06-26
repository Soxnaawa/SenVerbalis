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
    montant: float,
) -> PV:
    """Crée un PV signé et chiffré en base."""
    donnees = preparer_pv(
        agent_id,
        num_permis_chiffre,
        iv,
        num_permis_hash,
        plaque,
        type_infraction,
        lieu,
        montant,
    )
    pv = PV(**donnees)
    db.add(pv)
    db.commit()
    db.refresh(pv)
    return pv


def get_pvs_agent(
    db: Session, agent_id: int, skip: int = 0, limit: int = 50
) -> list[PV]:
    """Retourne les PV d'un agent."""
    return (
        db.query(PV)
        .filter(PV.agent_id == agent_id)
        .order_by(PV.date_creation.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_pvs_citoyen(db: Session, num_permis_hash: str) -> list[PV]:
    """Retourne les PV d'un citoyen par hash de permis."""
    return (
        db.query(PV)
        .filter(PV.num_permis_hash == num_permis_hash)
        .order_by(PV.date_creation.desc())
        .all()
    )


def get_tous_pvs(db: Session, skip: int = 0, limit: int = 50) -> list[PV]:
    """Retourne tous les PV — pour le superviseur."""
    return (
        db.query(PV).order_by(PV.date_creation.desc()).offset(skip).limit(limit).all()
    )


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


def rechercher_pvs(
    db: Session,
    plaque: str | None = None,
    type_infraction: str | None = None,
    lieu: str | None = None,
    statut: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[PV]:
    """Recherche multi-critères de PV."""
    query = db.query(PV)
    if plaque:
        query = query.filter(PV.plaque.ilike(f"%{plaque}%"))
    if type_infraction:
        query = query.filter(PV.type_infraction.ilike(f"%{type_infraction}%"))
    if lieu:
        query = query.filter(PV.lieu.ilike(f"%{lieu}%"))
    if statut:
        query = query.filter(PV.statut == statut)

    return query.order_by(PV.date_creation.desc()).offset(skip).limit(limit).all()


def verifier_pv(db: Session, pv_id: str) -> tuple[bool, str]:
    """Vérifie l'intégrité d'un PV."""
    pv = get_pv_by_id(db, pv_id)
    if not pv:
        return False, "PV introuvable"
    return verifier_integrite_pv(pv)


def get_stats_pvs(db: Session) -> dict:
    """Retourne des statistiques globales sur les PV pour le superviseur."""
    pvs = db.query(PV).all()
    total = len(pvs)
    regles = sum(1 for pv in pvs if pv.statut == "reglee")
    contestes = sum(1 for pv in pvs if pv.statut == "contestee")
    en_attente = sum(1 for pv in pvs if pv.statut == "en_attente")

    montant_total = sum(pv.montant for pv in pvs)
    montant_regle = sum(pv.montant for pv in pvs if pv.statut == "reglee")

    infraction_distribution = {}
    for pv in pvs:
        infraction_distribution[pv.type_infraction] = (
            infraction_distribution.get(pv.type_infraction, 0) + 1
        )

    return {
        "total": total,
        "regles": regles,
        "contestes": contestes,
        "en_attente": en_attente,
        "montant_total": montant_total,
        "montant_regle": montant_regle,
        "infraction_distribution": infraction_distribution,
    }
