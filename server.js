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

// STATI COMBINATI
app.get('/api/stati-combinati', (req, res) => {
    const sql = `SELECT 
                    t.id as tavolo_id,
                    c.stato as stato_cucina,
                    c.tempo_minuti as tempo_cucina,
                    c.ultimo_aggiornamento as ultimo_cucina,
                    c.stato_cassa,
                    f.stato as stato_friggitoria,
                    f.tempo_minuti as tempo_friggitoria,
                    f.ultimo_aggiornamento as ultimo_friggitoria
                 FROM tavoli t
                 LEFT JOIN stati_tavoli_cucina c ON t.id = c.tavolo_id
                 LEFT JOIN stati_tavoli_friggitoria f ON t.id = f.tavolo_id
                 ORDER BY t.id`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// STATI CUCINA CON STORICO
app.put('/api/stati-cucina/:id', (req, res) => {
    const { stato, tempo_minuti } = req.body;
    const id = req.params.id;
    console.log(`📝 Cucina: tavolo ${id} -> ${stato} ${tempo_minuti || ''}`);
    
    db.query('INSERT INTO stati_tavoli_cucina (tavolo_id, stato, tempo_minuti) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stato = ?, tempo_minuti = ?', 
        [id, stato, tempo_minuti || null, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        
        db.query('INSERT INTO storico_stati (tavolo_id, stato, tempo_minuti, operatore) VALUES (?, ?, ?, "cucina")', 
            [id, stato, tempo_minuti || null], (err2) => {
            if (err2) console.error('❌ Storico errore:', err2);
            res.json({ success: true });
        });
    });
});

// STATI FRIGGITORIA CON STORICO
app.put('/api/stati-friggitoria/:id', (req, res) => {
    const { stato, tempo_minuti } = req.body;
    const id = req.params.id;
    console.log(`📝 Friggitoria: tavolo ${id} -> ${stato} ${tempo_minuti || ''}`);
    
    db.query('INSERT INTO stati_tavoli_friggitoria (tavolo_id, stato, tempo_minuti) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stato = ?, tempo_minuti = ?', 
        [id, stato, tempo_minuti || null, stato, tempo_minuti || null], (err) => {
        if (err) return res.status(500).json({error: err.message});
        
        db.query('INSERT INTO storico_stati (tavolo_id, stato, tempo_minuti, operatore) VALUES (?, ?, ?, "friggitoria")', 
            [id, stato, tempo_minuti || null], (err2) => {
            if (err2) console.error('❌ Storico errore:', err2);
            res.json({ success: true });
        });
    });
});

// CASSA RISPONDE CON STORICO
app.put('/api/cassa-rispondi/:id', (req, res) => {
    const { azione } = req.body;
    const id = req.params.id;
    const stato_cassa = azione === 'accetta' ? 'accettato' : 'declinato';
    const stato_cucina = azione === 'accetta' ? 'lavorazione' : 'non_disponibile';
    
    console.log(`📝 Cassa: tavolo ${id} -> ${stato_cassa}`);
    
    db.query('UPDATE stati_tavoli_cucina SET stato_cassa = ?, stato = ? WHERE tavolo_id = ?', 
        [stato_cassa, stato_cucina, id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        
        db.query('INSERT INTO storico_stati (tavolo_id, stato, operatore) VALUES (?, ?, "cassa")', 
            [id, stato_cassa], (err2) => {
            if (err2) console.error('❌ Storico errore:', err2);
            res.json({ success: true });
        });
    });
});

// RESET TAVOLI
app.post('/api/reset-tavoli', (req, res) => {
    db.query('UPDATE stati_tavoli_cucina SET stato = "in_attesa", tempo_minuti = NULL, stato_cassa = "in_attesa"', (err) => {
        if (err) return res.status(500).json({error: err.message});
        db.query('UPDATE stati_tavoli_friggitoria SET stato = "in_attesa", tempo_minuti = NULL', (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            res.json({ success: true });
        });
    });
});

// STORICO TUTTI (ultimi 10 giorni)
app.get('/api/storico-tutti', (req, res) => {
    db.query('SELECT * FROM storico_stati WHERE data_ora >= DATE_SUB(NOW(), INTERVAL 10 DAY) ORDER BY data_ora DESC LIMIT 1000', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// PULISCI STORICO VECCHIO
app.delete('/api/pulisci-storico', (req, res) => {
    db.query('DELETE FROM storico_stati WHERE data_ora < DATE_SUB(NOW(), INTERVAL 10 DAY)', (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true, eliminati: result.affectedRows });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
