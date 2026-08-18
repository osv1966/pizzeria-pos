#!/bin/bash
echo "=== RESET COMPLETO TAVOLI ==="
echo "Data: $(date)"

# Carica le credenziali dal file .env nella root del progetto
cd "$(dirname "$0")/.." && set -a && source .env && set +a

# Reset cucina
docker exec -i pizzeria_mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DATABASE; UPDATE stati_tavoli_cucina SET stato = 'in_attesa', tempo_minuti = NULL;"

# Reset friggitoria
docker exec -i pizzeria_mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DATABASE; UPDATE stati_tavoli_friggitoria SET stato = 'in_attesa', tempo_minuti = NULL;"

echo "✅ Tutti i 60 tavoli resettati a IN ATTESA"
echo "=== FINE ==="
