require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pizzeria',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) console.error('DB error:', err);
    else {
        console.log('✅ DB connected');
        connection.release();
    }
});

// ---------- PIZZERIA ----------
// ---------- STATI COMPLETI (uniti) ----------
// ---------- MENU FRITTINI ----------

// GET tutti i frittini attivi
app.get('/api/menu-frittini', (req, res) => {
    db.query('SELECT * FROM menu_frittini WHERE attivo = 1 ORDER BY ordine ASC', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// GET tutti i frittini (anche non attivi) - per admin
app.get('/api/menu-frittini-tutti', (req, res) => {
    db.query('SELECT * FROM menu_frittini ORDER BY ordine ASC', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// POST aggiungi un frittino
app.post('/api/menu-frittini', (req, res) => {
    const { nome, ordine } = req.body;
    if (!nome) return res.status(400).json({error: 'Nome richiesto'});
    db.query('INSERT INTO menu_frittini (nome, ordine) VALUES (?, ?)', [nome, ordine || 99], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true, id: result.insertId });
    });
});

// PUT modifica un frittino (nome, attivo, ordine)
app.put('/api/menu-frittini/:id', (req, res) => {
    const { nome, attivo, ordine } = req.body;
    let updates = [];
    let params = [];
    if (nome !== undefined) { updates.push('nome = ?'); params.push(nome); }
    if (attivo !== undefined) { updates.push('attivo = ?'); params.push(attivo); }
    if (ordine !== undefined) { updates.push('ordine = ?'); params.push(ordine); }
    if (updates.length === 0) return res.status(400).json({error: 'Nessun campo da aggiornare'});
    params.push(req.params.id);
    db.query('UPDATE menu_frittini SET ' + updates.join(', ') + ' WHERE id = ?', params, (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});

// DELETE un frittino (soft delete: attivo = 0)
app.delete('/api/menu-frittini/:id', (req, res) => {
    db.query('UPDATE menu_frittini SET attivo = 0 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});
// ---------- FRIGGITORIA: AGGIUNGI FRITTINI ----------
app.put('/api/friggitoria-aggiungi-frittini/:id', (req, res) => {
    const { prodotti } = req.body;
        if (!prodotti || !Array.isArray(prodotti)) {
        return res.status(400).json({error: 'Prodotti richiesti'});
    }
        const prodottiJson = prodotti.length === 0 ? null : JSON.stringify(prodotti);

    // 1. Aggiorna il quadro attuale del tavolo
    db.query('UPDATE stati_tavoli_friggitoria SET prodotti = ? WHERE tavolo_id = ?', [prodottiJson, req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});

        // 2. Registra nello storico ordini_friggitoria
        db.query('INSERT INTO ordini_friggitoria (tavolo_id, prodotti, data_ora, stato) VALUES (?, ?, NOW(), "in_attesa")', [req.params.id, prodottiJson], (err2) => {
            if (err2) console.log('Errore storico friggitoria:', err2);
            res.json({ success: true });
        });
    });
});

app.get('/api/stati-completi', (req, res) => {
    const sql = `
        SELECT t.id as tavolo_id,
               COALESCE(p.stato_cassa, 'in_attesa') as pizzeria_stato,
               p.data_declino_pizzeria as pizzeria_data_declino,
               p.data_ripresa as pizzeria_data_ripresa,
               COALESCE(c.stato_cassa, 'in_attesa') as cucina_stato,
               c.data_declino_cucina as cucina_data_declino,
               c.data_ripresa as cucina_data_ripresa,
               COALESCE(f.stato_cassa, 'in_attesa') as friggitoria_stato,
               f.data_declino_friggitoria as friggitoria_data_declino,
               f.prodotti as friggitoria_prodotti
        FROM tavoli t
        LEFT JOIN stati_tavoli_pizzeria p ON t.id = p.tavolo_id
        LEFT JOIN stati_tavoli_cucina c ON t.id = c.tavolo_id
        LEFT JOIN stati_tavoli_friggitoria f ON t.id = f.tavolo_id
        ORDER BY t.id
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});


app.get('/api/stati-pizzeria', (req, res) => {
    db.query('SELECT * FROM stati_tavoli_pizzeria', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.put('/api/stati-pizzeria/:id', (req, res) => {
    const { stato, tempo_minuti } = req.body;
    const sql = `INSERT INTO stati_tavoli_pizzeria (tavolo_id, stato, tempo_minuti, ultimo_aggiornamento) 
                 VALUES (?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE 
                     stato = VALUES(stato), 
                     tempo_minuti = VALUES(tempo_minuti), 
                     ultimo_aggiornamento = NOW()`;
    db.query(sql, [req.params.id, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});

// ---------- CUCINA ----------
app.get('/api/stati-cucina', (req, res) => {
    db.query('SELECT * FROM stati_tavoli_cucina', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});
app.put('/api/stati-cucina/:id', (req, res) => {
    const { stato, tempo_minuti } = req.body;
    const sql = `INSERT INTO stati_tavoli_cucina (tavolo_id, stato, tempo_minuti, ultimo_aggiornamento) 
                 VALUES (?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE 
                     stato = VALUES(stato), 
                     tempo_minuti = VALUES(tempo_minuti), 
                     ultimo_aggiornamento = NOW()`;
    db.query(sql, [req.params.id, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});

// ---------- FRIGGITORIA ----------
app.get('/api/stati-friggitoria', (req, res) => {
    db.query('SELECT * FROM stati_tavoli_friggitoria', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// API per aggiornare stato friggitoria con prodotti
app.put('/api/stati-friggitoria/:id', (req, res) => {
    const { stato, tempo_minuti, prodotti } = req.body;
    db.query(`INSERT INTO stati_tavoli_friggitoria (tavolo_id, stato, tempo_minuti, ultimo_aggiornamento, prodotti) 
              VALUES (?, ?, ?, NOW(), ?) 
              ON DUPLICATE KEY UPDATE 
                  stato = VALUES(stato), 
                  tempo_minuti = VALUES(tempo_minuti), 
                  ultimo_aggiornamento = NOW(),
                  prodotti = VALUES(prodotti)`,
        [req.params.id, stato, tempo_minuti || null, prodotti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});

// API tutti-stati con prodotti
app.get('/api/tutti-stati', (req, res) => {
    const sql = `
        SELECT t.id as tavolo_id, 
               COALESCE(c.stato, 'in_attesa') as stato_cucina,
               COALESCE(c.tempo_minuti, 0) as tempo_cucina,
               c.ultimo_aggiornamento as ultimo_cucina,
               COALESCE(c.stato_cassa, 'in_attesa') as stato_cassa_cucina,
               COALESCE(p.stato, 'in_attesa') as stato_pizzeria,
               COALESCE(p.tempo_minuti, 0) as tempo_pizzeria,
               p.ultimo_aggiornamento as ultimo_pizzeria,
               COALESCE(p.stato_cassa, 'in_attesa') as stato_cassa_pizzeria,
               COALESCE(f.stato, 'in_attesa') as stato_friggitoria,
               COALESCE(f.tempo_minuti, 0) as tempo_friggitoria,
               f.ultimo_aggiornamento as ultimo_friggitoria,
               COALESCE(f.stato_cassa, 'in_attesa') as stato_cassa_friggitoria,
               f.prodotti as prodotti_frigg
        FROM tavoli t
        LEFT JOIN stati_tavoli_cucina c ON t.id = c.tavolo_id
        LEFT JOIN stati_tavoli_pizzeria p ON t.id = p.tavolo_id
        LEFT JOIN stati_tavoli_friggitoria f ON t.id = f.tavolo_id
        ORDER BY t.id
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// Aggiungi colonna prodotti se non esiste
db.query("ALTER TABLE stati_tavoli_friggitoria ADD COLUMN IF NOT EXISTS prodotti TEXT", (err) => {
    if (err) console.log("Colonna prodotti già esistente");
});

// ---------- CASSA RISPONDI ----------
app.put('/api/cassa-rispondi/:id', (req, res) => {
    const { azione } = req.body;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
        const dataDeclino = azione === 'declina' ? new Date() : null;
    db.query('UPDATE stati_tavoli_cucina SET stato_cassa = ?, data_declino_cucina = ? WHERE tavolo_id = ?', [stato_cassa, dataDeclino, req.params.id], (err) => {

        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "cucina", ?, NOW())', [req.params.id, stato_cassa], (err2) => {
            if (err2) console.log('Errore storico:', err2);
            res.json({ success: true });
        });
    });
});
app.put('/api/cassa-rispondi-pizzeria/:id', (req, res) => {
    const { azione } = req.body;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
    const dataDeclino = azione === 'declina' ? new Date() : null;
    db.query('UPDATE stati_tavoli_pizzeria SET stato_cassa = ?, data_declino_pizzeria = ? WHERE tavolo_id = ?', [stato_cassa, dataDeclino, req.params.id], (err) => {     



        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "pizzeria", ?, NOW())', [req.params.id, stato_cassa], (err2) => {
            if (err2) console.log('Errore storico:', err2);
            res.json({ success: true });
        });
    });
});
app.put('/api/cassa-rispondi-friggitoria/:id', (req, res) => {
    const { azione } = req.body;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
    db.query('UPDATE stati_tavoli_friggitoria SET stato_cassa = ? WHERE tavolo_id = ?', [stato_cassa, req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "friggitoria", ?, NOW())', [req.params.id, stato_cassa], (err2) => {
            if (err2) console.log('Errore storico:', err2);
            res.json({ success: true });
        });
    });
});


// ---------- NUOVE API PIZZERIA/CUCINA ----------

// Pizzeria accetta tavolo
app.put('/api/pizzeria-accetta/:id', (req, res) => {
    // 1. Leggi lo stato attuale
    db.query('SELECT stato_cassa FROM stati_tavoli_pizzeria WHERE tavolo_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        
        let eraDeclinato = rows.length > 0 && rows[0].stato_cassa === 'declinato';
        let dataRipresa = eraDeclinato ? new Date() : null;
        
        // 2. Aggiorna lo stato
        db.query('UPDATE stati_tavoli_pizzeria SET stato_cassa = ?, data_declino_pizzeria = NULL, data_ripresa = ? WHERE tavolo_id = ?', ['accettato', dataRipresa, req.params.id], (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "pizzeria", "accettato", NOW())', [req.params.id], (err3) => {
                if (err3) console.log('Errore storico:', err3);
                res.json({ success: true, ripresa: eraDeclinato });
            });
        });
    });
});




