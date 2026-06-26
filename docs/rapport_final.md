# 🇸🇳 Rapport de Conception et de Sécurité Final — SenVerbalis

Ce document constitue le rapport final exigé par la **Partie 5** du projet de programmation sécurisée (DevSecOps). Il détaille l'architecture de sécurité mise en œuvre dans **SenVerbalis**, justifie nos choix technologiques, analyse la gestion des secrets et détaille notre plan d'assurance qualité.

---

## 1. Autorisation (DAC vs MAC & RBAC)

### A. Choix et Justification de la Politique
Dans SenVerbalis, nous utilisons un modèle de **contrôle d'accès basé sur les rôles (RBAC)** qui s'apparente à une politique hybride :
*   **RBAC (Role-Based Access Control)** : Les utilisateurs sont affectés à un rôle spécifique parmi **Administrateur**, **Agent**, **Superviseur** ou **Citoyen**. Chaque privilège applicatif est lié à ces rôles.
*   **DAC (Discretionary Access Control)** : L'Agent verbalisateur possède un contrôle discrétionnaire sur les PV qu'il a lui-même créés. La route `/api/pvs/mes-pvs` applique un cloisonnement strict : un agent ne peut lister ou récupérer que ses propres procès-verbaux (propriétaire de la ressource).
*   **MAC (Mandatory Access Control)** : La vérification d'intégrité cryptographique globale, le changement de statut et la gestion globale des infractions sont régis par des règles impératives imposées par le système. Seul le rôle **Superviseur** peut modifier le statut ou auditer la signature d'un PV, tandis que seul le rôle **Administrateur** peut gérer les comptes.

### B. Implémentation Technique
Les habilitations sont contrôlées de manière centralisée côté serveur (FastAPI) grâce au mécanisme de dépendance de framework. Nous utilisons la fonction `require_role(*roles)` située dans [dependencies.py](file:///home/w4ro/SenVerbalis/backend/app/core/dependencies.py) :
```python
def require_role(*roles: Role):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès interdit : droits insuffisants."
            )
        return current_user
    return checker
```
Chaque route sensible est ainsi décorée avec `Depends(require_role(...))`.

### C. Gestion des Modifications de Politique
Toute modification des politiques d'habilitation ou des attributions de rôles est contrôlée de manière exclusive par le rôle **Administrateur** via la console d'administration. La désactivation d'un compte (pour révoquer l'accès) est effective immédiatement : le middleware de sécurité vérifie à chaque requête la validité et l'activité du compte dans la base de données.

---

## 2. Authentification

### A. Authentification des Utilisateurs Humains
Les utilisateurs s'authentifient via une requête `POST` sur la route `/api/auth/login` en fournissant leur nom d'utilisateur et leur mot de passe.
*   **Vérification de mot de passe** : Utilisation du hachage sécurisé **Bcrypt** avec sel pour résister aux attaques par dictionnaire ou tables de correspondance.
*   **Gestion des Sessions (JWT)** : Après validation, le backend émet un jeton **JSON Web Token (JWT)** signé cryptographiquement.
*   **Stockage du Token (anti-XSS)** : Le jeton JWT est renvoyé au client et stocké uniquement **en mémoire (state React)**. Aucun jeton n'est écrit dans le `localStorage` ou dans des cookies non sécurisés, éliminant ainsi le risque de vol de session par faille XSS (Cross-Site Scripting).

### B. Authentification des Flux API & Programmes
Pour les flux machine-to-machine (ex: espace citoyen pour la consultation publique), l'authentification repose sur l'index de recherche deterministe `num_permis_hash`. Les requêtes publiques sont validées de manière stricte par schéma Pydantic et limitées par un rate-limiter applicatif.

---

## 3. Audit & Traçabilité (Responsabilité des Actions)

Pour garantir l'infaillibilité et la responsabilité des actions, SenVerbalis implémente deux couches de protection :

### A. Journalisation Applicative Immuable
Chaque action sensible (création de PV, authentification réussie ou échouée, modification de statut, validation d'intégrité) est journalisée dans la table `audit_logs`. Le log capture :
*   Le timestamp de l'action (UTC) ;
*   L'acteur (nom d'utilisateur ou "system") ;
*   L'action réalisée (ex: `PV_CREE`, `LOGIN_FAILED`) ;
*   L'identifiant de la cible ;
*   Les détails contextuels et l'adresse IP source du client.

