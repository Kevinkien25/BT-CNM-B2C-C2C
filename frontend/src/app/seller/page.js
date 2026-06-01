"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SellerDashboard() {
  const { user, token, refreshUser, backendUrl, loading: authLoading } = useApp();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Active Tab: 'products' | 'orders' | 'wallet' | 'vouchers' | 'analytics' | 'branding'
  const [activeTab, setActiveTab] = useState('products');

  // Shop registration state
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(null);

  // Products state
  const [myProducts, setMyProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product Form states
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pSku, setPSku] = useState('');
  const [pImage, setPImage] = useState('');
  const [pCategory, setPCategory] = useState('Điện thoại & Tablet');
  const [pSponsored, setPSponsored] = useState(false);
  const [pInternational, setPInternational] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

      // Incoming Orders state
      const [shopOrders, setShopOrders] = useState([]);
      const [ordLoading, setOrdLoading] = useState(false);

      // Wallet State
      const [wallet, setWallet] = useState(null);
      const [transactions, setTransactions] = useState([]);
      const [walletLoading, setWalletLoading] = useState(false);
      const [withdrawAmount, setWithdrawAmount] = useState('');
      const [bankName, setBankName] = useState('');
      const [accountNo, setAccountNo] = useState('');

      // Vouchers State
      const [vouchers, setVouchers] = useState([]);
      const [vCode, setVCode] = useState('');
      const [vDiscount, setVDiscount] = useState('');
      const [vMinOrder, setVMinOrder] = useState('');

      // Branding Banner State
      const [shopBannerUrl, setShopBannerUrl] = useState('');
      const [updatingBanner, setUpdatingBanner] = useState(false);

      // Fetch Shop Profile State & Logic
      const [shop, setShop] = useState(null);
      const [shopLoading, setShopLoading] = useState(true);

      const fetchShopProfile = async () => {
        if (!token) return;
        setShopLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/shop/my-shop`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.shop) {
            setShop(data.shop);
          } else {
            setShop(null);
          }
        } catch (err) {
          console.warn("Failed to fetch shop:", err.message);
          setShop(null);
        } finally {
          setShopLoading(false);
        }
      };

      useEffect(() => {
        if (token) {
          fetchShopProfile();
        } else {
          setShopLoading(false);
        }
      }, [token]);

      // Guard routing
      useEffect(() => {
        if (!authLoading && !token) {
          router.push('/login');
        }
      }, [token, authLoading]);

      // Load data based on tab and shop availability
      useEffect(() => {
        if (shop) {
          if (activeTab === 'products') fetchMyProducts();
          if (activeTab === 'orders') fetchShopOrders();
          if (activeTab === 'wallet') fetchWalletData();
          if (activeTab === 'vouchers') loadVouchers();
          if (activeTab === 'branding') setShopBannerUrl(shop.banner_url || '');
        }
      }, [shop, activeTab]);

      const fetchMyProducts = async () => {
        if (!shop) return;
    setProdLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/products?shop_id=${shop.id}`);
          const data = await res.json();
          setMyProducts(data.products || []);
        } catch (err) {
          console.error(err);
        } finally {
          setProdLoading(false);
        }
      };

      const fetchShopOrders = async () => {
        if (!shop) return;
        setOrdLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/orders/my-orders`); // Demo handles filtering internally or we use mock
          const data = await res.json();
          // Filter orders where product belongs to seller's shop
          const filtered = (data.orders || []).filter(ord => 
            ord.items.some(item => item.shop_name === shop.shop_name)
          );
          setShopOrders(filtered);
        } catch (err) {
          console.warn("Using mock shop orders.");
          setShopOrders([
            {
              id: 101,
              total_amount: 5200000,
              status: 'shipped',
              shipping_address: 'Nguyễn Văn Mua - 0912345678 - 123 Đường Láng, Hà Nội',
              payment_method: 'Escrow',
              shipping_partner: 'GHN',
              shipping_fee: 30000,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              items: [
                { id: 1, product_name: 'Điện thoại iPhone 11 64GB Cũ', price: 5200000, quantity: 1, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60', shop_name: shop.shop_name }
              ]
            }
          ]);
        } finally {
      setOrdLoading(false);
    }
  };

  // --- Wallet Logic ---
  const fetchWalletData = async () => {
    setWalletLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
    } catch (err) {
      setWallet({ balance: 12500000 });
      setTransactions([
        { id: 1, amount: 5200000, type: 'receive', description: 'Nhận tiền thanh toán từ đơn #101', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (Number(wallet?.balance || 0) < Number(withdrawAmount)) {
      alert("Số dư ví không đủ.");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/auth/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(withdrawAmount), bankName, accountNo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(language === 'vi' ? `Rút tiền thành công! Số dư còn lại: ${data.balance.toLocaleString()} đ` : `Withdrawal successful! Remaining balance: ${data.balance.toLocaleString()} đ`);
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
      fetchWalletData();
    } catch (err) {
      const newBal = Number(wallet?.balance || 0) - Number(withdrawAmount);
      setWallet({ balance: newBal });
      setTransactions(prev => [{ id: Date.now(), amount: Number(withdrawAmount), type: 'withdraw', description: `Rút tiền về ${bankName} (Demo)`, created_at: new Date().toISOString() }, ...prev]);
      alert("Rút tiền thành công! (Chế độ Demo)");
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
    }
  };

  // --- Vouchers State ---
  const loadVouchers = () => {
    const key = `vouchers_${shop?.id || 'default'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setVouchers(JSON.parse(stored));
    } else {
      const defaults = [
        { code: 'GIAM50K', discount: 50000, minOrder: 300000 },
        { code: 'MALLFREE', discount: 100000, minOrder: 1000000 }
      ];
      setVouchers(defaults);
      localStorage.setItem(key, JSON.stringify(defaults));
    }
  };

  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!vCode || !vDiscount) return;

    const newV = {
      code: vCode.toUpperCase().trim(),
      discount: Number(vDiscount),
      minOrder: Number(vMinOrder || 0)
    };

    const updated = [newV, ...vouchers];
    setVouchers(updated);
    localStorage.setItem(`vouchers_${shop?.id || 'default'}`, JSON.stringify(updated));
    setVCode('');
    setVDiscount('');
    setVMinOrder('');
    alert(language === 'vi' ? "Tạo mã giảm giá thành công!" : "Voucher created successfully!");
  };

  const handleDeleteVoucher = (code) => {
    const updated = vouchers.filter(v => v.code !== code);
    setVouchers(updated);
    localStorage.setItem(`vouchers_${shop?.id || 'default'}`, JSON.stringify(updated));
  };

  // --- Branding Logic ---
  const handleUpdateBanner = async (e) => {
    e.preventDefault();
    if (!shopBannerUrl) return;
    setUpdatingBanner(true);

    try {
      const res = await fetch(`${backendUrl}/api/shop/my-shop/banner`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ banner_url: shopBannerUrl })
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Cập nhật Banner thành công!" : "Banner updated successfully!");
      await fetchShopProfile();
    } catch (err) {
      alert(language === 'vi' ? "Cập nhật Banner thành công! (Chế độ Demo)" : "Banner updated! (Demo Mode)");
    } finally {
      setUpdatingBanner(false);
    }
  };

  // --- Register Shop Logic ---
  const handleRegisterShop = async (e) => {
    e.preventDefault();
    if (!shopName || !address || !phone) {
      setRegError('Vui lòng điền các thông tin bắt buộc.');
      return;
    }

    if (user?.role === 'b2c_seller' && !taxCode) {
      setRegError('Doanh nghiệp bắt buộc phải cung cấp Mã số thuế.');
      return;
    }

    setRegLoading(true);
    setRegError(null);
    try {
      const res = await fetch(`${backendUrl}/api/shop/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_name: shopName,
          address,
          phone,
          tax_code: taxCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(language === 'vi' ? "Đăng ký mở gian hàng thành công!" : "Shop registered successfully!");
      await fetchShopProfile();
    } catch (err) {
      alert(language === 'vi' ? "Đăng ký shop thành công! (Chế độ Demo)" : "Shop registered! (Demo Mode)");
      setShop({
        id: 1,
        shop_name: shopName,
        shop_type: user?.role === 'b2c_seller' ? 'business' : 'individual',
        banner_url: '',
        address,
        phone,
        tax_code: taxCode,
        is_approved: user?.role === 'b2c_seller' ? 0 : 1
      });
    } finally {
      setRegLoading(false);
    }
  };

  // --- AI Description Generator ---
  const handleGenerateAIDescription = async () => {
    if (!pName) {
      alert("Vui lòng nhập tên sản phẩm để AI viết bài mô tả.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/products/ai-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: pName, category: pCategory })
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setPDescription(data.description);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback local description
      const desc = `### ${pName}\n\nSản phẩm thuộc danh mục **${pCategory}** chất lượng cao. Thích hợp cho mọi đối tượng sử dụng.\n\n- **Đặc điểm nổi bật**: Bền bỉ, tinh tế.\n- **Bảo hành**: 12 tháng.\n- Cập nhật bởi AI Assistant.`;
      setPDescription(desc);
    } finally {
      setAiLoading(false);
    }
  };

  // --- Photo Upload Logic ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await fetch(`${backendUrl}/api/products/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPImage(data.url);
        alert(language === 'vi' ? 'Tải ảnh sản phẩm lên thành công!' : 'Product image uploaded successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setPImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60');
      alert(language === 'vi' ? 'Đã tải ảnh lên! (Chế độ Demo)' : 'Photo uploaded! (Demo Mode)');
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Create/Edit Product Logic ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!pName || !pPrice || !pStock || !pSku) return;

    const payload = {
      name: pName,
      description: pDescription,
      price: Number(pPrice),
      stock: Number(pStock),
      sku: pSku,
      image_url: pImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      is_sponsored: pSponsored ? 1 : 0,
      international_shipping: pInternational ? 1 : 0
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${backendUrl}/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${backendUrl}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error();
      alert(editingProduct ? "Cập nhật thành công!" : "Đăng bán sản phẩm thành công!");
      resetForm();
      setShowAddForm(false);
      fetchMyProducts();
    } catch (err) {
      // Demo Fallback
      const mockProduct = {
        id: editingProduct ? editingProduct.id : Date.now(),
        shop_id: shop?.id || 1,
        shop_name: shop?.shop_name || 'My Shop',
        is_mall: user?.role === 'b2c_seller' ? 1 : 0,
        ...payload
      };

      setMyProducts(prev => {
        if (editingProduct) {
          return prev.map(p => p.id === editingProduct.id ? mockProduct : p);
        } else {
          return [mockProduct, ...prev];
        }
      });
      alert(language === 'vi' ? "Đã lưu sản phẩm! (Chế độ Demo)" : "Product saved! (Demo Mode)");
      resetForm();
      setShowAddForm(false);
    }
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPDescription(prod.description || '');
    setPPrice(prod.price);
    setPStock(prod.stock);
    setPSku(prod.sku);
    setPImage(prod.image_url || '');
    setPSponsored(prod.is_sponsored === 1);
    setPInternational(prod.international_shipping === 1);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm(language === 'vi' ? "Bạn chắc chắn muốn xóa sản phẩm này?" : "Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      alert("Xóa sản phẩm thành công!");
      fetchMyProducts();
    } catch (err) {
      setMyProducts(prev => prev.filter(p => p.id !== productId));
      alert(language === 'vi' ? "Đã xóa! (Chế độ Demo)" : "Deleted! (Demo Mode)");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setPName('');
    setPDescription('');
    setPPrice('');
    setPStock('');
    setPSku('');
    setPImage('');
    setPSponsored(false);
    setPInternational(false);
  };

  // --- Order preparation / handover logic ---
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${backendUrl}/api/shop/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      alert("Cập nhật trạng thái đơn hàng thành công!");
      fetchShopOrders();
    } catch (err) {
      setShopOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status } : ord));
      alert(language === 'vi' 
        ? `Đã cập nhật trạng thái đơn hàng thành: ${status === 'processing' ? 'Đang chuẩn bị' : 'Đang giao hàng (GHN API simulated)'}`
        : `Order status updated to: ${status}`);
    }
  };

  // --- Excel / CSV Export ---
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Product,Buyer,Total Amount,Status,Carrier,Date\n";
    
    shopOrders.forEach(ord => {
      const prodNames = ord.items.map(i => i.product_name).join("; ");
      const row = `${ord.id},"${prodNames}","${ord.shipping_address.split('-')[0].trim()}",${ord.total_amount},${ord.status},${ord.shipping_partner},${ord.created_at}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${shop?.shop_name || 'shop'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow font-sans">
        {!shop ? (
          /* REGISTRATION SCREEN */
          <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">🏪</span>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{t('register_shop_btn')}</h1>
              <p className="text-sm text-gray-400">
                {user?.role === 'b2c_seller' 
                  ? 'Đăng ký gian hàng Mall doanh nghiệp chính hãng (B2C) cần phê duyệt.'
                  : 'Đăng ký gian hàng cá nhân C2C thanh lý đồ cũ (tự động kích hoạt).'}
              </p>
            </div>

            {regError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3.5 rounded-xl text-xs font-semibold">
                ⚠️ {regError}
              </div>
            )}

            <form onSubmit={handleRegisterShop} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('shop_name')} *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ví dụ: Shop Đồ Cũ An Nhiên / Samsung Mall"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              {user?.role === 'b2c_seller' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('tax_code')} *</label>
                  <input
                    type="text"
                    required
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="Mã số thuế doanh nghiệp (10 chữ số)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('phone')} *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('address')} *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số 20, Lê Lợi, Quận 1, TPHCM"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:bg-gray-200"
              >
                {regLoading ? '⏳ Đang đăng ký...' : t('register_shop_btn')}
              </button>
            </form>
          </div>
        ) : shop.shop_type === 'business' && shop.is_approved === 0 ? (
          /* PENDING APPROVAL SCREEN */
          <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-center">
            <span className="text-5xl">⏳</span>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
              {language === 'vi' ? 'Đang Chờ Phê Duyệt' : 'Awaiting Admin Approval'}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {language === 'vi' 
                ? 'Cửa hàng Mall doanh nghiệp (B2C) của bạn đang được duyệt. Ban quản trị đang xác minh Mã số thuế và thông tin doanh nghiệp.'
                : 'Your B2C Mall store profile is awaiting Admin verification and approval.'}
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs text-gray-600 space-y-2 border border-gray-100">
              <p><strong>{t('shop_name')}:</strong> {shop.shop_name}</p>
              <p><strong>{t('shop_type')}:</strong> {t('business')}</p>
              {shop.tax_code && <p><strong>{t('tax_code')}:</strong> {shop.tax_code}</p>}
              <p><strong>{t('phone')}:</strong> {shop.phone}</p>
              <p><strong>{t('address')}:</strong> {shop.address}</p>
              <p><strong>{t('shop_approved')}:</strong> <span className="text-amber-600 font-bold">{t('pending_approval')}</span></p>
            </div>

            <div className="pt-2 text-xs text-gray-400">
              {language === 'vi'
                ? '💡 Mẹo test: Bạn có thể đăng nhập tài khoản Admin (admin@test.com / admin123) để phê duyệt cửa hàng này ngay lập tức.'
                : '💡 Testing tip: You can log in to the Admin account (admin@test.com / admin123) to approve this shop instantly.'}
            </div>

            <button
              onClick={fetchShopProfile}
              className="mt-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs shadow hover:bg-red-700 transition"
            >
              🔄 {language === 'vi' ? 'Kiểm tra lại trạng thái' : 'Re-check Approval Status'}
            </button>
          </div>
        ) : (
          /* SELLER CONSOLE SCREEN */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-1">
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="font-bold text-gray-800 text-sm">{shop.shop_name}</p>
                  <p className="text-[10px] mt-0.5"><span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-bold uppercase">
                    {shop.shop_type === 'business' ? 'B2C Mall' : 'C2C Shop'}
                  </span></p>
                </div>

                {[
                  { id: 'products', label: language === 'vi' ? 'Sản phẩm của tôi' : 'My Products', icon: '📦' },
                  { id: 'orders', label: language === 'vi' ? 'Đơn hàng bán' : 'Incoming Orders', icon: '📥' },
                  { id: 'wallet', label: language === 'vi' ? 'Ví doanh thu' : 'Sales Wallet', icon: '💳' },
                  { id: 'vouchers', label: language === 'vi' ? 'Mã giảm giá shop' : 'Shop Vouchers', icon: '🎟️' },
                  { id: 'analytics', label: t('sales_report'), icon: '📈' },
                  { id: 'branding', label: language === 'vi' ? 'Trang trí Shop' : 'Shop Branding', icon: '🎨' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
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

            {/* Console Content */}
            <section className="flex-grow">
              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Quản lý sản phẩm' : 'Products Manager'}</h2>
                    <button
                      onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
                      className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow hover:bg-red-700 transition"
                    >
                      {showAddForm ? 'Cancel' : t('add_product')}
                    </button>
                  </div>

                  {showAddForm && (
                    /* ADD/EDIT FORM */
                    <form onSubmit={handleSaveProduct} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">
                        {editingProduct ? t('edit_product') : t('add_product')}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('product_name')} *</label>
                          <input
                            type="text"
                            required
                            value={pName}
                            onChange={(e) => setPName(e.target.value)}
                            placeholder="Ví dụ: iPhone 15 Pro Max 256GB"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('categories')}</label>
                          <select
                            value={pCategory}
                            onChange={(e) => setPCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none bg-white text-gray-700"
                          >
                            <option value="Điện thoại & Tablet">Điện thoại & Tablet</option>
                            <option value="Laptop & PC">Laptop & PC</option>
                            <option value="Tai nghe & Âm thanh">Tai nghe & Âm thanh</option>
                            <option value="Đo gia dung">Đồ gia dụng</option>
                            <option value="Thời trang thanh lý">Thời trang thanh lý</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('price')} (VND) *</label>
                          <input
                            type="number"
                            required
                            value={pPrice}
                            onChange={(e) => setPPrice(e.target.value)}
                            placeholder="5000000"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('stock')} *</label>
                          <input
                            type="number"
                            required
                            value={pStock}
                            onChange={(e) => setPStock(e.target.value)}
                            placeholder="5"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('sku')} *</label>
                          <input
                            type="text"
                            required
                            value={pSku}
                            onChange={(e) => setPSku(e.target.value)}
                            placeholder="IP15-256G"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('image')} *</label>
                          <div className="flex items-center gap-3">
                            <label className="flex-grow flex items-center justify-center border border-dashed border-gray-300 rounded-xl p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm font-semibold transition-colors">
                              <span>{uploadingImage ? '⏳ Loading...' : t('upload_file')}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                            </label>
                            {pImage && (
                              <div className="w-10 h-10 border border-gray-150 rounded-lg overflow-hidden relative flex-shrink-0">
                                <img src={pImage} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="sponsored"
                              checked={pSponsored}
                              onChange={(e) => setPSponsored(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-red-600"
                            />
                            <label htmlFor="sponsored" className="text-xs font-bold text-gray-600 cursor-pointer">{t('sponsored_ad')}</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="international"
                              checked={pInternational}
                              onChange={(e) => setPInternational(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-red-600"
                            />
                            <label htmlFor="international" className="text-xs font-bold text-gray-600 cursor-pointer">{t('international_shipping')}</label>
                          </div>
                        </div>
                      </div>

                      {/* Product Description */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('product_description')}</label>
                          <button
                            type="button"
                            onClick={handleGenerateAIDescription}
                            disabled={aiLoading}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1.5"
                          >
                            {aiLoading ? '🤖 Writing...' : t('ai_description_btn')}
                          </button>
                        </div>
                        <textarea
                          value={pDescription}
                          onChange={(e) => setPDescription(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:border-red-500 focus:outline-none"
                          rows={6}
                          placeholder="Mô tả chi tiết sản phẩm..."
                        />
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => { resetForm(); setShowAddForm(false); }}
                          className="bg-white border border-gray-300 text-gray-700 text-xs font-bold px-5 py-2 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {/* PRODUCTS LIST */}
                  {prodLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : myProducts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8 bg-white border border-gray-150 rounded-2xl shadow-sm">Shop chưa đăng sản phẩm nào.</p>
                  ) : (
                    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-150 bg-gray-50/50 text-gray-400 uppercase font-semibold">
                              <th className="p-4">{t('product')}</th>
                              <th className="p-4">SKU</th>
                              <th className="p-4 text-right">{t('price')}</th>
                              <th className="p-4 text-center">{t('stock')}</th>
                              <th className="p-4 text-center">Tags</th>
                              <th className="p-4 text-center">{t('action')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                            {myProducts.map((prod) => (
                              <tr key={prod.id} className="hover:bg-gray-50/30">
                                <td className="p-4 flex items-center gap-3">
                                  <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                  <span className="font-bold text-gray-800 line-clamp-1 max-w-[200px]">{prod.name}</span>
                                </td>
                                <td className="p-4 font-mono">{prod.sku}</td>
                                <td className="p-4 text-right font-bold text-sm text-red-600">{Number(prod.price).toLocaleString()} đ</td>
                                <td className="p-4 text-center font-bold text-gray-800">{prod.stock}</td>
                                <td className="p-4 text-center space-y-1 sm:space-y-0 sm:space-x-1">
                                  {prod.is_sponsored === 1 && (
                                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">AD</span>
                                  )}
                                  {prod.international_shipping === 1 && (
                                    <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">INT</span>
                                  )}
                                  {prod.is_mall === 1 && (
                                    <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">MALL</span>
                                  )}
                                </td>
                                <td className="p-4 text-center text-[10px] font-bold space-x-2">
                                  <button onClick={() => handleEditClick(prod)} className="text-blue-600 hover:underline">Edit</button>
                                  <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Quản lý đơn hàng mua' : 'Incoming Order Management'}</h2>

                  {ordLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : shopOrders.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8 bg-white border border-gray-150 rounded-2xl shadow-sm">{t('no_orders_seller')}</p>
                  ) : (
                    <div className="space-y-4">
                      {shopOrders.map((ord) => (
                        <div key={ord.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm p-4 sm:p-5 space-y-4">
                          <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                            <div>
                              <p className="font-bold text-gray-800">ĐƠN HÀNG: #{ord.id}</p>
                              <p className="text-gray-400 mt-0.5">Ngày: {new Date(ord.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              ord.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              ord.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              ord.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {ord.status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {ord.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{item.product_name} (x{item.quantity})</span>
                                <span>{Number(item.price * item.quantity).toLocaleString()} đ</span>
                              </div>
                            ))}
                          </div>

                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                            <p>📍 <strong>Buyer:</strong> {ord.shipping_address}</p>
                            <p className="font-bold text-sm text-gray-800">Doanh thu: {Number(ord.total_amount).toLocaleString()} đ</p>
                          </div>

                          {/* Action update status */}
                          {ord.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                                className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
                              >
                                {language === 'vi' ? 'Chuẩn bị hàng' : 'Prepare Order'}
                              </button>
                            </div>
                          )}
                          {ord.status === 'processing' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                                className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                              >
                                {language === 'vi' ? 'Bàn giao GHN/GHTK API' : 'Handover to Shipping API'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WALLET TAB */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Ví doanh thu người bán' : 'Seller Sales Wallet'}</h2>
                  {walletLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl p-6 shadow-md">
                        <p className="text-xs uppercase font-semibold opacity-85">{t('wallet_balance')}</p>
                        <p className="text-3xl font-black mt-1">{Number(wallet?.balance || 0).toLocaleString()} VND</p>
                      </div>

                      {/* Withdraw form */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          <span>🏦</span> {t('withdraw')}
                        </h3>
                        <form onSubmit={handleWithdraw} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 font-bold mb-1">{t('bank_name')}</label>
                              <input
                                type="text"
                                required
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Vietinbank"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 font-bold mb-1">{t('account_no')}</label>
                              <input
                                type="text"
                                required
                                value={accountNo}
                                onChange={(e) => setAccountNo(e.target.value)}
                                placeholder="102938475"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 font-bold mb-1">{t('amount')} (VND)</label>
                            <input
                              type="number"
                              required
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="1,000,000"
                              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm transition"
                          >
                            {t('withdraw')}
                          </button>
                        </form>
                      </div>

                      {/* Transaction table */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Lịch sử doanh thu</h3>
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left font-medium text-gray-700 divide-y divide-gray-100">
                            <thead>
                              <tr className="text-gray-400 font-semibold uppercase">
                                <th className="py-2">Mô tả</th>
                                <th className="py-2 text-right">Số tiền</th>
                                <th className="py-2 text-right">Ngày</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map(t => (
                                <tr key={t.id}>
                                  <td className="py-2">{t.description}</td>
                                  <td className={`py-2 text-right font-bold ${['deposit', 'receive'].includes(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                                    {['deposit', 'receive'].includes(t.type) ? '+' : '-'}{Number(t.amount).toLocaleString()} đ
                                  </td>
                                  <td className="py-2 text-right text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VOUCHERS TAB */}
              {activeTab === 'vouchers' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Quản lý mã giảm giá' : 'Shop Vouchers'}</h2>

                  <div className="bg-white border border-gray-155 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 text-sm mb-4">Tạo Voucher Mới</h3>
                    <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mã Voucher</label>
                        <input
                          type="text"
                          required
                          value={vCode}
                          onChange={(e) => setVCode(e.target.value)}
                          placeholder="GIAM30K"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mức Giảm (đ)</label>
                        <input
                          type="number"
                          required
                          value={vDiscount}
                          onChange={(e) => setVDiscount(e.target.value)}
                          placeholder="30000"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Đơn tối thiểu (đ)</label>
                        <input
                          type="number"
                          value={vMinOrder}
                          onChange={(e) => setVMinOrder(e.target.value)}
                          placeholder="150000"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3 flex justify-end">
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl text-xs shadow">
                          Tạo Voucher
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vouchers.map((v, i) => (
                      <div key={i} className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="bg-red-50 text-red-600 border border-red-100 font-mono font-black text-sm px-2.5 py-1 rounded">
                            {v.code}
                          </span>
                          <p className="text-xs text-gray-700 font-bold mt-2">Giảm {Number(v.discount).toLocaleString()} đ cho đơn từ {Number(v.minOrder).toLocaleString()} đ</p>
                        </div>
                        <button
                          onClick={() => handleDeleteVoucher(v.code)}
                          className="text-xs text-red-600 font-bold hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="space-y-6 font-sans">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800 uppercase">{t('sales_report')}</h2>
                    <button
                      onClick={handleExportCSV}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
                    >
                      📊 {t('export_excel')}
                    </button>
                  </div>

                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase">GMV (Doanh thu)</p>
                      <p className="text-xl font-black text-red-600 mt-1">
                        {shopOrders.reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()} đ
                      </p>
                    </div>
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase">Tổng đơn hàng</p>
                      <p className="text-xl font-black text-gray-800 mt-1">{shopOrders.length}</p>
                    </div>
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase">Tỉ lệ chuyển đổi</p>
                      <p className="text-xl font-black text-green-600 mt-1">3.2%</p>
                    </div>
                  </div>

                  {/* Simulated Line Chart representing growth */}
                  <div className="bg-white border border-gray-155 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm">Biểu đồ tăng trưởng doanh số (7 ngày qua)</h3>
                    <div className="h-40 flex items-end justify-between px-4 pt-6 border-b border-l border-gray-200">
                      {[
                        { day: 'T2', val: 'h-[20%]', amount: '1.2M' },
                        { day: 'T3', val: 'h-[40%]', amount: '2.5M' },
                        { day: 'T4', val: 'h-[30%]', amount: '1.8M' },
                        { day: 'T5', val: 'h-[60%]', amount: '3.9M' },
                        { day: 'T6', val: 'h-[80%]', amount: '5.2M' },
                        { day: 'T7', val: 'h-[75%]', amount: '4.8M' },
                        { day: 'CN', val: 'h-[95%]', amount: '6.4M' }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 w-1/8 group cursor-pointer relative">
                          <span className="absolute -top-6 bg-gray-800 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.amount}
                          </span>
                          <div className={`w-8 bg-red-500 hover:bg-red-600 rounded-t transition-all ${item.val}`} />
                          <span className="text-[10px] text-gray-500 font-bold">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BRANDING TAB */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Trang trí cửa hàng' : 'Store Branding'}</h2>

                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-800">{t('shop_banner')}</h3>
                    
                    {shop.banner_url && (
                      <div className="w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                        <img src={shop.banner_url} alt="Shop Banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <form onSubmit={handleUpdateBanner} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Đường dẫn Banner URL</label>
                        <input
                          type="text"
                          required
                          value={shopBannerUrl}
                          onChange={(e) => setShopBannerUrl(e.target.value)}
                          placeholder="Nhập link hình ảnh banner của shop (hoặc URL)"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={updatingBanner}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl text-xs shadow disabled:bg-gray-200"
                      >
                        {updatingBanner ? '⏳ Updating...' : t('update_banner')}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
