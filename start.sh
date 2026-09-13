#!/bin/bash
# Entra nella cartella del progetto
cd /mnt/c/Users/Utente/Desktop/PizzeriaFinale &&
# Avvia i container Docker
docker-compose up -d &&
# Ora copiamo i file nel container usando l'IP giusto
docker cp ./frontend/. pizzeria_frontend:/usr/share/nginx/html/ &&
docker cp ./pizzeria.html pizzeria_frontend:/usr/share/nginx/html/ &&
docker cp ./cucina.html pizzeria_frontend:/usr/share/nginx/html/ &&
docker cp ./friggitoria.html pizzeria_frontend:/usr/share/nginx/html/ &&
docker cp ./frontend/cassa.html pizzeria_frontend:/usr/share/nginx/html/ &&
docker cp ./frontend/storico.html pizzeria_frontend:/usr/share/nginx/html/ &&
# Ricarichiamo Nginx
docker exec -it pizzeria_frontend nginx -s reload &&
echo "✅ Pizzeria avviata!"
echo "📱 Apri la cassa dal telefono all'indirizzo:"
echo "http://192.168.1.80:8080/cassa.html"