// Pizzeria declina tavolo
app.put('/api/pizzeria-declina/:id', (req, res) => {
    db.query('UPDATE stati_tavoli_pizzeria SET stato_cassa = ?, data_declino_pizzeria = NOW() WHERE tavolo_id = ?', ['declinato', req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "pizzeria", "declinato", NOW())', [req.params.id], (err2) => {
            if (err2) console.log('Errore storico:', err2);
            res.json({ success: true });
        });
    });
});

// Cucina accetta tavolo
// Cucina accetta tavolo
app.put('/api/cucina-accetta/:id', (req, res) => {
    // 1. Leggi lo stato attuale
    db.query('SELECT stato_cassa FROM stati_tavoli_cucina WHERE tavolo_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        
        let eraDeclinato = rows.length > 0 && rows[0].stato_cassa === 'declinato';
        let dataRipresa = eraDeclinato ? new Date() : null;
        
        // 2. Aggiorna lo stato
        db.query('UPDATE stati_tavoli_cucina SET stato_cassa = ?, data_declino_cucina = NULL, data_ripresa = ? WHERE tavolo_id = ?', ['accettato', dataRipresa, req.params.id], (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "cucina", "accettato", NOW())', [req.params.id], (err3) => {
                if (err3) console.log('Errore storico:', err3);
                res.json({ success: true, ripresa: eraDeclinato });
            });
        });
    });
});


