# Notes de Conception & Standardisation — SenVerbalis

Ce document détaille les choix de conception professionnels et les décisions d'architecture pris pour le projet **SenVerbalis** afin de garantir un niveau de sécurité optimal (Master SSI / niveau Production) tout en résolvant les ambiguïtés des spécifications initiales.

---

## 1. Choix du Framework Backend : Pourquoi Flask est parfaitement adapté

**Flask** est un micro-framework Python idéal pour ce projet pour les raisons suivantes :
*   **Modularité et Contrôle** : Contrairement à Django, Flask n'impose aucun composant prédéfini. Cela nous permet d'implémenter nos propres couches de sécurité (comme nos décorateurs RBAC personnalisés et nos gestionnaires cryptographiques) sans conflit.
*   **REST API légère** : Flask est parfait pour exposer des endpoints légers qui communiquent en JSON avec le frontend React (Vite).
*   **Intégration Cryptographique** : Python dispose de bibliothèques éprouvées comme `cryptography` (pour l'AES-GCM et le PBKDF2) et `bcrypt` (pour les mots de passe), qui s'intègrent de manière naturelle dans les routes Flask.
*   **Trabilité et Interceptateurs** : Flask permet de définir facilement des hooks (`before_request`, `after_request`) pour intercepter et journaliser automatiquement chaque action critique dans notre journal d'audit chaîné.

---

## 2. Standardisations Techniques Professionnelles

### A. Sécurisation physique de la base de données (Triggers SQLite)
Pour respecter scrupuleusement l'exigence d'inaltérabilité de l'audit et l'interdiction de supprimer des PV, la sécurité ne doit pas reposer uniquement sur le code de l'application Flask. Si un attaquant accède à la base de données SQLite, il pourrait tenter de lancer des requêtes de suppression.
*   **Solution** : Nous intégrons des **déclencheurs (Triggers) SQLite** directement dans la base de données pour bloquer les suppressions au niveau du moteur SQL.
```sql
-- Interdire toute mise à jour ou suppression de l'audit log
CREATE TRIGGER prevent_audit_update BEFORE UPDATE ON audit_log
BEGIN
    SELECT RAISE(FAIL, 'Les entrées du journal d''audit ne peuvent pas être modifiées');
END;

CREATE TRIGGER prevent_audit_delete BEFORE DELETE ON audit_log
BEGIN
    SELECT RAISE(FAIL, 'Les entrées du journal d''audit ne peuvent pas être supprimées');
END;

-- Interdire toute suppression de PV
CREATE TRIGGER prevent_pv_delete BEFORE DELETE ON pvs
BEGIN
    SELECT RAISE(FAIL, 'Les procès-verbaux ne peuvent pas être supprimés');
END;
```

### B. Signature HMAC des PV vs Changement de Statut
*   **Le problème** : Un PV est signé numériquement par HMAC-SHA256 pour garantir son intégrité (**OS-01**). Cependant, le statut de l'amende (`en attente`, `reglée`, `contestée`) doit pouvoir être modifié (**EF-04**). Si le statut est inclus dans le calcul du HMAC, chaque changement de statut invaliderait la signature.
*   **La solution** : Le HMAC du PV est calculé **uniquement sur les données immuables de l'infraction** :
    $$\text{HMAC-SHA256}(\text{PV}) = f(\text{reference\_number}, \text{date}, \text{lieu}, \text{plaque}, \text{type\_infraction}, \text{montant}, \text{citizen\_anonymous\_id}, \text{encrypted\_driver\_name}, \text{agent\_id})$$
    Le statut est stocké de manière séparée dans la table. Cela permet aux superviseurs de modifier le statut sans que la signature d'intégrité du PV historique ne soit brisée.

### C. Cryptographie Client (Zero-Knowledge) dans le Navigateur
*   **Le problème** : Les données personnelles des citoyens (Nom, CNI, Permis) ne doivent jamais être connues par le serveur sous forme lisible.
*   **La solution** : Le frontend React utilise l'API standard intégrée au navigateur : la **Web Crypto API** (`window.crypto.subtle`).
    1.  **Dérivation** : Le mot de passe saisi par le citoyen sert à dériver une clé de 256 bits via **PBKDF2** (avec un sel généré localement).
    2.  **Chiffrement** : Les champs (Nom, CNI, Numéro de permis) sont chiffrés localement dans le navigateur en **AES-256-GCM** avant la soumission.
    3.  **Stockage** : Seul le bloc chiffré (ciphertext, salt, nonce, tag) est transmis à Flask.
    4.  **Déchiffrement** : Après authentification réussie, le serveur envoie le bloc chiffré au navigateur, qui le déchiffre localement à l'aide du mot de passe saisi. Le serveur n'a jamais accès à la clé de déchiffrement.

### D. Gestion Multi-niveaux (Multi-tiered Fallback) des Secrets Serveur
Pour éviter de stocker des secrets cryptographiques en dur dans le code (faute grave de sécurité), nous mettons en place un chargement par étapes :
1.  **Priorité** : Lecture à partir des variables d'environnement (`JWT_SECRET_KEY`, `SERVER_AES_KEY`, `SERVER_HMAC_KEY`).
2.  **Secours local** : Lecture depuis un fichier de configuration sécurisé `.server_keys` présent sur le serveur (non suivi par Git).
3.  **Génération automatique** : Si aucun secret n'est trouvé au premier démarrage, le serveur génère des clés de manière dynamique et les enregistre dans le fichier `.server_keys` avec des permissions de lecture/écriture restrictives (`chmod 600`), garantissant ainsi la persistance locale.
