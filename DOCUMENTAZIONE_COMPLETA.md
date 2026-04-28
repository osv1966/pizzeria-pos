# PIZZERIA POS - DOCUMENTAZIONE

## ARCHITETTURA
3 container Docker: mysql, backend, frontend

## COMANDI BASE
- Avvio: docker-compose up -d
- Fermo: docker-compose down
- Riavvio: docker-compose down && docker-compose up -d --build

## CREDENZIALI
- MySQL user: pizzeria_user
- MySQL password: pizza123

## URL
- Cucina: http://IP:8080/cucina.html
- Cassa: http://IP:8080/cassa.html
- Storico: http://IP:8080/storico.html

## API PRINCIPALI
- GET /api/stati-tavoli
- PUT /api/stati-tavoli/:id/con-storico
- GET /api/storico-tutti
