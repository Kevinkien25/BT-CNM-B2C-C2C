const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const db = require('./db');
const { authenticateToken, requireRole } = require('./middleware/auth');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/orders/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Order Service' });
});

// 1. Đặt hàng (Thanh toán Ví, COD, hoặc Escrow qua tài khoản sàn)
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { items, shipping_address, payment_method, shipping_partner, shipping_fee, voucher_code } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !shipping_address) {
    return res.status(400).json({ message: 'Vui lòng cung cấp danh sách sản phẩm và địa chỉ.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const itemsWithDetails = [];

    // Kiểm tra hàng tồn kho & Tính tổng tiền
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, name, price, stock, shop_id FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Không tìm thấy sản phẩm ID ${item.product_id}`);
      }

      const product = products[0];
      if (product.stock < item.quantity) {
        throw new Error(`Sản phẩm "${product.name}" hiện không đủ tồn kho.`);
      }

      const itemTotal = Number(product.price) * item.quantity;
      totalAmount += itemTotal;

      itemsWithDetails.push({
        product_id: product.id,
        price: product.price,
        quantity: item.quantity,
        new_stock: product.stock - item.quantity,
        shop_id: product.shop_id
      });
    }

    // Áp dụng phí vận chuyển
    const finalAmount = totalAmount + Number(shipping_fee || 0);

    // Nếu chọn thanh toán bằng Ví điện tử (Wallet): Gọi Auth Service để trừ tiền ví người mua
    if (payment_method === 'Wallet') {
      try {
        const walletRes = await axios.post('http://localhost:5001/api/auth/wallet/pay-internal', {
          user_id: req.user.id,
          amount: finalAmount,
          description: `Thanh toán đơn hàng mua sắm`
        });
        if (!walletRes.data.success) {
          throw new Error('Trừ tiền ví điện tử không thành công.');
        }
      } catch (err) {
        throw new Error(err.response?.data?.message || 'Không thể thanh toán bằng Ví. Số dư không đủ.');
      }
    }

    // 1. Tạo đơn hàng
    const [orderResult] = await connection.query(
      `INSERT INTO orders (buyer_id, total_amount, status, shipping_address, payment_method, shipping_partner, shipping_fee, voucher_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, finalAmount, 'pending', shipping_address, payment_method || 'COD', shipping_partner || 'GHN', shipping_fee || 0.00, voucher_code || null]
    );
    const orderId = orderResult.insertId;

    // 2. Tạo chi tiết đơn hàng & Cập nhật kho
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

    // 3. Tạo bản ghi giao dịch bảo đảm (Sàn giữ tiền)
    const transactionStatus = (payment_method === 'Wallet') ? 'holding' : 'released';
    await connection.query(
      'INSERT INTO transactions (order_id, amount, status) VALUES (?, ?, ?)',
      [orderId, finalAmount, transactionStatus]
    );

    await connection.commit();
    res.status(201).json({ message: 'Đặt hàng thành công!', orderId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 2. Xem lịch sử mua hàng của khách (Buyer A5)
app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, t.status AS transaction_status, t.id AS transaction_id
       FROM orders o
       LEFT JOIN transactions t ON o.id = t.order_id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const result = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, p.name AS product_name, p.image_url, s.shop_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN shops s ON p.shop_id = s.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      result.push({ ...order, items });
    }
    res.json({ orders: result });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 3. Xác nhận nhận hàng và giải ngân cho Seller (Buyer A5 / Escrow release)
app.put('/api/orders/:id/confirm-receipt', authenticateToken, async (req, res) => {
  const orderId = req.params.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? AND buyer_id = ?', [orderId, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    const order = orders[0];

    // Cập nhật trạng thái đơn hàng
    await connection.query('UPDATE orders SET status = "delivered" WHERE id = ?', [orderId]);

    // Giải ngân tiền trong giao dịch bảo đảm
    const [txs] = await connection.query('SELECT * FROM transactions WHERE order_id = ? AND status IN ("escrow", "holding")', [orderId]);
    if (txs.length > 0) {
      await connection.query('UPDATE transactions SET status = "released" WHERE order_id = ?', [orderId]);

      // Tìm thông tin chủ shop để giải ngân tiền hàng vào Ví điện tử của họ
      const [items] = await connection.query(
        `SELECT p.shop_id, s.user_id AS seller_user_id
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN shops s ON p.shop_id = s.id
         WHERE oi.order_id = ? LIMIT 1`,
        [orderId]
      );

      if (items.length > 0) {
        const sellerUserId = items[0].seller_user_id;
        // Gọi Auth Service cộng tiền ví cho Người bán
        await axios.post('http://localhost:5001/api/auth/wallet/refund-internal', {
          user_id: sellerUserId,
          amount: order.total_amount,
          type: 'receive',
          description: `Nhận tiền thanh toán đơn hàng #${orderId} (Ví giải ngân)`
        });
      }
    }

    await connection.commit();
    res.json({ message: 'Đã nhận hàng thành công và giải ngân cho người bán.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 4. Tạo khiếu nại hoàn tiền / Bảo hành (Buyer A10)
app.post('/api/orders/:id/dispute', authenticateToken, async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: 'Vui lòng cung cấp lý do khiếu nại.' });

  try {
    const [orders] = await db.query('SELECT id FROM orders WHERE id = ? AND buyer_id = ?', [req.params.id, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });

    // Tạo bản ghi khiếu nại
    await db.query(
      'INSERT INTO disputes (order_id, user_id, reason, status) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, reason, 'pending']
    );

    res.json({ message: 'Yêu cầu khiếu nại/hoàn trả của bạn đã được gửi tới Admin giải quyết.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 5. Admin: Xử lý khiếu nại tranh chấp (Admin C3)
app.get('/api/orders/admin/disputes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [disputes] = await db.query(
      `SELECT d.*, o.total_amount, o.status AS order_status, u.name AS buyer_name
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );
    res.json({ disputes });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

app.put('/api/orders/admin/disputes/:id/resolve', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { action, resolution } = req.body; // action: 'refund' (hoàn tiền buyer) hoặc 'release' (giải ngân seller)
  const disputeId = req.params.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [disputes] = await connection.query('SELECT * FROM disputes WHERE id = ?', [disputeId]);
    if (disputes.length === 0) return res.status(404).json({ message: 'Không tìm thấy khiếu nại.' });
    const dispute = disputes[0];

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [dispute.order_id]);
    const order = orders[0];

    if (action === 'refund') {
      // 1. Hoàn tiền cho Người mua
      await connection.query('UPDATE transactions SET status = "refunded" WHERE order_id = ?', [dispute.order_id]);
      await connection.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [dispute.order_id]);

      // Trả tiền về ví điện tử của Người mua
      await axios.post('http://localhost:5001/api/auth/wallet/refund-internal', {
        user_id: order.buyer_id,
        amount: order.total_amount,
        type: 'refund',
        description: `Hoàn tiền tranh chấp đơn hàng #${order.id} theo quyết định Admin`
      });
    } else if (action === 'release') {
      // 2. Giải ngân cho Người bán
      await connection.query('UPDATE transactions SET status = "released" WHERE order_id = ?', [dispute.order_id]);
      await connection.query('UPDATE orders SET status = "delivered" WHERE id = ?', [dispute.order_id]);

      // Tìm seller
      const [items] = await connection.query(
        `SELECT s.user_id AS seller_user_id
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN shops s ON p.shop_id = s.id
         WHERE oi.order_id = ? LIMIT 1`,
        [dispute.order_id]
      );
      if (items.length > 0) {
        await axios.post('http://localhost:5001/api/auth/wallet/refund-internal', {
          user_id: items[0].seller_user_id,
          amount: order.total_amount,
          type: 'receive',
          description: `Nhận tiền giải ngân đơn hàng #${order.id} sau phán quyết tranh chấp của Admin`
        });
      }
    }

    // Cập nhật trạng thái tranh chấp
    await connection.query(
      'UPDATE disputes SET status = "resolved", resolution = ? WHERE id = ?',
      [resolution || 'Admin xử lý', disputeId]
    );

    await connection.commit();
    res.json({ message: `Đã giải quyết tranh chấp với hành động: ${action}` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

// Seller incoming orders
app.get('/api/orders/seller', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  try {
    const [shops] = await db.query('SELECT id, shop_name FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cửa hàng của bạn.' });
    }
    const shopId = shops[0].id;
    const shopName = shops[0].shop_name;

    const [orders] = await db.query(
      `SELECT o.id AS order_id, o.total_amount, o.status, o.shipping_address, o.payment_method, o.created_at,
              o.shipping_partner, o.shipping_fee, o.voucher_code,
              u.name AS buyer_name, u.email AS buyer_email,
              oi.product_id, oi.price, oi.quantity, p.name AS product_name, p.image_url
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE p.shop_id = ?
       ORDER BY o.created_at DESC`,
      [shopId]
    );

    const groupedOrders = {};
    orders.forEach(item => {
      if (!groupedOrders[item.order_id]) {
        groupedOrders[item.order_id] = {
          id: item.order_id, // Map order_id to id so ord.id works on frontend
          order_id: item.order_id,
          buyer_name: item.buyer_name,
          buyer_email: item.buyer_email,
          total_amount: item.total_amount,
          status: item.status,
          shipping_address: item.shipping_address,
          payment_method: item.payment_method,
          shipping_partner: item.shipping_partner || 'GHN',
          shipping_fee: item.shipping_fee || 0,
          voucher_code: item.voucher_code,
          created_at: item.created_at,
          items: []
        };
      }
      groupedOrders[item.order_id].items.push({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        shop_name: shopName
      });
    });

    res.json({ orders: Object.values(groupedOrders) });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng của shop:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách đơn hàng.' });
  }
});

// Update order status by seller
app.put('/api/orders/seller/:orderId/status', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'processing', 'shipped', 'delivered', 'cancelled'

  const allowedStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [shops] = await connection.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy shop.' });
    }
    const shopId = shops[0].id;

    const [items] = await connection.query(
      `SELECT oi.id FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ? AND p.shop_id = ?`,
      [orderId, shopId]
    );

    if (items.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật trạng thái đơn hàng này.' });
    }

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const order = orders[0];

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    if (status === 'cancelled') {
      await connection.query('UPDATE transactions SET status = "refunded" WHERE order_id = ?', [orderId]);
      
      const [orderItems] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of orderItems) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }

      if (order.payment_method === 'Wallet') {
        try {
          await axios.post('http://localhost:5001/api/auth/wallet/refund-internal', {
            user_id: order.buyer_id,
            amount: order.total_amount,
            type: 'refund',
            description: `Hoàn tiền do người bán hủy đơn hàng #${orderId}`
          });
        } catch (err) {
          console.error("Lỗi tự động hoàn tiền ví:", err.message);
        }
      }
    }

    await connection.commit();
    res.json({ message: `Cập nhật trạng thái đơn hàng sang "${status}" thành công.` });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  } finally {
    connection.release();
  }
});

async function start() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`Order Service matches port ${PORT}`);
  });
}
start();
