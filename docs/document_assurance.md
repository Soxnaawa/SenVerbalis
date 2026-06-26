# 🧪 Document d'Assurance Qualité et de Validation — SenVerbalis

Ce document détaille notre approche de test, l'architecture de validation du code source, la couverture de test obtenue, nos pratiques de développement collaboratif, ainsi que la configuration des tests de régression continue pour le projet **SenVerbalis**.

---

## 1. Stratégie de Test & Niveaux de Validation

Nous avons implémenté une pyramide de tests automatisés pour valider chaque couche de l'application :

### A. Tests Unitaires (Méthodes et Classes)
Les composants cryptographiques critiques et la logique de service ont été isolés et testés unitairement dans `backend/tests/test_pvs.py` :
*   **Chiffrement/Déchiffrement AES-256-GCM** : Validation du chiffrement et du déchiffrement correct avec des clés de session de 256 bits et des IVs de 12 octets.
*   **Dérivation de Clé PBKDF2** : Validation du caractère déterministe de la dérivation de clé avec sel, et de la génération de clés distinctes pour des sels différents.
*   **Signatures HMAC-SHA256** : Validation de la génération de signature et détection immédiate des falsifications (toute altération d'une donnée immuable comme le montant ou la plaque invalide instantanément la signature).
*   **Triggers SQL de Sécurité (SQLite & PostgreSQL)** : Validation de l'inaltérabilité physique des données en base. Les tests s'assurent que toute opération de modification (`UPDATE`) ou de suppression (`DELETE`) sur la table `audit_logs` est rejetée par le moteur SQL. Ils valident également que la suppression d'un PV est interdite, et que toute modification des champs immuables d'un PV (montant, plaque, etc.) est bloquée, alors que la mise à jour autorisée du `statut` passe sans encombre.

### B. Tests d'Intégration (Scénarios HTTP complets)
La cinématique de l'API et les flux métiers multi-rôles sont testés dans `backend/tests/test_api.py` à l'aide de `TestClient` :
*   **Création de PV** : Simulation d'un agent verbalisateur envoyant un permis chiffré localement. Vérification du retour HTTP `201 Created` et de l'enregistrement en base de données SQLite.
*   **Contrôle RBAC** : Vérification qu'un agent ne peut accéder qu'à ses propres PVs et que seul le superviseur peut modifier le statut ou valider l'intégrité globale.
*   **Journalisation automatique** : Validation de l'écriture systématique dans l'audit log après chaque requête sensible.

### C. Tests de Sécurité (DAST Applicatif)
Nous avons intégré des tests dédiés à la validation des contrôles de sécurité globaux :
*   **En-têtes HTTP (CSP, X-Frame-Options, etc.)** : Validation automatisée que le middleware injecte les en-têtes CSP stricts, anti-clickjacking (`DENY`), anti-sniffing (`nosniff`), et anti-XSS.
*   **Rate Limiting** : Simulation d'une attaque par force brute sur la route `/api/auth/login`. Le test valide qu'au bout de la 6ème tentative infructueuse dans la même minute, le serveur renvoie un code d'erreur `429 Too Many Requests`.

---

## 2. Pratiques de Développement (Pair Programming & Code Review)

*   **Pair Programming** : Le développement a été réalisé en binôme. Les sessions d'écriture du code de chiffrement client (Web Crypto API) et de signature serveur (HMAC) ont été menées à deux pour croiser les regards sur la sécurité cryptographique.
*   **Code Review (Revue de Code)** : Chaque branche de fonctionnalité (ex: `feat/backend-auth`, `feat/react-ui`) a fait l'objet d'une revue systématique et d'une validation locale des tests unitaires avant d'être fusionnée sur la branche de test `test-audit`.

---

## 3. Couverture de Code et Fréquence des Tests

### A. Couverture des Tests
La couverture de test sur les modules applicatifs clés (`backend/app/`) atteint **plus de 90%** du code source critique (sécurité, routes d'API, chiffrement et services).
Vous pouvez lancer le rapport de couverture localement avec la commande suivante :
```bash
python3 -m pytest backend/tests/ --cov=backend/app/
```

### B. Fréquence d'Exécution des Tests de Régression
Les tests unitaires et d'intégration sont exécutés à deux fréquences :
1.  **En local (Développement)** : Avant chaque commit majeur et avant toute demande de fusion (merge).
2.  **En continu (DevSecOps)** : Intégration continue automatisée via **GitHub Actions** sur chaque commit et Pull Request poussés vers les branches `main`, `test-audit` et `feat/*`.

---

## 4. Outils d'Analyse Statique (SAST & Linter)

Nous utilisons des outils automatiques de contrôle de la qualité et de la sécurité du code :
*   **SAST Backend (Python)** : **Bandit** analyse le code source du backend pour détecter les faiblesses communes (secrets codés en dur, mauvaise configuration TLS, fonctions cryptographiques obsolètes).
    *   *Commande exécutée* : `bandit -r backend/app/` (0 faille critique détectée).
*   **Linter Frontend (JavaScript)** : **ESLint** configuré de manière stricte pour éliminer les variables inutilisées, les hooks mal déclarés et les imports orphelins.
    *   *Commande exécutée* : `npm run lint` (0 avertissement, 0 erreur).
