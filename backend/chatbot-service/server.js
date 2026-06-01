const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const db = require('./db');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = 5004;

app.use(cors());
app.use(express.json());

// Initialize Gemini AI
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error("Failed to initialize Google Generative AI client:", err.message);
  }
}

// ---------------- MongoDB Schemas ----------------
const AnalyticsLogSchema = new mongoose.Schema({
  userId: String,
  action: String, // 'view', 'search', 'buy'
  metadata: mongoose.Schema.Types.Mixed, // e.g. { productId, category, keyword }
  timestamp: { type: Date, default: Date.now }
});
const AnalyticsLog = mongoose.models.AnalyticsLog || mongoose.model('AnalyticsLog', AnalyticsLogSchema);

// In-memory fallbacks for Analytics
let memoryAnalyticsLogs = [];

// Helper functions for fallbacks
function addAnalyticsLog(userId, action, metadata) {
  const log = { userId: userId ? String(userId) : 'anonymous', action, metadata, timestamp: new Date() };
  if (db.isMongoAvailable()) {
    const mongoLog = new AnalyticsLog(log);
    mongoLog.save().catch(err => console.error("Error saving log to Mongo:", err.message));
  } else {
    memoryAnalyticsLogs.push(log);
    // Keep log array size bounded in memory
    if (memoryAnalyticsLogs.length > 1000) {
      memoryAnalyticsLogs.shift();
    }
  }
}

// ---------------- E-Commerce Assistant Knowledge & Rules ----------------
const CHATBOT_RULES = [
  {
    keywords: ['ví', 'nạp tiền', 'rút tiền', 'wallet', 'deposit', 'withdraw', 'số dư'],
    response_vi: 'Hệ thống hỗ trợ ví điện tử nội bộ. Bạn có thể nạp tiền (nhấp nút "Nạp tiền" tại trang Ví), thanh toán đơn hàng bằng số dư ví, hoặc rút tiền về tài khoản ngân hàng (nhập số tài khoản, tên ngân hàng và số tiền mong muốn).',
    response_en: 'The system supports an internal e-wallet. You can deposit money (click "Deposit" on the Wallet page), pay for orders using your balance, or withdraw money to your bank account by entering your account number, bank name, and desired amount.'
  },
  {
    keywords: ['đổi trả', 'hoàn tiền', 'khiếu nại', 'tranh chấp', 'refund', 'dispute', 'return'],
    response_vi: 'Chính sách bảo vệ người mua đảm bảo số tiền thanh toán được sàn giữ an toàn. Nếu sản phẩm lỗi hoặc không đúng mô tả, bạn có thể gửi yêu cầu "Khiếu nại/Hoàn trả" trong mục chi tiết đơn hàng. Ban quản trị (Admin) sẽ làm trọng tài phân giải và hoàn tiền hoặc giải ngân cho người bán.',
    response_en: 'Our Buyer Protection policy secures payments until receipt. If a product is defective or not as described, you can submit a "Dispute/Refund" request in the order details. The Admin will act as arbiter to refund your wallet or release funds to the seller.'
  },
  {
    keywords: ['vận chuyển', 'giao hàng', 'ship', 'ghn', 'ghtk', 'viettelpost', 'delivery'],
    response_vi: 'Hệ thống tích hợp giả lập API vận chuyển (GHN, GHTK, Viettel Post) với tính năng hỗ trợ giao hàng quốc tế. Phí vận chuyển được tính tự động dựa trên khoảng cách và cân nặng sản phẩm.',
    response_en: 'The system integrates shipping partner API simulations (GHN, GHTK, Viettel Post) with international shipping options. Shipping fees are calculated automatically based on distance and product weight.'
  },
  {
    keywords: ['b2c', 'c2c', 'mall', 'nâng cấp', 'cá nhân', 'doanh nghiệp', 'upgrade', 'tax'],
    response_vi: 'Tài khoản người bán được chia thành C2C (cá nhân, đăng ký bán tự động duyệt) và B2C (doanh nghiệp, cần điền Mã số thuế và được Admin phê duyệt để có nhãn hiệu Mall chính hãng kèm % hoa hồng dịch vụ tương ứng).',
    response_en: 'Seller accounts are split into C2C (individuals, auto-approved) and B2C (businesses, requiring Tax Code input and Admin approval to gain the official Mall badge and custom commission structures).'
  }
];

// Helper to get fallback chat response based on user message
function getFallbackResponse(message) {
  const msgLower = message.toLowerCase();
  for (const rule of CHATBOT_RULES) {
    if (rule.keywords.some(kw => msgLower.includes(kw))) {
      return `${rule.response_vi}\n\n*(English)*: ${rule.response_en}`;
    }
  }

  return `Chào bạn! Tôi là Trợ lý AI của hệ thống thương mại điện tử C2C/B2C. Tôi có thể giúp gì cho bạn?\n` +
         `- Hỏi về ví điện tử nội bộ, nạp/rút tiền.\n` +
         `- Hỏi về chính sách đổi trả, tranh chấp đơn hàng.\n` +
         `- Hỏi về phân loại người bán C2C và B2C Mall.\n` +
         `- Hỏi về giao hàng, phí vận chuyển.\n\n` +
         `*(English)*:\n` +
         `Hello! I am the AI Assistant for this C2C/B2C e-commerce platform. How can I help you today? You can ask about internal wallets, returns/disputes, B2C/C2C accounts, or shipping options.`;
}

