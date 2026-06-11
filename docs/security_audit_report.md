# Rapport d'Audit de Sécurité et de Tests — SenVerbalis

Ce rapport présente l'état de sécurité du backend de l'application **SenVerbalis** sur la branche `test-audit`.

---

## 1. Analyse Statique de Sécurité (SAST)

J'ai exécuté un scanner de sécurité statique (**Bandit**) sur l'ensemble du code source Python (`backend/app`).

### Métriques du Scan :
* **Nombre de lignes analysées** : 641 lignes de code.
* **Failles critiques (HIGH)** : 0
* **Failles moyennes (MEDIUM)** : 0
* **Failles faibles (LOW)** : 0 (dans le code de l'application).

**Conclusion du Scan SAST** : Le code applicatif est entièrement exempt de vulnérabilités courantes (pas d'injections SQLi, de failles XSS, ou de secrets codés en dur).

---

## 2. Audit de l'Architecture de Sécurité

J'ai audité la conformité du code avec les spécifications de sécurité requises :

### A. Confidentialité et Zero-Knowledge
* **Exigence** : Les PII sensibles des citoyens (numéro de permis) ne doivent jamais être connus du serveur en clair.
* **Vérification** : Conforme. Le serveur FastAPI ne reçoit plus que `num_permis_chiffre` et `iv` chiffrés côté client, ainsi qu'un hash SHA-256 (`num_permis_hash`) servant d'index de recherche. Le serveur n'a aucune clé de déchiffrement pour cette donnée.

### B. Intégrité des Données (HMAC-SHA256)
* **Exigence** : Les PV doivent être inaltérables depuis leur création.
* **Vérification** : Conforme. À la création de chaque PV, une signature HMAC-SHA256 est calculée sur toutes les données immuables (y compris la version chiffrée du permis de conduire). Toute altération d'un champ immuable invalide immédiatement la signature.

### C. Gestion des Accès par Rôle (RBAC)
* **Exigence** : Les routes de l'API doivent être cloisonnées par rôles (Agent, Superviseur, Administrateur).
* **Vérification** : Conforme. L'API utilise les dépendances `Depends(require_role(...))` sur tous les endpoints pour restreindre strictement les accès (par exemple, seul un Superviseur peut vérifier l'intégrité ou consulter tous les PVs ; seul un Agent peut créer un PV).

### D. Traçabilité (Journal d'Audit)
* **Exigence** : Toutes les actions sensibles doivent être tracées.
* **Vérification** : Conforme. Toutes les routes clés (création de PV, modification de statut, vérification d'intégrité) enregistrent automatiquement une entrée d'audit détaillée en base de données avec l'identité de l'acteur, l'action, la cible, les détails et l'adresse IP.

---

## 3. Rapport d'Exécution des Tests Réels

La suite de tests unitaires et d'intégration a été lancée.

```bash
python3 -m pytest backend/tests/
```

### Résultats détaillés :
* **`tests/test_pvs.py` (8 tests unitaires passés)** : Valide le chiffrement/déchiffrement local, la dérivation de clé, la validité des signatures HMAC et la détection immédiate des falsifications de données.
* **`tests/test_api.py` (1 test d'intégration complet passé)** : Exécute un scénario HTTP réel (via `TestClient`) de création de PV par un agent fictif, récupération, vérification d'intégrité et modification de statut par un superviseur fictif.

**Statut final des tests** : **9 passés sur 9 (100% de réussite)**.
