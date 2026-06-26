from pydantic import BaseModel, Field
from typing import Optional, Literal


class PVCreate(BaseModel):
    """Données nécessaires pour créer un PV."""

    num_permis_chiffre: str = Field(..., min_length=10, max_length=500)
    iv: str = Field(..., min_length=10, max_length=100)
    num_permis_hash: str = Field(..., min_length=64, max_length=64)
    plaque: str = Field(..., min_length=3, max_length=20)
    type_infraction: Literal[
        "Excès de vitesse",
        "Stationnement interdit",
        "Non-respect du feu rouge",
        "Feu rouge",
        "Conduite sans permis",
        "Usage du téléphone au volant",
        "Défaut d'assurance",
    ]
    lieu: str = Field(..., min_length=3, max_length=200)
    montant: float = Field(..., gt=0, le=1000000)


class PVResponse(BaseModel):
    """Données retournées au client — le permis chiffré pour déchiffrement client."""

    id: str
    num_permis_chiffre: str
    iv: str
    num_permis_hash: str
    plaque: str
    type_infraction: str
    lieu: str
    montant: float
    statut: str
    date_creation: str
    agent_username: Optional[str] = None

    model_config = {"from_attributes": True}


class PVStatutUpdate(BaseModel):
    """Mise à jour du statut d'un PV."""

    statut: str = Field(..., pattern="^(en_attente|reglee|contestee)$")


class PVIntegriteResponse(BaseModel):
    """Résultat de la vérification d'intégrité."""

    pv_id: str
    integre: bool
    message: str