// Cucina declina tavolo
app.put('/api/cucina-declina/:id', (req, res) => {
    db.query('UPDATE stati_tavoli_cucina SET stato_cassa = ?, data_declino_cucina = NOW() WHERE tavolo_id = ?', ['declinato', req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_ordini (tavolo_id, reparto, azione, data_ora) VALUES (?, "cucina", "declinato", NOW())', [req.params.id], (err2) => {
            if (err2) console.log('Errore storico:', err2);
            res.json({ success: true });
        });
    });
});
// ---------- STATI COMBINATI ----------
app.get('/api/stati-combinati', (req, res) => {
    const sql = `SELECT 
                    t.id as tavolo_id,
                    p.stato as stato_pizzeria,
                    p.tempo_minuti as tempo_pizzeria,
                    p.ultimo_aggiornamento as ultimo_pizzeria,
                    p.stato_cassa as stato_cassa_pizzeria,
                    p.data_declino_pizzeria as data_declino_pizzeria,
                    c.stato as stato_cucina,
                    c.tempo_minuti as tempo_cucina,
                    c.ultimo_aggiornamento as ultimo_cucina,
                    c.stato_cassa,
                    f.stato as stato_friggitoria,
                    f.tempo_minuti as tempo_friggitoria,
                    f.ultimo_aggiornamento as ultimo_friggitoria,
                    f.stato_cassa as stato_cassa_friggitoria
                 FROM tavoli t
                 LEFT JOIN stati_tavoli_pizzeria p ON t.id = p.tavolo_id
                 LEFT JOIN stati_tavoli_cucina c ON t.id = c.tavolo_id
                 LEFT JOIN stati_tavoli_friggitoria f ON t.id = f.tavolo_id
                 ORDER BY t.id`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// ---------- RESET TAVOLI ----------
app.post('/api/reset-tavoli', (req, res) => {
    // Reset Pizzeria (tutti i campi)
    db.query('UPDATE stati_tavoli_pizzeria SET stato = "in_attesa", stato_cassa = "in_attesa", tempo_minuti = NULL, data_declino_pizzeria = NULL, data_ripresa = NULL', (err) => {
        if (err) return res.status(500).json({error: err.message});
        
        // Reset Cucina (tutti i campi)
        db.query('UPDATE stati_tavoli_cucina SET stato = "in_attesa", stato_cassa = "in_attesa", tempo_minuti = NULL, data_declino_cucina = NULL, data_ripresa = NULL', (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            
            // Reset Friggitoria (tutti i campi)
            db.query('UPDATE stati_tavoli_friggitoria SET stato = "in_attesa", stato_cassa = "in_attesa", tempo_minuti = NULL, data_declino_friggitoria = NULL, prodotti = NULL', (err3) => {
                if (err3) return res.status(500).json({error: err3.message});
                
                res.json({ success: true, message: "Tavoli resettati" });
            });
        });
    });
});
// ---------- STORICO (cancella solo >7 giorni) ----------
app.get('/api/storico-tutti', (req, res) => {
    db.query('SELECT * FROM storico_stati ORDER BY data_ora DESC', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.delete('/api/pulisci-storico', (req, res) => {
    db.query('DELETE FROM storico_stati WHERE data_ora < DATE_SUB(NOW(), INTERVAL 7 DAY)', (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true, eliminati: result.affectedRows });
    });
});
// API per ottenere ordini per reparto
app.get('/api/ordini/:reparto', (req, res) => {
    const reparto = req.params.reparto;
    
    let sql = '';
    if(reparto === 'cucina') {
        sql = `SELECT tavolo_id, stato, tempo_minuti, ultimo_aggiornamento, stato_cassa FROM stati_tavoli_cucina WHERE stato IN ('lavorazione', 'pronto')`;
    } else if(reparto === 'pizzeria') {
        sql = `SELECT tavolo_id, stato, tempo_minuti, ultimo_aggiornamento, stato_cassa FROM stati_tavoli_pizzeria WHERE stato IN ('lavorazione', 'pronto')`;
    } else if(reparto === 'friggitoria') {
        sql = `SELECT tavolo_id, stato, tempo_minuti, ultimo_aggiornamento, stato_cassa FROM stati_tavoli_friggitoria WHERE stato IN ('lavorazione', 'pronto')`;
    } else {
        return res.status(400).json({error: 'Reparto non valido'});
    }
    
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// API per ricevere ordini dalla friggitoria
app.post('/api/ordini-frigg', (req, res) => {
    const { tavolo_id, prodotti, tempo_minuti } = req.body;
    const prodottiJson = JSON.stringify(prodotti);
    
    // Salva l'ordine veloce
    db.query('INSERT INTO ordini_friggitoria (tavolo_id, prodotti, data_ora, stato, tempo_minuti) VALUES (?, ?, NOW(), "lavorazione", ?)', 
        [tavolo_id, prodottiJson, tempo_minuti], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        
        // Aggiorna lo stato del tavolo in friggitoria
        db.query(`INSERT INTO stati_tavoli_friggitoria (tavolo_id, stato, tempo_minuti, ultimo_aggiornamento) 
                  VALUES (?, 'lavorazione', ?, NOW()) 
                  ON DUPLICATE KEY UPDATE 
                  stato = 'lavorazione', 
                  tempo_minuti = ?, 
                  ultimo_aggiornamento = NOW()`,
            [tavolo_id, tempo_minuti, tempo_minuti], (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            res.json({ success: true, id: result.insertId });
        });
    });
});
// RESET TUTTI I TAVOLI
app.post('/api/reset-all', (req, res) => {
    db.query('TRUNCATE TABLE ordini_friggitoria', (err0) => {
        if (err0) return res.status(500).json({error: err0.message});
        db.query('UPDATE stati_tavoli_cucina SET stato = "in_attesa", stato_cassa = "in_attesa", tempo_minuti = NULL', (err) => {
            if (err) return res.status(500).json({error: err.message});
            db.query('UPDATE stati_tavoli_pizzeria SET stato = "in_attesa", stato_cassa = "in_attesa", tempo_minuti = NULL', (err2) => {
                if (err2) return res.status(500).json({error: err2.message});
                db.query('UPDATE stati_tavoli_friggitoria SET stato = "in_attesa", stato_cassa = "in_attesa", tempo_minuti = NULL, prodotti = NULL', (err3) => {
                    if (err3) return res.status(500).json({error: err3.message});
                    res.json({ success: true, message: "Reset completo" });
                });
            });
        });
    });
});

// ---------- STORICO con filtri e paginazione ----------
app.get('/api/storico', (req, res) => {
    const { data, reparto, azione, pagina } = req.query;
    const perPagina = 50;
    const offset = ((parseInt(pagina) || 1) - 1) * perPagina;
    
    let where = [];
    let params = [];
    
    if (data) {
        where.push('DATE(data_ora) = ?');
        params.push(data);
    }
    if (reparto) {
        where.push('reparto = ?');
        params.push(reparto);
    }
    if (azione) {
        where.push('azione = ?');
        params.push(azione);
    }
    
    let whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    
    // Conta totale
    const countSql = 'SELECT COUNT(*) as totale FROM storico_ordini ' + whereClause;
    db.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json({error: err.message});
        const totale = countResult[0].totale;
        
        // Prendi pagina
        const sql = 'SELECT id, tavolo_id, reparto, azione, data_ora FROM storico_ordini ' + 
                    whereClause + 
                    ' ORDER BY data_ora DESC LIMIT ? OFFSET ?';
        db.query(sql, [...params, perPagina, offset], (err2, rows) => {
            if (err2) return res.status(500).json({error: err2.message});
            res.json({
                movimenti: rows,
                totale: totale,
                pagina: parseInt(pagina) || 1,
                perPagina: perPagina,
                totalePagine: Math.ceil(totale / perPagina)
            });
        });
    });
});

// Cancella storico fino a una data
app.post('/api/cancella-storico-fino-al', (req, res) => {
    const { data_limite } = req.body;
    if (!data_limite) return res.status(400).json({error: 'Data limite richiesta'});
    
    db.query('DELETE FROM storico_ordini WHERE DATE(data_ora) < ?', [data_limite], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true, eliminati: result.affectedRows });
    });
});

// API per ottenere ordini friggitoria (per Cassa)
app.get('/api/ordini-friggitoria', (req, res) => {
    db.query('SELECT * FROM ordini_friggitoria WHERE stato = "in_attesa" ORDER BY data_ora ASC', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// API per accettare/declinare ordine friggitoria
app.put('/api/ordini-friggitoria/:id', (req, res) => {
    const { azione } = req.body;
    const stato = azione === 'accetta' ? 'accettato' : 'declinato';
    db.query('UPDATE ordini_friggitoria SET stato = ? WHERE id = ?', [stato, req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});
// API per cancellare TUTTO lo storico
app.post('/api/cancella-storico', (req, res) => {
    db.query('TRUNCATE TABLE storico_ordini', (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
