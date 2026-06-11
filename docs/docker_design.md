# Configuration Docker Compose & PostgreSQL — SenVerbalis

Ce document détaille la configuration multi-conteneurs pour le déploiement local sécurisé de **SenVerbalis** avec Docker Compose, FastAPI, PostgreSQL et React (Vite).

---

## 1. Architecture des Services (docker-compose.yml)

Nous divisons l'application en 3 conteneurs isolés au sein d'un réseau privé Docker :

```yaml
version: '3.8'

services:
  # 1. Base de données PostgreSQL
  db:
    image: postgres:15-alpine
    container_name: senverbalis_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: senverbalis
    ports:
      - "127.0.0.1:5432:5432" # Uniquement lié à localhost pour la sécurité
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - senverbalis_net

  # 2. Backend API (FastAPI)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: senverbalis_backend
    restart: always
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/senverbalis
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - SERVER_AES_KEY=${SERVER_AES_KEY}
      - SERVER_HMAC_KEY=${SERVER_HMAC_KEY}
    ports:
      - "127.0.0.1:8000:8000" # Expose l'API sur localhost:8000
    depends_on:
      - db
    networks:
      - senverbalis_net

  # 3. Frontend (React + Vite)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: senverbalis_frontend
    restart: always
    ports:
      - "127.0.0.1:5173:5173" # Expose le serveur dev React sur localhost:5173
    depends_on:
      - backend
    networks:
      - senverbalis_net

volumes:
  postgres_data:

networks:
  senverbalis_net:
    driver: bridge
```

---

## 2. Sécurité & Bonnes Pratiques de cette Configuration

### A. Isolation Réseau
Les services `db`, `backend` et `frontend` partagent le réseau privé `senverbalis_net`.
*   Le conteneur `db` n'expose son port `5432` **que sur localhost (127.0.0.1)**. Aucun attaquant sur le réseau local physique ne peut se connecter à la base de données. Seul le conteneur `backend` (sur le même réseau Docker bridge) peut y accéder via l'hôte nommé `db`.
*   Le conteneur `backend` n'expose son port `8000` **que sur localhost (127.0.0.1)** pour l'interface client.

### B. Gestion des Secrets (.env)
Les secrets et configurations sensibles ne sont jamais écrits dans les fichiers Docker ou dans le code source. Ils sont stockés dans un fichier `.env` local (exclu de Git via `.gitignore`) :
```env
DB_USER=senverbalis_app
DB_PASSWORD=SuperSecurePassword123!
JWT_SECRET_KEY=e8f9c182a4... # Généré aléatoirement
SERVER_AES_KEY=base64_aes_key...
SERVER_HMAC_KEY=base64_hmac_key...
```

### C. Persistance des Données
Le volume nommé `postgres_data` permet de conserver les données de la base de données même si les conteneurs sont arrêtés ou reconstruits avec `docker-compose down`.
