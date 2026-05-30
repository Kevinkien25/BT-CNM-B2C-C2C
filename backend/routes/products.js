const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const aiService = require('../services/ai');

// Cấu hình Multer lưu ảnh sản phẩm vào thư mục uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

// API tải ảnh lên cục bộ
router.post('/upload', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn và tải lên một tệp ảnh.' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    message: 'Tải ảnh lên thành công!',
    url: fileUrl
  });
});

// 1. Lấy danh sách sản phẩm (Có bộ lọc tìm kiếm và hàng Mall)
router.get('/', async (req, res) => {
  const { search, is_mall, shop_id } = req.query;
  
  let queryStr = `
    SELECT p.*, s.shop_name, s.shop_type, s.is_approved AS shop_approved
    FROM products p
    JOIN shops s ON p.shop_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    const searchLower = search.toLowerCase().trim();
    if (searchLower === 'điện thoại' || searchLower === 'điện thoại & tablet') {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ?)`;
      params.push('%điện thoại%', '%điện thoại%', '%iphone%', '%ipad%', '%samsung%', '%oppo%', '%xiaomi%', '%nokia%');
    } else if (searchLower === 'laptop' || searchLower === 'laptop & pc') {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ?)`;
      params.push('%laptop%', '%laptop%', '%macbook%', '%dell%', '%hp%', '%asus%', '%lenovo%');
    } else if (searchLower === 'tai nghe' || searchLower === 'tai nghe & âm thanh') {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.name LIKE ? OR p.name LIKE ? OR p.name LIKE ?)`;
      params.push('%tai nghe%', '%tai nghe%', '%headphone%', '%airpods%', '%sony%');
    } else {
      queryStr += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
  }

  if (is_mall === 'true' || is_mall === '1') {
    queryStr += ` AND p.is_mall = 1`;
  }

  if (shop_id) {
    queryStr += ` AND p.shop_id = ?`;
    params.push(shop_id);
  }

  queryStr += ` ORDER BY p.created_at DESC`;

  try {
    const [products] = await db.query(queryStr, params);
    res.json({ products });
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi tải sản phẩm.' });
  }
});

// 2. Tự động viết mô tả sản phẩm bằng AI
router.post('/ai-description', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { name, category } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc để AI phân tích.' });
  }

  try {
    const description = await aiService.generateProductDescription(name, category || '');
    res.json({ description });
  } catch (error) {
    console.error("Lỗi gọi AI sinh mô tả:", error);
    res.status(500).json({ message: 'Không thể tạo mô tả sản phẩm bằng AI.' });
  }
});

// 3. Lấy chi tiết sản phẩm theo ID (Kèm thông tin Shop)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [products] = await db.query(
      `SELECT p.*, s.shop_name, s.shop_type, s.address AS shop_address, s.phone AS shop_phone, s.tax_code, s.is_approved AS shop_approved
       FROM products p
       JOIN shops s ON p.shop_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    res.json({ product: products[0] });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// 4. Thêm sản phẩm mới (Chỉ dành cho chủ Shop đã được kích hoạt)
router.post('/', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { name, description, price, stock, sku, image_url } = req.body;

  if (!name || !price || stock === undefined || !sku) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ Tên, Giá, Số lượng và SKU.' });
  }

  try {
    // Tìm shop của user
    const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(400).json({ message: 'Bạn cần tạo shop trước khi đăng sản phẩm.' });
    }

    const shop = shops[0];
    
    // Nếu là B2C shop doanh nghiệp, cần phải được duyệt mới được hiển thị tag Mall
    const isMall = (shop.shop_type === 'business' && shop.is_approved === 1) ? 1 : 0;

    const defaultImg = image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';

    const [result] = await db.query(
      `INSERT INTO products (shop_id, name, description, price, stock, sku, is_mall, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [shop.id, name, description || '', price, stock, sku, isMall, defaultImg]
    );

    res.status(201).json({
      message: 'Đăng sản phẩm thành công!',
      productId: result.insertId
    });
  } catch (error) {
    console.error("Lỗi thêm sản phẩm:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng sản phẩm.' });
  }
});

// 5. Cập nhật sản phẩm
router.put('/:id', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, sku, image_url } = req.body;

  try {
    // Kiểm tra xem sản phẩm có thuộc shop của user này không
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa sản phẩm này.' });
    }
    const shopId = shops[0].id;

    const [products] = await db.query('SELECT id FROM products WHERE id = ? AND shop_id = ?', [id, shopId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong shop của bạn.' });
    }

    await db.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, stock = ?, sku = ?, image_url = ?
       WHERE id = ?`,
      [name, description, price, stock, sku, image_url, id]
    );

    res.json({ message: 'Cập nhật sản phẩm thành công!' });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật sản phẩm.' });
  }
});

// 6. Xóa sản phẩm
router.delete('/:id', authenticateToken, requireRole(['c2c_seller', 'b2c_seller']), async (req, res) => {
  const { id } = req.params;

  try {
    // Kiểm tra xem sản phẩm có thuộc shop của user này không
    const [shops] = await db.query('SELECT id FROM shops WHERE user_id = ?', [req.user.id]);
    if (shops.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này.' });
    }
    const shopId = shops[0].id;

    const [products] = await db.query('SELECT id FROM products WHERE id = ? AND shop_id = ?', [id, shopId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong shop của bạn.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Xóa sản phẩm thành công!' });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
