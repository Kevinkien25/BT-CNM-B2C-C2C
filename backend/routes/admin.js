const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Tất cả các route trong file này đều yêu cầu quyền 'admin'
router.use(authenticateToken, requireRole(['admin']));

// 1. Lấy danh sách tất cả các Shop
router.get('/shops', async (req, res) => {
  try {
    const [shops] = await db.query(
      `SELECT s.*, u.name AS owner_name, u.email AS owner_email 
       FROM shops s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json({ shops });
  } catch (error) {
    console.error("Lỗi lấy danh sách shop admin:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// 2. Phê duyệt hoặc Từ chối Shop (B2C & C2C)
router.put('/shops/:shopId/approve', async (req, res) => {
  const { shopId } = req.params;
  const { action, reject_reason } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Lấy thông tin shop
    const [shops] = await connection.query('SELECT * FROM shops WHERE id = ?', [shopId]);
    if (shops.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy cửa hàng.' });
    }

    const shop = shops[0];

    if (action === 'reject') {
      // Cập nhật trạng thái từ chối duyệt của Shop
      await connection.query('UPDATE shops SET is_approved = 2, reject_reason = ? WHERE id = ?', [reject_reason || 'Không đạt điều kiện.', shopId]);

      // Trả role user về 'buyer'
      await connection.query('UPDATE users SET role = "buyer" WHERE id = ?', [shop.user_id]);

      await connection.commit();
      return res.json({ message: `Đã từ chối phê duyệt shop "${shop.shop_name}" thành công.` });
    } else {
      // Cập nhật trạng thái duyệt của Shop
      await connection.query('UPDATE shops SET is_approved = 1, reject_reason = NULL WHERE id = ?', [shopId]);

      // Đồng bộ nâng cấp role user thành seller tương ứng
      const shopUser = shop.user_id;
      const targetRole = shop.shop_type === 'business' ? 'b2c_seller' : 'c2c_seller';
      await connection.query('UPDATE users SET role = ? WHERE id = ?', [targetRole, shopUser]);

      // Cập nhật toàn bộ sản phẩm của shop này có tag is_mall = 1 nếu shop này là doanh nghiệp (business)
      if (shop.shop_type === 'business') {
        await connection.query('UPDATE products SET is_mall = 1 WHERE shop_id = ?', [shopId]);
      }

      await connection.commit();
      res.json({ message: `Đã phê duyệt shop "${shop.shop_name}" thành công.` });
    }
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi duyệt/từ chối shop:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi phê duyệt/từ chối cửa hàng.' });
  } finally {
    connection.release();
  }
});

// 3. Lấy thống kê hệ thống để vẽ Dashboard Admin
router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [shopCount] = await db.query('SELECT COUNT(*) AS total FROM shops');
    const [productCount] = await db.query('SELECT COUNT(*) AS total FROM products');
    
    // Thống kê tiền
    const [escrowTotal] = await db.query('SELECT SUM(amount) AS total FROM transactions WHERE status = "escrow"');
    const [releasedTotal] = await db.query('SELECT SUM(amount) AS total FROM transactions WHERE status = "released"');
    const [refundedTotal] = await db.query('SELECT SUM(amount) AS total FROM transactions WHERE status = "refunded"');

    res.json({
      stats: {
        users: userCount[0].total,
        shops: shopCount[0].total,
        products: productCount[0].total,
        escrow_funds: escrowTotal[0].total || 0,
        released_funds: releasedTotal[0].total || 0,
        refunded_funds: refundedTotal[0].total || 0
      }
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê hệ thống:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi tải thống kê.' });
  }
});

module.exports = router;
