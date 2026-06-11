# 📚 Documentation Complète d'Architecture et de Conception — SenVerbalis

Ce document regroupe de manière structurée l'ensemble des décisions d'architecture, de sécurité, de conception technique et les règles de collaboration retenues pour le projet **SenVerbalis**. 

---

## 1. 🏗️ Architecture Globale et Bonnes Pratiques

Cette section définit les règles de base adaptées pour un travail d'équipe fluide via Git, sans sur-complexifier le projet.

### A. Architecture 3 Tiers Containerisée
*   **Séparation Stricte** : Le projet est divisé entre le Frontend (React), le Backend (FastAPI) et la Base de données (PostgreSQL).
*   **Orchestration Docker (Fin du "Ça marche sur mon PC")** : Le tout est orchestré par Docker Compose. Cela élimine définitivement le fameux problème du *"ça marche sur ma machine mais pas sur la tienne"*. Chaque développeur de l'équipe aura exactement le même environnement (mêmes versions de Node, Python et PostgreSQL), configuré et prêt à l'emploi.
*   **Isolation Réseau** : Le Frontend n'a jamais d'accès direct à la base de données. Seul le Backend agit comme intermédiaire sécurisé.
*   **API RESTful** : Le backend expose une API standardisée avec des endpoints prévisibles (ex: `POST /api/pvs/`, `GET /api/pvs/{id}`).

### B. Collaboration via Git
*   **Exclusions Strictes (`.gitignore`)** : Les dossiers virtuels (`venv/`, `__pycache__/`), les dépendances (`node_modules/`), et les fichiers secrets (`.env`) doivent impérativement être ignorés.
*   **Flux de Travail (Feature Branches)** : Éviter de pousser directement sur la branche principale (`main`). Créer une branche par tâche (ex: `feat/backend-auth`, `feat/react-ui`).
*   **Messages de Commit** : Utiliser des messages clairs et structurés pour expliquer le "pourquoi" de la modification.

### C. Qualité du Code
*   **Validation des Entrées (Pydantic)** : Aucune donnée provenant du Frontend n'est acceptée aveuglément. FastAPI et Pydantic valident les types et les formats avant tout traitement.
*   **Typage Statique** : Utilisation extensive des *Type Hints* en Python pour rendre le code prédictible et auto-documenté.

