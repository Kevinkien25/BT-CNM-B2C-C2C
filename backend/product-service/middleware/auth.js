const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'c2c_b2c_platform_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ.' });
    }
    req.user = user;
    next();
  });
}

const db = require('../db');

function requireRole(roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực.' });
    }
    try {
      const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }
      const currentRole = users[0].role;
      if (!roles.includes(currentRole)) {
        return res.status(403).json({ message: 'Không có quyền truy cập.' });
      }
      req.user.role = currentRole;
      next();
    } catch (err) {
      console.error("Lỗi xác thực quyền hạn:", err);
      return res.status(500).json({ message: 'Lỗi hệ thống khi xác thực quyền hạn.' });
    }
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
