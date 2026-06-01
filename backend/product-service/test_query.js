const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c2c_b2c_ecommerce'
};

async function test() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [p] = await connection.query('SELECT * FROM products WHERE id = 6');
    console.log("Product 6:", p);
    const [s] = await connection.query('SELECT * FROM shops WHERE id = 1');
    console.log("Shop 1:", s);
    const [joined] = await connection.query(
      `SELECT p.*, s.shop_name, s.shop_type, s.address AS shop_address, s.phone AS shop_phone, s.tax_code, s.is_approved AS shop_approved, s.banner_url
       FROM products p
       JOIN shops s ON p.shop_id = s.id
       WHERE p.id = 6`
    );
    console.log("Joined result:", joined);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

test();