### D. Bonnes Pratiques Web API
*   **CORS Strict** : Le Backend FastAPI n'acceptera que les requêtes provenant de l'URL exacte de notre Frontend React.
*   **Gestion Sécurisée des Erreurs** : Interception globale des erreurs. En cas de bug, le serveur renvoie une erreur générique ("Erreur interne") au client pour ne **jamais divulguer** la "stack trace" ou la structure du code à un attaquant.
*   **Journalisation (Logging)** : Utilisation d'un logger propre (au lieu de simples `print()`) pour tracer les accès et les erreurs de manière professionnelle.
*   **Pagination** : Toute route renvoyant des listes (ex: l'historique des PVs) sera paginée (`limit`, `offset`) pour empêcher la surcharge du serveur (protection contre le Déni de Service applicatif).

### E. Tests & Documentation (Standard de l'Industrie)
*   **Documentation Automatique (Swagger/OpenAPI)** : Grâce à FastAPI, l'API générera automatiquement sa propre documentation interactive sur la route `/docs`. Toujours garder l'API auto-documentée est une pratique d'excellence.
*   **Tests Unitaires (TDD)** : Le Backend inclura des tests unitaires (via `pytest`) pour valider la cryptographie (HMAC) et la logique métier sans avoir besoin de lancer toute l'application.
*   **HTTPS (Chiffrement en transit)** : En production, le serveur devra obligatoirement être derrière un certificat TLS/SSL (HTTPS) pour chiffrer les requêtes entre React et FastAPI, même si les données (Nom, CNI) sont déjà chiffrées en AES-GCM (Défense en profondeur).

---

## 2. 🔐 Sécurité et Conception Technique (Niveau SSI)

Cette section détaille les choix cryptographiques et structurels pour garantir un niveau de sécurité optimal.

### A. Choix du Framework Backend (FastAPI)
FastAPI a été choisi (au lieu de frameworks plus lourds) pour les raisons suivantes :
*   **Validation intégrée** : Intégration native avec Pydantic pour sécuriser les entrées.
*   **REST API performante** : Idéal pour exposer des endpoints asynchrones légers qui communiquent en JSON avec le frontend React (Vite).
*   **Intégration Cryptographique** : Intégration naturelle des bibliothèques Python (`cryptography` pour AES-GCM/PBKDF2 et `passlib` pour les mots de passe).

### B. Cryptographie Client (Zero-Knowledge) dans le Navigateur
Les données personnelles des citoyens (Nom, CNI, Permis) ne doivent jamais être connues par le serveur en clair.
1.  **Dérivation** : Le NINA ou le mot de passe du citoyen sert à dériver une clé de 256 bits via **PBKDF2** (avec un sel).
2.  **Chiffrement** : Les champs sensibles sont chiffrés localement dans le navigateur en **AES-256-GCM** via la *Web Crypto API* (`window.crypto.subtle`).
3.  **Stockage** : Seul le bloc chiffré (ciphertext, salt, nonce, tag) est transmis à FastAPI.

### C. Intégrité des PV et Signature HMAC
*   **Le problème** : Un PV doit être inaltérable, mais son statut (`en attente`, `reglée`, `contestée`) doit pouvoir évoluer.
*   **La solution** : Chaque PV reçoit une signature cryptographique (`HMAC-SHA256`) générée par le backend **uniquement sur les données immuables** de l'infraction (référence, date, lieu, plaque, infraction, citoyen, agent). Le statut est stocké séparément, permettant sa modification sans briser la signature d'intégrité du PV.

### D. Immutabilité Physique (Triggers PostgreSQL)
Pour empêcher formellement toute modification (UPDATE) ou suppression (DELETE) de l'historique (PV et Audit Log), des **Triggers PostgreSQL** bloquent ces actions directement au niveau du moteur SQL. Même un administrateur connecté à la base ne pourra pas altérer les logs.

### E. Gestion Multi-niveaux des Secrets Serveur
Les secrets (Mots de passe DB, Clé secrète JWT/HMAC) ne sont **jamais codés en dur ni commités sur Git**.
1.  **Priorité** : Lecture à partir du fichier local `.env`.
2.  **Secours local** : Lecture depuis un fichier de configuration sécurisé `.server_keys` (non suivi par Git).
3.  **Moindre Privilège** : Le compte de base de données (ex: UUID au lieu de Auto-Increment) n'a des droits que sur la base SenVerbalis.

### F. Bonnes Pratiques de Sécurité (OWASP & Application)
Pour consolider la robustesse du système, les pratiques suivantes sont obligatoires :
*   **Robustesse des Mots de Passe** : Validation stricte côté serveur (12+ caractères mixtes). Côté client, intégration d'une jauge d'entropie (ex: `zxcvbn`) pour conseiller l'utilisateur.
*   **Limitation de Débit (Rate Limiting)** : Protection anti-bruteforce et anti-DoS sur les endpoints sensibles (ex: `/api/auth/login`).
*   **Expiration de Session (Inactivité)** : Le JWT a une durée de vie courte. Le client (React) déconnecte automatiquement l'agent après 15 minutes d'inactivité.
*   **Prévention XSS & En-têtes Sécurisés** : Mise en place d'une Content Security Policy (CSP) stricte. Interdiction absolue d'utiliser `dangerouslySetInnerHTML` dans React.
*   **Assainissement des Logs** : Les journaux techniques et l'Audit Log sont filtrés pour s'assurer qu'aucun secret ou PII en clair ne fuite.
*   **Comportement Fail-Safe** : En cas de défaillance d'un composant de vérification (ex: base de données inaccessible ou signature HMAC illisible), le système bloque par défaut l'action (Fail-Closed) au lieu de l'autoriser.

---

## 3. 🐳 Configuration Déploiement Local (Docker Compose)

Nous divisons l'application en 3 conteneurs isolés au sein d'un réseau privé Docker (`senverbalis_net`).

### A. Le fichier `docker-compose.yml`

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
      - "127.0.0.1:5432:5432" # Uniquement lié à localhost
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
      - "127.0.0.1:8000:8000"
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
      - "127.0.0.1:5173:5173"
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

### B. Sécurité du Déploiement Docker
*   **Isolation Réseau** : Le conteneur `db` n'expose son port `5432` que sur `localhost`. Aucun attaquant sur le réseau local physique ne peut s'y connecter directement.
*   **Persistance** : Le volume `postgres_data` permet de conserver les données de la base même en cas d'arrêt (`docker-compose down`).
*   **Environnement** : Les variables sont lues depuis le `.env` de la machine hôte. Un fichier `.env.example` vide sera fourni sur Git.

---

## 4. 📂 Structure du Référentiel 

Pour garantir une maintenabilité à long terme et un travail d'équipe fluide, le code source respecte une arborescence professionnelle standardisée pour FastAPI et React.

```text
SenVerbalis/
├── docker-compose.yml       # Orchestration globale
├── .env                     # Variables d'environnement secrètes (NON COMMITÉ)
├── .env.example             # Modèle vide pour l'équipe (COMMITÉ)
├── .gitignore               # Règles d'exclusion Git globales
│
├── backend/                 # 🐍 API FastAPI
│   ├── Dockerfile           # Recette de construction du backend
│   ├── requirements.txt     # Dépendances Python
│   ├── main.py              # Point d'entrée de l'API FastAPI
│   ├── app/                 # Code source de l'application
│   │   ├── api/             # Routes REST (endpoints) classées par domaine (auth, pvs)
│   │   ├── core/            # Configurations et sécurité (cryptographie, JWT)
│   │   ├── models/          # Modèles SQLAlchemy (Structure des tables en Base de Données)
│   │   ├── schemas/         # Modèles Pydantic (Validation stricte des données in/out)
│   │   ├── crud/            # Logique de requête à la base de données (Create, Read, Update, Delete)
│   │   └── services/        # Logique métier complexe (génération HMAC, etc.)
│   └── tests/               # Tests unitaires et d'intégration
│
└── frontend/                # ⚛️ Application React (Vite)
    ├── Dockerfile           # Recette de construction du frontend
    ├── package.json         # Dépendances Node.js
    ├── vite.config.js       # Configuration Vite
    └── src/                 # Code source React
        ├── assets/          # Images, icônes, polices
        ├── components/      # Composants UI réutilisables (Boutons, Modales)
        ├── pages/           # Vues principales (Login, Dashboard, Formulaire PV)
        ├── services/        # Appels à l'API Backend (Axios/Fetch)
        ├── utils/           # Utilitaires (Zero-Knowledge Web Crypto API)
        └── context/         # Gestion d'état global (ex: Session Utilisateur)
```

---

## 5. ⚙️ Pratiques DevOps & Pipeline CI/CD (DevSecOps)

Pour atteindre un niveau de qualité professionnel, le projet intègre la logique d'un pipeline d'Intégration Continue (CI/CD) automatisé, exécuté via **GitHub Actions** ou **GitLab CI**. Ce pipeline a pour but de bloquer toute fusion de code si une faille de sécurité est détectée.

### A. Qualité du Code (Linting & Formatage)
*   **Backend (Python)** : Utilisation de **Ruff** (ou Black/Flake8) pour formater le code de l'équipe de manière identique et éviter les conflits Git.
*   **Frontend (React)** : Utilisation d'**ESLint** et **Prettier** pour détecter les erreurs de syntaxe et standardiser le code JavaScript/TypeScript.

### B. Sécurité Continue Automatisée (SSI)
*   **SAST (Static Application Security Testing)** : Analyse du code source avec des outils comme **Bandit** (pour Python) ou **SonarQube** afin de détecter les vulnérabilités (injections, secrets codés en dur, configuration faible).
*   **SCA (Software Composition Analysis)** : Vérification stricte des bibliothèques externes (`requirements.txt`, `package.json`) en les croisant avec les bases de données mondiales de vulnérabilités connues (CVE).
*   **Scanner de Conteneurs** : Avant tout déploiement, les images Docker sont analysées par des outils spécialisés (comme **Trivy** ou **Clair**) pour garantir que le système d'exploitation de base (Alpine, Debian) ne contient pas de failles publiques exploitables.

### C. Conteneurisation Uniforme Locale
*   Pour le développement, la commande `docker-compose up --build` fait office de pipeline universel. Il n'y a **aucune installation manuelle** requise sur les machines physiques de l'équipe.
