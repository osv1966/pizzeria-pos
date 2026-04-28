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

app.get('/api/prodotti', (req, res) => {
    db.query('SELECT p.*, c.tipo FROM prodotti p JOIN categorie c ON p.categoria_id = c.id WHERE p.disponibile = 1', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/api/ordini', (req, res) => {
    const tavoloNumero = req.body.tavolo || req.body.tavolo_numero || 1;
    const zona = req.body.zona || 'Sala interna';
    const nome_cliente = req.body.nome_cliente || '';
    const reparto = req.body.reparto || 'cucina';
    const prodotti = req.body.prodotti || [];
    
    const sql = 'INSERT INTO ordini (tavolo_numero, zona, nome_cliente, reparto, stato) VALUES (?, ?, ?, ?, "in_attesa")';
    db.query(sql, [tavoloNumero, zona, nome_cliente, reparto], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        
        const ordineId = result.insertId;
        let count = 0;
        
        if (prodotti.length === 0) {
            return res.json({ success: true, ordineId });
        }
        
        prodotti.forEach(prod => {
            db.query('INSERT INTO dettagli_ordine (ordine_id, prodotto_id, quantita, prezzo_unita) VALUES (?, ?, ?, ?)',
                [ordineId, prod.id, 1, prod.prezzo], err2 => {
                if (err2) console.error('❌ Dettaglio:', err2);
                if (++count === prodotti.length) {
                    res.json({ success: true, ordineId });
                }
            });
        });
    });
});

app.get('/api/ordini/:reparto', (req, res) => {
    const sql = `SELECT o.*, GROUP_CONCAT(CONCAT(p.nome, " x", d.quantita) SEPARATOR ", ") as prodotti_dettaglio,
                        SUM(d.prezzo_unita * d.quantita) as totale
                 FROM ordini o
                 JOIN dettagli_ordine d ON o.id = d.ordine_id
                 JOIN prodotti p ON d.prodotto_id = p.id
                 WHERE o.stato = "in_attesa" AND o.reparto = ?
                 GROUP BY o.id ORDER BY o.data_ora ASC`;
    db.query(sql, [req.params.reparto], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.put('/api/ordini/:id/completa', (req, res) => {
    db.query('UPDATE ordini SET stato = "completato" WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});

app.get('/api/storico', (req, res) => {
    const sql = `SELECT o.*, GROUP_CONCAT(CONCAT(p.nome, " x", d.quantita) SEPARATOR ", ") as prodotti_dettaglio,
                        SUM(d.prezzo_unita * d.quantita) as totale
                 FROM ordini o
                 JOIN dettagli_ordine d ON o.id = d.ordine_id
                 JOIN prodotti p ON d.prodotto_id = p.id
                 WHERE o.stato = "completato"
                 GROUP BY o.id ORDER BY o.data_ora DESC LIMIT 50`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/admin/prodotti', (req, res) => {
    db.query('SELECT p.*, c.tipo FROM prodotti p JOIN categorie c ON p.categoria_id = c.id', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/api/admin/prodotti', (req, res) => {
    const { nome, prezzo, tipo } = req.body;
    
    let categoria_id = 1;
    if (tipo === 'friggitoria') categoria_id = 2;
    if (tipo === 'bar') categoria_id = 3;
    
    db.query('INSERT INTO prodotti (nome, prezzo, categoria_id, disponibile) VALUES (?, ?, ?, 1)', 
        [nome, prezzo, categoria_id], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true, id: result.insertId });
    });
});

app.delete('/api/admin/prodotti/:id', (req, res) => {
    db.query('DELETE FROM prodotti WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
    });
});

app.listen(3000, () => console.log('🚀 Server on 3000'));
