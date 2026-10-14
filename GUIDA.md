# 🍕 PizzeriaOperativa — Guida completa

Sistema di gestione operativa per pizzeria con postazioni separate per **Cassa**, **Pizzeria**, **Cucina**, **Friggitoria** e **Storico**.

---

## 📋 Indice

1. [Cos'è il progetto](#cosè-il-progetto)
2. [Requisiti](#requisiti)
3. [Prima installazione](#prima-installazione)
4. [Avvio quotidiano](#avvio-quotidiano)
5. [Diagnostica](#diagnostica)
6. [Struttura del progetto](#struttura-del-progetto)
7. [Tecnologie usate](#tecnologie-usate)
8. [Pagine e funzionalità](#pagine-e-funzionalità)
9. [Risoluzione problemi](#risoluzione-problemi)
10. [Backup e ripristino](#backup-e-ripristino)

---

## Cos'è il progetto

**PizzeriaOperativa** coordina i reparti di una pizzeria:

- **Pizzeria** e **Cucina** accettano/declinano i tavoli
- **Friggitoria** riceve i frittini ordinati dalla Pizzeria
- **Cassa** (manager) vede tutto in tempo reale + gestisce menu frittini + storico + reset
- **Storico** consultabile con filtri (data, reparto, azione)

Ogni postazione ha il suo dispositivo, e tutti comunicano via rete locale.

---

## Requisiti

- **Windows 10/11** con **WSL2** (Ubuntu)
- **Docker Desktop** installato e avviato
- **Git** (per clonare/aggiornare)
- Connessione Wi-Fi (per far comunicare telefono/tablet con il PC)

---

## Prima installazione

### 1. Clona il progetto

```bash
cd ~/Desktop
git clone https://github.com/osv1966/pizzeria-pos.git PizzeriaOperativa
cd PizzeriaOperativa
```

### 2. Lancia il setup

```bash
./setup.sh
```

Lo script fa **tutto da solo**:
- Crea il file `.env`
- Crea il volume MySQL
- Avvia i container
- Aspetta che MySQL sia pronto
- Importa `init.sql` (crea tabelle + 60 tavoli + menu frittini)
- Verifica che tutto funzioni

### 3. Avvia il progetto

```bash
./avvia.sh
```

---

## Avvio quotidiano

### Procedura standard

1. **Apri Docker Desktop** (aspetta icona verde 🐳)
2. **Apri WSL** (Ubuntu)
3. Vai nel progetto:
   ```bash
   cd /mnt/c/Users/Utente/Desktop/PizzeriaOperativa
   ```
4. Avvia:
   ```bash
   ./avvia.sh
   ```

Lo script:
- Fa la diagnostica
- Ripara eventuali problemi
- Trova l'IP attuale
- Mostra gli URL per telefono/tablet
- Genera il QR code

### Fermare il progetto

```bash
docker compose down
```

---

## Diagnostica

```bash
./diagnostica.sh
```

Controlla:
- ✅ Docker attivo
- ✅ Container Up
- ✅ MySQL risponde
- ✅ Tutte le tabelle (8)
- ✅ 60 tavoli presenti
- ✅ Tutte le API backend
- ✅ Tutte le pagine frontend

**Ripara automaticamente** quando possibile.

---

## Struttura del progetto

```
PizzeriaOperativa/
├── .env                        ← configurazione database
├── .gitignore                  ← file esclusi da git
├── docker-compose.yml          ← configurazione container
├── init.sql                    ← inizializzazione database
│
├── avvia.sh                    ← avvia il progetto
├── setup.sh                    ← prima installazione
├── diagnostica.sh              ← controlla + ripara
│
├── backend/
│   ├── server.js               ← API e logica
│   └── package.json
│
└── frontend/
    ├── cassa.html              ← postazione Cassa (manager)
    ├── pizzeria.html           ← postazione Pizzeria
    ├── cucina.html             ← postazione Cucina
    ├── friggitoria.html        ← postazione Friggitoria
    ├── storico.html            ← storico movimenti
    └── favicon-*.svg           ← icone pagine
```

---

## Tecnologie usate

- **Backend**: Node.js 18 + Express
- **Database**: MySQL 8
- **Frontend**: HTML + CSS + JavaScript (vanilla)
- **Web server**: nginx (serve i file HTML)
- **Container**: Docker + Docker Compose
- **Ambiente**: WSL2 (Ubuntu)

### Porte usate

| Porta | Cosa |
|---|---|
| 3000 | Backend API (Node.js) |
| 8080 | Frontend (nginx) |
| 3306 | Database MySQL |

---

## Pagine e funzionalità

### 🍕 Pizzeria

- Card con 3 righe: PIZZERIA (cliccabile), CUCINA (badge), FRIGGITORIA (badge)
- **ACCETTA / DECLINA** il tavolo
- **Menu frittini**: 🍟 GESTISCI FRITTINI per ordinare frittini alla Friggitoria
- **Effetto ripreso**: bordo verde pulsante + 🔄 RIPRESO (10 min) se il tavolo è stato ripreso dopo un declino
- **Statistiche**: In attesa / Accettati / Split / Standby
- **Barra SPLIT** (in alto): tavoli con stati misti
- **Barra STANDBY** (in alto): tavoli declinati da entrambi
- **RIPRENDI** sul reparto che ha declinato

### 👨‍🍳 Cucina

Come Pizzeria ma:
- Riga CUCINA cliccabile
- **NO** menu frittini (solo Pizzeria)
- **RIPRENDI** solo sulla riga Cucina

### 📋 Cassa (manager)

- **Solo visualizzazione** (righe non cliccabili)
- Pulsante **📜 STORICO** (apre lo storico)
- Pulsante **🔄 RESET TAVOLI** (azzera tutto, mantiene storico)
- Pulsante **🍟 GESTISCI MENU FRITTINI** (aggiungi/modifica/disattiva frittini)
- **Effetto ripreso** (Pizzeria + Cucina)
- **Statistiche** + **Barre SPLIT/STANDBY**

### 🍟 Friggitoria

- **Solo visualizzazione** (come Cassa ma senza STORICO/RESET)
- Vede i frittini ordinati dalla Pizzeria
- Nessun pulsante di azione

### 📜 Storico

- **Filtri**: 📅 Data | 🍕 Reparto | ✅ Azione
- **Tabella**: ID, Tavolo, Reparto, Azione, Data/Ora
- **Paginazione**: 50 movimenti per pagina
- **🗑️ Cancella fino al...**: cancella storico precedente a una data (con 2 conferme)
- Ogni movimento è tracciato: accettato/declinato per reparto

---

## Risoluzione problemi

### Docker non parte

Apri PowerShell (Windows):
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Stop-Process -Force
```
Poi riapri Docker Desktop.

### WSL non ha rete

Apri PowerShell:
```powershell
wsl --shutdown
```
Riapri WSL.

### MySQL non risponde

```bash
docker compose down
docker compose up -d
sleep 30
./diagnostica.sh
```

### "Volume not found"

```bash
docker volume create cartellafinalepizzeria_mysql_data
docker compose up -d
docker exec -i pizzeria_mysql mysql -u pizzeria -ppizzeria pizzeria < init.sql
```

### Porta occupata

Apri PowerShell (amministratore):
```powershell
net stop winnat
net start winnat
```

### Errore "Cannot connect to MySQL"

Verifica che `.env` esista:
```bash
cat .env
```

Se manca:
```bash
./setup.sh
```

### Port forwarding (perso dopo riavvio)

```bash
docker compose down
docker compose up -d
```

Se persiste:
```powershell
wsl --shutdown
```
Riapri WSL e rilancia.

---

## Backup e ripristino

### Backup completo

```bash
cd /mnt/c/Users/Utente/Desktop
zip -r PizzeriaOperativa_backup_$(date +%Y%m%d).zip PizzeriaOperativa \
  -x "*/node_modules/*" "*/.git/*"
```

### Backup solo database

```bash
docker exec pizzeria_mysql mysqldump -u root -proot pizzeria > backup_db_$(date +%Y%m%d).sql
```

### Ripristino database

```bash
docker exec -i pizzeria_mysql mysql -u root -proot pizzeria < backup_db_20261014.sql
```

---

## Comandi rapidi

| Cosa | Comando |
|---|---|
| Prima installazione | `./setup.sh` |
| Avvio quotidiano | `./avvia.sh` |
| Diagnostica + ripara | `./diagnostica.sh` |
| Ferma tutto | `docker compose down` |
| Stato container | `docker compose ps` |
| Log backend | `docker compose logs backend | tail -30` |
| Backup DB | `docker exec pizzeria_mysql mysqldump -u root -proot pizzeria > backup.sql` |

---

## Cambio rete (es. dal cliente con hotspot)

Il progetto usa **IP dinamico** (window.location.hostname) → **funziona su qualsiasi rete senza modifiche**.

Procedura:
1. Collega il PC alla nuova rete (hotspot o Wi-Fi cliente)
2. Lancia `./avvia.sh`
3. Il QR code e gli URL si aggiornano da soli

---

## Firewall Windows (una tantum)

Se telefono/tablet non riescono a connettersi, apri **PowerShell come amministratore**:

```powershell
New-NetFirewallRule -DisplayName "Pizzeria Frontend 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName "Pizzeria Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

*Ultimo aggiornamento: 14/10/2026*