// ---------------- API Routes ----------------

// Health Check
app.get('/api/chatbot/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Chatbot & Analytics Service', mongoActive: db.isMongoAvailable() });
});

// Endpoint: POST /api/chatbot - Ask Chatbot AI
app.post('/api/chatbot', async (req, res) => {
  const { message, history, userId } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Vui lòng cung cấp nội dung tin nhắn.' });
  }

  // Log action for analytics
  addAnalyticsLog(userId, 'search', { keyword: message, origin: 'chatbot' });

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Structure system prompt and history
      const systemInstruction = 
        `Bạn là trợ lý AI (chatbot) thông minh và thân thiện của hệ thống thương mại điện tử C2C và B2C song ngữ.\n` +
        `Nhiệm vụ của bạn là tư vấn sản phẩm, giải đáp thắc mắc về đơn hàng, ví tiền, chính sách thanh toán bảo đảm, khiếu nại hoàn trả, đăng ký shop Mall B2C, và phí vận chuyển quốc tế.\n` +
        `Trả lời bằng ngôn ngữ người dùng hỏi (Tiếng Việt hoặc Tiếng Anh). Nếu người dùng dùng tiếng Việt, trả lời bằng tiếng Việt lịch sự, chi tiết.`;

      const prompt = `${systemInstruction}\n\nLịch sử chat:\n${
        (history || []).map(h => `${h.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${h.text}`).join('\n')
      }\n\nNgười dùng hỏi: ${message}\nTrợ lý trả lời:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        return res.json({ reply: text });
      }
    } catch (error) {
      console.warn("Gemini API invocation failed in Chatbot Service. Falling back:", error.message);
    }
  }

  // Return intelligent rules-based fallback
  const reply = getFallbackResponse(message);
  res.json({ reply });
});

// Endpoint: POST /api/analytics/logs - Collect User Actions
app.post('/api/analytics/logs', async (req, res) => {
  const { user_id, action, metadata } = req.body;
  if (!action) {
    return res.status(400).json({ message: 'Action is required.' });
  }

  addAnalyticsLog(user_id, action, metadata);
  res.json({ success: true, message: 'Analytics log stored.' });
});

// Endpoint: GET /api/analytics/recommendations - Predictive Shopping Recommendations
app.get('/api/analytics/recommendations', async (req, res) => {
  const { user_id } = req.query;
  const uid = user_id ? String(user_id) : null;

  try {
    let userLogs = [];
    if (db.isMongoAvailable()) {
      if (uid) {
        userLogs = await AnalyticsLog.find({ userId: uid }).sort({ timestamp: -1 }).limit(20);
      }
      if (userLogs.length === 0) {
        userLogs = await AnalyticsLog.find({}).sort({ timestamp: -1 }).limit(100);
      }
    } else {
      if (uid) {
        userLogs = memoryAnalyticsLogs.filter(l => l.userId === uid);
      }
      if (userLogs.length === 0) {
        userLogs = memoryAnalyticsLogs;
      }
    }

    // Analyze interest
    let keywordHits = {};
    let categoryHits = {};
    let isMallInterested = false;

    userLogs.forEach(log => {
      const meta = log.metadata || {};
      if (meta.category) {
        categoryHits[meta.category] = (categoryHits[meta.category] || 0) + 1;
      }
      if (meta.keyword) {
        const kw = String(meta.keyword).toLowerCase().trim();
        keywordHits[kw] = (keywordHits[kw] || 0) + 1;
      }
      if (meta.isMall || meta.is_mall) {
        isMallInterested = true;
      }
    });

    // Find top preferred categories or keywords
    const sortedCategories = Object.keys(categoryHits).sort((a, b) => categoryHits[b] - categoryHits[a]);
    const sortedKeywords = Object.keys(keywordHits).sort((a, b) => keywordHits[b] - keywordHits[a]);

    // Return recommendation parameters for product query
    res.json({
      success: true,
      recommendations: {
        preferredCategories: sortedCategories,
        preferredKeywords: sortedKeywords,
        isMallInterested,
        reason: sortedCategories.length > 0 
          ? `Gợi ý dựa trên sự quan tâm của bạn với danh mục: ${sortedCategories[0]}`
          : "Gợi ý sản phẩm nổi bật dựa trên xu hướng hệ thống"
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi phân tích gợi ý mua sắm.', error: err.message });
  }
});

async function start() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`Chatbot & Analytics Service is running on port ${PORT}`);
  });
}
start();
