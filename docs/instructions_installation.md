# ⚙️ Instructions d'Installation et d'Exécution — SenVerbalis

Ce document détaille les prérequis, la procédure d'installation et de lancement du projet **SenVerbalis** avec Docker Compose (recommandé pour la production) ou en local sans Docker (pour le développement), ainsi que l'exécution des tests.

---

## 1. Lancement avec Docker Compose (Méthode Recommandée & Sécurisée)

Cette méthode orchestre les 3 conteneurs isolés du projet (frontend React servi par Nginx, backend FastAPI et base de données PostgreSQL) dans un réseau bridge privé sécurisé.

### A. Prérequis
*   **Docker** et **Docker Compose** installés sur votre machine.

### B. Procédure de Lancement
1.  **Configurer les variables d'environnement** :
    Vérifiez ou créez le fichier `.env` à la racine du projet (copié et adapté depuis `.env.example`). Il contient les identifiants de la base de données et les clés cryptographiques de signature/chiffrement.
2.  **Lancer les conteneurs** :
    Depuis la racine du projet, compilez les images et démarrez les services en arrière-plan :
    ```bash
    docker compose up --build -d
    ```
3.  **Initialiser le compte Administrateur par défaut** :
    Exécutez le script d'initialisation dans le conteneur du backend pour créer le compte admin d'origine :
    ```bash
    docker exec -it senverbalis_backend python create_admin.py
    ```
4.  **Accéder aux services** :
    *   **Application Frontend Web** : [http://localhost:5173](http://localhost:5173)
    *   **Documentation Interactive de l'API (Swagger)** : [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. Installation et Lancement Local (Sans Docker)

Cette méthode est idéale pour le développement rapide en local en utilisant SQLite comme base de données.

### A. Prérequis Système
Assurez-vous d'avoir les outils suivants installés :
*   **Python 3.10+** (pour le backend FastAPI)
*   **Node.js 18+** et **npm** (pour le frontend React + Vite)
*   **SQLite3** (installé par défaut sur la plupart des OS)

---

## 3. Installation et Lancement du Backend (FastAPI)

1.  **Naviguer dans le répertoire backend** :
    ```bash
    cd backend
    ```

2.  **Créer et activer un environnement virtuel** :
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # Sur Linux/macOS
    # Ou venv\Scripts\activate sur Windows
    ```

3.  **Installer les dépendances** :
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configurer le fichier d'environnement** :
    Copiez le fichier d'exemple à la racine du backend et renommez-le en `.env` :
    ```bash
    cp ../.env.example .env
    ```
    *(Par défaut, le fichier `.env` est pré-configuré pour utiliser une base de données locale SQLite `sqlite:///./senverbalis.db` afin de faciliter le démarrage).*

5.  **Créer le compte Administrateur par défaut** :
    Exécutez le script d'initialisation pour générer la base de données et créer le premier compte admin :
    ```bash
    python3 create_admin.py
    ```
    *Identifiants générés par défaut :*
    *   **Identifiant** : `admin`
    *   **Mot de passe** : `AdminSenverbalis2026!`

6.  **Lancer le serveur de développement** :
    ```bash
    python3 -m uvicorn main:app --port 8000 --reload
    ```
    Le backend démarre sur : [http://localhost:8000](http://localhost:8000)
    La documentation interactive de l'API (Swagger) est disponible sur : [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4. Installation et Lancement du Frontend (React)

1.  **Ouvrir un nouveau terminal et naviguer dans le répertoire frontend** :
    ```bash
    cd frontend
    ```

2.  **Installer les dépendances Node.js** :
    ```bash
    npm install
    ```

3.  **Lancer le serveur de développement Vite** :
    ```bash
    npm run dev
    ```
    Le frontend démarre sur : [http://localhost:5173](http://localhost:5173)

---

## 5. Accès et Comptes de Démonstration

Une fois le serveur backend et le serveur frontend lancés, ouvrez votre navigateur sur [http://localhost:5173](http://localhost:5173).

### Comptes Utilisateurs disponibles (créés via l'interface Admin) :
Pour tester la console RBAC, vous pouvez vous connecter avec l'administrateur par défaut, puis créer des profils :
1.  **Administrateur** : `admin` / `AdminSenverbalis2026!`
2.  **Agent Verbalisateur** : créez un compte depuis l'interface admin (habilitation `agent`), puis connectez-vous pour saisir et signer des infractions.
3.  **Superviseur** : créez un compte (habilitation `superviseur`) pour consulter tous les PVs et exécuter les vérifications d'intégrité cryptographique (HMAC).

### Espace Citoyen (Public, sans authentification) :
Le citoyen peut consulter ses PVs en cliquant sur le lien **"Consulter mes infractions (Espace Citoyen)"** situé en bas de l'écran de connexion, ou en accédant directement à l'URL :
[http://localhost:5173/#/citoyen/consulter](http://localhost:5173/#/citoyen/consulter)

---

## 6. Exécution des Tests et Contrôles DevOps

### A. Lancer la suite de tests unitaires et d'intégration
Depuis la racine du projet (ou le dossier `backend`) :
```bash
python3 -m pytest backend/tests/ -v
```

### B. Lancer le linter syntaxique et stylistique frontend
Depuis le répertoire `frontend` :
```bash
npm run lint
```
