# ⚙️ Instructions d'Installation et d'Exécution — SenVerbalis

Ce document détaille les prérequis, la procédure d'installation et de lancement local du projet **SenVerbalis** sans utiliser Docker, ainsi que les commandes pour exécuter la suite de tests de sécurité.

---

## 1. Prérequis Système

Assurez-vous d'avoir les outils suivants installés sur votre machine physique :
*   **Python 3.10+** (pour le backend FastAPI)
*   **Node.js 18+** et **npm** (pour le frontend React + Vite)
*   **SQLite3** (utilisé par défaut pour le développement local afin de simplifier l'installation, ou PostgreSQL pour la production)

---

## 2. Installation et Lancement du Backend (FastAPI)

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

## 3. Installation et Lancement du Frontend (React)

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

## 4. Accès et Comptes de Démonstration

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

## 5. Exécution des Tests et Contrôles DevOps

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
