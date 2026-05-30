const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Đăng ký mở Shop (Chỉ dành cho c2c_seller và b2c_seller)
router.post('/register', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { shop_name, address, phone, tax_code } = req.body;

  if (!shop_name || !address || !phone) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Tên shop, Địa chỉ và Số điện thoại.' });
  }

  try {
    // Kiểm tra xem user đã có shop chưa
    const [existingShops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (existingShops.length > 0) {
      return res.status(400).json({ message: 'Bạn đã đăng ký mở shop rồi.' });
    }

    const shopType = req.user.role === 'b2c_seller' ? 'business' : 'individual';
    
    // Nếu là B2C Doanh nghiệp, bắt buộc phải có mã số thuế
    if (shopType === 'business' && !tax_code) {
      return res.status(400).json({ message: 'Doanh nghiệp đăng ký B2C bắt buộc phải có Mã số thuế.' });
    }

    // Đối với shop C2C cá nhân, tự động duyệt. Shop B2C doanh nghiệp cần admin duyệt (is_approved = 0)
    const isApproved = shopType === 'individual' ? 1 : 0;

    const [result] = await db.query(
      'INSERT INTO shops (user_id, shop_name, shop_type, address, phone, tax_code, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, shop_name, shopType, address, phone, tax_code || null, isApproved]
    );

    const [newShops] = await db.query('SELECT * FROM shops WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: shopType === 'business' 
        ? 'Đăng ký shop doanh nghiệp thành công! Vui lòng chờ Admin phê duyệt mã số thuế.' 
        : 'Đăng ký cửa hàng cá nhân thành công!',
      shop: newShops[0]
    });
  } catch (error) {
    console.error("Lỗi đăng ký shop:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký shop.' });
  }
});

// 2. Lấy thông tin shop hiện tại của Seller
router.get('/my-shop', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  try {
    const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Bạn chưa đăng ký shop.' });
    }
    res.json({ shop: shops[0] });
  } catch (error) {
    console.error("Lỗi lấy thông tin shop:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// 3. Xem danh sách đơn hàng gửi tới Shop của tôi
router.get('/orders', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  try {
    // Tìm shop của user
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cửa hàng của bạn.' });
    }
    const shopId = shops[0].id;

    // Lấy danh sách sản phẩm thuộc shop của mình và các đơn hàng tương ứng
    const [orders] = await db.query(
      `SELECT o.id AS order_id, o.total_amount, o.status, o.shipping_address, o.payment_method, o.created_at,
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

    // Gom nhóm order_items theo order_id
    const groupedOrders = {};
    orders.forEach(item => {
      if (!groupedOrders[item.order_id]) {
        groupedOrders[item.order_id] = {
          order_id: item.order_id,
          buyer_name: item.buyer_name,
          buyer_email: item.buyer_email,
          total_amount: item.total_amount,
          status: item.status,
          shipping_address: item.shipping_address,
          payment_method: item.payment_method,
          created_at: item.created_at,
          items: []
        };
      }
      groupedOrders[item.order_id].items.push({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url
      });
    });

    res.json({ orders: Object.values(groupedOrders) });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng của shop:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách đơn hàng.' });
  }
});

// 4. Cập nhật trạng thái đơn hàng (Chuẩn bị hàng, Giao hàng)
router.put('/orders/:orderId/status', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'processing', 'shipped', 'delivered', 'cancelled'

  const allowedStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ.' });
  }

  try {
    // Xác minh đơn hàng này có chứa sản phẩm của shop này hay không
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy shop.' });
    }
    const shopId = shops[0].id;

    const [items] = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ? AND p.shop_id = ?`,
      [orderId, shopId]
    );

    if (items.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật trạng thái đơn hàng này.' });
    }

    // Cập nhật trạng thái của đơn hàng chính
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    // Nếu đơn hàng chuyển sang trạng thái delivered (Đã giao), giao dịch Escrow sẽ chờ người mua bấm xác nhận giải ngân.
    // Nếu đơn hàng bị huỷ, cập nhật giao dịch Escrow thành refunded và hoàn lại kho hàng
    if (status === 'cancelled') {
      await db.query('UPDATE transactions SET status = "refunded" WHERE order_id = ?', [orderId]);
      
      // Hoàn trả số lượng hàng vào kho
      const [orderItems] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of orderItems) {
        await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    res.json({ message: `Cập nhật trạng thái đơn hàng sang "${status}" thành công.` });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
