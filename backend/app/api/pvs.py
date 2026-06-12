from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.schemas.pv import PVCreate, PVResponse, PVStatutUpdate, PVIntegriteResponse
from app.crud import pvs as crud_pvs
from app.db import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import Role, User
from app.crud import audit as audit_crud

router = APIRouter(prefix="/api/pvs", tags=["PVs"])


@router.post(
    "/",
    response_model=PVResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(Role.AGENT))]
)
def creer_pv(
    pv_data: PVCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau PV signé et chiffré. Réservé aux agents."""
    pv = crud_pvs.creer_pv(
        db=db,
        agent_id=current_user.id,
        num_permis_chiffre=pv_data.num_permis_chiffre,
        iv=pv_data.iv,
        num_permis_hash=pv_data.num_permis_hash,
        plaque=pv_data.plaque,
        type_infraction=pv_data.type_infraction,
        lieu=pv_data.lieu,
        montant=pv_data.montant
    )
    ip = request.client.host if request.client else "unknown"
    audit_crud.log(
        db,
        actor=current_user.username,
        action="PV_CREE",
        target=str(pv.id),
        detail=f"Infraction : {pv_data.type_infraction} — lieu : {pv_data.lieu}",
        ip_address=ip
    )
    return pv


@router.get(
    "/mes-pvs",
    response_model=list[PVResponse],
    dependencies=[Depends(require_role(Role.AGENT))]
)
def mes_pvs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne uniquement les PV de l'agent connecté."""
    return crud_pvs.get_pvs_agent(db, current_user.id)


@router.get(
    "/tous",
    response_model=list[PVResponse],
    dependencies=[Depends(require_role(Role.SUPERVISEUR))]
)
def tous_les_pvs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne tous les PV. Réservé au superviseur."""
    return crud_pvs.get_tous_pvs(db)


@router.get(
    "/{pv_id}",
    response_model=PVResponse,
    dependencies=[Depends(require_role(Role.AGENT, Role.SUPERVISEUR))]
)
def get_pv(
    pv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retourne un PV par son ID. Accessible aux agents et superviseurs."""
    pv = crud_pvs.get_pv_by_id(db, pv_id)
    if not pv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PV introuvable."
        )
    # Un agent ne peut voir que ses propres PV
    if current_user.role == Role.AGENT and pv.agent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit : ce PV ne vous appartient pas."
        )
    return pv


@router.patch(
    "/{pv_id}/statut",
    response_model=PVResponse,
    dependencies=[Depends(require_role(Role.SUPERVISEUR))]
)
def maj_statut(
    pv_id: str,
    statut_data: PVStatutUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour le statut d'un PV. Réservé au superviseur."""
    pv = crud_pvs.maj_statut_pv(db, pv_id, statut_data.statut)
    if not pv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PV introuvable."
        )
    ip = request.client.host if request.client else "unknown"
    audit_crud.log(
        db,
        actor=current_user.username,
        action="PV_STATUT_MAJ",
        target=pv_id,
        detail=f"Nouveau statut : {statut_data.statut}",
        ip_address=ip
    )
    return pv


@router.get(
    "/{pv_id}/integrite",
    response_model=PVIntegriteResponse,
    dependencies=[Depends(require_role(Role.SUPERVISEUR))]
)
def verifier_integrite(
    pv_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vérifie l'intégrité d'un PV. Réservé au superviseur."""
    integre, message = crud_pvs.verifier_pv(db, pv_id)
    ip = request.client.host if request.client else "unknown"
    audit_crud.log(
        db,
        actor=current_user.username,
        action="PV_INTEGRITE_VERIFIEE",
        target=pv_id,
        detail=message,
        ip_address=ip
    )
    return PVIntegriteResponse(
        pv_id=pv_id,
        integre=integre,
        message=message
    )


@router.get(
    "/citoyen/{num_permis_hash}",
    response_model=list[PVResponse]
)
def get_pvs_citoyen(
    num_permis_hash: str,
    db: Session = Depends(get_db)
):
    """Retourne les PV d'un citoyen par le hash de son permis."""
    return crud_pvs.get_pvs_citoyen(db, num_permis_hash)

