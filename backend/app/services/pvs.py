from app.core.crypto import (
    signer_pv, verifier_signature_pv
)
from datetime import datetime, timezone


def construire_donnees_immuables(
    num_permis_chiffre: str,
    num_permis_hash: str,
    plaque: str,
    type_infraction: str,
    lieu: str,
    montant: float,
    date: str
) -> str:
    """Construit la chaîne de données immuables à signer."""
    return f"{num_permis_chiffre}|{num_permis_hash}|{plaque}|{type_infraction}|{lieu}|{float(montant)}|{date}"


def preparer_pv(
    agent_id: int,
    num_permis_chiffre: str,
    iv: str,
    num_permis_hash: str,
    plaque: str,
    type_infraction: str,
    lieu: str,
    montant: float
) -> dict:
    """Prépare les données d'un PV — signature."""
    date = datetime.now(timezone.utc).isoformat()

    # Signer les données immuables
    donnees = construire_donnees_immuables(
        num_permis_chiffre, num_permis_hash, plaque, type_infraction, lieu, montant, date
    )
    signature = signer_pv(donnees)

    return {
        "agent_id":           agent_id,
        "num_permis_chiffre": num_permis_chiffre,
        "iv":                 iv,
        "num_permis_hash":    num_permis_hash,
        "plaque":             plaque,
        "type_infraction":    type_infraction,
        "lieu":               lieu,
        "montant":            montant,
        "signature":          signature,
        "date_creation":      date,
        "statut":             "en_attente",
    }


def verifier_integrite_pv(pv) -> tuple[bool, str]:
    """Vérifie qu'un PV n'a pas été modifié depuis sa création."""
    donnees = construire_donnees_immuables(
        pv.num_permis_chiffre,
        pv.num_permis_hash,
        pv.plaque,
        pv.type_infraction,
        pv.lieu,
        pv.montant,
        pv.date_creation
    )

    if verifier_signature_pv(donnees, pv.signature):
        return True, "PV intègre — aucune modification détectée"
    else:
        return False, "ALERTE — PV modifié depuis sa création"