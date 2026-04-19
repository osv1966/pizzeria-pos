CREATE DATABASE IF NOT EXISTS pizzeria;
USE pizzeria;

CREATE TABLE IF NOT EXISTS categorie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'cucina'
);

CREATE TABLE IF NOT EXISTS prodotti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    prezzo DECIMAL(10,2) NOT NULL,
    disponibile BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ordini (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tavolo VARCHAR(10) NOT NULL,
    cliente VARCHAR(100),
    data_ora DATETIME DEFAULT CURRENT_TIMESTAMP,
    stato VARCHAR(50) DEFAULT 'in_attesa',
    reparto VARCHAR(50) DEFAULT 'cucina'
);

CREATE TABLE IF NOT EXISTS dettagli_ordine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordine_id INT NOT NULL,
    prodotto_id INT NOT NULL,
    quantita INT DEFAULT 1,
    prezzo_unita DECIMAL(10,2) NOT NULL
);

INSERT INTO categorie (nome, tipo) VALUES ('Pizze', 'cucina'), ('Fritti', 'friggitoria'), ('Bevande', 'bar');
INSERT INTO prodotti (categoria_id, nome, prezzo) VALUES (1, 'Margherita', 5.50), (1, 'Marinara', 4.50), (2, 'Patatine', 3.50), (3, 'Acqua', 2.00);
