#!/bin/bash

# Script de compilation et d'empaquetage final pour SenVerbalis

echo "📦 [1/2] Compilation du Frontend React (Vite)..."
cd frontend
npm install
npm run build
cd ..

echo "🤐 [2/2] Création de l'archive de livraison senverbalis_delivery_final.zip..."
python3 -c "
import zipfile
import os

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        if any(p in root for p in ['venv', '__pycache__', '.pytest_cache', 'node_modules', '.git', '.vite']):
            continue
        for file in files:
            if file.endswith('.db') or file.endswith('.zip') or file.endswith('.log') or file == '.env':
                continue
            filePath = os.path.join(root, file)
            archivePath = os.path.relpath(filePath, '.')
            ziph.write(filePath, archivePath)

with zipfile.ZipFile('senverbalis_delivery_final.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    root_files = ['.env.example', 'README.md', 'docker-compose.yml', 'start.sh', 'build.sh']
    for rf in root_files:
        if os.path.exists(rf):
            zipf.write(rf, rf)
    zipdir('backend', zipf)
    zipdir('docs', zipf)
    zipdir('frontend', zipf)
"

echo "✅ Empaquetage terminé avec succès ! Fichier généré : senverbalis_delivery_final.zip"
