const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'mysql',
    user: 'pizzeria_user',
    password: 'pizza123',
    database: 'pizzeria'
});

db.connect(err => {
    if (err) console.error('DB error:', err);
    else console.log('✅ DB connected');
});

// ---------- PIZZERIA ----------
app.get('/api/stati-pizzeria', (req, res) => {
    db.query('SELECT * FROM stati_tavoli_pizzeria', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});
app.put('/api/stati-pizzeria/:id', (req, res) => {
    const { stato, tempo_minuti } = req.body;
    db.query('INSERT INTO stati_tavoli_pizzeria (tavolo_id, stato, tempo_minuti) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stato = ?, tempo_minuti = ?', 
        [req.params.id, stato, tempo_minuti || null, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_stati (tavolo_id, stato, tempo_minuti, operatore) VALUES (?, ?, ?, "pizzeria")', 
            [req.params.id, stato, tempo_minuti || null], (err2) => {
            res.json({ success: true });
        });
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
    db.query('INSERT INTO stati_tavoli_cucina (tavolo_id, stato, tempo_minuti) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stato = ?, tempo_minuti = ?', 
        [req.params.id, stato, tempo_minuti || null, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_stati (tavolo_id, stato, tempo_minuti, operatore) VALUES (?, ?, ?, "cucina")', 
            [req.params.id, stato, tempo_minuti || null], (err2) => {
            res.json({ success: true });
        });
    });
});

// ---------- FRIGGITORIA ----------
app.get('/api/stati-friggitoria', (req, res) => {
    db.query('SELECT * FROM stati_tavoli_friggitoria', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});
app.put('/api/stati-friggitoria/:id', (req, res) => {
    const { stato, tempo_minuti } = req.body;
    db.query('INSERT INTO stati_tavoli_friggitoria (tavolo_id, stato, tempo_minuti) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stato = ?, tempo_minuti = ?', 
        [req.params.id, stato, tempo_minuti || null, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_stati (tavolo_id, stato, tempo_minuti, operatore) VALUES (?, ?, ?, "friggitoria")', 
            [req.params.id, stato, tempo_minuti || null], (err2) => {
            res.json({ success: true });
        });
    });
});

// ---------- CASSA RISPONDI ----------
app.put('/api/cassa-rispondi/:id', (req, res) => {
    const { azione } = req.body;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
    db.query('UPDATE stati_tavoli_cucina SET stato_cassa = ? WHERE tavolo_id = ?', [stato_cassa, req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_stati (tavolo_id, stato, operatore) VALUES (?, ?, "cassa")', 
            [req.params.id, stato_cassa], (err2) => {
            res.json({ success: true });
        });
    });
});

app.put('/api/cassa-rispondi-pizzeria/:id', (req, res) => {
    const { azione } = req.body;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
    db.query('UPDATE stati_tavoli_pizzeria SET stato_cassa = ? WHERE tavolo_id = ?', [stato_cassa, req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_stati (tavolo_id, stato, operatore) VALUES (?, ?, "cassa")', 
            [req.params.id, stato_cassa], (err2) => {
            res.json({ success: true });
        });
    });
});

app.put('/api/cassa-rispondi-friggitoria/:id', (req, res) => {
    const { azione } = req.body;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
    db.query('UPDATE stati_tavoli_friggitoria SET stato_cassa = ? WHERE tavolo_id = ?', [stato_cassa, req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('INSERT INTO storico_stati (tavolo_id, stato, operatore) VALUES (?, ?, "cassa")', 
            [req.params.id, stato_cassa], (err2) => {
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
    db.query('UPDATE stati_tavoli_pizzeria SET stato = "in_attesa", tempo_minuti = NULL, stato_cassa = "in_attesa"', (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('UPDATE stati_tavoli_cucina SET stato = "in_attesa", tempo_minuti = NULL, stato_cassa = "in_attesa"', (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            db.query('UPDATE stati_tavoli_friggitoria SET stato = "in_attesa", tempo_minuti = NULL, stato_cassa = "in_attesa"', (err3) => {
                if (err3) return res.status(500).json({error: err3.message});
                res.json({ success: true });
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

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));

// ORDINI FRIGGITORIA (bottoni rapidi)
app.post('/api/ordini-frigg', (req, res) => {
    const { tavolo_id, prodotto, quantita } = req.body;
    db.query('INSERT INTO ordini_frigg (tavolo_id, prodotto, quantita, data_ora) VALUES (?, ?, ?, NOW())', 
        [tavolo_id, prodotto, quantita], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true, id: result.insertId });
    });
});
