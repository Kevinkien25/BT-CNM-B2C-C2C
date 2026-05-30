"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function SellerDashboard() {
  const { user, token, refreshUser, backendUrl, loading: authLoading } = useApp();
  const router = useRouter();

  // Active Tab: 'products' | 'orders'
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
  
  // Product Form states
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pSku, setPSku] = useState('');
  const [pImage, setPImage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Incoming Orders state
  const [shopOrders, setShopOrders] = useState([]);
  const [ordLoading, setOrdLoading] = useState(false);

  // Guard routing
  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [token, authLoading]);

  // Load shop products and orders
  useEffect(() => {
    if (user?.shop) {
      fetchMyProducts();
      fetchShopOrders();
    }
  }, [user?.shop]);

  const fetchMyProducts = async () => {
    if (!user?.shop) return;
    setProdLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/products?shop_id=${user.shop.id}`);
      const data = await res.json();
      setMyProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProdLoading(false);
    }
  };

  const fetchShopOrders = async () => {
    if (!user?.shop) return;
    setOrdLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/shop/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setShopOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdLoading(false);
    }
  };

  // Open shop action
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
        body: JSON.stringify({ shop_name: shopName, address, phone, tax_code: taxCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi mở shop.');

      alert(data.message);
      await refreshUser();
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  // Call Gemini AI description
  const handleGenerateAIDescription = async () => {
    if (!pName) {
      alert("Vui lòng nhập tên sản phẩm để AI có căn cứ viết bài mô tả.");
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
        body: JSON.stringify({ name: pName, category: user?.role === 'b2c_seller' ? 'Chính hãng B2C' : 'Đồ cũ C2C' })
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setPDescription(data.description);
      } else {
        alert("Không nhận được phản hồi từ AI. Hãy thử lại.");
      }
    } catch (err) {
      alert("Lỗi kết nối AI: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Tải ảnh lên thư mục uploads của Backend
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await fetch(`${backendUrl}/api/products/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPImage(data.url);
        alert('Tải ảnh sản phẩm lên thành công!');
      } else {
        alert(data.message || 'Lỗi tải ảnh.');
      }
    } catch (err) {
      alert('Lỗi kết nối server: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Create product action
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backendUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: pName,
          description: pDescription,
          price: pPrice,
          stock: pStock,
          sku: pSku,
          image_url: pImage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Thêm sản phẩm thành công!");
      resetProductForm();
      setShowAddForm(false);
      fetchMyProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (productId) => {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Xóa thành công!");
        fetchMyProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit order status action
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
      const data = await res.json();
      if (res.ok) {
        alert(`Chuyển trạng thái đơn hàng sang "${status}" thành công!`);
        fetchShopOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const resetProductForm = () => {
    setPName('');
    setPDescription('');
    setPPrice('');
    setPStock('');
    setPSku('');
    setPImage('');
  };

  // 1. Loading state during auth handshake
  if (authLoading || (!user && token)) {
    return (
      <>
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Đang xác thực thông tin...</p>
        </div>
        <Footer />
      </>
    );
  }

  // 2. Buyer restriction
  if (user && user.role === 'buyer') {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
          <div className="text-5xl">🛍️</div>
          <h2 className="text-xl font-bold text-gray-800">Bạn là Người Mua</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Tài khoản hiện tại của bạn không hỗ trợ tính năng bán hàng. Vui lòng tạo tài khoản mới với vai trò <strong>Người bán C2C</strong> hoặc <strong>Doanh nghiệp B2C</strong> để mở cửa hàng đăng bán.
          </p>
          <Link href="/register" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md">
            Đăng ký tài khoản bán hàng
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* Render only if user info is loaded */}
        {user ? (
          <>
            {/* Case A: Seller has NOT registered a shop yet */}
            {!user.shop ? (
              <div className="max-w-lg mx-auto bg-white border border-gray-100 p-8 rounded-3xl shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-4xl">🏪</span>
                  <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">KÍCH HOẠT GIAN HÀNG CỦA BẠN</h1>
                  <p className="text-xs text-gray-500">Mở rộng kinh doanh và tiếp cận hàng ngàn khách hàng</p>
                </div>

                {regError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-4 rounded-xl">
                    ❌ {regError}
                  </div>
                )}

                <form onSubmit={handleRegisterShop} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Tên Cửa Hàng / Thương Hiệu</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Apple Store VN hoặc Đồ Cũ Tèo"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      placeholder="09xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Địa chỉ cửa hàng</label>
                    <input
                      type="text"
                      placeholder="Số nhà, Tên đường, Quận, Thành phố"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                      required
                    />
                  </div>

                  {/* Business Tax Code input if role is B2C Business */}
                  {user.role === 'b2c_seller' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Mã số thuế doanh nghiệp</label>
                      <input
                        type="text"
                        placeholder="Mã số thuế 10 chữ số"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                        required
                      />
                      <p className="text-[10px] text-gray-400">** Tài khoản doanh nghiệp B2C yêu cầu phê duyệt Mã số thuế bởi Admin để lên Mall.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center text-sm"
                  >
                    {regLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Kích Hoạt Gian Hàng'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Case B: Seller already has shop registered */
              <div className="space-y-8">
                {/* Shop Summary Header Banner */}
                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏪</span>
                      <h1 className="text-xl font-black text-gray-900">{user.shop.shop_name}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded uppercase">
                        {user.shop.shop_type === 'business' ? 'Gian hàng Doanh nghiệp B2C' : 'Cửa hàng Cá nhân C2C'}
                      </span>
                      {user.shop.is_approved === 1 ? (
                        <span className="bg-red-50 border border-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                          ✓ Đã duyệt Mall chính hãng
                        </span>
                      ) : (
                        <span className="bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded">
                          ⏳ Đang chờ duyệt mã số thuế
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tab Toggles */}
                  <div className="flex bg-gray-100 p-1.5 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        activeTab === 'products' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Sản phẩm bán ({myProducts.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        activeTab === 'orders' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Đơn hàng của shop ({shopOrders.length})
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: PRODUCTS */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">DANH SÁCH SẢN PHẨM</h2>
                      {!showAddForm && (
                        <button
                          onClick={() => {
                            resetProductForm();
                            setShowAddForm(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition-all"
                        >
                          + Đăng sản phẩm mới
                        </button>
                      )}
                    </div>

                    {/* Add product form */}
                    {showAddForm && (
                      <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <h3 className="font-black text-sm text-gray-800 uppercase">THÔNG TIN SẢN PHẨM MỚI</h3>
                          <button
                            onClick={() => setShowAddForm(false)}
                            className="text-xs font-bold text-gray-400 hover:text-red-600"
                          >
                            Đóng
                          </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-medium text-gray-700">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-gray-600 uppercase">Tên sản phẩm</label>
                              <input
                                type="text"
                                placeholder="Ví dụ: iPhone 15 Pro Max VN/A"
                                value={pName}
                                onChange={(e) => setPName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-gray-600 uppercase">Mã định danh SKU</label>
                              <input
                                type="text"
                                placeholder="Ví dụ: IP15-256-PM"
                                value={pSku}
                                onChange={(e) => setPSku(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-gray-600 uppercase">Giá bán (đ)</label>
                              <input
                                type="number"
                                placeholder="Ví dụ: 29000000"
                                value={pPrice}
                                onChange={(e) => setPPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-gray-600 uppercase">Số lượng kho</label>
                              <input
                                type="number"
                                placeholder="Ví dụ: 10"
                                value={pStock}
                                onChange={(e) => setPStock(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-gray-600 uppercase">Ảnh sản phẩm (Tải file)</label>
                              <div className="flex items-center gap-3">
                                <label className="flex-grow flex items-center justify-center border border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm font-semibold transition-colors">
                                  <span>{uploadingImage ? '⏳ Đang tải ảnh...' : '📁 Chọn tệp ảnh'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                  />
                                </label>
                                {pImage && (
                                  <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden relative flex-shrink-0">
                                    <img src={pImage} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* AI Description Field */}
                          <div className="space-y-1 relative">
                            <div className="flex justify-between items-center">
                              <label className="font-bold text-gray-600 uppercase">Mô tả sản phẩm</label>
                              <button
                                type="button"
                                onClick={handleGenerateAIDescription}
                                disabled={aiLoading}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1.5"
                              >
                                {aiLoading ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    AI đang viết mô tả...
                                  </>
                                ) : (
                                  '✨ Tạo mô tả bằng Gemini AI'
                                )}
                              </button>
                            </div>
                            <textarea
                              placeholder="Bài đăng mô tả chi tiết sản phẩm..."
                              rows={8}
                              value={pDescription}
                              onChange={(e) => setPDescription(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 text-sm whitespace-pre-line"
                            />
                          </div>

                          <div className="pt-2 flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                resetProductForm();
                                setShowAddForm(false);
                              }}
                              className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold px-5 py-2 rounded-xl text-xs"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md"
                            >
                              Đăng bán sản phẩm
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Products list table */}
                    {prodLoading ? (
                      <div className="text-center py-10 text-gray-500">Đang tải sản phẩm...</div>
                    ) : myProducts.length === 0 ? (
                      <div className="bg-white border border-gray-100 p-12 text-center rounded-3xl space-y-3">
                        <p className="text-sm text-gray-400">Bạn chưa đăng sản phẩm bán nào.</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase">
                              <th className="p-4">Sản phẩm</th>
                              <th className="p-4">SKU</th>
                              <th className="p-4">Giá bán</th>
                              <th className="p-4">Tồn kho</th>
                              <th className="p-4">Gian hàng Mall</th>
                              <th className="p-4 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {myProducts.map((p) => (
                              <tr key={p.id} className="hover:bg-gray-50/50">
                                <td className="p-4 flex items-center gap-3">
                                  <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                                  <span className="font-bold text-gray-800 line-clamp-1">{p.name}</span>
                                </td>
                                <td className="p-4 font-mono text-gray-500">{p.sku}</td>
                                <td className="p-4 font-bold text-gray-800">{Number(p.price).toLocaleString('vi-VN')} đ</td>
                                <td className="p-4 text-gray-500 font-semibold">{p.stock}</td>
                                <td className="p-4">
                                  {p.is_mall === 1 ? (
                                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">MALL</span>
                                  ) : (
                                    <span className="text-gray-400 text-[10px]">Cá nhân</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="text-red-500 hover:text-red-700 font-bold px-3 py-1"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: ORDERS */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">QUẢN LÝ ĐƠN HÀNG NHẬN ĐƯỢC</h2>

                    {ordLoading ? (
                      <div className="text-center py-10 text-gray-500">Đang tải đơn hàng...</div>
                    ) : shopOrders.length === 0 ? (
                      <div className="bg-white border border-gray-100 p-12 text-center rounded-3xl space-y-3">
                        <p className="text-sm text-gray-400">Chưa có đơn hàng nào gửi tới shop của bạn.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {shopOrders.map((order) => (
                          <div key={order.order_id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4">
                            <div className="flex flex-wrap justify-between items-center gap-4 text-xs pb-3 border-b border-gray-100">
                              <div>
                                <p className="font-bold text-gray-700">ĐƠN HÀNG MỚI: #{order.order_id}</p>
                                <p className="text-gray-400">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                              </div>
                              <span className="bg-amber-100 text-amber-800 font-bold uppercase px-2.5 py-0.5 rounded">
                                {order.status === 'pending' ? 'Chờ chuẩn bị hàng' : order.status === 'processing' ? 'Đang chuẩn bị hàng' : order.status === 'shipped' ? 'Đang giao hàng' : order.status === 'delivered' ? 'Đã hoàn thành' : 'Đã hủy'}
                              </span>
                            </div>

                            {/* Customer details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                              <p>👤 <strong>Khách hàng:</strong> {order.buyer_name} ({order.buyer_email})</p>
                              <p>📍 <strong>Giao tới:</strong> {order.shipping_address}</p>
                              <p>💳 <strong>Thanh toán:</strong> {order.payment_method}</p>
                              <p>💰 <strong>Tổng giá trị:</strong> <span className="font-bold text-red-600">{Number(order.total_amount).toLocaleString('vi-VN')} đ</span></p>
                            </div>

                            {/* Items in order */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Sản phẩm thuộc shop bạn:</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-gray-800 truncate max-w-md">{item.product_name}</span>
                                  <span className="text-gray-500 font-medium">SL: {item.quantity} x {Number(item.price).toLocaleString('vi-VN')} đ</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions for order */}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <div className="flex flex-wrap gap-2 pt-2 justify-end">
                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.order_id, 'processing')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                                  >
                                    Chuẩn bị hàng xong (Xử lý)
                                  </button>
                                )}
                                {order.status === 'processing' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.order_id, 'shipped')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                                  >
                                    Bàn giao vận chuyển (Giao hàng)
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_id, 'cancelled')}
                                  className="border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs px-4 py-2 rounded-xl transition-all"
                                >
                                  Hủy đơn
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">Đang tải thông tin cửa hàng...</div>
        )}
      </main>
      <Footer />
    </>
  );
}
