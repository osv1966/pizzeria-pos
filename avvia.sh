#!/bin/bash
# ================================================
#  avvia.sh - Controlla + Avvia + Mostra QR
# ================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   🍕  PizzeriaOperativa - Avvio rapido${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# --- 1. Controllo + eventuale riparazione ---
if [ -x "./controlla.sh" ]; then
    echo -e "${YELLOW}[1/4]${NC} Controllo stato progetto..."
    if ! ./controlla.sh; then
        echo ""
        echo -e "${RED}❌ Il progetto non funziona. Risolvi prima i problemi.${NC}"
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  controlla.sh non trovato, salto il controllo${NC}"
fi

# --- 2. Trova IP (versione robusta) ---
echo -e "${YELLOW}[2/4]${NC} Ricerca IP della rete..."

IP=$(ipconfig.exe 2>/dev/null \
    | grep -A 8 "Wi-Fi" \
    | grep "IPv4" \
    | grep -v "127.0.0.1" \
    | awk -F': ' '{print $2}' \
    | tr -d '\r' \
    | head -n 1)

if [ -z "$IP" ]; then
    IP=$(ipconfig.exe 2>/dev/null \
        | grep -A 8 "Ethernet" \
        | grep "IPv4" \
        | grep -v "127.0.0.1" \
        | awk -F': ' '{print $2}' \
        | tr -d '\r' \
        | head -n 1)
fi

if [ -z "$IP" ]; then
    echo -e "${RED}     ❌ Impossibile trovare l'IP.${NC}"
    exit 1
fi

echo -e "${GREEN}     ✅ IP rilevato: ${IP}${NC}"
echo ""

# --- 3. URL ---
echo -e "${YELLOW}[3/4]${NC} URL pronti:"
echo ""
echo -e "${GREEN}📱 Dal telefono:${NC}"
echo -e "  🛒 Cassa:        ${BLUE}http://${IP}:8080/cassa.html${NC}"
echo -e "  👨‍🍳 Cucina:       ${BLUE}http://${IP}:8080/cucina.html${NC}"
echo -e "  🍕 Pizzeria:     ${BLUE}http://${IP}:8080/pizzeria.html${NC}"
echo -e "  🍟 Friggitoria:  ${BLUE}http://${IP}:8080/friggitoria.html${NC}"
echo -e "  📊 Storico:      ${BLUE}http://${IP}:8080/storico.html${NC}"
echo ""
echo -e "${GREEN}💻 Da questo PC:${NC}"
echo -e "  🛒 Cassa:        ${BLUE}http://localhost:8080/cassa.html${NC}"
echo ""

# --- 4. QR Code ---
echo -e "${YELLOW}[4/4]${NC} QR CODE:"
echo ""
if command -v qrencode &> /dev/null; then
    qrencode -t ANSIUTF8 "http://${IP}:8080/cassa.html"
    echo ""
else
    echo -e "${RED}⚠️  qrencode non installato${NC}"
fi

echo ""
echo -e "${GREEN}✅ Pronto! Progetto attivo su IP ${IP}${NC}"
echo -e "${YELLOW}Per fermare: docker compose down${NC}"
echo ""
