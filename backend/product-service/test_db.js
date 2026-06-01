const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c2c_b2c_ecommerce'
};

async function check() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [shops] = await connection.query('SELECT * FROM shops');
    const [products] = await connection.query('SELECT * FROM products');
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log("=== USERS ===");
    console.log(JSON.stringify(users, null, 2));
    console.log("=== SHOPS ===");
    console.log(JSON.stringify(shops, null, 2));
    console.log("=== PRODUCTS ===");
    console.log(JSON.stringify(products, null, 2));
    await connection.end();
  } catch (err) {
    console.error(err);
  }
}

check();
