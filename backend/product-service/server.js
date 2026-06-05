const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
require('dotenv').config();

const db = require('./db');
const { authenticateToken, requireRole } = require('./middleware/auth');
const aiService = require('./services/ai');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Mongoose MongoDB Schema for Product Reviews (NoSQL data)
const ReviewSchema = new mongoose.Schema({
  productId: Number,
  userId: Number,
  userName: String,
  rating: Number,
  comment: String,
  reply: String,
  createdAt: { type: Date, default: Date.now }
});
const MongoReview = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

// Memory fallback for Reviews if MongoDB is down
let memoryReviews = [
  { id: "m1", productId: 1, userId: 2, userName: "Nguyễn Văn Mua", rating: 5, comment: "Sản phẩm dùng tốt, đúng mô tả C2C.", reply: "Cảm ơn bạn đã tin tưởng ủng hộ shop đồ cũ của mình!", createdAt: new Date() }
];

// Health Check
app.get('/api/products/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Product Service', mongoActive: db.isMongoAvailable() });
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Endpoint: File Upload
app.post('/api/products/upload', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn ảnh.' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ message: 'Tải ảnh thành công!', url: fileUrl });
});

// 1. Đăng ký shop (Seller B1)
app.post('/api/shop/register', authenticateToken, requireRole(['buyer', 'c2c_seller', 'b2c_seller']), async (req, res) => {
  const { shop_name, address, phone, tax_code, shop_type } = req.body;
  if (!shop_name || !address || !phone) return res.status(400).json({ message: 'Vui lòng điền đủ thông tin.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Bạn đã đăng ký shop rồi.' });
    }

    const shopType = shop_type || (req.user.role === 'b2c_seller' ? 'business' : 'individual');
    if (shopType === 'business' && !tax_code) {
      await conn.rollback();
      return res.status(400).json({ message: 'Mã số thuế bắt buộc đối với B2C.' });
    }

    const isApproved = 0; // Cả B2C Mall và C2C Shop đều cần Admin duyệt, mặc định ban đầu là 0 (chờ duyệt)
    const [result] = await conn.query(
      'INSERT INTO shops (user_id, shop_name, shop_type, address, phone, tax_code, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, shop_name, shopType, address, phone, tax_code || null, isApproved]
    );

    await conn.commit();
    res.status(201).json({ message: 'Đăng ký cửa hàng thành công!', shopId: result.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Lỗi đăng ký shop.' });
  } finally {
    conn.release();
  }
});

