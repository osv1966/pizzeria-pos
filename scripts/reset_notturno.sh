#!/bin/bash
echo "$(date): Avvio reset notturno..."

# Reset tavoli (usa localhost)
curl -s -X POST http://localhost:3000/api/reset-tavoli

# Pulisci storico >10 giorni
curl -s -X DELETE "http://localhost:3000/api/pulisci-storico?giorni=10"

echo "$(date): Reset completato"
