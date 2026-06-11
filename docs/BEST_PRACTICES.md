# 🚀 Bonnes Pratiques du Projet SenVerbalis

Ce document regroupe les décisions d'architecture, de sécurité et les règles de collaboration retenues pour le projet SenVerbalis. Ces règles sont adaptées pour un travail d'équipe fluide via Git sans sur-complexifier le projet.

## 1. 🏗️ Architecture et Conception
*   **Architecture 3 Tiers Containerisée** : Séparation stricte entre le Frontend (React), le Backend (FastAPI) et la Base de données (PostgreSQL). Le tout est orchestré par Docker Compose pour garantir que le projet s'exécute de manière identique chez chaque développeur.
*   **Isolation Réseau** : Le Frontend n'a jamais d'accès direct à la base de données. Seul le Backend agit comme intermédiaire.
*   **API RESTful** : Le backend expose une API standardisée avec des endpoints prévisibles (ex: `POST /api/pvs/`, `GET /api/pvs/{id}`).

## 2. 🔐 Sécurité et Intégrité
*   **Architecture "Zero-Knowledge"** : Le serveur ne doit jamais stocker les informations personnelles des conducteurs en clair. Elles sont chiffrées/déchiffrées côté client (React) via la *Web Crypto API* (AES-GCM), avec le NINA agissant comme matériel cryptographique.
*   **Protection contre l'Altération (HMAC)** : Chaque PV reçoit une signature cryptographique (`HMAC-SHA256`) générée par le backend. Cela permet de prouver mathématiquement si un PV a été discrètement modifié en base de données.
*   **Immutabilité au niveau SGBD** : La règle métier stricte (impossibilité de modifier ou supprimer un PV) est appliquée de force par des **Triggers PostgreSQL**. Même un développeur connecté à la base ne pourra pas altérer l'historique (Audit Log).
*   **Gestion des Secrets** : Les variables sensibles (Mots de passe DB, Clé secrète JWT/HMAC) résident dans un fichier `.env`. **Ce fichier `.env` ne doit jamais être commité.** L'équipe partagera un `.env.example` vide pour la structure.

## 3. 💾 Base de Données
*   **UUID vs Auto-Increment** : Les clés primaires (ID) des PV et des logs seront des UUID (ex: `f47ac10b-...`) au lieu de simples entiers (`1, 2, 3...`). Cela empêche l'énumération et sécurise les URLs.
*   **Moindre Privilège** : Le compte PostgreSQL utilisé par FastAPI n'a les droits que sur la base de données SenVerbalis.

## 4. 👨‍💻 Qualité du Code
*   **Validation des Entrées (Pydantic)** : Aucune donnée provenant du Frontend n'est acceptée aveuglément. FastAPI et Pydantic valident les types et les formats avant tout traitement.
*   **Typage Statique** : Utilisation extensive des *Type Hints* en Python pour rendre le code prédictible et auto-documenté.

## 5. 🌿 Collaboration via Git
*   **Exclusions Strictes (`.gitignore`)** : Les dossiers virtuels (`venv/`, `__pycache__/`), les dépendances (`node_modules/`), et les fichiers secrets (`.env`) doivent impérativement être dans le `.gitignore` dès l'initialisation.
*   **Flux de Travail (Feature Branches)** : Éviter de pousser directement sur la branche principale (`main`/`master`). Créer une branche par tâche (ex: `feat/backend-auth`, `feat/react-ui`).
*   **Messages de Commit** : Utiliser des messages clairs et structurés pour expliquer le "pourquoi" de la modification.
