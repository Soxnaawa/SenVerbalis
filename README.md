# 🇸🇳 SenVerbalis — Gestion Sécurisée des Infractions Routières

**SenVerbalis** est une plateforme ministérielle sécurisée de verbalisation électronique et de suivi des procès-verbaux (PV) d'infractions routières au Sénégal. Elle répond aux exigences réglementaires de protection de la vie privée des citoyens et d'infaillibilité probatoire des PV.

---

## 🎯 Échéances et Objectifs Atteints (Sprint Alpha)

Conformément au cahier des charges, le **sprint Alpha** se concentre sur les aspects d'**audit**, de **traçabilité**, de **confidentialité** et d'**intégrité**. Nous avons implémenté et validé l'ensemble de ces fonctionnalités critiques :

### 1. 🔍 Audit & Traçabilité (100% Opérationnel)
*   **Journal d'Audit Immuable** : Enregistrement de chaque action sensible (connexions, créations de PV, modifications de statuts) dans la table `audit_logs` avec adresse IP de l'acteur et détails contextuels.
*   **Sécurisation par Trigger SQL** : Des déclencheurs (triggers) bloquent de manière définitive toute opération de modification (`UPDATE`) ou de suppression (`DELETE`) sur les tables `pvs` et `audit_logs` au niveau de la base de données.
*   **fail-safe / fail-closed** : En cas de défaillance de la base de données ou du module de signature, le système bloque par défaut l'action pour éviter tout état non sécurisé.

### 2. 🔒 Confidentialité & Zero-Knowledge (100% Opérationnel)
*   **Chiffrement Local (Client-Side)** : Le numéro de permis de conduire est chiffré en **AES-GCM-256** directement dans le navigateur de l'agent verbalisateur via la *Web Crypto API* avant sa transmission.
*   **Indexation par Hachage** : Le serveur utilise uniquement un condensat **SHA-256** du permis comme index de recherche publique. Le serveur FastAPI ne possède ni ne stocke jamais la clé de déchiffrement du permis.

### 3. 🛡️ Intégrité & Inaltérabilité (100% Opérationnel)
*   **Signature HMAC-SHA256** : À la création de chaque PV, le backend génère une signature unique sur l'ensemble des données immuables. 
*   **Le statut est stocké de manière mutable** pour lui permettre d'évoluer (réglé, contesté) sans invalider la signature d'origine.
*   **Module de Vérification** : Le superviseur peut valider instantanément si les données physiques d'un PV correspondent à sa signature cryptographique d'origine.

### 4. 🔑 Authentification & RBAC (En avance sur le Sprint Beta)
*   **Authentification JWT** : Jetons éphémères stockés en mémoire uniquement (protection contre les failles XSS).
*   **Habilitations RBAC** : Contrôle d'accès strict côté serveur distinguant les rôles **Agent**, **Superviseur**, et **Administrateur**.
*   **Expiration de session** : Déconnexion automatique de l'utilisateur après 15 minutes d'inactivité complète détectée côté client.

### 5. ⚙️ Intégration Continue (DevSecOps)
*   **Pipeline CI/CD (GitHub Actions)** : Analyse statique de vulnérabilités (**SAST avec Bandit**), audit des dépendances (**npm audit** & **safety**), formatage (**Black** & **ESLint**), et exécution automatique de la suite de tests (**pytest**).

---

## ⚙️ Instructions d'Installation et d'Exécution

### 1. Prérequis Système
Assurez-vous d'avoir les outils suivants installés sur votre machine :
*   **Python 3.10+** (pour le backend FastAPI)
*   **Node.js 18+** et **npm** (pour le frontend React + Vite)
*   **SQLite3** (utilisé par défaut pour le développement local afin de simplifier l'installation, ou PostgreSQL pour la production)

### 2. Installation et Lancement du Backend (FastAPI)

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

### 3. Installation et Lancement du Frontend (React)

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

## 🔑 Accès et Comptes de Démonstration

Une fois le serveur backend et le serveur frontend lancés, ouvrez votre navigateur sur [http://localhost:5173](http://localhost:5173).

*   **Administrateur** : `admin` / `AdminSenverbalis2026!` (sert à créer des comptes Agents ou Superviseurs).
*   **Espace Citoyen (Sans authentification)** : Accessible en cliquant sur le bouton **"Consulter mes infractions (Espace Citoyen)"** en bas de l'écran de connexion ou directement via : [http://localhost:5173/#/citoyen/consulter](http://localhost:5173/#/citoyen/consulter).

---

## 🧪 Exécution des Tests de Régression

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

---

## 📅 Échéance à venir (Sprint Beta)

*   **🐳 Containerisation & Orchestration (Docker Compose)** : Déploiement unifié sous conteneurs Docker pour isoler le Frontend React, le Backend FastAPI et la base de données PostgreSQL dans un réseau privé sécurisé.
