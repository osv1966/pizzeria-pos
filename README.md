# 🍕 PIZZERIA POS - SISTEMA COMPLETO

## 📋 INDICE
1. Architettura
2. Avvio del sistema
3. Schermate
4. Funzionalità
5. Comandi utili
6. Personalizzazione

## 🏗️ ARCHITETTURA
Sistema basato su Docker con 3 container:
- pizzeria_mysql (database)
- pizzeria_backend (API Node.js)
- pizzeria_frontend (interfaccia web)

## 🚀 AVVIO DEL SISTEMA
cd /mnt/c/Users/Utente/Desktop/PizzeriaFinale
docker-compose up -d

## 🌐 ACCESSO
CUCINA: http://192.168.1.61:8080/cucina.html
PIZZERIA: http://192.168.1.61:8080/pizzeria.html
FRIGGITORIA: http://192.168.1.61:8080/friggitoria.html
CASSA: http://192.168.1.61:8080/cassa.html
STORICO: http://192.168.1.61:8080/storico.html

## 📱 RESPONSIVITÀ
Cellulare: 4 colonne
Tablet: 6 colonne
Desktop: 10 colonne

## 🎯 FUNZIONALITÀ
- 60 tavoli numerati
- 3 reparti (Cucina, Pizzeria, Friggitoria)
- Countdown con minuti rimasti
- Voce che annuncia stato e reparto
- Badge ACCETTATO / DECLINATO
- Bordi colorati (verde per accettato, rosso per non disponibile)
- Storico eventi
- Reset totale tavoli

## 🔧 COMANDI UTILI
Reset manuale tavoli:
curl -X POST http://192.168.1.61:3000/api/reset-tavoli

Backup database:
docker exec pizzeria_mysql mysqldump -upizzeria_user -ppizza123 pizzeria > backup.sql

Log:
docker-compose logs -f

## 🛠️ PERSONALIZZAZIONE
Modificare i file HTML per cambiare il numero di colonne

## 📞 SUPPORTO
Repository: https://github.com/osv1966/pizzeria-pos
