-- ================================================
--  Inizializzazione database PizzeriaOperativa
-- ================================================

CREATE TABLE IF NOT EXISTS tavoli (
  id INT PRIMARY KEY AUTO_INCREMENT,
  numero INT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS stati_tavoli_cucina (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tavolo_id INT NOT NULL UNIQUE,
  stato VARCHAR(50) DEFAULT 'in_attesa',
  tempo_minuti INT DEFAULT NULL,
  ultimo_aggiornamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  stato_cassa VARCHAR(50) DEFAULT 'in_attesa',
  data_declino_cucina TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (tavolo_id) REFERENCES tavoli(id)
);

CREATE TABLE IF NOT EXISTS stati_tavoli_pizzeria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tavolo_id INT NOT NULL UNIQUE,
  stato VARCHAR(50) DEFAULT 'in_attesa',
  tempo_minuti INT DEFAULT NULL,
  ultimo_aggiornamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  stato_cassa VARCHAR(50) DEFAULT 'in_attesa',
  data_declino_pizzeria TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (tavolo_id) REFERENCES tavoli(id)
);

CREATE TABLE IF NOT EXISTS stati_tavoli_friggitoria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tavolo_id INT NOT NULL UNIQUE,
  stato VARCHAR(50) DEFAULT 'in_attesa',
  tempo_minuti INT DEFAULT NULL,
  ultimo_aggiornamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  stato_cassa VARCHAR(50) DEFAULT 'in_attesa',
  prodotti TEXT DEFAULT NULL,
  FOREIGN KEY (tavolo_id) REFERENCES tavoli(id)
);

CREATE TABLE IF NOT EXISTS storico_ordini (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tavolo_id INT NOT NULL,
  reparto VARCHAR(50) NOT NULL,
  azione VARCHAR(50) NOT NULL,
  data_ora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storico_stati (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tavolo_id INT,
  reparto VARCHAR(50),
  stato VARCHAR(50),
  data_ora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordini_friggitoria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tavolo_id INT NOT NULL,
  prodotti TEXT,
  data_ora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  stato VARCHAR(50) DEFAULT 'lavorazione',
  tempo_minuti INT DEFAULT NULL
);

INSERT INTO tavoli (numero) VALUES
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),
(31),(32),(33),(34),(35),(36),(37),(38),(39),(40),
(41),(42),(43),(44),(45),(46),(47),(48),(49),(50),
(51),(52),(53),(54),(55),(56),(57),(58),(59),(60);

INSERT INTO stati_tavoli_cucina (tavolo_id) SELECT id FROM tavoli;
INSERT INTO stati_tavoli_pizzeria (tavolo_id) SELECT id FROM tavoli;
INSERT INTO stati_tavoli_friggitoria (tavolo_id) SELECT id FROM tavoli;

-- Tabella menu frittini
CREATE TABLE IF NOT EXISTS menu_frittini (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  attivo TINYINT DEFAULT 1,
  ordine INT DEFAULT 0
);

-- Prodotti frittini base
INSERT INTO menu_frittini (nome, ordine) VALUES
('Patatine', 1),
('Crocchè', 2),
('Arancini', 3),
('Panzerotti', 4),
('Olive Ascolane', 5),
('Fiori di Zucca', 6);
