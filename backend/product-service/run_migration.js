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
    console.log("Connecting to database to run migration...");
    await connection.query('ALTER TABLE shops ADD COLUMN banner_url VARCHAR(500) DEFAULT NULL');
    console.log("Migration SUCCESS! Added banner_url column to shops table.");
    await connection.end();
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Migration skipped: Column banner_url already exists.");
    } else {
      console.error("Migration FAILED:", err.message);
    }
  }
}

migrate();
