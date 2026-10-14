#!/bin/bash
# ================================================
#  setup.sh - Prima configurazione del progetto
# ================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   🍕 PizzeriaOperativa - Setup iniziale${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 1. Verifica Docker attivo
echo -e "${YELLOW}[1/6]${NC} Verifica Docker..."
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Desktop non è aperto.${NC}"
    echo -e "${YELLOW}   Apri Docker Desktop e riprova.${NC}"
    exit 1
fi
echo -e "${GREEN}     ✅ Docker attivo${NC}"
echo ""

# 2. Crea .env se non esiste
echo -e "${YELLOW}[2/6]${NC} File .env..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=pizzeria
MYSQL_USER=pizzeria
MYSQL_PASSWORD=pizzeria
EOF
    echo -e "${GREEN}     ✅ .env creato${NC}"
else
    echo -e "${GREEN}     ✅ .env già esistente${NC}"
fi
echo ""

# 3. Crea volume MySQL
echo -e "${YELLOW}[3/6]${NC} Volume MySQL..."
if docker volume ls | grep -q "cartellafinalepizzeria_mysql_data"; then
    echo -e "${GREEN}     ✅ Volume già esistente${NC}"
else
    docker volume create cartellafinalepizzeria_mysql_data >/dev/null
    echo -e "${GREEN}     ✅ Volume creato${NC}"
fi
echo ""

# 4. Avvia i container
echo -e "${YELLOW}[4/6]${NC} Avvio container..."
docker compose down >/dev/null 2>&1 || true
docker compose up -d
echo -e "${GREEN}     ✅ Container avviati${NC}"
echo ""

# 5. Aspetta MySQL + importa init.sql
echo -e "${YELLOW}[5/6]${NC} Attesa MySQL (fino a 60 secondi)..."
for i in {1..30}; do
    if docker exec pizzeria_mysql mysql -u pizzeria -ppizzeria -e "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}     ✅ MySQL pronto${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Importa init.sql se le tabelle non esistono
echo -e "${YELLOW}[6/6]${NC} Inizializzazione database..."
if docker exec pizzeria_mysql mysql -u pizzeria -ppizzeria pizzeria -e "SHOW TABLES LIKE 'tavoli';" 2>/dev/null | grep -q "tavoli"; then
    echo -e "${GREEN}     ✅ Tabelle già presenti${NC}"
else
    if [ -f "init.sql" ]; then
        docker exec -i pizzeria_mysql mysql -u pizzeria -ppizzeria pizzeria < init.sql 2>/dev/null
        echo -e "${GREEN}     ✅ Tabelle create da init.sql${NC}"
    else
        echo -e "${YELLOW}     ⚠️  init.sql non trovato${NC}"
    fi
fi
echo ""

# Verifica finale
echo -e "${YELLOW}Verifica finale...${NC}"
sleep 5

if [ -x "./diagnostica.sh" ]; then
    ./diagnostica.sh
else
    echo -e "${YELLOW}⚠️  diagnostica.sh non trovato${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   ✅ SETUP COMPLETATO!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Per avviare il progetto:"
echo -e "${BLUE}  ./avvia.sh${NC}"
echo ""
