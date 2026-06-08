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
    donnees = "chiffre|hash|DK-1234|Excès|Dakar|15000.0|2026-06-07"
    sig = signer_pv(donnees)
    assert verifier_signature_pv(donnees, sig)


def test_falsification_detectee():
    donnees = "chiffre|hash|DK-1234|Excès|Dakar|15000.0|2026-06-07"
    sig = signer_pv(donnees)
    donnees_falsifiees = "chiffre|hash|DK-1234|Excès|Dakar|0.0|2026-06-07"
    assert not verifier_signature_pv(donnees_falsifiees, sig)


# ── Tests services ────────────────────────────────────────────────────────

def test_preparer_pv():
    num_permis_chiffre_sim = "Y2hpZmZyZW1lbnRfbm9tYnJlX3Blcm1pc18xMjM0NQ=="
    iv_sim = "MTIzNDU2Nzg5MDEy"
    num_permis_hash_sim = hashlib.sha256(b"SN-2024-12345").hexdigest()

    pv = preparer_pv(
        agent_id=1,
        num_permis_chiffre=num_permis_chiffre_sim,
        iv=iv_sim,
        num_permis_hash=num_permis_hash_sim,
        plaque="DK-1234-AB",
        type_infraction="Excès de vitesse",
        lieu="Autoroute",
        montant=15000
    )
    assert "signature" in pv
    assert pv["iv"] == iv_sim
    assert pv["num_permis_chiffre"] == num_permis_chiffre_sim
    assert pv["num_permis_hash"] == num_permis_hash_sim
    assert pv["statut"] == "en_attente"
    assert pv["montant"] == 15000


def test_verifier_integrite_pv_valide():
    num_permis_chiffre_sim = "Y2hpZmZyZW1lbnRfbm9tYnJlX3Blcm1pc18xMjM0NQ=="
    iv_sim = "MTIzNDU2Nzg5MDEy"
    num_permis_hash_sim = hashlib.sha256(b"SN-2024-12345").hexdigest()

    pv_dict = preparer_pv(
        agent_id=1,
        num_permis_chiffre=num_permis_chiffre_sim,
        iv=iv_sim,
        num_permis_hash=num_permis_hash_sim,
        plaque="DK-1234-AB",
        type_infraction="Excès de vitesse",
        lieu="Autoroute",
        montant=15000
    )

    class MockPV:
        def __init__(self, d):
            for k, v in d.items():
                setattr(self, k, v)

    pv_obj = MockPV(pv_dict)

    integre, msg = verifier_integrite_pv(pv_obj)
    assert integre
    assert "aucune modification" in msg

    # Altération d'une donnée immuable (ex: montant)
    pv_obj.montant = 0
    integre_alt, msg_alt = verifier_integrite_pv(pv_obj)
    assert not integre_alt
    assert "ALERTE" in msg_alt


def test_cle_serveur_32_octets():
    cle = get_cle_serveur()
    assert len(cle) == 32