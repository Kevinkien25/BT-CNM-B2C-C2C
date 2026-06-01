const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c2c_b2c_ecommerce'
  });

  try {
    console.log("Updating order #5 in database...");
    
    // Update order total amount
    const [res1] = await connection.query('UPDATE orders SET total_amount = 5600000.00 WHERE id = 5');
    console.log("Orders table rows affected:", res1.affectedRows);

    // Update transactions holding amount
    const [res2] = await connection.query('UPDATE transactions SET amount = 5600000.00 WHERE order_id = 5');
    console.log("Transactions table rows affected:", res2.affectedRows);
    
    console.log("Fix completed successfully!");
  } catch (err) {
    console.error("Error during database update:", err);
  } finally {
    await connection.end();
  }
}

fix();
