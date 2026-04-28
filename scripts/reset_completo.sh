#!/bin/bash
echo "=== RESET COMPLETO TAVOLI ==="
echo "Data: $(date)"

# Reset cucina
docker exec -i pizzeria_mysql mysql -upizzeria_user -ppizza123 -e "USE pizzeria; UPDATE stati_tavoli_cucina SET stato = 'in_attesa', tempo_minuti = NULL;"

# Reset friggitoria
docker exec -i pizzeria_mysql mysql -upizzeria_user -ppizza123 -e "USE pizzeria; UPDATE stati_tavoli_friggitoria SET stato = 'in_attesa', tempo_minuti = NULL;"

echo "✅ Tutti i 60 tavoli resettati a IN ATTESA"
echo "=== FINE ==="
