CREATE DATABASE IF NOT EXISTS padelmate;

USE padelmate;

-- =========================================
-- TABLE USERS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- TABLE COURTS
-- =========================================

CREATE TABLE IF NOT EXISTS courts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'Outdoor',
    price_per_hour DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- TABLE BOOKINGS
-- =========================================

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    court_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (court_id)
        REFERENCES courts(id)
);


-- =========================================
-- TABLE MATCHES
-- =========================================

CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    max_players INT DEFAULT 4,
    status ENUM('open', 'full', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
);


-- =========================================
-- TABLE MATCH PLAYERS
-- =========================================

CREATE TABLE IF NOT EXISTS match_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id)
        REFERENCES matches(id),

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    UNIQUE (match_id, user_id)
);


-- =========================================
-- DATA USERS
-- =========================================

INSERT IGNORE INTO users
(name, email, password, role)
VALUES
('Admin PadelMate', 'admin@padelmate.com', 'admin123', 'admin'),
('Eka', 'eka@padelmate.com', 'eka123', 'user'),
('Budi', 'budi@padelmate.com', 'budi123', 'user'),
('Andi', 'andi@padelmate.com', 'andi123', 'user');


-- =========================================
-- DATA COURTS
-- =========================================

INSERT IGNORE INTO courts
(name, type, price_per_hour, status)
VALUES
('Court A', 'Indoor', 100000, 'available'),
('Court B', 'Indoor', 120000, 'available'),
('Court C', 'Outdoor', 90000, 'available');