import os
import sys
import pytest
import hashlib
import uuid
from fastapi import Depends
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Utiliser un fichier SQLite temporaire pour que les connexions concurrentes partagent la même base de données
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

# Utilisateurs mockés
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
    # Recréer les tables proprement avant chaque test
    Base.metadata.create_all(bind=engine)

    # Insérer les utilisateurs fictifs pour les relations de clé étrangère
    db = SessionLocal()
    from app.core.triggers import appliquer_triggers
    appliquer_triggers(db)
    db.add(mock_agent)
    db.add(mock_supervisor)
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

    # Nettoyer le fichier SQLite de test après chaque test
    if os.path.exists("./test_temp.db"):
        try:
            os.remove("./test_temp.db")
        except Exception:
            pass


def test_api_scenario_complet():
    global current_test_user_id

    # ── ÉTAPE 1 : Création d'un PV par un Agent ──────────────────────────────
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
    print("API Response:", response.json())
    assert response.status_code == 201
    pv_created = response.json()

    assert "id" in pv_created
    pv_id = pv_created["id"]
    assert len(pv_id) == 36
    assert pv_created["num_permis_chiffre"] == num_permis_chiffre_sim
    assert pv_created["iv"] == iv_sim
    assert pv_created["num_permis_hash"] == num_permis_hash_sim
    assert pv_created["statut"] == "en_attente"
    assert pv_created["montant"] == 15000.0

    # ── ÉTAPE 2 : Récupération du PV créé par l'Agent ────────────────────────
    response_get = client.get(f"/api/pvs/{pv_id}")
    assert response_get.status_code == 200
    pv_retrieved = response_get.json()
    assert pv_retrieved["id"] == pv_id
    assert pv_retrieved["plaque"] == "DK-1234-AB"

    # ── ÉTAPE 3 : Consultation de ses propres PV par l'Agent ──────────────────
    response_mes = client.get("/api/pvs/mes-pvs")
    assert response_mes.status_code == 200
    pvs_list = response_mes.json()
    assert len(pvs_list) == 1
    assert pvs_list[0]["id"] == pv_id

    # ── ÉTAPE 4 : Vérification de l'intégrité par le Superviseur ───────────────
    current_test_user_id = SUPERVISOR_ID

    response_int = client.get(f"/api/pvs/{pv_id}/integrite")
    assert response_int.status_code == 200
    integrite = response_int.json()
    assert integrite["integre"] is True
    assert "aucune modification" in integrite["message"]

    # ── ÉTAPE 5 : Mise à jour du statut par le Superviseur ─────────────────────
    response_patch = client.patch(f"/api/pvs/{pv_id}/statut", json={"statut": "reglee"})
    assert response_patch.status_code == 200
    pv_updated = response_patch.json()
    assert pv_updated["statut"] == "reglee"

    # ── ÉTAPE 6 : Validation finale de l'intégrité après changement de statut ─
    response_int_2 = client.get(f"/api/pvs/{pv_id}/integrite")
    assert response_int_2.status_code == 200
    integrite_2 = response_int_2.json()
    assert integrite_2["integre"] is True


def test_security_headers():
    response = client.get("/health")
    assert response.status_code == 200

    headers = response.headers

    # 1. Content-Security-Policy (CSP)
    assert "content-security-policy" in headers
    csp = headers["content-security-policy"]
    assert "default-src 'self'" in csp
    assert "script-src 'self'" in csp

    # 2. X-Frame-Options
    assert headers.get("x-frame-options") == "DENY"

    # 3. X-Content-Type-Options
    assert headers.get("x-content-type-options") == "nosniff"

    # 4. X-XSS-Protection
    assert headers.get("x-xss-protection") == "1; mode=block"

    # 5. Referrer-Policy
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    # 6. Permissions-Policy
    assert "permissions-policy" in headers


def test_rate_limiting_login():
    payload = {"username": "bad_user", "password": "wrong_password"}
    # Hit login route multiple times. Limit is 5/minute.
    responses = [client.post("/api/auth/login", json=payload) for _ in range(7)]
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
