const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Đặt hàng (Thanh toán COD hoặc chuyển khoản qua Escrow Sàn Giữ Tiền)
router.post('/', authenticateToken, requireRole(['buyer', 'c2c_seller', 'b2c_seller']), async (req, res) => {
  const { items, shipping_address, payment_method } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !shipping_address) {
    return res.status(400).json({ message: 'Vui lòng cung cấp danh sách sản phẩm và địa chỉ giao hàng.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const itemsWithDetails = [];

    // Kiểm tra hàng tồn kho và tính tổng tiền
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Không tìm thấy sản phẩm với ID ${item.product_id}`);
      }

      const product = products[0];

      if (product.stock < item.quantity) {
        throw new Error(`Sản phẩm "${product.name}" hiện không đủ hàng trong kho (Còn: ${product.stock}, Yêu cầu: ${item.quantity}).`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      itemsWithDetails.push({
        product_id: product.id,
        price: product.price,
        quantity: item.quantity,
        new_stock: product.stock - item.quantity
      });
    }

    // 1. Tạo bản ghi Đơn hàng
    const [orderResult] = await connection.query(
      'INSERT INTO orders (buyer_id, total_amount, status, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, totalAmount, 'pending', shipping_address, payment_method || 'COD']
    );
    const orderId = orderResult.insertId;

    // 2. Tạo các bản ghi Chi tiết Đơn hàng & Cập nhật số lượng kho
    for (const detail of itemsWithDetails) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)',
        [orderId, detail.product_id, detail.price, detail.quantity]
      );

      await connection.query(
        'UPDATE products SET stock = ? WHERE id = ?',
        [detail.new_stock, detail.product_id]
      );
    }

    // 3. Tạo giao dịch Trung gian (Escrow)
    // Sàn sẽ giữ số tiền này (status = 'escrow') cho đến khi người mua xác nhận hoặc có khiếu nại.
    await connection.query(
      'INSERT INTO transactions (order_id, amount, status) VALUES (?, ?, ?)',
      [orderId, totalAmount, 'escrow']
    );

    await connection.commit();
    res.status(201).json({
      message: 'Đặt hàng thành công! Đơn hàng của bạn đang được sàn bảo vệ qua cơ chế Escrow.',
      orderId
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi đặt hàng (Rollback):", error.message);
    res.status(400).json({ message: error.message || 'Lỗi hệ thống khi đặt hàng.' });
  } finally {
    connection.release();
  }
});

// 2. Lấy lịch sử mua hàng của tôi
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    // Lấy các đơn hàng
    const [orders] = await db.query(
      `SELECT o.*, t.status AS transaction_status, t.id AS transaction_id
       FROM orders o
       LEFT JOIN transactions t ON o.id = t.order_id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const orderList = [];

    // Lấy chi tiết từng đơn hàng
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, p.name AS product_name, p.image_url, s.shop_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN shops s ON p.shop_id = s.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      orderList.push({
        ...order,
        items
      });
    }

    res.json({ orders: orderList });
  } catch (error) {
    console.error("Lỗi lấy lịch sử mua hàng:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi tải lịch sử mua hàng.' });
  }
});

// 3. Xác nhận đã nhận hàng (Giải ngân tiền từ Escrow sang tài khoản Seller)
router.put('/:id/confirm-receipt', authenticateToken, async (req, res) => {
  const { id } = req.params; // orderId

  try {
    // Kiểm tra đơn hàng có đúng là của người mua này hay không
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND buyer_id = ?', [id, req.user.id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng của bạn.' });
    }

    const order = orders[0];

    // Cập nhật trạng thái đơn hàng thành 'delivered'
    await db.query('UPDATE orders SET status = "delivered" WHERE id = ?', [id]);

    // Giải ngân tiền trong bảng Transactions (từ 'escrow' sang 'released')
    const [transactions] = await db.query('SELECT * FROM transactions WHERE order_id = ?', [id]);
    if (transactions.length > 0) {
      await db.query('UPDATE transactions SET status = "released" WHERE order_id = ?', [id]);
    }

    res.json({ message: 'Xác nhận đã nhận hàng thành công. Tiền đã được giải ngân cho Người bán.' });
  } catch (error) {
    console.error("Lỗi xác nhận nhận hàng:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
