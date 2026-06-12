# 📋 Document des Exigences et État d'Avancement — SenVerbalis

Ce document présente l'objectif du système, la liste des exigences fonctionnelles selon la méthodologie MoSCoW et la grille INVEST, l'analyse des menaces, les objectifs de sécurité et l'état d'avancement de la livraison de la version **Alpha**.

---

## 1. Objectif du Système

**SenVerbalis** est une plateforme ministérielle sécurisée de gestion et de suivi des Procès-Verbaux (PV) d'infraction routière au Sénégal. Conçue pour remplacer les carnets à souche physiques vulnérables aux pertes et à la falsification, l'application permet aux agents verbalisateurs d'enregistrer des infractions en temps réel sur le terrain, aux superviseurs de suivre le cycle de vie des amendes, et aux citoyens de consulter leurs infractions de manière transparente.

La sécurité et le respect de la vie privée des citoyens sont au cœur de la conception de SenVerbalis. Pour cela, le système implémente une architecture **Zero-Knowledge** (Connaissance Nulle) : les données personnelles sensibles (notamment le numéro de permis de conduire) sont chiffrées localement dans le navigateur de l'agent avant leur transmission au serveur. Le serveur FastAPI stocke uniquement ces données chiffrées sans jamais posséder la clé de déchiffrement, garantissant qu'une compromission de la base de données ne révèle aucune information personnelle en clair.

Pour garantir la force probante et l'infaillibilité des procès-verbaux face aux contestations, SenVerbalis intègre un mécanisme d'**intégrité par signature HMAC-SHA256** calculée côté serveur sur les champs immuables de chaque PV à sa création. Un journal d'audit immuable (protégé par des verrous au niveau SQL) assure la traçabilité complète de toutes les opérations sensibles du système (connexion, création de PV, modification de statut, etc.).

---

## 2. Exigences Fonctionnelles (Méthode MoSCoW & INVEST)

Toutes nos user stories respectent la grille **INVEST** (Indépendantes, Négociables, de Valeur, Estimables, Petites, Testables).

| Réf | Type d'utilisateur | Actifs impliqués | Importance (MoSCoW) | User Story (Description) | Statut |
|---|---|---|---|---|---|
| **RF-01** | Tous | Comptes & JWT | **Must Have** | En tant qu'utilisateur habilité, je veux m'authentifier de manière sécurisée pour accéder aux fonctionnalités de mon rôle. | **100% Fait** |
| **RF-02** | Agent | PV & Numéro de Permis | **Must Have** | En tant qu'agent, je veux enregistrer une infraction avec chiffrement local du permis de conduire pour protéger l'anonymat du citoyen. | **100% Fait** |
| **RF-03** | Agent | PVs de l'Agent | **Must Have** | En tant qu'agent, je veux consulter la liste de mes propres PVs avec déchiffrement local du permis pour suivre mes saisies. | **100% Fait** |
| **RF-04** | Superviseur | Tous les PVs | **Must Have** | En tant que superviseur, je veux consulter la liste de tous les PVs enregistrés pour avoir une vue d'ensemble du réseau. | **100% Fait** |
| **RF-05** | Superviseur | Signature HMAC | **Must Have** | En tant que superviseur, je veux vérifier en un clic l'intégrité cryptographique d'un PV pour m'assurer qu'il n'a pas été modifié. | **100% Fait** |
| **RF-06** | Superviseur | Statut du PV | **Must Have** | En tant que superviseur, je veux modifier le statut d'un PV (en attente, réglé, contesté) pour mettre à jour le dossier. | **100% Fait** |
| **RF-07** | Administrateur | Comptes Utilisateurs | **Must Have** | En tant qu'admin, je veux lister, créer et désactiver des comptes utilisateurs pour gérer les effectifs et les accès. | **100% Fait** |
| **RF-08** | Citoyen | PVs du Citoyen | **Must Have** | En tant que citoyen, je veux rechercher mes PVs en saisissant mon permis (haché localement) pour consulter mes infractions. | **100% Fait** |
| **RF-09** | Superviseur | Tous les PVs | **Should Have** | En tant que superviseur, je veux pouvoir rechercher des PVs par plaque, lieu, infraction ou statut pour filtrer les données. | **100% Fait** |
| **RF-10** | Système | Journal d'Audit | **Should Have** | En tant que système, je veux journaliser chaque action sensible (IP, acteur, action, cible) dans un log immuable pour traçabilité. | **100% Fait** |

