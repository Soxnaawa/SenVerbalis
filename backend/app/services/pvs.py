from app.core.crypto import (
    chiffrer, dechiffrer,
    signer_pv, verifier_signature_pv,
    get_cle_serveur
)
from datetime import datetime, timezone


def construire_donnees_immuables(
    num_permis: str,
    plaque: str,
    type_infraction: str,
    lieu: str,
    montant: float,
    date: str
) -> str:
    """Construit la chaîne de données immuables à signer."""
    return f"{num_permis}|{plaque}|{type_infraction}|{lieu}|{float(montant)}|{date}"


def preparer_pv(
    agent_id: int,
    num_permis: str,
    plaque: str,
    type_infraction: str,
    lieu: str,
    montant: float
) -> dict:
    """Prépare les données d'un PV — chiffrement + signature."""
    cle = get_cle_serveur()
    date = datetime.now(timezone.utc).isoformat()

    # Chiffrer le numéro de permis
    iv, permis_chiffre = chiffrer(cle, num_permis)

    # Signer les données immuables
    donnees = construire_donnees_immuables(
        num_permis, plaque, type_infraction, lieu, montant, date
    )
    signature = signer_pv(donnees)

    return {
        "agent_id":           agent_id,
        "num_permis_chiffre": permis_chiffre,
        "iv":                 iv,
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
    cle = get_cle_serveur()

    try:
        num_permis = dechiffrer(cle, pv.iv, pv.num_permis_chiffre)
    except Exception:
        return False, "Impossible de déchiffrer le numéro de permis"

    donnees = construire_donnees_immuables(
        num_permis,
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