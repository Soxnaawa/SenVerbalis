from fastapi import FastAPI
from app.api.pvs import router as pvs_router
from app.core.database import init_db

app = FastAPI(title="SenVerbalis API")

# Initialise les tables de la base de données
init_db()

app.include_router(pvs_router)

@app.get("/")
def read_root():
    return {"status": "running", "service": "SenVerbalis API"}
