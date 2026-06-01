"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminDashboard() {
  const { user, token, backendUrl, loading: authLoading } = useApp();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Active Tab: 'reports' | 'shops' | 'disputes' | 'users' | 'categories' | 'products' | 'vouchers' | 'fees_shipping' | 'banner_seo'
  const [activeTab, setActiveTab] = useState('reports');

  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shop detailed verification popup
  const [detailShop, setDetailShop] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Dispute resolution inputs
  const [resNotes, setResNotes] = useState({});

  // Tab 4: Categories & Platform Commission
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCommission, setNewCatCommission] = useState('3.0');
  const [newCatRules, setNewCatRules] = useState('');

  // Tab 7: System Vouchers
  const [vouchers, setVouchers] = useState([]);
  const [newVouchCode, setNewVouchCode] = useState('');
  const [newVouchDiscount, setNewVouchDiscount] = useState('50000');
  const [newVouchMinSpend, setNewVouchMinSpend] = useState('200000');
  const [newVouchEvent, setNewVouchEvent] = useState('Tết');
  const [newVouchExpiry, setNewVouchExpiry] = useState('2026-12-31');

  // Tab 8 & 10: Fees & Partners Configuration
  const [feesConfig, setFeesConfig] = useState({
    shippingFee: 30000,
    c2cCommission: 1.5,
    b2cCommission: 3.5,
    paymentProcessingFee: 1.0,
    partners: [
      { id: 'ghn', name: 'Giao Hàng Nhanh (GHN)', active: true, contract: 'GHN-CORP-9883', successRate: 98.4 },
      { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm (GHTK)', active: true, contract: 'GHTK-CORP-0112', successRate: 97.9 },
      { id: 'viettel', name: 'Viettel Post', active: false, contract: 'VTP-CORP-4530', successRate: 96.5 }
    ]
  });

  // Tab 9: Banners & SEO & Sitemap
  const [banners, setBanners] = useState([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerDesc, setNewBannerDesc] = useState('');
  const [newBannerBg, setNewBannerBg] = useState('bg-gradient-to-r from-red-600 to-red-800');
  const [newBannerImg, setNewBannerImg] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80');

  const [seo, setSeo] = useState({
    title: 'RedMall - Sàn thương mại điện tử C2C & B2C',
    description: 'Mua bán trao đổi đồ cũ C2C an toàn cùng hệ thống gian hàng chính hãng B2C tích hợp AI mô tả sản phẩm thông minh.',
    keywords: 'redmall, c2c ecommerce, b2c mall, ai product writer, secure wallet'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      setError(language === 'vi' ? "Bạn không có quyền truy cập trang quản trị." : "You do not have permission to access the admin portal.");
      setLoading(false);
      return;
    }

    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [token, user, activeTab, authLoading]);

  // Load configuration details from LocalStorage on mount
  useEffect(() => {
    // Categories
    const storedCats = localStorage.getItem('system_categories');
    if (storedCats) {
      setCategories(JSON.parse(storedCats));
    } else {
      const defaults = [
        { id: 1, name: 'Điện thoại & Tablet', commission: 2.5, rules: 'Hàng điện tử có bảo chứng, tỷ lệ lỗi thấp.' },
        { id: 2, name: 'Laptop & Thiết bị', commission: 3.0, rules: 'Giá trị cao, yêu cầu đóng gói cẩn thận.' },
        { id: 3, name: 'Thời trang & May mặc', commission: 5.0, rules: 'Hàng may mặc C2C thanh lý, không tính phí đổi trả.' },
        { id: 4, name: 'Gia dụng & Đời sống', commission: 4.0, rules: 'Sản phẩm tiêu dùng thường nhật.' }
      ];
      setCategories(defaults);
      localStorage.setItem('system_categories', JSON.stringify(defaults));
    }

    // Vouchers
    const storedVouchers = localStorage.getItem('system_vouchers');
    if (storedVouchers) {
      setVouchers(JSON.parse(storedVouchers));
    } else {
      const defaults = [
        { id: 'v1', code: 'REDMALLTET', discount_amount: 50000, min_spend: 200000, event: 'Tết', expiry: '2026-03-01', active: true },
        { id: 'v2', code: 'GIAM30K', discount_amount: 30000, min_spend: 150000, event: '9.9 Sale', expiry: '2026-09-30', active: true },
        { id: 'v3', code: 'FREESHIP11', discount_amount: 30000, min_spend: 100000, event: '11.11 Event', expiry: '2026-11-30', active: true }
      ];
      setVouchers(defaults);
      localStorage.setItem('system_vouchers', JSON.stringify(defaults));
    }

    // Fees Config
    const storedFees = localStorage.getItem('system_fees_shipping');
    if (storedFees) {
      setFeesConfig(JSON.parse(storedFees));
    } else {
      localStorage.setItem('system_fees_shipping', JSON.stringify(feesConfig));
    }

    // Banners
    const storedBanners = localStorage.getItem('system_banners');
    if (storedBanners) {
      setBanners(JSON.parse(storedBanners));
    } else {
      const defaults = [
        {
          title: "HỘI CHỢ MUA BÁN C2C - ĐỒ CŨ GIÁ TỐT",
          description: "Thanh lý đồ cũ nhanh chóng, mua sắm thả ga với cơ chế giữ tiền an toàn tuyệt đối.",
          bg: "bg-gradient-to-r from-red-600 to-red-800",
          image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80"
        },
        {
          title: "GIAN HÀNG CHÍNH HÃNG B2C - RED MALL",
          description: "Mua sắm thiết bị công nghệ chính hãng từ doanh nghiệp uy tín, bảo hành chuẩn hãng.",
          bg: "bg-gradient-to-r from-gray-800 to-red-950",
          image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80"
        },
        {
          title: "TỰ ĐỘNG VIẾT MÔ TẢ BẰNG GEMINI AI",
          description: "Người bán C2C chỉ cần nhập tên sản phẩm, AI sẽ soạn thảo bài đăng hấp dẫn và chuẩn SEO.",
          bg: "bg-gradient-to-r from-red-500 to-pink-700",
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
        }
      ];
      setBanners(defaults);
      localStorage.setItem('system_banners', JSON.stringify(defaults));
    }

    // SEO
    const storedSeo = localStorage.getItem('system_seo');
    if (storedSeo) {
      setSeo(JSON.parse(storedSeo));
    } else {
      localStorage.setItem('system_seo', JSON.stringify(seo));
    }
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch System Stats
      const statsRes = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats || { users: 5, shops: 2, products: 4, escrow_funds: 5200000, released_funds: 2500000 });

      // 2. Fetch specific tab items
      if (activeTab === 'shops') {
        const shopsRes = await fetch(`${backendUrl}/api/admin/shops`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const shopsData = await shopsRes.json();
        setShops(shopsData.shops || []);
      } else if (activeTab === 'disputes') {
        const disputesRes = await fetch(`${backendUrl}/api/orders/admin/disputes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const disputesData = await disputesRes.json();
        setDisputes(disputesData.disputes || []);
      } else if (activeTab === 'users') {
        const usersRes = await fetch(`${backendUrl}/api/auth/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        setUsersList(usersData.users || []);
      } else if (activeTab === 'products') {
        const productsRes = await fetch(`${backendUrl}/api/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const productsData = await productsRes.json();
        setProductsList(productsData.products || []);
      }
    } catch (err) {
      console.warn("Using mock API callbacks in admin panel.");
      // Standard local mock setups
      setStats({
        users: 7,
        shops: 3,
        products: 8,
        escrow_funds: 5200000,
        released_funds: 23640000,
        refunded_funds: 7800000
      });
      setShops([
        { id: 1, shop_name: 'Cửa Hàng Đồ Cũ Tèo', shop_type: 'individual', tax_code: null, is_approved: 1, address: '123 Đường Láng, Hà Nội', phone: '0912345678', owner_name: 'Trần Văn Bán C2C', owner_email: 'seller_c2c@test.com' },
        { id: 2, shop_name: 'Apple Authorized Reseller VN', shop_type: 'business', tax_code: '0102030405', is_approved: 1, address: '456 Lê Lợi, TP. HCM', phone: '19001508', owner_name: 'Doanh Nghiệp B2C', owner_email: 'business_b2c@test.com' },
        { id: 3, shop_name: 'Samsung Flagship Mall', shop_type: 'business', tax_code: '0315488691', is_approved: 0, address: '78 Nguyễn Huệ, Quận 1, TP. HCM', phone: '028382216', owner_name: 'Đào Trung Kiên', owner_email: 'kevinkien2500@gmail.com' }
      ]);
      setDisputes([
        { id: 1, order_id: 3, buyer_name: 'Nguyễn Văn Mua', reason: 'ko muốn mua hàng nữa', total_amount: 7800000, status: 'resolved', resolution: 'tụi tui đã đàm phán bên kia nên chúng tui sẽ hoàn trả lại', created_at: new Date().toISOString() }
      ]);
      setUsersList([
        { id: 1, name: 'Admin Hệ Thống', email: 'admin@test.com', role: 'admin', status: 'active', created_at: new Date().toISOString() },
        { id: 2, name: 'Nguyễn Văn Mua', email: 'buyer@test.com', role: 'buyer', status: 'active', created_at: new Date().toISOString() },
        { id: 3, name: 'Trần Văn Bán C2C', email: 'seller_c2c@test.com', role: 'c2c_seller', status: 'active', created_at: new Date().toISOString() },
        { id: 4, name: 'Doanh Nghiệp B2C', email: 'business_b2c@test.com', role: 'b2c_seller', status: 'active', created_at: new Date().toISOString() },
        { id: 5, name: 'đào trung kien', email: 'kevinkien2500@gmail.com', role: 'c2c_seller', status: 'active', created_at: new Date().toISOString() }
      ]);
      setProductsList([
        { id: 1, name: 'Điện thoại iPhone 11 64GB Cũ', shop_name: 'Cửa Hàng Đồ Cũ Tèo', price: 5200000, stock: 2, is_mall: 0, owner_email: 'seller_c2c@test.com' },
        { id: 3, name: 'iPhone 15 Pro Max 256GB Chính Hãng', shop_name: 'Apple Authorized Reseller VN', price: 29490000, stock: 14, is_mall: 1, owner_email: 'business_b2c@test.com' },
        { id: 5, name: 'Samsung M14', shop_name: 'Cửa Hàng Đồ Cũ Tèo', price: 5600000, stock: 10, is_mall: 0, owner_email: 'seller_c2c@test.com' },
        { id: 7, name: 'Samsung-ZFold5', shop_name: 'Apple Authorized Reseller VN', price: 16500000, stock: 9, is_mall: 1, owner_email: 'business_b2c@test.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Phê duyệt / Từ chối Shop B2C & C2C
  const handleDecideShop = async (shopId, action) => {
    if (action === 'reject' && !rejectReason.trim()) {
      alert(language === 'vi' ? "Vui lòng nhập lý do từ chối phê duyệt." : "Please enter the rejection reason.");
      return;
    }

    const confirmMsg = action === 'approve'
      ? (language === 'vi' ? "Bạn đồng ý phê duyệt cửa hàng này?" : "Do you agree to approve this shop?")
      : (language === 'vi' ? "Bạn đồng ý từ chối phê duyệt cửa hàng này?" : "Are you sure you want to reject this shop?");
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${backendUrl}/api/shop/admin/${shopId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, reject_reason: rejectReason })
      });
      if (!res.ok) throw new Error();
      alert(action === 'approve'
        ? (language === 'vi' ? "Đã phê duyệt cửa hàng thành công!" : "Shop approved successfully!")
        : (language === 'vi' ? "Đã từ chối phê duyệt cửa hàng thành công!" : "Shop rejected successfully!")
      );
      setDetailShop(null);
      setRejectReason('');
      fetchAdminData();
    } catch (err) {
      alert("Xử lý thành công! (Mock Response)");
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, is_approved: action === 'approve' ? 1 : 2, reject_reason: action === 'reject' ? rejectReason : null } : s));
      setDetailShop(null);
      setRejectReason('');
    }
  };

  // Resolve disputes
  const handleResolveDispute = async (disputeId, action) => {
    const notes = resNotes[disputeId] || '';
    if (!notes.trim()) {
      alert(language === 'vi' ? "Vui lòng nhập lý do quyết định tranh chấp." : "Please enter the arbitration reason.");
      return;
    }

    const confirmMsg = language === 'vi'
      ? `Xác nhận hành động tranh chấp: ${action === 'refund' ? 'Hoàn tiền cho Buyer' : 'Giải ngân cho Seller'}?`
      : `Confirm dispute resolution: ${action === 'refund' ? 'Refund Buyer' : 'Release to Seller'}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${backendUrl}/api/orders/admin/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, resolution: notes })
      });
      if (!res.ok) throw new Error();
      alert("Đã phán quyết tranh chấp thành công!");
      fetchAdminData();
    } catch (err) {
      alert("Đã phán quyết tranh chấp thành công! (Mock Response)");
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolved', resolution: notes } : d));
    }
  };

  // Toggle user account freezing
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmMsg = language === 'vi'
      ? `Bạn muốn ${nextStatus === 'inactive' ? 'Khóa' : 'Mở khóa'} tài khoản này?`
      : `Are you sure you want to ${nextStatus === 'inactive' ? 'freeze' : 'unfreeze'} this account?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${backendUrl}/api/auth/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error();
      fetchAdminData();
    } catch (err) {
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      alert(language === 'vi' ? "Cập nhật trạng thái thành viên thành công! (Mock)" : "User status updated! (Mock)");
    }
  };

  // Tab 4: Delete/Ban a product (STT 4)
  const handleBanProduct = async (prodId, prodName) => {
    const confirmMsg = language === 'vi'
      ? `Bạn chắc chắn muốn xóa sản phẩm "${prodName}" vi phạm chính sách?`
      : `Are you sure you want to delete product "${prodName}" due to policy violation?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${backendUrl}/api/admin/products/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Đã xóa sản phẩm vi phạm!" : "Violating product deleted!");
      fetchAdminData();
    } catch (err) {
      alert("Đã xóa sản phẩm vi phạm thành công! (Chế độ Demo)");
      setProductsList(prev => prev.filter(p => p.id !== prodId));
    }
  };

  // Tab 2: Create Category (STT 2)
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat = {
      id: Date.now(),
      name: newCatName,
      commission: parseFloat(newCatCommission || 3.0),
      rules: newCatRules || 'Không áp dụng quy định đặc biệt.'
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('system_categories', JSON.stringify(updated));

    setNewCatName('');
    setNewCatRules('');
    alert(language === 'vi' ? "Thêm danh mục mới thành công!" : "Category created successfully!");
  };

  // Tab 2: Delete Category
  const handleDeleteCategory = (catId) => {
    if (!confirm(language === 'vi' ? "Xóa danh mục này?" : "Delete category?")) return;
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    localStorage.setItem('system_categories', JSON.stringify(updated));
  };

  // Tab 2: Update commission %
  const handleUpdateCatCommission = (catId, newRate) => {
    const updated = categories.map(c => c.id === catId ? { ...c, commission: parseFloat(newRate) } : c);
    setCategories(updated);
    localStorage.setItem('system_categories', JSON.stringify(updated));
  };

  // Tab 7: Create system-wide voucher (STT 7)
  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!newVouchCode.trim()) return;

    const newVouch = {
      id: `sysv_${Date.now()}`,
      code: newVouchCode.toUpperCase().trim(),
      discount_amount: parseInt(newVouchDiscount || 0),
      min_spend: parseInt(newVouchMinSpend || 0),
      event: newVouchEvent,
      expiry: newVouchExpiry || '2026-12-31',
      active: true
    };

    const updated = [...vouchers, newVouch];
    setVouchers(updated);
    localStorage.setItem('system_vouchers', JSON.stringify(updated));

    setNewVouchCode('');
    alert(language === 'vi' ? "Tạo mã giảm giá toàn sàn thành công!" : "System voucher created!");
  };

  // Tab 7: Delete system voucher
  const handleDeleteVoucher = (vId) => {
    if (!confirm(language === 'vi' ? "Xóa voucher hệ thống này?" : "Delete system voucher?")) return;
    const updated = vouchers.filter(v => v.id !== vId);
    setVouchers(updated);
    localStorage.setItem('system_vouchers', JSON.stringify(updated));
  };

  // Tab 8 & 10: Update Fees & Partners config
  const handleSaveFeesConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('system_fees_shipping', JSON.stringify(feesConfig));
    alert(language === 'vi' ? "Lưu cấu hình phí & hoa hồng thành công!" : "Fees & Commission saved!");
  };

  const handleTogglePartner = (pId) => {
    const updatedPartners = feesConfig.partners.map(p => p.id === pId ? { ...p, active: !p.active } : p);
    const updatedConfig = { ...feesConfig, partners: updatedPartners };
    setFeesConfig(updatedConfig);
    localStorage.setItem('system_fees_shipping', JSON.stringify(updatedConfig));
  };

  // Tab 9: Create Homepage Banner (STT 9)
  const handleAddBanner = (e) => {
    e.preventDefault();
    if (!newBannerTitle.trim()) return;

    const newB = {
      title: newBannerTitle,
      description: newBannerDesc,
      bg: newBannerBg,
      image: newBannerImg
    };

    const updated = [...banners, newB];
    setBanners(updated);
    localStorage.setItem('system_banners', JSON.stringify(updated));

    setNewBannerTitle('');
    setNewBannerDesc('');
    alert(language === 'vi' ? "Cập nhật Banner trang chủ thành công!" : "Homepage banner updated!");
  };

  // Tab 9: Delete Banner
  const handleDeleteBanner = (index) => {
    const updated = banners.filter((_, idx) => idx !== index);
    setBanners(updated);
    localStorage.setItem('system_banners', JSON.stringify(updated));
  };

  // Tab 9: Save SEO
  const handleSaveSEO = (e) => {
    e.preventDefault();
    localStorage.setItem('system_seo', JSON.stringify(seo));
    alert(language === 'vi' ? "Lưu thông tin thẻ SEO Meta thành công!" : "SEO configs saved!");
  };

  // Tab 9: Download Sitemap.xml (STT 9)
  const handleDownloadSitemap = () => {
    const siteUrl = window.location.origin;
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/orders</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/seller</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${categories.map(c => `  <url>
    <loc>${siteUrl}/?search=${encodeURIComponent(c.name.toLowerCase())}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

    const blob = new Blob([sitemapContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || (loading && shops.length === 0)) {
    return (
      <>
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20 space-y-4 font-sans bg-gray-50">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-semibold">{language === 'vi' ? 'Đang tải trang quản trị...' : 'Loading admin panel...'}</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-6 font-sans">
          <div className="text-5xl">🛡️</div>
          <h2 className="text-xl font-bold text-gray-800">{language === 'vi' ? 'Lỗi Truy Cập' : 'Access Denied'}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow">
            {language === 'vi' ? 'Quay lại Trang chủ' : 'Return Home'}
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow font-sans">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase border-b border-gray-150 pb-4 mb-8 flex justify-between items-center">
          <span>🛡️ {t('admin_dashboard')}</span>
          <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold">SYSTEM ADMINISTRATOR</span>
        </h1>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('active_users')}</p>
              <p className="text-xl font-black text-gray-800 mt-1">{stats.users}</p>
            </div>
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Shops</p>
              <p className="text-xl font-black text-gray-800 mt-1">{stats.shops}</p>
            </div>
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{language === 'vi' ? 'Sản phẩm' : 'Products'}</p>
              <p className="text-xl font-black text-gray-800 mt-1">{stats.products || 4}</p>
            </div>
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center bg-red-50/30 border-red-100">
              <p className="text-[10px] font-bold text-red-600 uppercase">{language === 'vi' ? 'Bảo chứng (Giữ)' : 'Protected Holdings'}</p>
              <p className="text-base font-black text-red-600 mt-1">{Number(stats.escrow_funds).toLocaleString()} đ</p>
            </div>
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center bg-green-50/30 border-green-100">
              <p className="text-[10px] font-bold text-green-600 uppercase">{language === 'vi' ? 'Đã giải ngân' : 'Released funds'}</p>
              <p className="text-base font-black text-green-600 mt-1">{Number(stats.released_funds).toLocaleString()} đ</p>
            </div>
          </div>
        )}

        {/* Layout with Side Navigation */}
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-1">
              {[
                { id: 'reports', label: language === 'vi' ? 'Báo cáo hệ thống' : 'Platform Reports', icon: '📊' },
                { id: 'shops', label: t('b2c_approval_tab'), icon: '🏪' },
                { id: 'disputes', label: t('dispute_resolution_tab'), icon: '⚖️' },
                { id: 'users', label: t('user_management_tab'), icon: '👤' },
                { id: 'categories', label: language === 'vi' ? 'Quản lý danh mục & Sàn' : 'Category & Commission', icon: '📁' },
                { id: 'products', label: language === 'vi' ? 'Quản trị sản phẩm' : 'Product Moderation', icon: '🛍️' },
                { id: 'vouchers', label: language === 'vi' ? 'Voucher toàn sàn' : 'System Vouchers', icon: '🎟️' },
                { id: 'fees_shipping', label: language === 'vi' ? 'Cấu hình Phí & Đối tác' : 'Fees & Logistics', icon: '⚙️' },
                { id: 'banner_seo', label: language === 'vi' ? 'Banner & SEO' : 'Banner & SEO Config', icon: '🌐' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="flex-grow">
            
            {/* TAB 1: REPORTS (STT 5) */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">📊 {language === 'vi' ? 'Hệ thống báo cáo & Giám sát Sàn' : 'Platform Reports & Analytics'}</h2>
                
                {/* Simulated Metrics Card Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">{language === 'vi' ? 'Tỷ lệ Chuyển đổi' : 'Conversion Rate'}</p>
                    <p className="text-2xl font-black text-gray-800">3.24%</p>
                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                      <span>▲ +0.45%</span>
                      <span className="text-gray-400 font-medium">so với tuần trước</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">{language === 'vi' ? 'Chỉ số hài lòng NPS' : 'Customer NPS'}</p>
                    <p className="text-2xl font-black text-gray-800">78 <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold">Excellent</span></p>
                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                      <span>▲ +2 điểm</span>
                      <span className="text-gray-400 font-medium">khảo sát quý trước</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">{language === 'vi' ? 'Lưu lượng truy cập (Traffic)' : 'Daily Traffic'}</p>
                    <p className="text-2xl font-black text-gray-800">142,500 <span className="text-xs font-normal text-gray-400">views</span></p>
                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                      <span>▲ +12.5%</span>
                      <span className="text-gray-400 font-medium">organic search</span>
                    </div>
                  </div>
                </div>

                {/* Graph Analytics Mock Representation */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{language === 'vi' ? 'Biểu đồ tăng trưởng GMV & Lượt xem' : 'GMV & Traffic Growth Chart'}</h3>
                      <p className="text-[10px] text-gray-400">{language === 'vi' ? 'Thống kê tổng quan sàn RedMall trong 7 ngày gần đây' : 'System Overview'}</p>
                    </div>
                    <span className="text-xs text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full">LIVE</span>
                  </div>

                  <div className="h-48 flex items-end gap-3 px-2 border-b border-gray-150 pb-2">
                    {[
                      { day: 'T2', val: '30%', views: '20k', gmv: '4.2tr' },
                      { day: 'T3', val: '45%', views: '28k', gmv: '6.0tr' },
                      { day: 'T4', val: '38%', views: '25k', gmv: '5.1tr' },
                      { day: 'T5', val: '65%', views: '40k', gmv: '8.4tr' },
                      { day: 'T6', val: '80%', views: '55k', gmv: '11.2tr' },
                      { day: 'T7', val: '95%', views: '62k', gmv: '14.5tr' },
                      { day: 'CN', val: '100%', views: '70k', gmv: '18.9tr' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex-grow flex flex-col items-center gap-2 group relative cursor-pointer">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[9px] p-2 rounded shadow opacity-0 group-hover:opacity-100 transition duration-150 z-10 text-center w-24">
                          <p className="font-bold text-yellow-400">GMV: {item.gmv}</p>
                          <p>Traffic: {item.views}</p>
                        </div>
                        {/* Bars stack */}
                        <div className="w-full bg-gray-100 rounded-t-lg h-32 flex flex-col justify-end overflow-hidden">
                          <div 
                            className="bg-red-500 hover:bg-red-600 transition-all rounded-t-lg"
                            style={{ height: item.val }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">{item.day}</span>
                      </div>
                    ))}
                  </div>

                  {/* Graph Legends */}
                  <div className="flex gap-4 items-center justify-center mt-4 text-[10px] font-bold text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded"></span>
                      <span>GMV sàn RedMall (VND)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-gray-200 rounded"></span>
                      <span>Lượt truy cập (Page Views)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHOPS APPROVAL (STT 1) */}
            {activeTab === 'shops' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">🏪 {t('b2c_approval_tab')}</h2>

                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                          <th className="p-4">{t('shop')}</th>
                          <th className="p-4">{t('shop_type')}</th>
                          <th className="p-4">{t('tax_code')}</th>
                          <th className="p-4">{t('address')}</th>
                          <th className="p-4 text-center">Trạng thái</th>
                          <th className="p-4 text-center">{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                        {shops.map((shop) => (
                          <tr key={shop.id} className="hover:bg-gray-50/50">
                            <td className="p-4">
                              <div>
                                <p className="font-bold text-gray-800">{shop.shop_name}</p>
                                <p className="text-[10px] text-gray-400">Chủ: {shop.owner_name} ({shop.owner_email})</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                shop.shop_type === 'business' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {shop.shop_type === 'business' ? 'B2C Mall' : 'C2C Shop'}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold">{shop.tax_code || 'N/A'}</td>
                            <td className="p-4 text-gray-400">{shop.address}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                shop.is_approved === 1 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : shop.is_approved === 2
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {shop.is_approved === 1 
                                  ? 'Đã phê duyệt' 
                                  : shop.is_approved === 2
                                    ? 'Đã từ chối'
                                    : 'Đang Chờ Duyệt'
                                }
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {shop.is_approved === 0 ? (
                                <button
                                  onClick={() => setDetailShop(shop)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  {language === 'vi' ? 'Kiểm duyệt' : 'Review License'}
                                </button>
                              ) : (
                                <span className="text-gray-400 italic">No action</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DISPUTES RESOLUTION */}
            {activeTab === 'disputes' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">⚖️ {t('dispute_resolution_tab')}</h2>

                <div className="space-y-4">
                  {disputes.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6 bg-white border border-gray-150 rounded-2xl">Không có khiếu nại nào cần phân xử.</p>
                  ) : (
                    disputes.map((disp) => (
                      <div key={disp.id} className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                          <div>
                            <p className="font-bold text-gray-800">{t('order_id')}: #{disp.order_id}</p>
                            <p className="text-gray-400 mt-0.5">Khách khiếu nại: {disp.buyer_name}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            disp.status === 'pending' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {disp.status}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <p className="text-gray-600"><strong>Lý do khiếu nại:</strong> "{disp.reason}"</p>
                          <p className="text-gray-600"><strong>Giá trị đơn hàng:</strong> {Number(disp.total_amount).toLocaleString()} đ</p>
                        </div>

                        {disp.status === 'pending' ? (
                          <div className="space-y-3 pt-2 border-t border-gray-100">
                            <div>
                              <label className="block text-[10px] text-gray-500 font-bold mb-1">{t('resolution_label')}</label>
                              <input
                                type="text"
                                value={resNotes[disp.id] || ''}
                                onChange={(e) => setResNotes({ ...resNotes, [disp.id]: e.target.value })}
                                placeholder="Nhập lý do phân xử để lưu lại..."
                                className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex justify-end gap-2 text-[10px] font-bold">
                              <button
                                onClick={() => handleResolveDispute(disp.id, 'refund')}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
                              >
                                {t('action_refund_buyer')}
                              </button>
                              <button
                                onClick={() => handleResolveDispute(disp.id, 'release')}
                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                              >
                                {t('action_release_seller')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-2.5 rounded-xl text-xs text-gray-500 border border-gray-150">
                            <strong>Phán quyết:</strong> {disp.resolution || 'Admin xử lý'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">👤 {t('user_management_tab')}</h2>

                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                          <th className="p-4">Hội viên</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Vai trò</th>
                          <th className="p-4 text-center">Trạng thái</th>
                          <th className="p-4 text-center">{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-800">{u.name}</td>
                            <td className="p-4 font-mono">{u.email}</td>
                            <td className="p-4">
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold capitalize">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {u.role !== 'admin' ? (
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.status)}
                                  className={`font-bold px-3 py-1 rounded-lg text-[10px] transition ${
                                    u.status === 'active' 
                                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                                  }`}
                                >
                                  {u.status === 'active' ? t('block_btn') : t('unblock_btn')}
                                </button>
                              ) : (
                                <span className="text-gray-400 italic">Protected</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CATEGORIES & Platform COMMISSION (STT 2) */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">📁 {language === 'vi' ? 'Quản lý ngành hàng & Chiết khấu Sàn' : 'Category & Commission Management'}</h2>

                {/* Add Category Form */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">🆕 {language === 'vi' ? 'Thêm ngành hàng mới' : 'Add New Category'}</h3>
                  <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{language === 'vi' ? 'Tên ngành hàng' : 'Category Name'}</label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ví dụ: Thiết bị thông minh"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{language === 'vi' ? 'Phí sàn (commission %)' : 'Commission Rate (%)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={newCatCommission}
                        onChange={(e) => setNewCatCommission(e.target.value)}
                        placeholder="3.0"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      {language === 'vi' ? 'Thêm ngành hàng' : 'Create Category'}
                    </button>
                  </form>
                </div>

                {/* Category List */}
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                          <th className="p-4">Ngành hàng (Category)</th>
                          <th className="p-4 text-center">Phí Commission Sàn (B2C & C2C)</th>
                          <th className="p-4">Quy định bán hàng</th>
                          <th className="p-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                        {categories.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-800">{c.name}</td>
                            <td className="p-4 text-center font-mono">
                              <input 
                                type="number" 
                                step="0.1" 
                                value={c.commission} 
                                onChange={(e) => handleUpdateCatCommission(c.id, e.target.value)}
                                className="w-16 border border-gray-200 text-center rounded py-1 px-1 focus:border-red-500 font-bold"
                              /> %
                            </td>
                            <td className="p-4 text-gray-400">{c.rules}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteCategory(c.id)}
                                className="text-red-600 hover:text-red-700 font-bold"
                              >
                                {language === 'vi' ? 'Xóa' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PRODUCT CONTENT MODERATION (STT 4) */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">🛍️ {language === 'vi' ? 'Kiểm duyệt Nội dung Sản phẩm' : 'Product Content Moderation'}</h2>

                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                          <th className="p-4">Sản phẩm (Product)</th>
                          <th className="p-4">Gian hàng (Shop)</th>
                          <th className="p-4">Giá bán</th>
                          <th className="p-4 text-center">Tồn kho</th>
                          <th className="p-4 text-center">Phân loại</th>
                          <th className="p-4 text-center">Kiểm soát</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                        {productsList.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-800">{p.name}</td>
                            <td className="p-4">
                              <div>
                                <p className="font-bold text-gray-700">{p.shop_name}</p>
                                <p className="text-[9px] text-gray-400">{p.owner_email}</p>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-red-600">{Number(p.price).toLocaleString()} đ</td>
                            <td className="p-4 text-center font-bold">{p.stock}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                p.is_mall === 1 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}>
                                {p.is_mall === 1 ? 'Mall chính hãng' : 'Cá nhân C2C'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleBanProduct(p.id, p.name)}
                                className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-2 py-1 rounded"
                              >
                                {language === 'vi' ? 'Gỡ/Xóa' : 'Remove/Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: VOUCHER CONFIGURATION (STT 7) */}
            {activeTab === 'vouchers' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">🎟️ {language === 'vi' ? 'Quản lý Chương trình & Mã Voucher toàn sàn' : 'Platform Promotion & System Vouchers'}</h2>

                {/* Create Voucher Form */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">🎁 {language === 'vi' ? 'Tạo chương trình khuyến mãi/Voucher toàn sàn' : 'New Platform Voucher'}</h3>
                  <form onSubmit={handleCreateVoucher} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Mã giảm giá (Code)</label>
                      <input
                        type="text"
                        required
                        value={newVouchCode}
                        onChange={(e) => setNewVouchCode(e.target.value)}
                        placeholder="REDMALLNEW"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Số tiền giảm (đ)</label>
                      <input
                        type="number"
                        required
                        value={newVouchDiscount}
                        onChange={(e) => setNewVouchDiscount(e.target.value)}
                        placeholder="50000"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Đơn tối thiểu (đ)</label>
                      <input
                        type="number"
                        required
                        value={newVouchMinSpend}
                        onChange={(e) => setNewVouchMinSpend(e.target.value)}
                        placeholder="200000"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Sự kiện (Event)</label>
                      <select 
                        value={newVouchEvent}
                        onChange={(e) => setNewVouchEvent(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none bg-white"
                      >
                        <option value="Tết">Tết Nguyên Đán</option>
                        <option value="9.9 Sale">9.9 Shopping Day</option>
                        <option value="11.11 Event">11.11 Single's Day</option>
                        <option value="Flash sale">Chương trình Flash Sale</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      {language === 'vi' ? 'Tạo mã voucher' : 'Add Voucher'}
                    </button>
                  </form>
                </div>

                {/* Vouchers List */}
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                          <th className="p-4">Mã Voucher toàn sàn</th>
                          <th className="p-4">Mức giảm giá</th>
                          <th className="p-4">Đơn tối thiểu</th>
                          <th className="p-4">Chiến dịch / Sự kiện</th>
                          <th className="p-4 text-center">Trạng thái</th>
                          <th className="p-4 text-center">Gỡ bỏ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                        {vouchers.map((v) => (
                          <tr key={v.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-800 font-mono">{v.code}</td>
                            <td className="p-4 font-bold text-red-600">-{Number(v.discount_amount).toLocaleString()} đ</td>
                            <td className="p-4 font-mono font-bold">{Number(v.min_spend).toLocaleString()} đ</td>
                            <td className="p-4 text-gray-400">{v.event}</td>
                            <td className="p-4 text-center">
                              <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                Active
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteVoucher(v.id)}
                                className="text-red-600 hover:text-red-700 font-bold"
                              >
                                {language === 'vi' ? 'Xóa' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: FEES, COMMISSION & SHIPPING CONFIGURATION (STT 8 & 10 Integrated) */}
            {activeTab === 'fees_shipping' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">⚙️ {language === 'vi' ? 'Quản lý phí dịch vụ, hoa hồng & Đối tác Logistics' : 'Fees, Platform Commission & Delivery Configuration'}</h2>

                <form onSubmit={handleSaveFeesConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Platform Fees configuration */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">💸 {language === 'vi' ? 'Cấu hình chiết khấu & Công thức phí sàn' : 'Commission & Platform Fees'}</h3>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{language === 'vi' ? 'Phí giao dịch mặc định (%)' : 'Transaction Fee (%)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={feesConfig.paymentProcessingFee}
                        onChange={(e) => setFeesConfig({ ...feesConfig, paymentProcessingFee: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xs focus:border-red-500 focus:outline-none font-mono"
                      />
                      <p className="text-[9px] text-gray-400">{language === 'vi' ? 'Áp dụng trên mỗi giao dịch ví bảo chứng (thanh toán/hoàn trả).' : 'Applies to escrow transaction billing.'}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{language === 'vi' ? 'Hoa hồng sàn cố định cho Bán lẻ C2C (%)' : 'C2C Seller Fee (%)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={feesConfig.c2cCommission}
                        onChange={(e) => setFeesConfig({ ...feesConfig, c2cCommission: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xs focus:border-red-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{language === 'vi' ? 'Hoa hồng sàn cố định cho doanh nghiệp B2C Mall (%)' : 'B2C Mall Fee (%)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={feesConfig.b2cCommission}
                        onChange={(e) => setFeesConfig({ ...feesConfig, b2cCommission: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xs focus:border-red-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">{language === 'vi' ? 'Chi phí vận chuyển đồng giá tiêu chuẩn (đ)' : 'Standard Flat Rate Shipping (VND)'}</label>
                      <input
                        type="number"
                        value={feesConfig.shippingFee}
                        onChange={(e) => setFeesConfig({ ...feesConfig, shippingFee: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xs focus:border-red-500 focus:outline-none font-mono font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      {language === 'vi' ? 'Lưu cấu hình phí' : 'Save Config'}
                    </button>
                  </div>

                  {/* Delivery API connections */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">🚚 {language === 'vi' ? 'Đối tác vận chuyển & Kết nối API' : 'Shipping Partners (API Integration)'}</h3>
                    
                    <div className="divide-y divide-gray-100">
                      {feesConfig.partners.map((partner) => (
                        <div key={partner.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{partner.name}</p>
                            <p className="text-[10px] text-gray-400">Hợp đồng: {partner.contract}</p>
                            <p className="text-[9px] text-green-600 font-bold">Tỷ lệ giao thành công: {partner.successRate}%</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              partner.active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                            }`}>
                              {partner.active ? 'Active (API on)' : 'Inactive'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTogglePartner(partner.id)}
                              className={`px-3 py-1 rounded font-bold text-[10px] ${
                                partner.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                              }`}
                            >
                              {partner.active ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 9: BANNER & SEO MANAGEMENT & SITEMAP (STT 9) */}
            {activeTab === 'banner_seo' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">🌐 {language === 'vi' ? 'Cấu hình Trang chủ, SEO & Sitemap tìm kiếm' : 'Homepage Banners, SEO Tags & Sitemap.xml'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Banners */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">🖼️ {language === 'vi' ? 'Danh sách Banner Quảng cáo' : 'Promotional Banners'}</h3>
                    
                    <form onSubmit={handleAddBanner} className="space-y-2 border-b border-gray-100 pb-4">
                      <input
                        type="text"
                        required
                        value={newBannerTitle}
                        onChange={(e) => setNewBannerTitle(e.target.value)}
                        placeholder="Tiêu đề Banner..."
                        className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newBannerDesc}
                        onChange={(e) => setNewBannerDesc(e.target.value)}
                        placeholder="Mô tả phụ..."
                        className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBannerBg}
                          onChange={(e) => setNewBannerBg(e.target.value)}
                          placeholder="Tailwind bg class..."
                          className="w-1/2 border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={newBannerImg}
                          onChange={(e) => setNewBannerImg(e.target.value)}
                          placeholder="Image URL..."
                          className="w-1/2 border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                      >
                        {language === 'vi' ? 'Thêm Banner Slider' : 'Add Banner'}
                      </button>
                    </form>

                    <div className="space-y-2 text-xs">
                      {banners.map((b, index) => (
                        <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                          <div className="truncate pr-4">
                            <p className="font-bold text-gray-800 truncate">{b.title}</p>
                            <p className="text-[10px] text-gray-400 truncate">{b.description}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteBanner(index)}
                            className="text-red-600 hover:text-red-700 font-bold"
                          >
                            {language === 'vi' ? 'Xóa' : 'Remove'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Configuration */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">🔍 {language === 'vi' ? 'Cấu hình thẻ SEO Meta' : 'SEO Meta Tags Config'}</h3>
                    
                    <form onSubmit={handleSaveSEO} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Document Title (Thẻ Title)</label>
                        <input
                          type="text"
                          value={seo.title}
                          onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Meta Description (Mô tả tìm kiếm)</label>
                        <textarea
                          value={seo.description}
                          onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                          rows="3"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">SEO Keywords (Từ khóa)</label>
                        <input
                          type="text"
                          value={seo.keywords}
                          onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                      >
                        {language === 'vi' ? 'Lưu thẻ SEO' : 'Save SEO Content'}
                      </button>
                    </form>

                    {/* Sitemap XML file generator */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <h4 className="font-bold text-xs text-gray-800">📄 {language === 'vi' ? 'Tạo tệp chỉ mục Sitemap.xml' : 'Sitemap.xml Index Generator'}</h4>
                      <p className="text-[9px] text-gray-400">Tự động quét các ngành hàng và đường dẫn sản phẩm trên hệ thống để xuất bản file sitemap hỗ trợ bot tìm kiếm Google, Bing, Yahoo.</p>
                      
                      <button
                        onClick={handleDownloadSitemap}
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition"
                      >
                        📥 {language === 'vi' ? 'Tải xuống sitemap.xml' : 'Download sitemap.xml'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* SHOP VERIFICATION MODAL DETAIL (STT 1) */}
        {detailShop && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white border border-gray-150 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">
                    🏪 {detailShop.shop_type === 'business' 
                      ? (language === 'vi' ? 'Thẩm định hồ sơ doanh nghiệp B2C Mall' : 'Verify B2C Shop Profile')
                      : (language === 'vi' ? 'Phê duyệt mở cửa hàng cá nhân C2C' : 'Verify C2C Shop Profile')
                    }
                  </h3>
                  <p className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded inline-block mt-1">
                    {detailShop.shop_type === 'business' ? 'YÊU CẦU DUYỆT GẮN NHÃN MALL' : 'YÊU CẦU DUYỆT SHOP CÁ NHÂN C2C'}
                  </p>
                </div>
                <button 
                  onClick={() => { setDetailShop(null); setRejectReason(''); }} 
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-3 text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[9px] mb-0.5">Tên doanh nghiệp / Shop</p>
                    <p className="font-bold text-gray-800 text-sm">{detailShop.shop_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[9px] mb-0.5">Mã số thuế doanh nghiệp</p>
                    <p className="font-mono font-bold text-gray-800 text-sm">{detailShop.tax_code || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[9px] mb-0.5">Người đại diện pháp luật</p>
                    <p className="font-bold text-gray-800">{detailShop.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase text-[9px] mb-0.5">Email liên hệ</p>
                    <p className="font-mono">{detailShop.owner_email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[9px] mb-0.5">Địa chỉ đăng ký kinh doanh</p>
                  <p className="font-medium text-gray-800">{detailShop.address}</p>
                </div>

                {/* Simulated Business documents (STT 1) - ONLY FOR B2C BUSINESS */}
                {detailShop.shop_type === 'business' ? (
                  <div className="pt-2 border-t border-gray-150 space-y-2">
                    <p className="text-gray-800 font-bold text-[10px] uppercase">📄 Giấy tờ pháp lý thẩm duyệt:</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">GPKD-{detailShop.tax_code || 'MALL'}.pdf</p>
                          <p className="text-[8px] text-gray-400">Giấy phép đăng ký kinh doanh</p>
                        </div>
                        <span className="text-green-600 font-bold">✓ Valid</span>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">Trademark-{detailShop.id}.pdf</p>
                          <p className="text-[8px] text-gray-400">Chứng nhận bảo hộ thương hiệu</p>
                        </div>
                        <span className="text-green-600 font-bold">✓ Valid</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-150 py-1 text-gray-400 italic">
                    {language === 'vi' 
                      ? 'ℹ️ Đăng ký cá nhân C2C không yêu cầu nộp hồ sơ pháp lý mã số thuế doanh nghiệp.'
                      : 'ℹ️ Individual C2C registration does not require tax ID verification.'
                    }
                  </div>
                )}

                {/* Stamp preview */}
                {detailShop.shop_type === 'business' ? (
                  <div className="bg-red-50/50 border border-dashed border-red-200 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-red-600 flex items-center justify-center text-[10px] font-black text-red-600 tracking-tighter shrink-0 rotate-12">
                      MALL
                    </div>
                    <div>
                      <p className="font-bold text-red-700 text-[10px]">Quyền lợi sau phê duyệt:</p>
                      <p className="text-[9px] text-gray-500">Cửa hàng sẽ được tự động đổi vai trò thành B2C Seller, gắn nhãn hiệu Mall chính hãng màu đỏ trên sản phẩm và nhận tỷ lệ vị trí hiển thị ưu tiên.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50/50 border border-dashed border-red-200 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-red-600 flex items-center justify-center text-[10px] font-black text-red-600 tracking-tighter shrink-0 rotate-12">
                      C2C
                    </div>
                    <div>
                      <p className="font-bold text-red-700 text-[10px]">Quyền lợi sau phê duyệt:</p>
                      <p className="text-[9px] text-gray-500">Người dùng sẽ được nâng cấp lên vai trò C2C Seller và kích hoạt gian hàng đăng tin mua bán tự do trên sàn RedMall.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection Input & Action Buttons */}
              <div className="pt-3 border-t border-gray-150 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">
                    {language === 'vi' ? 'Lý do từ chối (bắt buộc nếu không duyệt)' : 'Rejection Reason (required if rejecting)'}
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={language === 'vi' ? "Ví dụ: Số điện thoại không liên lạc được / Tên cửa hàng vi phạm thuần phong mỹ tục..." : "Enter rejection reason..."}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end text-xs font-bold">
                  <button
                    onClick={() => { setDetailShop(null); setRejectReason(''); }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl"
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                  <button
                    onClick={() => handleDecideShop(detailShop.id, 'reject')}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl"
                  >
                    {language === 'vi' ? 'Từ chối duyệt' : 'Reject Shop'}
                  </button>
                  <button
                    onClick={() => handleDecideShop(detailShop.id, 'approve')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                  >
                    {detailShop.shop_type === 'business' 
                      ? (language === 'vi' ? 'Phê duyệt lên B2C Mall' : 'Approve as Mall')
                      : (language === 'vi' ? 'Duyệt mở shop C2C' : 'Approve C2C Shop')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
