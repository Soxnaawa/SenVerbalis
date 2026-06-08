from pydantic import BaseModel, Field
from typing import Optional


class PVCreate(BaseModel):
    """Données nécessaires pour créer un PV."""
    num_permis:      str   = Field(..., min_length=5, max_length=50)
    plaque:          str   = Field(..., min_length=3, max_length=20)
    type_infraction: str   = Field(..., min_length=3, max_length=100)
    lieu:            str   = Field(..., min_length=3, max_length=200)
    montant:         float = Field(..., gt=0)


class PVResponse(BaseModel):
    """Données retournées au client — jamais le permis en clair."""
    id:              int
    plaque:          str
    type_infraction: str
    lieu:            str
    montant:         float
    statut:          str
    date_creation:   str

    class Config:
        from_attributes = True


class PVStatutUpdate(BaseModel):
    """Mise à jour du statut d'un PV."""
    statut: str = Field(..., pattern="^(en_attente|reglee|contestee)$")


class PVIntegriteResponse(BaseModel):
    """Résultat de la vérification d'intégrité."""
    pv_id:    int
    integre:  bool
    message:  str