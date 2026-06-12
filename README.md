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
*   **Module de Vérification** : Le superviseur peut valider instantanément si les données physiques d'un PV correspondent à sa signature cryptographique d'origine.

### 4. 🔑 Authentification & RBAC (En avance sur le Sprint Beta)
*   **Authentification JWT** : Jetons éphémères stockés en mémoire uniquement (protection contre les failles XSS).
*   **Habilitations RBAC** : Contrôle d'accès strict côté serveur distinguant les rôles **Agent**, **Superviseur**, et **Administrateur**.
*   **Expiration de session** : Déconnexion automatique de l'utilisateur après 15 minutes d'inactivité complète détectée côté client.

### 5. ⚙️ Intégration Continue (DevSecOps)
*   **Pipeline CI/CD (GitHub Actions)** : Analyse statique de vulnérabilités (**SAST avec Bandit**), audit des dépendances (**npm audit** & **safety**), formatage (**Black** & **ESLint**), et exécution automatique de la suite de tests (**pytest**).

---

## 📅 Échéance à venir (Sprint Beta)

*   **🐳 Containerisation & Orchestration (Docker Compose)** : Déploiement unifié sous conteneurs Docker pour isoler le Frontend React, le Backend FastAPI et la base de données PostgreSQL dans un réseau privé sécurisé.
