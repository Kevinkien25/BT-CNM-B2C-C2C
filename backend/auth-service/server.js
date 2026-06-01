const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const { authenticateToken, requireRole } = require('./middleware/auth');

const app = express();
const PORT = 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'c2c_b2c_platform_secret_key_2026';

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Auth Service' });
});

// 1. Đăng ký tài khoản
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email này đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'buyer', 'active']
    );
    const userId = result.insertId;

    // Tự động kích hoạt ví điện tử cho tài khoản mới
    await db.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, 0.00]);

    res.status(201).json({ message: 'Đăng ký thành công và đã kích hoạt ví điện tử.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký.' });
  }
});

// 2. Đăng nhập tài khoản
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
});

// 3. Lấy profile /me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Không tìm thấy user.' });
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 4. Cập nhật hồ sơ cá nhân (Buyer A15)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let updateFields = 'name = ?';
    let params = [name || req.user.name];

    if (email) {
      updateFields += ', email = ?';
      params.push(email);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateFields += ', password = ?';
      params.push(hash);
    }

    params.push(req.user.id);
    await db.query(`UPDATE users SET ${updateFields} WHERE id = ?`, params);
    res.json({ message: 'Cập nhật thông tin thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Email có thể đã tồn tại hoặc lỗi máy chủ.' });
  }
});

// 5. Ví điện tử (Wallet): Số dư và Lịch sử giao dịch (Buyer A11 / Seller B4)
app.get('/api/auth/wallet', authenticateToken, async (req, res) => {
  try {
    let [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    if (wallets.length === 0) {
      // Auto-create wallet with a default balance (0 VND)
      await db.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [req.user.id, 0.00]);
      const [newWallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
      wallets = newWallets;
    }

    const wallet = wallets[0];
    const [transactions] = await db.query(
      'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC',
      [wallet.id]
    );

    res.json({ wallet, transactions });
  } catch (error) {
    console.error("Lỗi ví:", error);
    res.status(500).json({ message: 'Lỗi ví.' });
  }
});

// Nạp tiền ví điện tử
app.post('/api/auth/wallet/deposit', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Số tiền nạp không hợp lệ.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [wallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
    const wallet = wallets[0];

    const newBalance = Number(wallet.balance) + Number(amount);
    await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);

    await conn.query(
      'INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [wallet.id, amount, 'deposit', 'Nạp tiền vào ví điện tử']
    );

    await conn.commit();
    res.json({ message: 'Nạp tiền thành công!', balance: newBalance });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Lỗi nạp tiền.' });
  } finally {
    conn.release();
  }
});

// Rút tiền về ngân hàng
app.post('/api/auth/wallet/withdraw', authenticateToken, async (req, res) => {
  const { amount, bankName, accountNo } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Số tiền rút không hợp lệ.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [wallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
    const wallet = wallets[0];

    if (Number(wallet.balance) < Number(amount)) {
      return res.status(400).json({ message: 'Số dư ví không đủ.' });
    }

    const newBalance = Number(wallet.balance) - Number(amount);
    await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);

    await conn.query(
      'INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [wallet.id, amount, 'withdraw', `Rút tiền về ngân hàng ${bankName || ''} (STK: ${accountNo || ''})`]
    );

    await conn.commit();
    res.json({ message: 'Rút tiền thành công!', balance: newBalance });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Lỗi rút tiền.' });
  } finally {
    conn.release();
  }
});

// Internal API: trừ tiền ví khi đặt hàng (Gọi từ Order Service)
app.post('/api/auth/wallet/pay-internal', async (req, res) => {
  const { user_id, amount, description } = req.body;
  
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let [wallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [user_id]);
    if (wallets.length === 0) {
      await conn.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [user_id, 0.00]); // Auto-create with default balance of 0 VND
      const [newWallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [user_id]);
      wallets = newWallets;
    }
    const wallet = wallets[0];

    if (Number(wallet.balance) < Number(amount)) {
      return res.status(400).json({ message: 'Số dư ví người mua không đủ.' });
    }

    const newBalance = Number(wallet.balance) - Number(amount);
    await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);
    await conn.query(
      'INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [wallet.id, amount, 'payment', description || 'Thanh toán đơn hàng']
    );

    await conn.commit();
    res.json({ success: true, balance: newBalance });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// Internal API: hoàn tiền / nhận tiền ví (Gọi từ Order Service)
