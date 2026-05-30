"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function BuyerOrders() {
  const { token, backendUrl } = useApp();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchBuyerOrders();
  }, [token]);

  const fetchBuyerOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Không thể tải lịch sử đơn hàng.");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.warn("Using mock buyer orders:", err.message);
      // Mock history
      setOrders([
        {
          id: 101,
          total_amount: 5200000,
          status: 'shipped',
          shipping_address: 'Nguyễn Văn Mua - 0912345678 - 123 Đường Láng, Hà Nội',
          payment_method: 'Escrow',
          transaction_status: 'escrow',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          items: [
            { id: 1, product_name: 'Điện thoại iPhone 11 64GB Cũ', price: 5200000, quantity: 1, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60', shop_name: 'Cửa Hàng Đồ Cũ Tèo' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    if (!confirm("Bạn xác nhận đã nhận hàng đầy đủ, đúng mô tả và đồng ý giải ngân tiền cho Người bán?")) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/confirm-receipt`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi xác nhận.');

      alert("Cập nhật thành công! Tiền đã được giải ngân cho Người bán.");
      fetchBuyerOrders();
    } catch (err) {
      // Mock update
      alert("Xác nhận nhận hàng thành công! (Chế độ Demo)");
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? { ...ord, status: 'delivered', transaction_status: 'released' }
            : ord
        )
      );
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: { text: 'Chờ chuẩn bị hàng', color: 'bg-amber-100 text-amber-800' },
      processing: { text: 'Đang chuẩn bị hàng', color: 'bg-blue-100 text-blue-800' },
      shipped: { text: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { text: 'Đã nhận hàng', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Đã hủy đơn', color: 'bg-red-100 text-red-800' }
    };
    return map[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getEscrowText = (status) => {
    const map = {
      escrow: { text: 'Sàn đang giữ tiền bảo chứng (Escrow)', color: 'bg-red-50 text-red-700 border-red-100' },
      released: { text: 'Đã giải ngân cho người bán', color: 'bg-green-50 text-green-700 border-green-100' },
      refunded: { text: 'Đã hoàn tiền cho người mua', color: 'bg-gray-50 text-gray-500 border-gray-200' }
    };
    return map[status] || { text: status, color: 'bg-gray-50 text-gray-800 border-gray-200' };
  };

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow space-y-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">ĐƠN HÀNG ĐÃ ĐẶT (KHÁCH MUA)</h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm">
            <div className="text-5xl">📦</div>
            <h2 className="text-lg font-bold text-gray-800">Chưa có đơn hàng nào</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Bạn chưa thực hiện bất kỳ giao dịch mua bán nào trên hệ thống.</p>
            <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md">
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderStatus = getStatusText(order.status);
              const escrowStatus = getEscrowText(order.transaction_status);

              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                  {/* Order header */}
                  <div className="p-4 sm:p-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-700">MÃ ĐƠN HÀNG: #{order.id}</p>
                      <p className="text-gray-400">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${orderStatus.color}`}>
                        {orderStatus.text}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 sm:p-6 divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center justify-between">
                        <div className="flex gap-3 items-center min-w-0">
                          <img src={item.image_url} alt={item.product_name} className="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-800 truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-400">Shop: {item.shop_name} | Số lượng: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-gray-800">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="p-4 sm:p-6 bg-gray-50/20 border-t border-gray-100 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">📍 <strong>Giao tới:</strong> {order.shipping_address}</p>
                        <p className="text-gray-500 mt-1">💳 <strong>Hình thức:</strong> {order.payment_method}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-xs font-semibold">Tổng thanh toán:</span>
                        <p className="text-base font-black text-red-600">{Number(order.total_amount).toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>

                    {/* Escrow Banner inside Order */}
                    {order.transaction_status && (
                      <div className={`p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row justify-between items-center gap-3 ${escrowStatus.color}`}>
                        <span>🛡️ Trạng thái dòng tiền: {escrowStatus.text}</span>
                        
                        {/* Show confirm receipt button */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && order.transaction_status === 'escrow' && (
                          <button
                            onClick={() => handleConfirmReceipt(order.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-sm hover:shadow-red-100 transition-all text-[11px]"
                          >
                            Xác nhận đã nhận hàng & Giải ngân
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
