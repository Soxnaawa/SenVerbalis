#!/bin/bash

# ==============================================================================
# 🇸🇳 Script de Démarrage Automatisé — SenVerbalis
# ==============================================================================
# Ce script permet de lancer facilement l'application SenVerbalis soit via
# Docker Compose (recommandé), soit en local (FastAPI + SQLite + React Vite).
# ==============================================================================

# Couleurs pour le terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}             🇸🇳  DÉMARRAGE DE L'APPLICATION SENVERBALIS             ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Fonction pour nettoyer les processus en arrière-plan à la fermeture
cleanup() {
    echo -e "\n${YELLOW}⏹️  Arrêt des serveurs locaux...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Tous les processus locaux ont été arrêtés.${NC}"
    exit 0
}

# Vérifier si Docker est installé
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    DOCKER_AVAILABLE=true
fi

# Choix du mode d'exécution
CHOICE=""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${CYAN}Docker & Docker Compose sont détectés sur votre système.${NC}"
    echo -e "Comment souhaitez-vous démarrer l'application ?"
    echo -e "  ${GREEN}1)${NC} Docker Compose (Recommandé - FastAPI + PostgreSQL + React Nginx)"
    echo -e "  ${GREEN}2)${NC} Local (Développement - FastAPI SQLite + React Vite)"
    read -p "Votre choix (1 ou 2) [1]: " CHOICE
    CHOICE=${CHOICE:-1}
else
    echo -e "${YELLOW}⚠️  Docker / Docker Compose n'est pas détecté. Utilisation du mode local.${NC}"
    CHOICE=2
fi

# ------------------------------------------------------------------------------
# MODE DOCKER COMPOSE
# ------------------------------------------------------------------------------
if [ "$CHOICE" = "1" ]; then
    echo -e "\n${BLUE}🚀 Lancement via Docker Compose...${NC}"
    
    # Vérification du fichier .env à la racine
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  Fichier .env manquant à la racine. Création depuis .env.example...${NC}"
        cp .env.example .env
    fi
    
    echo -e "${CYAN}🐳 Lancement des conteneurs en arrière-plan...${NC}"
    docker compose up --build -d
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ Conteneurs démarrés avec succès !${NC}"
        echo -e "${CYAN}🔑 Initialisation de l'administrateur par défaut dans le conteneur backend...${NC}"
        # Laisser le temps au backend de démarrer
        sleep 3
        docker exec -it senverbalis_backend python create_admin.py
        
        echo -e "\n${GREEN}🖥️  Accès aux services :${NC}"
        echo -e "  - Frontend Web (Citoyen & Console) : ${CYAN}http://localhost:5173${NC}"
        echo -e "  - Documentation Swagger de l'API   : ${CYAN}http://localhost:8000/docs${NC}"
        echo -e "\nPour voir les logs : ${YELLOW}docker compose logs -f${NC}"
        echo -e "Pour arrêter les services : ${YELLOW}docker compose down${NC}"
    else
        echo -e "${RED}❌ Échec lors du lancement de Docker Compose.${NC}"
        exit 1
    fi

# ------------------------------------------------------------------------------
# MODE LOCAL SANS DOCKER
# ------------------------------------------------------------------------------
elif [ "$CHOICE" = "2" ]; then
    trap cleanup SIGINT SIGTERM

    echo -e "\n${BLUE}🖥️  Lancement en mode local (FastAPI SQLite + React Vite)...${NC}"
    
    # 1. Vérification des prérequis locaux
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ Node.js/npm n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
        exit 1
    fi

    # 2. Configuration environnement local
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  Fichier .env racine absent. Création depuis .env.example...${NC}"
        cp .env.example .env
    fi
    
    if [ ! -f backend/.env ]; then
        echo -e "${YELLOW}⚠️  Fichier backend/.env absent. Configuration pour SQLite local...${NC}"
        cp .env.example backend/.env
    fi

    # 3. Préparation du Backend
    echo -e "\n${CYAN}📦 Configuration du Backend...${NC}"
    cd backend
    
    # Création du virtualenv si inexistant
    if [ ! -d venv ]; then
        echo -e "${YELLOW}🔧 Création de l'environnement virtuel Python (venv)...${NC}"
        python3 -m venv venv
    fi
    
    # Activation du venv et installation des dépendances
    source venv/bin/activate
    echo -e "${CYAN}📥 Installation des dépendances Python...${NC}"
    pip install -r requirements.txt
    
    # Initialisation DB & Triggers & Compte Admin
    echo -e "${CYAN}⚙️  Initialisation de la base de données SQLite et des triggers...${NC}"
    python3 create_admin.py
    
    # Lancement du backend en arrière-plan
    echo -e "${GREEN}🚀 Lancement du serveur Backend FastAPI...${NC}"
    python3 -m uvicorn main:app --port 8000 --reload > fastapi_server.log 2>&1 &
    BACKEND_PID=$!
    deactivate
    cd ..

    # 4. Préparation du Frontend
    echo -e "\n${CYAN}📦 Configuration du Frontend...${NC}"
    cd frontend
    
    # Installation des dépendances Node.js si nécessaires
    if [ ! -d node_modules ]; then
        echo -e "${YELLOW}🔧 Installation des dépendances npm (node_modules)...${NC}"
        npm install
    fi
    
    # Lancement du frontend en arrière-plan
    echo -e "${GREEN}🚀 Lancement du serveur de développement React Vite...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    # 5. Résumé et attente
    echo -e "\n${GREEN}🎉 Lancement local initié avec succès !${NC}"
    echo -e "  - Frontend Web (Citoyen & Console) : ${CYAN}http://localhost:5173${NC}"
    echo -e "  - API Backend & Swagger Docs       : ${CYAN}http://localhost:8000/docs${NC}"
    echo -e "\nLogs du backend FastAPI redirigés dans : ${YELLOW}backend/fastapi_server.log${NC}"
    echo -e "${BLUE}👉 Appuyez sur [Ctrl + C] à tout moment pour arrêter les deux serveurs.${NC}"
    
    # Attendre que les processus enfants se terminent
    wait
fi
