from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.pv import PVCreate, PVResponse, PVStatutUpdate, PVIntegriteResponse
from app.crud import pvs as crud_pvs

router = APIRouter(prefix="/api/pvs", tags=["PVs"])


def get_db():
    """Dépendance base de données — sera complétée par Anta/Mamadou."""
    pass


@router.post("/", response_model=PVResponse, status_code=status.HTTP_201_CREATED)
def creer_pv(
    pv_data: PVCreate,
    agent_id: int,  # sera remplacé par le token JWT d'Anta
    db: Session = Depends(get_db)
):
    """Crée un nouveau PV signé et chiffré."""
    pv = crud_pvs.creer_pv(
        db=db,
        agent_id=agent_id,
        num_permis=pv_data.num_permis,
        plaque=pv_data.plaque,
        type_infraction=pv_data.type_infraction,
        lieu=pv_data.lieu,
        montant=pv_data.montant
    )
    return pv


@router.get("/mes-pvs/{agent_id}", response_model=list[PVResponse])
def mes_pvs(agent_id: int, db: Session = Depends(get_db)):
    """Retourne les PV d'un agent."""
    return crud_pvs.get_pvs_agent(db, agent_id)


@router.get("/tous", response_model=list[PVResponse])
def tous_les_pvs(db: Session = Depends(get_db)):
    """Retourne tous les PV — pour le superviseur."""
    return crud_pvs.get_tous_pvs(db)


@router.get("/{pv_id}", response_model=PVResponse)
def get_pv(pv_id: int, db: Session = Depends(get_db)):
    """Retourne un PV par son ID."""
    pv = crud_pvs.get_pv_by_id(db, pv_id)
    if not pv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PV introuvable"
        )
    return pv


@router.patch("/{pv_id}/statut", response_model=PVResponse)
def maj_statut(
    pv_id: int,
    statut_data: PVStatutUpdate,
    db: Session = Depends(get_db)
):
    """Met à jour le statut d'un PV."""
    pv = crud_pvs.maj_statut_pv(db, pv_id, statut_data.statut)
    if not pv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PV introuvable"
        )
    return pv


@router.get("/{pv_id}/integrite", response_model=PVIntegriteResponse)
def verifier_integrite(pv_id: int, db: Session = Depends(get_db)):
    """Vérifie l'intégrité d'un PV."""
    integre, message = crud_pvs.verifier_pv(db, pv_id)
    return PVIntegriteResponse(
        pv_id=pv_id,
        integre=integre,
        message=message
    )