const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

let pool = null;
let mongoAvailable = false;

async function initDB() {
  // 1. MySQL setup
  try {
    const tempConnection = await mysql.createConnection(dbConfig);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'c2c_b2c_ecommerce'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();

    pool = mysql.createPool({
      ...dbConfig,
      database: process.env.DB_NAME || 'c2c_b2c_ecommerce',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    const tables = [
      `CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        shop_name VARCHAR(255) NOT NULL,
        shop_type ENUM('individual', 'business') DEFAULT 'individual',
        address VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        tax_code VARCHAR(100) DEFAULT NULL,
        is_approved TINYINT(1) DEFAULT 0,
        reject_reason VARCHAR(255) DEFAULT NULL,
        banner_url VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(15,2) NOT NULL,
        stock INT NOT NULL,
        sku VARCHAR(100) NOT NULL,
        is_mall TINYINT(1) DEFAULT 0,
        image_url VARCHAR(500) DEFAULT NULL,
        is_sponsored TINYINT(1) DEFAULT 0,
        international_shipping TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS livestreams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        status ENUM('live', 'ended') DEFAULT 'live',
        viewer_count INT DEFAULT 0,
        pinned_product_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
        FOREIGN KEY (pinned_product_id) REFERENCES products(id) ON DELETE SET NULL
      )`
    ];

    for (const tableQuery of tables) {
      await pool.query(tableQuery);
    }
    console.log("Product Service MySQL tables initialized.");

    // Self-healing: add columns if they are missing
    try {
      await pool.query('ALTER TABLE products ADD COLUMN is_sponsored TINYINT(1) DEFAULT 0');
      console.log("Self-healing: Added missing 'is_sponsored' column to products table.");
    } catch (e) {
      // Ignore error if column already exists
    }
    try {
      await pool.query('ALTER TABLE products ADD COLUMN international_shipping TINYINT(1) DEFAULT 0');
      console.log("Self-healing: Added missing 'international_shipping' column to products table.");
    } catch (e) {
      // Ignore error if column already exists
    }
    try {
      await pool.query('ALTER TABLE shops ADD COLUMN banner_url VARCHAR(500) DEFAULT NULL');
      console.log("Self-healing: Added missing 'banner_url' column to shops table.");
    } catch (e) {
      // Ignore error if column already exists
    }
    try {
      await pool.query('ALTER TABLE shops ADD COLUMN reject_reason VARCHAR(255) DEFAULT NULL');
      console.log("Self-healing: Added missing 'reject_reason' column to shops table.");
    } catch (e) {
      // Ignore error if column already exists
    }
  } catch (error) {
    console.error("Product Service MySQL connection failed:", error.message);
  }

  // 2. MongoDB setup (with timeout fallback)
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/c2c_b2c_ecommerce';
    console.log("Connecting to MongoDB at", mongoURI);
    
    // Set a 3-second timeout for MongoDB connection to avoid blocking server boot
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    
    mongoAvailable = true;
    console.log("Product Service MongoDB connected successfully.");
  } catch (error) {
    console.warn("MongoDB is not available. System will run in MySQL-fallback mode for reviews/analytics.");
    mongoAvailable = false;
  }
}

module.exports = {
  initDB,
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection(),
  isMongoAvailable: () => mongoAvailable
};
