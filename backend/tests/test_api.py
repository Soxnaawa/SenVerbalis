import os
import sys
import pytest
import hashlib
import uuid
from fastapi import Depends
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"
os.environ["DB_USER"] = "test"
os.environ["DB_PASSWORD"] = "test"
os.environ["JWT_SECRET_KEY"] = "test"

from main import app
from app.db import SessionLocal, engine, Base, get_db
from app.models.user import User, Role
from app.core.dependencies import get_current_user

AGENT_ID = uuid.uuid4()
SUPERVISOR_ID = uuid.uuid4()

mock_agent = User(
    id=AGENT_ID,
    username="agent_test",
    email="agent@test.com",
    hashed_password="mocked_password",
    role=Role.AGENT,
    is_active=True,
)

mock_supervisor = User(
    id=SUPERVISOR_ID,
    username="super_test",
    email="super@test.com",
    hashed_password="mocked_password",
    role=Role.SUPERVISEUR,
    is_active=True,
)

current_test_user_id = AGENT_ID


def override_current_user(db=Depends(get_db)):
    user = db.query(User).filter(User.id == current_test_user_id).first()
    return user


app.dependency_overrides[get_current_user] = override_current_user

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.add(mock_agent)
    db.add(mock_supervisor)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test_temp.db"):
        try:
            os.remove("./test_temp.db")
        except Exception:
            pass


def test_api_scenario_complet():
    global current_test_user_id

    # ÉTAPE 1 : Création d'un PV par un Agent
    current_test_user_id = AGENT_ID
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
        "montant": 15000.0,
    }

    response = client.post("/api/pvs/", json=payload)
    assert response.status_code == 201
    pv_created = response.json()
    pv_id = pv_created["id"]
    assert len(pv_id) == 36
    assert pv_created["statut"] == "en_attente"

    # ÉTAPE 2 : Récupération du PV par l'Agent
    response_get = client.get(f"/api/pvs/{pv_id}")
    assert response_get.status_code == 200
    assert response_get.json()["plaque"] == "DK-1234-AB"

    # ÉTAPE 3 : Liste des PV de l'Agent
    response_mes = client.get("/api/pvs/mes-pvs")
    assert response_mes.status_code == 200
    assert len(response_mes.json()) == 1

    # ÉTAPE 4 : Vérification intégrité par le Superviseur
    current_test_user_id = SUPERVISOR_ID
    response_int = client.get(f"/api/pvs/{pv_id}/integrite")
    assert response_int.status_code == 200
    assert response_int.json()["integre"] is True

    # ÉTAPE 5 : Mise à jour du statut par le Superviseur
    response_patch = client.patch(
        f"/api/pvs/{pv_id}/statut", json={"statut": "reglee"}
    )
    assert response_patch.status_code == 200
    assert response_patch.json()["statut"] == "reglee"

    # ÉTAPE 6 : Intégrité toujours valide après changement de statut
    response_int_2 = client.get(f"/api/pvs/{pv_id}/integrite")
    assert response_int_2.status_code == 200
    assert response_int_2.json()["integre"] is True


def test_security_headers():
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers
    assert "content-security-policy" in headers
    assert "x-frame-options" in headers
    assert "x-content-type-options" in headers


def test_rate_limiting_login():
    payload = {"username": "bad_user", "password": "wrong_password"}
    responses = [client.post("/api/auth/login", json=payload) for _ in range(7)]
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes