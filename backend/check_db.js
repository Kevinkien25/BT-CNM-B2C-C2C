const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c2c_b2c_ecommerce'
  });

  try {
    const [products] = await connection.query('SELECT id, name, price, stock, is_mall, shop_id FROM products');
    console.log("=== PRODUCTS IN DATABASE ===");
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
