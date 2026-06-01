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

  // Active Tab: 'shops' | 'disputes' | 'users' | 'reports'
  const [activeTab, setActiveTab] = useState('shops');

  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolution Notes for disputes
  const [resNotes, setResNotes] = useState({});

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

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats || { users: 5, shops: 2, products: 4, escrow_funds: 5200000, released_funds: 2500000 });

      // 2. Fetch data based on tab
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
      }
    } catch (err) {
      console.warn("Using mock admin data.");
      // Mocks
      setStats({
        users: 5,
        shops: 2,
        products: 4,
        escrow_funds: 5200000,
        released_funds: 12500000,
        refunded_funds: 4200000
      });
      setShops([
        { id: 1, shop_name: 'Cửa Hàng Đồ Cũ Tèo', shop_type: 'individual', tax_code: null, is_approved: 1, address: '123 Đường Láng, Hà Nội', phone: '0912345678', owner_name: 'Trần Văn Bán C2C', owner_email: 'seller_c2c@test.com' },
        { id: 2, shop_name: 'Apple Authorized Reseller VN', shop_type: 'business', tax_code: '0102030405', is_approved: 0, address: '456 Lê Lợi, TP. HCM', phone: '19001508', owner_name: 'Doanh Nghiệp B2C', owner_email: 'business_b2c@test.com' }
      ]);
      setDisputes([
        { id: 1, order_id: 101, buyer_name: 'Nguyễn Văn Mua', reason: 'Điện thoại xước nhiều hơn mô tả', total_amount: 5200000, status: 'pending', created_at: new Date().toISOString() }
      ]);
      setUsersList([
        { id: 1, name: 'Admin Hệ Thống', email: 'admin@test.com', role: 'admin', status: 'active', created_at: new Date().toISOString() },
        { id: 2, name: 'Nguyễn Văn Mua', email: 'buyer@test.com', role: 'buyer', status: 'active', created_at: new Date().toISOString() },
        { id: 3, name: 'Trần Văn Bán C2C', email: 'seller_c2c@test.com', role: 'c2c_seller', status: 'active', created_at: new Date().toISOString() },
        { id: 4, name: 'Doanh Nghiệp B2C', email: 'business_b2c@test.com', role: 'b2c_seller', status: 'active', created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveShop = async (shopId, shopName) => {
    const confirmMsg = language === 'vi'
      ? `Bạn đồng ý phê duyệt shop doanh nghiệp "${shopName}" lên B2C Mall?`
      : `Do you agree to approve shop "${shopName}" for B2C Mall status?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${backendUrl}/api/shop/admin/${shopId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Duyệt shop doanh nghiệp thành công!" : "Shop approved successfully!");
      fetchAdminData();
    } catch (err) {
      alert("Phê duyệt thành công! (Chế độ Demo)");
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, is_approved: 1 } : s));
    }
  };

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
      alert("Đã phán quyết tranh chấp thành công! (Chế độ Demo)");
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolved', resolution: notes } : d));
    }
  };

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
      alert(language === 'vi' ? "Cập nhật trạng thái thành viên thành công! (Demo)" : "User status updated! (Demo)");
    }
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
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase border-b border-gray-150 pb-4 mb-8">
          {t('admin_dashboard')}
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
              <p className="text-[10px] font-bold text-red-600 uppercase">{language === 'vi' ? 'Tiền đang tạm giữ' : 'Protected Holdings'}</p>
              <p className="text-base font-black text-red-600 mt-1">{Number(stats.escrow_funds).toLocaleString()} đ</p>
            </div>
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center bg-green-50/30 border-green-100">
              <p className="text-[10px] font-bold text-green-600 uppercase">{language === 'vi' ? 'Đã giải ngân' : 'Released funds'}</p>
              <p className="text-base font-black text-green-600 mt-1">{Number(stats.released_funds || stats.escrow_funds * 3).toLocaleString()} đ</p>
            </div>
          </div>
        )}

        {/* Unified admin portal Layout with tabs */}
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-1">
              {[
                { id: 'shops', label: t('b2c_approval_tab'), icon: '🏪' },
                { id: 'disputes', label: t('dispute_resolution_tab'), icon: '⚖️' },
                { id: 'users', label: t('user_management_tab'), icon: '👤' }
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
            {/* SHOPS APPROVAL */}
            {activeTab === 'shops' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">{t('b2c_approval_tab')}</h2>

                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase">
                          <th className="p-4">{t('shop')}</th>
                          <th className="p-4">{t('shop_type')}</th>
                          <th className="p-4">{t('tax_code')}</th>
                          <th className="p-4">{t('address')}</th>
                          <th className="p-4 text-center">{t('shop_approved')}</th>
                          <th className="p-4 text-center">{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                        {shops.map((shop) => (
                          <tr key={shop.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-800">{shop.shop_name}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                shop.shop_type === 'business' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {shop.shop_type === 'business' ? t('business') : t('individual')}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold">{shop.tax_code || 'N/A'}</td>
                            <td className="p-4 text-gray-400">{shop.address}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                shop.is_approved === 1 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {shop.is_approved === 1 ? t('approved') : t('pending_approval')}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {shop.shop_type === 'business' && shop.is_approved === 0 ? (
                                <button
                                  onClick={() => handleApproveShop(shop.id, shop.shop_name)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  {t('approve_btn')}
                                </button>
                              ) : (
                                <span className="text-gray-400 italic">No request</span>
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

            {/* DISPUTES RESOLUTION */}
            {activeTab === 'disputes' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">{t('dispute_resolution_tab')}</h2>

                <div className="space-y-4">
                  {disputes.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6 bg-white border border-gray-150 rounded-2xl">Không có tranh chấp nào.</p>
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
                                placeholder="Nhập lý do phân xử (ví dụ: Người bán đồng ý hoàn tiền/Khách nhận hàng sai mẫu...)"
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

            {/* USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">{t('user_management_tab')}</h2>

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
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
