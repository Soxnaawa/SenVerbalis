# 🇸🇳 SenVerbalis — Gestion Sécurisée des Infractions Routières

**SenVerbalis** est une plateforme ministérielle sécurisée de verbalisation électronique et de suivi des procès-verbaux (PV) d'infractions routières au Sénégal. Elle répond aux exigences réglementaires de protection de la vie privée des citoyens et d'infaillibilité probatoire des PV.

## 🎯 Échéances et Objectifs Atteints (Sprint Beta & Livraison Finale)

Conformément au cahier des charges, les objectifs du **Sprint Beta** et de la **Livraison Finale** ont été pleinement réalisés, consolidant les aspects d'**audit**, de **confidentialité**, d'**intégrité**, de **conteneurisation multi-services** et de **tests d'infaillibilité** :

### 1. 🔍 Audit & Traçabilité (100% Opérationnel)
*   **Journal d'Audit Immuable** : Enregistrement de chaque action sensible (connexions, créations de PV, modifications de statuts) dans la table `audit_logs` avec adresse IP de l'acteur et détails contextuels.
*   **Sécurisation par Trigger SQL** : Des déclencheurs (triggers) bloquent de manière définitive toute opération de modification (`UPDATE`) ou de suppression (`DELETE`) sur les tables `pvs` et `audit_logs` au niveau de la base de données (PostgreSQL et SQLite).
*   **fail-safe / fail-closed** : En cas de défaillance de la base de données ou du module de signature, le système bloque par défaut l'action pour éviter tout état non sécurisé.

### 2. 🔒 Confidentialité & Zero-Knowledge (100% Opérationnel)
*   **Chiffrement Local (Client-Side)** : Le numéro de permis de conduire est chiffré en **AES-GCM-256** directement dans le navigateur de l'agent verbalisateur via la *Web Crypto API* avant sa transmission.
*   **Indexation par Hachage** : Le serveur utilise uniquement un condensat **SHA-256** du permis comme index de recherche publique. Le serveur FastAPI ne possède ni ne stocke jamais la clé de déchiffrement du permis.

### 3. 🛡️ Intégrité & Inaltérabilité (100% Opérationnel)
*   **Signature HMAC-SHA256** : À la création de chaque PV, le backend génère une signature unique sur l'ensemble des données immuables. 
*   **Le statut est stocké de manière mutable** pour lui permettre d'évoluer (réglé, contesté) sans invalider la signature d'origine.
*   **Module de Vérification** : Le superviseur peut valider instantanément si les données physiques d'un PV correspondent à sa signature cryptographique d'origine.

### 4. 🔑 Authentification & RBAC (100% Opérationnel)
*   **Authentification JWT** : Jetons éphémères stockés en mémoire uniquement (protection contre les failles XSS).
*   **Habilitations RBAC** : Contrôle d'accès strict côté serveur distinguant les rôles **Agent**, **Superviseur**, et **Administrateur**.
*   **Expiration de session** : Déconnexion automatique de l'utilisateur après 15 minutes d'inactivité complète détectée côté client.

### 5. 🐳 Conteneurisation & Orchestration (100% Opérationnel)
*   **Architecture 3-tiers** : Déploiement via Docker Compose séparant la base de données PostgreSQL, l'API backend FastAPI et l'application frontend React (servie par Nginx).

### 6. ⚙️ Intégration Continue (DevSecOps)
*   **Pipeline CI/CD (GitHub Actions)** : Analyse statique de vulnérabilités (**SAST avec Bandit**), audit des dépendances (**npm audit** & **safety**), formatage (**Black** & **ESLint**), et exécution automatique de la suite de tests (**pytest**).

---

## ⚙️ Instructions d'Installation et d'Exécution

### 1. Démarrage Rapide et Automatisé (Recommandé)
Nous fournissons un script de démarrage interactif et intelligent `start.sh` à la racine :
```bash
./start.sh
```
*   **Si Docker est présent** : Le script vous proposera de lancer l'orchestration Docker Compose (avec PostgreSQL, API et Frontend via Nginx).
*   **Si Docker n'est pas présent** : Le script configurera automatiquement l'environnement virtuel Python, installera les dépendances (`pip` et `npm`), initialisera la base SQLite et démarrera les serveurs de développement en parallèle (avec arrêt propre sur Ctrl+C).

---

### 2. Lancement avec Docker Compose (Production / Sécurisé)
Cette méthode déploie les conteneurs isolés (Base de données PostgreSQL, Backend FastAPI et Frontend React servi par Nginx) sur un réseau bridge privé.
1.  **Lancer les conteneurs** :
    ```bash
    docker compose up --build -d
    ```
2.  **Initialiser l'administrateur et appliquer les triggers** :
    ```bash
    docker exec -it senverbalis_backend python create_admin.py
    ```
3.  **Accéder aux services** :
    *   **Frontend Web** : [http://localhost:5173](http://localhost:5173)
    *   **Documentation API (Swagger)** : [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Installation et Démarrage Local Manuel (SQLite)
Si vous préférez démarrer chaque composant individuellement sans le script automatique :

#### A. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
python3 create_admin.py
python3 -m uvicorn main:app --port 8000 --reload
```

#### B. Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Accès et Comptes de Démonstration

Une fois l'application démarrée, ouvrez [http://localhost:5173](http://localhost:5173) :
*   **Administrateur** : `admin` / `Admin@Senverbalis2026!` (pour la création d'agents/superviseurs).
*   **Espace Citoyen (Sans authentification)** : Accessible depuis l'écran de connexion ou directement sur [http://localhost:5173/#/citoyen/consulter](http://localhost:5173/#/citoyen/consulter).

---

## 🧪 Exécution des Tests et DevOps

### A. Lancer la suite de tests unitaires et d'intégration
Depuis la racine du projet :
```bash
python3 -m pytest backend/tests/ -v
```

### B. Compiler et empaqueter la livraison finale
Pour regénérer l'archive de soumission compressée `senverbalis_delivery_final.zip` contenant le code propre compilé :
```bash
./build.sh
```
