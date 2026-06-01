const bcrypt = require('bcryptjs');
const db = require('./db');

async function seedData() {
  try {
    // Check if users table already has data
    const [users] = await db.query('SELECT COUNT(*) AS total FROM users');
    if (users[0].total > 0) {
      console.log("Database already has data. Skipping seed.");
      return;
    }

    console.log("Seeding initial database data...");

    // 1. Create passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const buyerPass = await bcrypt.hash('buyer123', 10);
    const c2cPass = await bcrypt.hash('seller123', 10);
    const b2cPass = await bcrypt.hash('business123', 10);

    // 2. Insert Users
    const [resAdmin] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Admin Hệ Thống', 'admin@test.com', adminPass, 'admin', 'active']
    );

    const [resBuyer] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Nguyễn Văn Mua', 'buyer@test.com', buyerPass, 'buyer', 'active']
    );

    const [resC2C] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Trần Văn Bán C2C', 'seller_c2c@test.com', c2cPass, 'c2c_seller', 'active']
    );

    const [resB2C] = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Doanh Nghiệp B2C', 'business_b2c@test.com', b2cPass, 'b2c_seller', 'active']
    );

    const c2cUserId = resC2C.insertId;
    const b2cUserId = resB2C.insertId;

    // 3. Insert Shops
    // Individual C2C shop: auto-approved (is_approved = 1)
    const [resC2CShop] = await db.query(
      'INSERT INTO shops (user_id, shop_name, shop_type, address, phone, tax_code, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c2cUserId, 'Cửa Hàng Đồ Cũ Tèo', 'individual', '123 Đường Láng, Đống Đa, Hà Nội', '0912345678', null, 1]
    );

    // Business B2C shop: requires admin approval (is_approved = 0 initially to demo approval flow!)
    const [resB2CShop] = await db.query(
      'INSERT INTO shops (user_id, shop_name, shop_type, address, phone, tax_code, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [b2cUserId, 'Apple Authorized Reseller VN', 'business', '456 Lê Lợi, Quận 1, TP. HCM', '19001508', '0102030405', 0]
    );

    const c2cShopId = resC2CShop.insertId;
    const b2cShopId = resB2CShop.insertId;

    // 4. Insert Products
    // C2C Products
    await db.query(
      `INSERT INTO products (shop_id, name, description, price, stock, sku, is_mall, image_url) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c2cShopId, 'Điện thoại iPhone 11 64GB Cũ', 'Máy cũ qua sử dụng còn đẹp 95%, pin 82%. Bản quốc tế, mọi chức năng hoạt động hoàn hảo. Phụ kiện đi kèm gồm cáp sạc.', 5200000, 3, 'IP11-64G-USED', 0, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60',
        c2cShopId, 'Tai nghe Sony WH-1000XM4 Like New', 'Tai nghe chụp tai Sony XM4 chống ồn chủ động đỉnh cao, mới 99% không vết trầy xước. Pin nghe liên tục 30 tiếng, chất âm đỉnh cao.', 4200000, 1, 'SONY-XM4-USED', 0, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60'
      ]
    );

    // B2C Products (Initially is_mall = 0 since B2C shop is not approved yet!)
    await db.query(
      `INSERT INTO products (shop_id, name, description, price, stock, sku, is_mall, image_url) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b2cShopId, 'iPhone 15 Pro Max 256GB Chính Hãng VN/A', 'Điện thoại thông minh cao cấp thế hệ mới nhất của Apple với khung viền Titanium siêu bền nhẹ, nút Action mới và hệ thống camera zoom quang học 5x đẳng cấp.', 29490000, 15, 'IP15PM-256G', 0, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60',
        b2cShopId, 'MacBook Air 13-inch M2 (8GB RAM / 256GB SSD)', 'Mẫu máy tính xách tay siêu mỏng nhẹ trang bị chip Apple M2 mạnh mẽ, màn hình Liquid Retina sắc nét và thời lượng pin lên đến 18 giờ liên tục.', 24890000, 10, 'MBAIR-M2-256G', 0, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60'
      ]
    );

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

module.exports = {
  seedData
};

if (require.main === module) {
  (async () => {
    await db.initDB();
    await seedData();
    process.exit(0);
  })();
}
