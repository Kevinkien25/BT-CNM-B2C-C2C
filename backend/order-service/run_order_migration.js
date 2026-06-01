const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c2c_b2c_ecommerce'
};

async function migrate() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connecting to database to run orders migration...");
    
    try {
      await connection.query("ALTER TABLE orders ADD COLUMN shipping_partner VARCHAR(50) DEFAULT 'GHN'");
      console.log("Migration: Added shipping_partner column to orders table.");
    } catch (err) {
      console.log("shipping_partner check:", err.message);
    }

    try {
      await connection.query("ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0.00");
      console.log("Migration: Added shipping_fee column to orders table.");
    } catch (err) {
      console.log("shipping_fee check:", err.message);
    }

    try {
      await connection.query("ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(50) DEFAULT NULL");
      console.log("Migration: Added voucher_code column to orders table.");
    } catch (err) {
      console.log("voucher_code check:", err.message);
    }

    await connection.end();
    console.log("Migration completed.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  }
}

migrate();
