# 🍕 PizzeriaOperativa — Guida rapida

## 📍 Percorsi e URL

| Cosa | Valore |
|---|---|
| Progetto (WSL) | `/mnt/c/Users/1466o/Desktop/PizzeriaOperativa` |
| Progetto (Windows) | `C:\Users\1466o\Desktop\PizzeriaOperativa` |
| Frontend | porta `8080` |
| Backend | porta `3000` |
| Database | porta `3306` |

---

## 🚀 Avvio rapido (consigliato)

```bash
cd /mnt/c/Users/1466o/Desktop/PizzeriaOperativa
./avvia.sh
```

Lo script fa tutto:
1. Avvia i container Docker
2. Aspetta che siano pronti
3. Trova l'IP della Wi-Fi attuale
4. Verifica che il backend risponda
5. Stampa gli URL pronti
6. Genera un QR code per il cliente

⚠️ **Ingrandisci il terminale** (Ctrl + rotella) per far vedere meglio il QR.

---

## 🛑 Fermare il progetto

```bash
cd /mnt/c/Users/1466o/Desktop/PizzeriaOperativa
docker compose down
```

---

## 🌐 URL da usare

### Da PC (il portatile stesso)
```
http://localhost:8080/cassa.html
http://localhost:8080/cucina.html
http://localhost:8080/pizzeria.html
http://localhost:8080/friggitoria.html
http://localhost:8080/storico.html
```

### Da telefono / altri dispositivi (stessa rete)
Sostituisci `IP` con quello attuale (lo trovi con `./avvia.sh`):
```
http://IP:8080/cassa.html
http://IP:8080/cucina.html
http://IP:8080/pizzeria.html
http://IP:8080/friggitoria.html
http://IP:8080/storico.html
```

---

## 🔍 Come trovare l'IP attuale

Da WSL:

```bash
ipconfig.exe | grep "IPv4"
```

Ignora:
- `127.0.0.1` → localhost
- `172.28.80.1` → WSL, non serve

Usa quello che corrisponde alla **Wi-Fi** (inizia con `192.168.x.x`, `10.x.x.x` o `172.x.x.x`).

Oppure lancia direttamente:

```bash
ipconfig.exe | sed -n '/Wi-Fi/,/^$/p' | grep "IPv4"
```

---

## 🎯 Dal cliente — passo per passo

1. **Collega il PC alla rete**
   - Hotspot del tuo telefono, oppure
   - Wi-Fi del cliente (nome + password)

2. **Avvia il progetto**
   ```bash
   cd /mnt/c/Users/1466o/Desktop/PizzeriaOperativa
   ./avvia.sh
   ```

3. **Ingrandisci il terminale** (Ctrl + rotella)

4. **Fai inquadrare il QR al cliente**
   - Apre automaticamente la pagina Cassa

5. **Per le altre pagine** leggi gli URL dal terminale

6. **Fine demo**: `docker compose down`

---

## 🔄 Cambio rete (Wi-Fi → hotspot o viceversa)

**Non devi toccare il codice.** Il progetto usa IP dinamico.

Devi solo:
1. Collegare il PC alla nuova rete
2. Rilanciare `./avvia.sh`
3. Nuovo IP + nuovo QR

---

## ⚠️ Problemi comuni

### Il telefono non apre la pagina
1. **Stessa rete?** Il telefono deve essere sulla stessa Wi-Fi/hotspot del PC
2. **Firewall?** Le regole Windows devono esistere (già configurate, una tantum)
3. **Isolamento client hotspot**: su Android, disattiva "Isola client" / "AP isolation"
4. **IP giusto?** Rilancia `./avvia.sh`
5. **Container attivi?** `docker compose ps` → tutti `Up`

### Docker non parte
- Apri **Docker Desktop** su Windows prima di lanciare lo script
- Aspetta che dica "Docker Desktop is running"

### Backend non risponde
```bash
docker compose logs backend
```
Controlla errori. A volte serve riavviare:
```bash
docker compose restart backend
```

### Porta già in uso
```bash
sudo lsof -i :3000
sudo lsof -i :8080
```

### Il QR code non appare
- `qrencode` installato? `which qrencode`
- Se manca: `sudo apt install -y qrencode`

---

## 💾 Backup e ripristino

### Creare un backup
```bash
cd /mnt/c/Users/1466o/Desktop
zip -r PizzeriaOperativa_backup_$(date +%Y%m%d).zip PizzeriaOperativa \
  -x "*/node_modules/*" "*/.git/*"
```

Il file appare sul Desktop. Copialo su **chiavetta USB** o **cloud**.

### Ripristinare un backup
```bash
cd /mnt/c/Users/1466o/Desktop
unzip PizzeriaOperativa_backup_YYYYMMDD.zip
```

Poi rilancia `./avvia.sh`.

---

## 🐳 Comandi Docker utili

```bash
# Stato container
docker compose ps

# Log backend (in tempo reale)
docker compose logs -f backend

# Log frontend
docker compose logs -f frontend

# Riavvio
docker compose restart

# Rebuild completo (dopo modifiche ai file)
docker compose down && docker compose up -d --build

# Entrare dentro un container
docker exec -it pizzeria_backend sh
docker exec -it pizzeria_frontend sh
```

---

## 🔥 Firewall Windows (una tantum)

Le regole sono già configurate, ma se mai dovessi rifarle:

Apri **PowerShell come amministratore**:

```powershell
New-NetFirewallRule -DisplayName "Pizzeria Frontend 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName "Pizzeria Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

Verifica:
```powershell
Get-NetFirewallRule -DisplayName "Pizzeria*" | Format-Table DisplayName, Enabled, Direction, Action
```

---

## 🧠 Come funziona il progetto (note tecniche)

- **Backend**: Node.js + Express su porta 3000
- **Frontend**: nginx che serve file HTML su porta 8080
- **Database**: MySQL 8 su porta 3306
- **API URL nel frontend**: `'http://' + window.location.hostname + ':3000'`

Questo significa che il frontend chiama automaticamente il backend usando **lo stesso IP da cui è stata caricata la pagina** → funziona su qualsiasi rete senza modifiche. 🎯

---

## 📋 Riepilogo comandi essenziali

```bash
# Vai al progetto
cd /mnt/c/Users/1466o/Desktop/PizzeriaOperativa

# Avvia tutto (con IP e QR)
./avvia.sh

# Stato container
docker compose ps

# Ferma tutto
docker compose down

# Riavvio con rebuild
docker compose down && docker compose up -d --build

# Log backend
docker compose logs -f backend
```

---

## 💻 Da portatile vs da telefono

| Dispositivo | Cosa usare | Esempio |
|---|---|---|
| **Portatile** (dove gira Docker) | `localhost` — **sempre, non cambia mai** | `http://localhost:8080/cassa.html` |
| **Telefono / tablet / altri PC** | **IP attuale** (lo trovi con `./avvia.sh`) | `http://10.186.123.89:8080/cassa.html` |
| **Cliente dal suo telefono** | **IP attuale** o **QR code** | Inquadra il QR |

⚠️ **Da telefono NON usare `localhost`** — punterebbe al telefono stesso, non al PC.

**Perché funziona automaticamente:** il frontend usa `window.location.hostname`, quindi chiama il backend sullo stesso IP da cui è stata caricata la pagina. Non serve modificare nulla.
---

*Ultimo aggiornamento: 2026-09-29*
