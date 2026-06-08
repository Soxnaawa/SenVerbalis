import pytest
import hashlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.crypto import (
    chiffrer, dechiffrer,
    deriver_cle, signer_pv,
    verifier_signature_pv,
    get_cle_serveur
)
from app.services.pvs import (
    construire_donnees_immuables,
    preparer_pv,
    verifier_integrite_pv
)


# ── Tests crypto ──────────────────────────────────────────────────────────

def test_chiffrement_dechiffrement():
    cle = os.urandom(32)
    iv, chiffre = chiffrer(cle, "SN-2024-12345")
    assert dechiffrer(cle, iv, chiffre) == "SN-2024-12345"


def test_derivation_cle_deterministe():
    sel = os.urandom(16)
    cle1 = deriver_cle("motdepasse", sel)
    cle2 = deriver_cle("motdepasse", sel)
    assert cle1 == cle2


def test_derivation_cle_sel_different():
    cle1 = deriver_cle("motdepasse", os.urandom(16))
    cle2 = deriver_cle("motdepasse", os.urandom(16))
    assert cle1 != cle2


def test_signature_valide():
    donnees = "SN-2024|DK-1234|Excès|Dakar|15000.0|2026-06-07"
    sig = signer_pv(donnees)
    assert verifier_signature_pv(donnees, sig)


def test_falsification_detectee():
    donnees = "SN-2024|DK-1234|Excès|Dakar|15000.0|2026-06-07"
    sig = signer_pv(donnees)
    donnees_falsifiees = "SN-2024|DK-1234|Excès|Dakar|0.0|2026-06-07"
    assert not verifier_signature_pv(donnees_falsifiees, sig)


# ── Tests services ────────────────────────────────────────────────────────

def test_preparer_pv():
    pv = preparer_pv(
        agent_id=1,
        num_permis="SN-2024-12345",
        plaque="DK-1234-AB",
        type_infraction="Excès de vitesse",
        lieu="Autoroute",
        montant=15000
    )
    assert "signature" in pv
    assert "iv" in pv
    assert "num_permis_chiffre" in pv
    assert pv["statut"] == "en_attente"
    assert pv["montant"] == 15000


def test_cle_serveur_32_octets():
    cle = get_cle_serveur()
    assert len(cle) == 32