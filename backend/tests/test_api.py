import os
import sys
import pytest
import hashlib
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Utiliser un fichier SQLite temporaire pour que les connexions concurrentes partagent la même base de données
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"

from app.main import app
from app.core.database import SessionLocal, engine
from app.models.pv import Base

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    # Recréer les tables proprement avant chaque test
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Nettoyer le fichier SQLite de test après chaque test
    if os.path.exists("./test_temp.db"):
        try:
            os.remove("./test_temp.db")
        except Exception:
            pass


def test_api_scenario_complet():
    # 1. Création d'un PV (avec données chiffrées/hachées simulant le client React)
    num_permis_chiffre_sim = "Y2hpZmZyZW1lbnRfbm9tYnJlX3Blcm1pc18xMjM0NQ=="
    iv_sim = "MTIzNDU2Nzg5MDEy"
    num_permis_hash_sim = hashlib.sha256(b"SN-2024-12345").hexdigest()

    payload = {
        "num_permis_chiffre": num_permis_chiffre_sim,
        "iv": iv_sim,
        "num_permis_hash": num_permis_hash_sim,
        "plaque": "DK-1234-AB",
        "type_infraction": "Excès de vitesse",
        "lieu": "Autoroute",
        "montant": 15000.0
    }

    # Création du PV via POST (avec agent_id=42 en paramètre de requête pour simuler l'agent connecté)
    response = client.post("/api/pvs/?agent_id=42", json=payload)
    assert response.status_code == 201
    pv_created = response.json()
    
    # Vérification des propriétés du PV créé
    assert "id" in pv_created
    pv_id = pv_created["id"]
    assert len(pv_id) == 36  # UUID standard a 36 caractères
    assert pv_created["num_permis_chiffre"] == num_permis_chiffre_sim
    assert pv_created["iv"] == iv_sim
    assert pv_created["num_permis_hash"] == num_permis_hash_sim
    assert pv_created["statut"] == "en_attente"
    assert pv_created["montant"] == 15000.0

    # 2. Récupération du PV créé via GET
    response_get = client.get(f"/api/pvs/{pv_id}")
    assert response_get.status_code == 200
    pv_retrieved = response_get.json()
    assert pv_retrieved["id"] == pv_id
    assert pv_retrieved["plaque"] == "DK-1234-AB"

    # 3. Récupération des PV de l'agent via GET /mes-pvs/42
    response_mes = client.get("/api/pvs/mes-pvs/42")
    assert response_mes.status_code == 200
    pvs_list = response_mes.json()
    assert len(pvs_list) == 1
    assert pvs_list[0]["id"] == pv_id

    # 4. Vérification de l'intégrité via GET /integrite (doit être valide)
    response_int = client.get(f"/api/pvs/{pv_id}/integrite")
    assert response_int.status_code == 200
    integrite = response_int.json()
    assert integrite["integre"] is True
    assert "aucune modification" in integrite["message"]

    # 5. Mise à jour du statut via PATCH (ex: reglee)
    response_patch = client.patch(f"/api/pvs/{pv_id}/statut", json={"statut": "reglee"})
    assert response_patch.status_code == 200
    pv_updated = response_patch.json()
    assert pv_updated["statut"] == "reglee"

    # 6. Vérification finale que la mise à jour du statut n'a pas cassé l'intégrité HMAC
    response_int_2 = client.get(f"/api/pvs/{pv_id}/integrite")
    assert response_int_2.status_code == 200
    integrite_2 = response_int_2.json()
    assert integrite_2["integre"] is True  # Le statut a été modifié mais la signature HMAC est toujours valide
