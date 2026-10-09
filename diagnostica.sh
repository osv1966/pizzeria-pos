#!/bin/bash
# ================================================
#  diagnostica.sh - Controllo e riparazione completa
# ================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

cd "$(dirname "$0")"

ERRORI=0
RIPARATI=0
MANUALI=""

# ================================================
#  HEADER
# ================================================
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🔍 DIAGNOSTICA PizzeriaOperativa          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ================================================
#  1. INFRASTRUTTURA
# ================================================
echo -e "${BOLD}━━━ 1. INFRASTRUTTURA ━━━${NC}"

# Docker attivo?
echo -n "  Docker attivo................... "
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FALLITO${NC}"
    echo ""
    echo -e "${RED}❌ Docker Desktop non è aperto.${NC}"
    echo -e "${YELLOW}   SOLUZIONE: apri Docker Desktop e aspetta che l'icona diventi verde.${NC}"
    exit 1
fi

# Container attivi?
echo -n "  Container attivi................ "
UP=$(docker compose ps 2>/dev/null | grep -c "Up" || true)
if [ "$UP" -eq 3 ]; then
    echo -e "${GREEN}OK (3/3)${NC}"
else
    echo -e "${YELLOW}$UP/3 - provo a riavviare${NC}"
    docker compose down >/dev/null 2>&1
    docker compose up -d >/dev/null 2>&1
    sleep 45
    UP=$(docker compose ps 2>/dev/null | grep -c "Up" || true)
    if [ "$UP" -eq 3 ]; then
        echo -e "  ${GREEN}✅ Riparato (3/3)${NC}"
        RIPARATI=$((RIPARATI+1))
    else
        echo -e "  ${RED}❌ Ancora $UP/3${NC}"
        MANUALI="${MANUALI}\n  • Container non attivi → docker compose down && docker compose up -d"
        ERRORI=$((ERRORI+1))
    fi
fi
echo ""

# ================================================
#  2. DATABASE
# ================================================
echo -e "${BOLD}━━━ 2. DATABASE ━━━${NC}"

# Connessione DB
echo -n "  MySQL risponde.................. "
if docker exec pizzeria_mysql mysql -u pizzeria -ppizzeria pizzeria -e "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FALLITO${NC}"
    MANUALI="${MANUALI}\n  • MySQL non risponde → docker compose down && docker compose up -d"
    ERRORI=$((ERRORI+1))
fi

# Controllo tabelle
TABELLE="tavoli stati_tavoli_cucina stati_tavoli_pizzeria stati_tavoli_friggitoria storico_ordini storico_stati ordini_friggitoria menu_frittini"

for T in $TABELLE; do
    echo -n "  Tabella $T............... "
    ESISTE=$(docker exec pizzeria_mysql mysql -u pizzeria -ppizzeria pizzeria -e "SHOW TABLES LIKE '$T';" 2>/dev/null | grep -c "$T" || true)
    if [ "$ESISTE" -ge 1 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}MANCANTE${NC}"
        MANUALI="${MANUALI}\n  • Tabella '$T' mancante → esegui init.sql o contatta supporto"
        ERRORI=$((ERRORI+1))
    fi
done

# Conteggio tavoli
echo -n "  Tavoli (60 attesi).............. "
N=$(docker exec pizzeria_mysql mysql -u pizzeria -ppizzeria pizzeria -e "SELECT COUNT(*) FROM tavoli;" 2>/dev/null | tail -1 | tr -d ' \r' || echo "0")
if [ "$N" = "60" ]; then
    echo -e "${GREEN}OK (60)${NC}"
else
    echo -e "${YELLOW}$N (atteso 60)${NC}"
    MANUALI="${MANUALI}\n  • Tavoli: $N invece di 60 → verifica init.sql"
fi
echo ""

# ================================================
#  3. BACKEND
# ================================================
echo -e "${BOLD}━━━ 3. BACKEND ━━━${NC}"

# Endpoint /api/tutti-stati
echo -n "  /api/tutti-stati................ "
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/api/tutti-stati 2>/dev/null)
if [ "$CODE" = "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
else
    echo -e "${YELLOW}$CODE - riavvio backend${NC}"
    docker compose down >/dev/null 2>&1
    docker compose up -d >/dev/null 2>&1
    sleep 45
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/api/tutti-stati 2>/dev/null)
    if [ "$CODE" = "200" ]; then
        echo -e "  ${GREEN}✅ Riparato (200)${NC}"
        RIPARATI=$((RIPARATI+1))
    else
        echo -e "  ${RED}❌ Ancora $CODE${NC}"
        MANUALI="${MANUALI}\n  • Backend non risponde ($CODE) → controlla 'docker compose logs backend'"
        ERRORI=$((ERRORI+1))
    fi
fi

# Altri endpoint critici
for EP in "stati-cucina" "stati-pizzeria" "stati-friggitoria" "storico" "menu-frittini" "stati-completi"; do
    echo -n "  /api/$EP............... "
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3000/api/$EP" 2>/dev/null)
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}OK (200)${NC}"
    else
        echo -e "${RED}FALLITO ($CODE)${NC}"
        MANUALI="${MANUALI}\n  • Endpoint /api/$EP risponde $CODE"
        ERRORI=$((ERRORI+1))
    fi
done
echo ""

# ================================================
#  4. FRONTEND
# ================================================
echo -e "${BOLD}━━━ 4. FRONTEND ━━━${NC}"

for PAGINA in cassa cucina pizzeria friggitoria storico; do
    echo -n "  $PAGINA.html.................... "
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:8080/$PAGINA.html" 2>/dev/null)
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALLITO ($CODE)${NC}"
        MANUALI="${MANUALI}\n  • Pagina $PAGINA.html non risponde ($CODE)"
        ERRORI=$((ERRORI+1))
    fi
done
echo ""

# ================================================
#  5. RISULTATO FINALE
# ================================================
echo -e "${BOLD}━━━ RISULTATO ━━━${NC}"
echo ""

if [ "$ERRORI" -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TUTTO OK - PROGETTO FUNZIONANTE          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    if [ "$RIPARATI" -gt 0 ]; then
        echo -e "${YELLOW}Riparati automaticamente: $RIPARATI${NC}"
    fi
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ PROBLEMI RILEVATI                        ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}Errori critici: $ERRORI${NC}"
    if [ "$RIPARATI" -gt 0 ]; then
        echo -e "${GREEN}Riparati automaticamente: $RIPARATI${NC}"
    fi
    echo ""
    echo -e "${YELLOW}AZIONI MANUALI NECESSARIE:${NC}"
    echo -e "$MANUALI"
    echo ""
    echo -e "${BLUE}Suggerimenti generali:${NC}"
    echo "  1. Riavvia WSL da PowerShell:  wsl --shutdown"
    echo "  2. Riapri WSL e lancia:        ./diagnostica.sh"
    echo "  3. Se persiste, riavvia Docker Desktop"
    echo ""
    exit 1
fi