app.post('/api/auth/wallet/refund-internal', async (req, res) => {
  const { user_id, amount, type, description } = req.body; // type: 'refund' hoặc 'receive'
  
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let [wallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [user_id]);
    if (wallets.length === 0) {
      await conn.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [user_id, 0.00]);
      const [newWallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [user_id]);
      wallets = newWallets;
    }
    const wallet = wallets[0];

    const newBalance = Number(wallet.balance) + Number(amount);
    await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);
    await conn.query(
      'INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [wallet.id, amount, type || 'refund', description || 'Hoàn tiền giao dịch']
    );

    await conn.commit();
    res.json({ success: true, balance: newBalance });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// 6. Quản lý Địa Chỉ Giao Hàng (Buyer A12)
app.get('/api/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const [addresses] = await db.query('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.id]);
    res.json({ addresses });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

app.post('/api/auth/addresses', authenticateToken, async (req, res) => {
  const { receiver_name, phone, address_detail, is_default } = req.body;
  if (!receiver_name || !phone || !address_detail) return res.status(400).json({ message: 'Vui lòng điền đủ.' });

  try {
    if (is_default === 1) {
      await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    await db.query(
      'INSERT INTO user_addresses (user_id, receiver_name, phone, address_detail, is_default) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, receiver_name, phone, address_detail, is_default || 0]
    );
    res.json({ message: 'Đã thêm địa chỉ mới.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm địa chỉ.' });
  }
});

app.put('/api/auth/addresses/:id/default', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await db.query('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Đặt mặc định thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

app.delete('/api/auth/addresses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Xóa địa chỉ thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// 7. Quản lý Admin: Khóa tài khoản / Lấy danh sách users (Admin C6)
app.get('/api/auth/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, status, created_at FROM users');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

app.put('/api/auth/admin/users/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' hoặc 'inactive'
  try {
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Cập nhật trạng thái tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi.' });
  }
});

// --- User-to-User Chat Routes (P2P Chat) ---

// 1. Send Message
app.post('/api/auth/chat/send', authenticateToken, async (req, res) => {
  const { receiverId, message } = req.body;
  if (!receiverId || !message || !message.trim()) {
    return res.status(400).json({ message: 'Vui lòng cung cấp receiverId và nội dung tin nhắn.' });
  }

  try {
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [req.user.id, Number(receiverId), message.trim()]
    );
    res.json({ success: true, message: 'Đã gửi tin nhắn thành công.' });
  } catch (err) {
    console.error("Lỗi gửi tin nhắn:", err);
    res.status(500).json({ message: 'Lỗi hệ thống khi gửi tin nhắn.' });
  }
});

// 2. Get Chat History with a Specific User
app.get('/api/auth/chat/history/:partnerId', authenticateToken, async (req, res) => {
  const { partnerId } = req.params;
  try {
    const [messages] = await db.query(
      `SELECT * FROM messages
       WHERE (sender_id = ? AND receiver_id = ?)
          OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [req.user.id, Number(partnerId), Number(partnerId), req.user.id]
    );
    res.json({ messages });
  } catch (err) {
    console.error("Lỗi lấy lịch sử chat:", err);
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy lịch sử chat.' });
  }
});

// 3. Get Chat Partners List (with last message and partner details)
app.get('/api/auth/chat/partners', authenticateToken, async (req, res) => {
  try {
    const [partners] = await db.query(
      `SELECT u.id AS partner_id, u.name AS partner_name, u.email AS partner_email, u.role AS partner_role,
              m.message AS last_message, m.created_at AS last_message_time
       FROM users u
       JOIN (
         SELECT partner_id, MAX(msg_id) AS max_msg_id
         FROM (
           SELECT id AS msg_id, receiver_id AS partner_id FROM messages WHERE sender_id = ?
           UNION
           SELECT id AS msg_id, sender_id AS partner_id FROM messages WHERE receiver_id = ?
         ) AS temp
         GROUP BY partner_id
       ) AS last_msgs ON u.id = last_msgs.partner_id
       JOIN messages m ON last_msgs.max_msg_id = m.id
       ORDER BY m.created_at DESC`,
      [req.user.id, req.user.id]
    );
    res.json({ partners });
  } catch (err) {
    console.error("Lỗi lấy danh sách đối tác chat:", err);
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách hội thoại.' });
  }
});

async function start() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`Auth Service matches port ${PORT}`);
  });
}
start();