### B. Déclencheurs SQL (Triggers) de Défense en Profondeur
Pour empêcher un administrateur système ou un attaquant ayant corrompu le backend de falsifier les preuves :
1.  **Sur la table `audit_logs`** : Des déclencheurs SQL bloquent formellement toute opération de modification (`UPDATE`) ou de suppression (`DELETE`) au niveau du moteur de la base de données (SQLite et PostgreSQL).
2.  **Sur la table `pvs`** : Des triggers interdisent la suppression (`DELETE`) et bloquent toute modification (`UPDATE`) sur les colonnes physiques immuables (montant, plaque, type d'infraction, etc.). Seul le `statut` peut être mis à jour.

---

## 4. Confidentialité (Architecture Zero-Knowledge)

La confidentialité des données personnelles (PII) des citoyens est assurée par une approche **Zero-Knowledge** :
1.  **Chiffrement Client** : Le numéro de permis de conduire est chiffré dans le navigateur de l'agent avant d'être transmis en réseau, en utilisant la clé dérivée du mot de passe de l'infraction.
2.  **Indexation Déterministe** : Un hash SHA-256 du permis (`num_permis_hash`) est calculé côté client et envoyé au serveur pour servir d'index de recherche.
3.  **Isolation du Serveur** : Le serveur stocke le permis chiffré et le hash, mais ne possède jamais la clé de chiffrement. En cas de fuite de la base de données, l'identité des conducteurs reste indéchiffrable.

---

## 5. Intégrité (Infaillibilité Probatoire)

L'intégrité physique de chaque procès-verbal est assurée par une **signature HMAC-SHA256** générée côté serveur à la création du PV :
*   La signature est calculée sur les colonnes immuables (`id`, `agent_id`, `num_permis_chiffre`, `iv`, `plaque`, `type_infraction`, `lieu`, `montant`, `date_creation`).
*   Le `statut` est exclu de la signature pour lui permettre d'évoluer (ex: de "en_attente" à "reglee") sans invalider l'intégrité d'origine de l'infraction.
*   En cas d'altération physique directe (ex: modification du montant en base de données par un DBA corrompu), le module de vérification détecte instantanément l'incohérence entre les données et la signature HMAC.

---

## 6. Gestion des Secrets & Cryptographie

### A. Choix des Algorithmes et Tailles
*   **Chiffrement Symétrique** : **AES-GCM-256** (clé de 32 octets, IV aléatoire de 12 octets). GCM fournit un chiffrement authentifié (AEAD), garantissant la confidentialité et l'authenticité de la charge utile.
*   **Dérivation de Clé (KDF)** : **PBKDF2-HMAC-SHA256** avec sel de 16 octets et 100 000 itérations côté client.
*   **Hachage d'Index** : **SHA-256** pour l'anonymisation du permis de conduire.
*   **Signature du PV** : **HMAC-SHA256** (clé de 32 octets stockée en variable d'environnement).
*   **Hachage des Mots de Passe** : **Bcrypt** avec un coût de travail adaptatif.

### B. Stockage et Cycle de Vie des Clés
*   **Clés de Session Client** : Dérivées à la volée en mémoire à partir du permis/mot de passe et immédiatement purgées par le ramasse-miettes (Garbage Collector) du navigateur à la fermeture de l'onglet.
*   **Secrets Serveur** : Chargés depuis le fichier d'environnement sécurisé `.env` (exclu de Git) sous forme de variables d'environnement (`SERVER_AES_KEY`, `SERVER_HMAC_KEY`, `JWT_SECRET_KEY`). Elles ne sont jamais stockées sur disque ou dans la base de données.

---

## 7. Assurance Qualité (Tests & Validation)

### A. Niveaux de Tests Automatisés
*   **Tests Unitaires** : Couverture complète des modules cryptographiques, de la logique de dérivation de clés, du chiffrement AES et des signatures HMAC dans [test_pvs.py](file:///home/w4ro/SenVerbalis/backend/tests/test_pvs.py).
*   **Tests d'Intégration** : Scénarios réels de création de PV par un agent, récupération, modification de statut et audit d'intégrité par un superviseur dans [test_api.py](file:///home/w4ro/SenVerbalis/backend/tests/test_api.py).
*   **Tests de Sécurité (DAST/SAST)** : Validation automatisée des en-têtes HTTP de sécurité (CSP, X-Frame-Options), tests de protection contre le brute-force (Rate Limiting renvoyant une erreur 429), et analyse de vulnérabilités statique via **Bandit** (SAST).
*   **Tests de Triggers SQL** : Tests unitaires simulant des attaques de contournement pour valider le rejet des modifications d'audit logs et de PV par le moteur de base de données.

### B. Pratiques de Développement
Le développement a suivi les pratiques de pair programming pour les modules sensibles (chiffrement/déchiffrement client) et une revue de code mutuelle systématique sur les branches thématiques avant fusion sur `test-audit`. La pipeline de CI intégrée à GitHub Actions garantit qu'aucun code ne peut être déployé sans passer 100 % de la suite de tests de régression.
