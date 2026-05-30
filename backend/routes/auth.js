const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'c2c_b2c_platform_secret_key_2026';

// 1. Đăng ký tài khoản
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
  }

  const validRoles = ['buyer', 'c2c_seller', 'b2c_seller', 'admin'];
  const userRole = role && validRoles.includes(role) ? role : 'buyer';

  try {
    // Kiểm tra xem email đã tồn tại chưa
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email này đã được sử dụng.' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu vào database
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, userRole, 'active']
    );

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công.',
      userId: result.insertId
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống trong quá trình đăng ký.' });
  }
});

// 2. Đăng nhập tài khoản
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ email và mật khẩu.' });
  }

  try {
    // Tìm user theo email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Lấy thông tin shop kèm theo nếu người dùng là seller
    let shop = null;
    if (user.role === 'c2c_seller' || user.role === 'b2c_seller') {
      const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [user.id]);
      if (shops.length > 0) {
        shop = shops[0];
      }
    }

    res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop
      }
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình đăng nhập.' });
  }
});

// 3. Lấy thông tin tài khoản hiện tại
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const user = users[0];
    
    // Tìm thông tin shop nếu là người bán
    let shop = null;
    if (user.role === 'c2c_seller' || user.role === 'b2c_seller') {
      const [shops] = await db.query('SELECT * FROM shops WHERE user_id = ?', [user.id]);
      if (shops.length > 0) {
        shop = shops[0];
      }
    }

    res.json({
      user: {
        ...user,
        shop
      }
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
