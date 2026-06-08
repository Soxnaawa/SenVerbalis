import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.db import SessionLocal, Base, engine
from app.crud.user import create_user, get_by_username
from app.models.user import Role

Base.metadata.create_all(bind=engine)

db = SessionLocal()
if get_by_username(db, "admin"):
    print("⚠️  Un compte admin existe déjà.")
else:
    user = create_user(db, "admin", "admin@senverbalis.sn",
                       "Admin@Senverbalis2026!", Role.ADMIN, "system")
    print(f"✅ Admin créé : {user.username}")
db.close()