---

## 3. Analyse des Menaces (Threat Modeling)

SenVerbalis se défend contre plusieurs types d'attaquants et scénarios de menace :

*   **Attaquant externe (Internet/Réseau)** :
    *   *Menace* : Tentative d'interception des flux, de brute-force des comptes ou d'injection SQL.
    *   *Défense* : HTTPS obligatoire, Content Security Policy (CSP) stricte injectée par le backend, rate limiting à 5 requêtes/minute sur le login pour bloquer le brute-force, validation stricte des schémas d'entrée via Pydantic.
*   **Administrateur de base de données malveillant (DBA) ou Intrusion DB** :
    *   *Menace* : Lecture en clair des permis des citoyens, modification frauduleuse du montant d'un PV ou suppression des logs d'audit.
    *   *Défense* :
        1. Le numéro de permis est chiffré en AES-GCM-256 côté client ; les clés de déchiffrement ne quittent jamais le navigateur du citoyen ou de l'agent.
        2. Les signatures HMAC-SHA256 détectent immédiatement toute modification frauduleuse d'un montant ou d'une plaque.
        3. Des déclencheurs (triggers) au niveau SQL bloquent formellement tout `UPDATE` ou `DELETE` sur les tables `pvs` et `audit_logs`.
*   **Usurpation d'identité ou Session volée** :
    *   *Menace* : Un agent laisse sa session ouverte et un tiers non autorisé accède à la console.
    *   *Défense* : Expiration automatique de la session JWT après 15 minutes d'inactivité complète détectée côté client.

---

## 4. Objectifs de Sécurité (C.I.D.)

1.  **Confidentialité (C)** : Les informations d'identification des citoyens (numéro de permis) stockées à long terme ou transmises en réseau doivent rester secrètes. Le système doit empêcher toute divulgation en clair de ces données (Zero-Knowledge cryptographique).
2.  **Intégrité (I)** : Les PVs créés et les logs d'audit doivent être protégés contre toute modification non autorisée. Le système doit invalider et signaler tout PV dont la signature HMAC-SHA256 ne correspond plus aux données physiques enregistrées.
3.  **Disponibilité (D)** : Les services de vérification et d'enregistrement doivent être protégés contre les abus. Le rate-limiting applicatif protège le serveur contre les surcharges.

---

## 5. État d'Avancement de la Livraison (Sprint Alpha)

Conformément aux directives du cours, la livraison **Alpha** devait se concentrer sur les fonctionnalités d'**Audit**. 
Cependant, notre équipe a choisi d'adopter une démarche d'ingénierie rigoureuse en livrant un **système complet et fonctionnel** dès l'étape Alpha.

*   **Audit & Traçabilité (100% Terminé)** : Implémentation du journal d'audit immuable en base de données avec triggers SQL, logs unifiés avec adresses IP, et module d'audit dans la console d'administration.
*   **Authentification & Autorisation (100% Terminé - En avance sur la Beta)** : Authentification JWT en mémoire (anti-XSS), politique RBAC stricte côté serveur avec contrôle d'accès sur chaque route FastAPI, et déconnexion automatique sur inactivité.
*   **Confidentialité & Intégrité (100% Terminé)** : Chiffrement client AES-GCM (Web Crypto API) et signature HMAC-SHA256 côté serveur validée en temps réel.
