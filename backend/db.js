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
    // Connect to MySQL server without selecting database first
    const tempConnection = await mysql.createConnection(dbConfig);
    
    // Create database if not exists
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'c2c_b2c_ecommerce'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();

    // Now establish connection pool with the database selected
    pool = mysql.createPool({
      ...dbConfig,
      database: process.env.DB_NAME || 'c2c_b2c_ecommerce',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create tables in order of dependency
    const tables = [
      // 1. Users
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('buyer', 'c2c_seller', 'b2c_seller', 'admin') DEFAULT 'buyer',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // 2. Shops
      `CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        shop_name VARCHAR(255) NOT NULL,
        shop_type ENUM('individual', 'business') DEFAULT 'individual',
        address VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        tax_code VARCHAR(100) DEFAULT NULL,
        is_approved TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      // 3. Products
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )`,
      // 4. Orders
      `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        shipping_address VARCHAR(255) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      // 5. Order Items
      `CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
      // 6. Transactions (Escrow)
      `CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('escrow', 'released', 'refunded') DEFAULT 'escrow',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )`
    ];

    for (const tableQuery of tables) {
      await pool.query(tableQuery);
    }
    console.log("Database and tables initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed. Please make sure XAMPP/MySQL is running.");
    console.error(error);
    process.exit(1); // Exit if DB connection fails
  }
}

module.exports = {
  initDB,
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection()
};
