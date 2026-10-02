#!/bin/bash
# ================================================
#  controlla.sh - Diagnostica e ripara il progetto
# ================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

cd "$(dirname "$0")"

OK=0
PROBLEMI=""

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   🔍 Controllo stato PizzeriaOperativa${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# --- 1. Docker attivo? ---
echo -n "[1/5] Docker attivo... "
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FALLITO${NC}"
    echo ""
    echo -e "${RED}❌ Docker Desktop non è aperto.${NC}"
    echo -e "${YELLOW}   Apri Docker Desktop e riprova.${NC}"
    exit 1
fi

# --- 2. Container Up? ---
echo -n "[2/5] Container attivi... "
UP_COUNT=$(docker compose ps 2>/dev/null | grep -c "Up" || true)
if [ "$UP_COUNT" -eq 3 ]; then
    echo -e "${GREEN}OK (3/3)${NC}"
else
    echo -e "${YELLOW}Solo $UP_COUNT/3${NC}"
    echo -e "${YELLOW}     → Riavvio i container da zero...${NC}"
    docker compose down >/dev/null 2>&1
    docker compose up -d >/dev/null 2>&1
    sleep 45
    UP_COUNT=$(docker compose ps 2>/dev/null | grep -c "Up" || true)
    if [ "$UP_COUNT" -eq 3 ]; then
        echo -e "${GREEN}     ✅ Riparato (3/3)${NC}"
    else
        echo -e "${RED}     ❌ Ancora $UP_COUNT/3${NC}"
        PROBLEMI="${PROBLEMI}\n  • Container non tutti attivi"
        OK=1
    fi
fi

# --- 3. Backend risponde? ---
echo -n "[3/5] Backend risponde... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/api/tutti-stati 2>/dev/null)
if [ "$CODE" = "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
else
    echo -e "${RED}FALLITO ($CODE)${NC}"
    echo -e "${YELLOW}     → Provo a riavviare il backend...${NC}"
    docker compose down >/dev/null 2>&1
    docker compose up -d >/dev/null 2>&1
    sleep 45
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/api/tutti-stati 2>/dev/null)
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}     ✅ Riparato (200)${NC}"
    else
        echo -e "${RED}     ❌ Ancora $CODE${NC}"
        PROBLEMI="${PROBLEMI}\n  • Backend non risponde ($CODE)"
        OK=1
    fi
fi

# --- 4. Frontend risponde? ---
echo -n "[4/5] Frontend risponde... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/cassa.html 2>/dev/null)
if [ "$CODE" = "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
else
    echo -e "${RED}FALLITO ($CODE)${NC}"
    PROBLEMI="${PROBLEMI}\n  • Frontend non risponde ($CODE)"
    OK=1
fi

# --- 5. Database connesso? ---
echo -n "[5/5] Database connesso... "
DB_LOG=$(docker compose logs backend 2>/dev/null | grep -c "DB connected" || true)
if [ "$DB_LOG" -ge 1 ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}NON CONFERMATO${NC}"
    PROBLEMI="${PROBLEMI}\n  • DB non confermato nei log"
fi

echo ""

# --- Risultato finale ---
if [ "$OK" -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TUTTO OK - PROGETTO FUNZIONANTE          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ PROBLEMI RILEVATI                        ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}$PROBLEMI${NC}"
    echo ""
    echo -e "${YELLOW}Suggerimenti:${NC}"
    echo "  1. Riavvia WSL da PowerShell:  wsl --shutdown"
    echo "  2. Riapri WSL e lancia:        docker compose down && docker compose up -d"
    echo "  3. Se persiste, riavvia Docker Desktop"
    echo ""
    exit 1
fi
