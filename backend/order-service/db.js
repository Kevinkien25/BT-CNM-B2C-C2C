const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

let pool = null;

async function initDB() {
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
      `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        shipping_address VARCHAR(255) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        shipping_partner VARCHAR(50) DEFAULT 'GHN',
        shipping_fee DECIMAL(10,2) DEFAULT 0.00,
        voucher_code VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('escrow', 'holding', 'released', 'refunded') DEFAULT 'holding',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS disputes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
        resolution TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )`
    ];

    for (const tableQuery of tables) {
      await pool.query(tableQuery);
    }
    console.log("Order Service database tables initialized.");

    // Self-healing: add columns if they are missing in orders table
    try {
      await pool.query("ALTER TABLE orders ADD COLUMN shipping_partner VARCHAR(50) DEFAULT 'GHN'");
      console.log("Self-healing: Added missing 'shipping_partner' column to orders table.");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0.00");
      console.log("Self-healing: Added missing 'shipping_fee' column to orders table.");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(50) DEFAULT NULL");
      console.log("Self-healing: Added missing 'voucher_code' column to orders table.");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE transactions MODIFY COLUMN status ENUM('escrow', 'holding', 'released', 'refunded') DEFAULT 'holding'");
      console.log("Self-healing: Updated transactions status ENUM to include 'holding' in order-service/db.js.");
    } catch (e) {}
  } catch (error) {
    console.error("Order Service DB connection failed:", error.message);
  }
}

module.exports = {
  initDB,
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection()
};