// Lấy thông tin shop của tôi
app.get('/api/shop/my-shop', authenticateToken, async (req, res) => {
  try {
    const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) return res.status(404).json({ message: 'Bạn chưa có shop.' });
    res.json({ shop: shops[0] });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// Reset thông tin đăng ký shop nếu bị từ chối (Seller reset)
app.delete('/api/shop/my-shop', authenticateToken, async (req, res) => {
  try {
    const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) return res.status(404).json({ message: 'Không tìm thấy shop.' });
    
    if (shops[0].is_approved !== 2) {
      return res.status(400).json({ message: 'Chỉ có thể xóa hồ sơ đăng ký shop đã bị từ chối.' });
    }

    await db.query('DELETE FROM shops WHERE id = ?', [shops[0].id]);
    res.json({ success: true, message: 'Đã xóa hồ sơ đăng ký cũ để làm mới.' });
  } catch (err) {
    console.error("Lỗi xóa shop của tôi:", err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// Cập nhật banner/giao diện trang shop (Seller B13)
app.put('/api/shop/my-shop/banner', authenticateToken, async (req, res) => {
  const { banner_url } = req.body;
  try {
    await db.query('UPDATE shops SET banner_url = ? WHERE user_id = ?', [banner_url, req.user.id]);
    res.json({ message: 'Cập nhật giao diện shop thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 2. CRUD Products (Seller B2 / Buyer A2)
// Lấy danh sách sản phẩm (hỗ trợ lọc tìm kiếm thông minh, sponsored, quốc tế)
app.get('/api/products', async (req, res) => {
  const { search, is_mall, shop_id, sponsored, international } = req.query;
  let queryStr = 'SELECT p.*, s.shop_name, s.shop_type FROM products p JOIN shops s ON p.shop_id = s.id WHERE s.is_approved = 1';
  let params = [];

  if (search) {
    const sLower = search.toLowerCase().trim();
    if (sLower === 'điện thoại' || sLower === 'điện thoại & tablet') {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ?)`;
      params.push('%điện thoại%', '%điện thoại%', '%iphone%', '%ipad%', '%samsung%', '%oppo%');
    } else if (sLower === 'laptop' || sLower === 'laptop & pc') {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.name LIKE ? OR p.name LIKE ?)`;
      params.push('%laptop%', '%laptop%', '%macbook%', '%dell%');
    } else {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
  }

  if (is_mall === 'true' || is_mall === '1') {
    queryStr += ' AND p.is_mall = 1';
  }
  if (shop_id) {
    queryStr += ' AND p.shop_id = ?';
    params.push(shop_id);
  }
  if (sponsored === 'true' || sponsored === '1') {
    queryStr += ' AND p.is_sponsored = 1';
  }
  if (international === 'true' || international === '1') {
    queryStr += ' AND p.international_shipping = 1';
  }

  queryStr += ' ORDER BY p.is_sponsored DESC, p.created_at DESC';

  try {
    const [products] = await db.query(queryStr, params);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy sản phẩm nổi bật quảng cáo (Seller B12)
app.get('/api/products/sponsored', async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT p.*, s.shop_name FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.is_sponsored = 1 AND s.is_approved = 1'
    );
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// Lấy chi tiết sản phẩm
app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, s.shop_name, s.shop_type, s.address AS shop_address, s.phone AS shop_phone, s.tax_code, s.is_approved AS shop_approved, s.banner_url, s.user_id AS seller_user_id
       FROM products p
       JOIN shops s ON p.shop_id = s.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (products.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    res.json({ product: products[0] });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// Thêm sản phẩm mới (chủ shop)
app.post('/api/products', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { name, description, price, stock, sku, image_url, is_sponsored, international_shipping } = req.body;
  if (!name || !price || stock === undefined || !sku) return res.status(400).json({ message: 'Thiếu thông tin.' });

  try {
    const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) return res.status(400).json({ message: 'Bạn chưa tạo cửa hàng.' });

    const shop = shops[0];
    const isMall = (shop.shop_type === 'business' && shop.is_approved === 1) ? 1 : 0;
    const defaultImg = image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';

    const [result] = await db.query(
      `INSERT INTO products (shop_id, name, description, price, stock, sku, is_mall, image_url, is_sponsored, international_shipping)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shop.id, name, description || '', price, stock, sku, isMall, defaultImg, is_sponsored || 0, international_shipping || 0]
    );

    res.status(201).json({ message: 'Đăng bán thành công!', productId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật sản phẩm
app.put('/api/products/:id', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { name, description, price, stock, sku, image_url, is_sponsored, international_shipping } = req.body;
  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) return res.status(403).json({ message: 'Không có quyền.' });

    await db.query(
      `UPDATE products SET name=?, description=?, price=?, stock=?, sku=?, image_url=?, is_sponsored=?, international_shipping=?
       WHERE id=? AND shop_id=?`,
      [name, description, price, stock, sku, image_url, is_sponsored || 0, international_shipping || 0, req.params.id, shops[0].id]
    );
    res.json({ message: 'Cập nhật sản phẩm thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// Xoá sản phẩm
app.delete('/api/products/:id', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) return res.status(403).json({ message: 'Không có quyền.' });

    await db.query('DELETE FROM products WHERE id=? AND shop_id=?', [req.params.id, shops[0].id]);
    res.json({ message: 'Xóa sản phẩm thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 3. Đánh giá & Phản hồi Sản Phẩm (Buyer A7 / Seller B11)
app.post('/api/products/reviews', authenticateToken, async (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating) return res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin đánh giá.' });

  const reviewData = {
    productId: Number(productId),
    userId: req.user.id,
    userName: req.user.name,
    rating: Number(rating),
    comment: comment || '',
    reply: '',
    createdAt: new Date()
  };

  try {
    if (db.isMongoAvailable()) {
      const review = new MongoReview(reviewData);
      await review.save();
    } else {
      memoryReviews.push({ id: Date.now().toString(), ...reviewData });
    }
    res.json({ message: 'Đăng đánh giá thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đăng đánh giá.' });
  }
});

// Lấy danh sách đánh giá của sản phẩm
app.get('/api/products/:productId/reviews', async (req, res) => {
  const pid = Number(req.params.productId);
  try {
    if (db.isMongoAvailable()) {
      const reviews = await MongoReview.find({ productId: pid }).sort({ createdAt: -1 });
      res.json({ reviews });
    } else {
      const reviews = memoryReviews.filter(r => r.productId === pid);
      res.json({ reviews });
    }
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải đánh giá.' });
  }
});

// Phản hồi/Trả lời đánh giá của người mua (Seller B11)
app.put('/api/products/reviews/:id/reply', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;
  try {
    if (db.isMongoAvailable()) {
      await MongoReview.findByIdAndUpdate(id, { reply });
    } else {
      const rev = memoryReviews.find(r => r.id === id);
      if (rev) rev.reply = reply;
    }
    res.json({ message: 'Đã phản hồi đánh giá.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 4. Trợ lý Marketing AI
app.post('/api/products/ai-description', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc.' });

  try {
    const desc = await aiService.generateProductDescription(name, category || '');
    res.json({ description: desc });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi AI.' });
  }
});

// 5. Admin: Duyệt Shop & Xem tất cả shops (Admin C1)
app.get('/api/shop/admin/all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [shops] = await db.query('SELECT * FROM shops ORDER BY created_at DESC');
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

app.put('/api/shop/admin/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { action, reject_reason } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [shops] = await conn.query('SELECT * FROM shops WHERE id = ?', [id]);
    if (shops.length === 0) return res.status(404).json({ message: 'Không tìm thấy shop.' });
    
    if (action === 'reject') {
      await conn.query('UPDATE shops SET is_approved = 2, reject_reason = ? WHERE id = ?', [reject_reason || 'Không đạt điều kiện.', id]);
      
      // Trả role user về 'buyer'
      await conn.query('UPDATE users SET role = "buyer" WHERE id = ?', [shops[0].user_id]);
      
      await conn.commit();
      return res.json({ message: 'Đã từ chối phê duyệt shop.' });
    } else {
      // Approve
      await conn.query('UPDATE shops SET is_approved = 1, reject_reason = NULL WHERE id = ?', [id]);
      
      // Đồng bộ nâng cấp role user thành seller tương ứng
      const shopUser = shops[0].user_id;
      const targetRole = shops[0].shop_type === 'business' ? 'b2c_seller' : 'c2c_seller';
      await conn.query('UPDATE users SET role = ? WHERE id = ?', [targetRole, shopUser]);

      if (shops[0].shop_type === 'business') {
        await conn.query('UPDATE products SET is_mall = 1 WHERE shop_id = ?', [id]);
      }
      await conn.commit();
      res.json({ message: 'Đã phê duyệt shop thành công.' });
    }
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Lỗi phê duyệt.' });
  } finally {
    conn.release();
  }
});

// Admin stats and shop list for Admin Dashboard
app.get('/api/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [shopCount] = await db.query('SELECT COUNT(*) AS total FROM shops');
    const [productCount] = await db.query('SELECT COUNT(*) AS total FROM products');
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

app.get('/api/admin/shops', authenticateToken, requireRole(['admin']), async (req, res) => {
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

// Admin content moderation: Get all products (STT 4)
app.get('/api/admin/products', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, s.shop_name, u.email AS owner_email 
       FROM products p
       JOIN shops s ON p.shop_id = s.id
       JOIN users u ON s.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ products });
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm admin:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// Admin content moderation: Delete/Ban a product (STT 4)
app.delete('/api/admin/products/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }
    res.json({ success: true, message: 'Đã xóa sản phẩm vi phạm thành công.' });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm admin:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// --- Livestream Selling APIs ---

// 1. Start Livestream (Seller)
app.post('/api/products/livestreams/start', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập tiêu đề livestream.' });
  }

  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ? AND is_approved = 1', [req.user.id]);
    if (shops.length === 0) {
      return res.status(403).json({ message: 'Bạn chưa có gian hàng được phê duyệt để livestream.' });
    }
    const shopId = shops[0].id;

    // End any active livestreams for this shop
    await db.query("UPDATE livestreams SET status = 'ended' WHERE shop_id = ? AND status = 'live'", [shopId]);

    // Insert new livestream
    const [result] = await db.query(
      "INSERT INTO livestreams (shop_id, title, status, viewer_count) VALUES (?, ?, 'live', 0)",
      [shopId, title.trim()]
    );

    res.status(201).json({ success: true, streamId: result.insertId, message: 'Khởi tạo livestream thành công.' });
  } catch (err) {
    console.error("Lỗi khởi tạo livestream:", err);
    res.status(500).json({ message: 'Lỗi máy chủ khi khởi tạo livestream.' });
  }
});

// 2. End Livestream (Seller)
app.post('/api/products/livestreams/end/:id', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const streamId = Number(req.params.id);
  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ? AND is_approved = 1', [req.user.id]);
    if (shops.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý livestream này.' });
    }
    const shopId = shops[0].id;

    await db.query(
      "UPDATE livestreams SET status = 'ended' WHERE id = ? AND shop_id = ?",
      [streamId, shopId]
    );

    res.json({ success: true, message: 'Đã kết thúc livestream.' });
  } catch (err) {
    console.error("Lỗi kết thúc livestream:", err);
    res.status(500).json({ message: 'Lỗi máy chủ khi kết thúc livestream.' });
  }
});

// 3. Pin Product to Livestream (Seller)
app.post('/api/products/livestreams/pin', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { streamId, productId } = req.body;
  if (!streamId) {
    return res.status(400).json({ message: 'Thiếu streamId.' });
  }

  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ? AND is_approved = 1', [req.user.id]);
    if (shops.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền ghim sản phẩm.' });
    }
    const shopId = shops[0].id;

    if (productId) {
      const [prods] = await db.query('SELECT id FROM products WHERE id = ? AND shop_id = ?', [Number(productId), shopId]);
      if (prods.length === 0) {
        return res.status(400).json({ message: 'Sản phẩm không thuộc gian hàng của bạn.' });
      }
    }

    await db.query(
      "UPDATE livestreams SET pinned_product_id = ? WHERE id = ? AND shop_id = ?",
      [productId ? Number(productId) : null, Number(streamId), shopId]
    );

    res.json({ success: true, message: 'Đã ghim sản phẩm lên livestream.' });
  } catch (err) {
    console.error("Lỗi ghim sản phẩm livestream:", err);
    res.status(500).json({ message: 'Lỗi máy chủ khi ghim sản phẩm.' });
  }
});

// 4. Get Active Livestreams (Public)
app.get('/api/products/livestreams/active', async (req, res) => {
  try {
    const [streams] = await db.query(
      `SELECT l.*, s.shop_name, s.banner_url,
              p.name AS product_name, p.price AS product_price, p.image_url AS product_image
       FROM livestreams l
       JOIN shops s ON l.shop_id = s.id
       LEFT JOIN products p ON l.pinned_product_id = p.id
       WHERE l.status = 'live'
       ORDER BY l.created_at DESC`
    );
    res.json({ streams });
  } catch (err) {
    console.error("Lỗi lấy danh sách livestream active:", err);
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách livestream.' });
  }
});

// 5. Join Livestream (Viewer increment)
app.post('/api/products/livestreams/:id/join', async (req, res) => {
  try {
    await db.query('UPDATE livestreams SET viewer_count = viewer_count + 1 WHERE id = ? AND status = "live"', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tham gia livestream.' });
  }
});

// 6. Leave Livestream (Viewer decrement)
app.post('/api/products/livestreams/:id/leave', async (req, res) => {
  try {
    await db.query('UPDATE livestreams SET viewer_count = GREATEST(0, viewer_count - 1) WHERE id = ? AND status = "live"', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi rời livestream.' });
  }
});

async function start() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`Product Service matches port ${PORT}`);
  });
}
start();
