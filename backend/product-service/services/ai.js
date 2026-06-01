const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error("Failed to initialize Google Generative AI client:", err.message);
  }
}

async function generateProductDescription(productName, category = '') {
  const prompt = `Bạn là chuyên gia marketing. Hãy viết một mô tả sản phẩm chi tiết, hấp dẫn và chuẩn SEO cho sản phẩm thương mại điện tử sau:
Tên sản phẩm: "${productName}"
${category ? `Danh mục: "${category}"` : ''}

Yêu cầu nội dung:
1. Nêu bật các ưu điểm vượt trội và công dụng của sản phẩm.
2. Cung cấp thông số kỹ thuật/chất liệu chi tiết (nếu có).
3. Đưa ra hướng dẫn sử dụng và bảo quản.
4. Viết bằng tiếng Việt, giọng điệu chuyên nghiệp, cuốn hút người mua.`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) return text;
    } catch (error) {
      console.warn("Gemini API error, falling back to mock generator:", error.message);
    }
  }

  return generateMockDescription(productName, category);
}

function generateMockDescription(productName, category) {
  const cleanName = productName.trim();
  const dateStr = new Date().toLocaleDateString('vi-VN');
  
  return `### Giới thiệu sản phẩm: **${cleanName}**

Chào mừng bạn đến với sản phẩm **${cleanName}** - sự lựa chọn hoàn hảo mang lại trải nghiệm tuyệt vời cho cuộc sống hiện đại. Được sản xuất dựa trên công nghệ tiên tiến và quy trình kiểm duyệt chất lượng nghiêm ngặt, sản phẩm tự hào đem lại giá trị vượt trội và độ bền cao cho khách hàng.

---

### 🌟 Các Điểm Nổi Bật của Sản Phẩm

- **Thiết kế tối giản & hiện đại:** Phù hợp với mọi không gian và phong cách sống của bạn.
- **Chất liệu cao cấp:** Đảm bảo độ bền bỉ, an toàn tuyệt đối khi sử dụng lâu dài.
- **Hiệu năng xuất sắc:** Tối ưu hóa tính năng sử dụng, giải quyết triệt để nhu cầu của người dùng.
- **Thân thiện với môi trường:** Quy trình sản xuất xanh, giảm thiểu rác thải.

---

### 🛠️ Thông Số Kỹ Thuật Chi Tiết

- **Tên sản phẩm:** ${cleanName}
- **Danh mục:** ${category || 'Thương mại Điện tử Tổng hợp'}
- **Công nghệ tích hợp:** Tiêu chuẩn Quốc Tế ISO-9001
- **Xuất xứ:** Hàng chính hãng phân phối toàn quốc
- **Tình trạng:** Mới 100% nguyên hộp kèm bảo hành

---

### 📖 Hướng Dẫn Sử Dụng & Bảo Quản

1. **Sử dụng:** Đọc kỹ hướng dẫn sử dụng kèm theo trong hộp sản phẩm trước khi khởi động.
2. **Bảo quản:** Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ quá cao.
3. **Vệ sinh:** Lau nhẹ bằng khăn mềm khô sau khi sử dụng để giữ độ mới của sản phẩm.

---

### 🛡️ Chính Sách Bảo Hành & Cam Kết

- **Cam kết:** Sản phẩm y hình, giống mô tả 100%.
- **Bảo hành:** Đổi trả miễn phí trong vòng 7 ngày đầu nếu có lỗi kỹ thuật từ nhà sản xuất.
- **Đóng gói:** Sản phẩm được bọc bong bóng chống sốc cẩn thận khi vận chuyển.
- **Cập nhật ngày:** ${dateStr} (Phiên bản SEO bởi AI Trợ lý Bán hàng)`;
}

module.exports = {
  generateProductDescription
};
