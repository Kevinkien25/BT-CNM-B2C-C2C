"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LivestreamModal({ stream, onClose }) {
  const { user, token, backendUrl } = useApp();
  const { language } = useLanguage();

  const [comments, setComments] = useState([
    { id: 'init-1', username: 'Hệ thống', comment: 'Chào mừng bạn đến với Livestream! Hãy trò chuyện văn minh lịch sự.', isSystem: true }
  ]);
  const [pinnedProduct, setPinnedProduct] = useState(
    stream.pinned_product_id ? {
      id: stream.pinned_product_id,
      name: stream.product_name,
      price: stream.product_price,
      image_url: stream.product_image
    } : null
  );
  const [hearts, setHearts] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [viewerCount, setViewerCount] = useState(stream.viewer_count || 1);
  const [shopHeartsCount, setShopHeartsCount] = useState(0);

  // Checkout states
  const [showCheckout, setShowCheckout] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [newReceiverName, setNewReceiverName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddressDetail, setNewAddressDetail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const wsRef = useRef(null);
  const commentsEndRef = useRef(null);
  const [currentFrame, setCurrentFrame] = useState(null);

  // 1. Join stream and setup WebSockets
  useEffect(() => {
    // Notify DB of join
    fetch(`${backendUrl}/api/products/livestreams/${stream.id}/join`, { method: 'POST' }).catch(() => {});
    setViewerCount(prev => prev + 1);

    const hostname = window.location.hostname;
    const ws = new WebSocket(`ws://${hostname}:5001`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join_stream',
        streamId: stream.id,
        username: user ? user.name : 'Khách vãng lai'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'stream_comment') {
          setComments(prev => [...prev, data]);
        }
        if (data.type === 'stream_frame') {
          setCurrentFrame(data.frame);
        }
        if (data.type === 'stream_heart') {
          setShopHeartsCount(prev => prev + 1);
          triggerLocalHeart();
        }
        if (data.type === 'stream_user_joined') {
          setViewerCount(prev => prev + 1);
          setComments(prev => [...prev, {
            id: Date.now() + Math.random(),
            username: 'Hệ thống',
            comment: `${data.username} đã tham gia livestream.`,
            isSystem: true
          }]);
        }
        if (data.type === 'stream_pinned_product_updated') {
          setPinnedProduct(data.productId ? {
            id: data.productId,
            name: data.productName,
            price: data.productPrice,
            image_url: data.productImage
          } : null);
        }
      } catch (err) {
        console.error("WS Live Error:", err);
      }
    };

    return () => {
      fetch(`${backendUrl}/api/products/livestreams/${stream.id}/leave`, { method: 'POST' }).catch(() => {});
      ws.close();
    };
  }, [stream.id]);

  // Fetch addresses and wallet balance if user is logged in
  useEffect(() => {
    if (token && showCheckout) {
      // Fetch user addresses
      fetch(`${backendUrl}/api/auth/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setAddresses(data.addresses || []);
          const def = data.addresses?.find(a => a.is_default) || data.addresses?.[0];
          if (def) setSelectedAddress(def);
        }).catch(() => {});

      // Fetch wallet balance
      fetch(`${backendUrl}/api/auth/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setWalletBalance(data.wallet?.balance || 0);
        }).catch(() => {});
    }
  }, [token, showCheckout]);

  // Auto-scroll comments
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Float heart animation trigger
  const triggerLocalHeart = () => {
    const newHeart = {
      id: Math.random() + Date.now(),
      left: Math.random() * 80 + 10,
      scale: Math.random() * 0.4 + 0.8,
      duration: Math.random() * 1 + 1.2
    };
    setHearts(prev => [...prev, newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2200);
  };

  const handleSendHeart = () => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'stream_heart',
        streamId: stream.id
      }));
    }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'stream_comment',
        streamId: stream.id,
        username: user ? user.name : 'Khách',
        comment: commentInput.trim()
      }));
      setCommentInput('');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Vui lòng đăng nhập để đặt hàng.");
      return;
    }
    if (!pinnedProduct) return;

    let shippingAddressStr = '';
    if (selectedAddress) {
      shippingAddressStr = `${selectedAddress.receiver_name} - ${selectedAddress.phone} - ${selectedAddress.address_detail}`;
    } else {
      if (!newReceiverName || !newPhone || !newAddressDetail) {
        alert("Vui lòng nhập đầy đủ thông tin giao hàng.");
        return;
      }
      shippingAddressStr = `${newReceiverName} - ${newPhone} - ${newAddressDetail}`;
    }

    const price = Number(pinnedProduct.price);
    const finalTotal = price + 30000; // 30K shipping fee

    if (paymentMethod === 'Wallet' && Number(walletBalance) < finalTotal) {
      alert("Số dư ví điện tử không đủ để thanh toán. Vui lòng nạp thêm tiền.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{ product_id: pinnedProduct.id, quantity: 1 }],
          shipping_address: shippingAddressStr,
          payment_method: paymentMethod,
          voucher_code: null,
          discount: 0,
          shipping_fee: 30000,
          shipping_partner: 'GHN'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi đặt hàng.');

      alert("Đặt hàng thành công! Đơn hàng được thanh toán bảo chứng an toàn.");
      setShowCheckout(false);

      // System comment purchase alert
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type: 'stream_comment',
          streamId: stream.id,
          username: 'Hệ thống',
          comment: `🎉 ${user?.name || 'Khách'} đã mua sản phẩm đang ghim!`
        }));
      }
    } catch (err) {
      alert(err.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0 sm:p-4">
      {/* Immersive Mobile-Like Frame */}
      <div className="bg-gray-950 w-full sm:max-w-[420px] h-full sm:h-[760px] sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col border border-gray-800">
        
        {/* Stream Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="bg-black/50 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1 flex items-center gap-2 text-white">
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center font-black text-[10px]">
              {stream.shop_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black truncate max-w-[100px]">{stream.shop_name}</p>
              <p className="text-[8px] text-gray-300">Đang phát trực tiếp</p>
            </div>
            <span className="bg-red-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ml-1">LIVE</span>
          </div>

          <div className="flex gap-2">
            <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              👀 {viewerCount}
            </span>
            <button
              onClick={onClose}
              className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Simulation Display (Webcam overlay if active, or beautiful mockup) */}
        <div className="w-full h-3/5 bg-gradient-to-br from-indigo-900 via-gray-950 to-red-950 relative flex items-center justify-center overflow-hidden">
          {currentFrame ? (
            <img
              src={currentFrame}
              alt="Live Stream Frame"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-xs" style={{ backgroundImage: `url(${stream.banner_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400'})` }} />
          )}
          
          {!currentFrame && (
            <div className="text-center z-10 space-y-4 px-6 select-none pointer-events-none bg-black/35 p-4 rounded-2xl backdrop-blur-xs">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-red-650/20 border-2 border-red-500/55 flex items-center justify-center animate-pulse">
                  <span className="text-4xl text-red-500 animate-bounce">📺</span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-white text-sm font-black uppercase tracking-wider">{stream.title}</h3>
                <p className="text-gray-300 text-[10px]">
                  Đang kết nối camera trực tiếp...
                </p>
              </div>
            </div>
          )}

          {/* Floating Hearts Container */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {hearts.map(heart => (
              <span
                key={heart.id}
                style={{
                  left: `${heart.left}%`,
                  bottom: '20px',
                  transform: `scale(${heart.scale})`,
                  animation: `floatUp ${heart.duration}s ease-in-out forwards`
                }}
                className="absolute text-2xl text-red-550 filter drop-shadow-md select-none"
              >
                ❤️
              </span>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/40 z-10 pointer-events-none" />
        </div>

        {/* Comments Overlay list */}
        <div className="flex-grow bg-gray-950 p-4 flex flex-col justify-end relative">
          <div className="absolute top-2 left-4 text-white text-[10px] font-bold z-10 bg-black/30 px-2 py-0.5 rounded-md pointer-events-none">
            💬 Trò chuyện trực tiếp
          </div>

          <div className="flex-grow overflow-y-auto space-y-2.5 mb-3 flex flex-col pr-1 pt-6 max-h-[200px]">
            {comments.map((cmt, idx) => (
              <div key={cmt.id || idx} className="text-[11px] leading-relaxed">
                {cmt.isSystem ? (
                  <p className="text-red-400 font-bold bg-red-950/20 rounded-lg px-2.5 py-1 border border-red-900/10 italic">{cmt.comment}</p>
                ) : (
                  <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-white">
                    <span className="text-red-450 font-bold block text-[10px] mb-0.5">{cmt.username}</span>
                    <span className="text-gray-200">{cmt.comment}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Floating heart trigger & checkout ghim product */}
          <div className="flex items-center justify-between gap-3 mb-2">
            {pinnedProduct ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-3 flex-grow min-w-0">
                <img
                  src={pinnedProduct.image_url || 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=100'}
                  alt="Pinned Product"
                  className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <span className="text-[8px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">ĐANG GHIM</span>
                  <h4 className="text-white text-xs font-bold truncate mt-0.5">{pinnedProduct.name}</h4>
                  <p className="text-red-450 text-[10px] font-black mt-0.5">{Number(pinnedProduct.price).toLocaleString()}đ</p>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition shadow flex-shrink-0"
                >
                  Mua ngay
                </button>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex-grow text-center text-[10px] text-gray-500 italic">
                Chủ shop chưa ghim sản phẩm nào.
              </div>
            )}

            <button
              onClick={() => {
                handleSendHeart();
                triggerLocalHeart();
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-xl w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow"
            >
              ❤️
            </button>
          </div>

          {/* Comment inputs form */}
          <form onSubmit={handleSendComment} className="flex gap-2 border-t border-white/10 pt-3">
            <input
              type="text"
              placeholder="Bình luận gì đó..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Gửi
            </button>
          </form>
        </div>

        {/* Floating Quick Checkout Drawer */}
        {showCheckout && (
          <div className="absolute inset-x-0 bottom-0 z-30 bg-gray-900 border-t border-gray-800 rounded-t-3xl max-h-[90%] overflow-y-auto flex flex-col p-5 text-white transition-transform duration-300">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3 mb-4">
              <h3 className="text-sm font-black uppercase text-red-550">⚡ Đặt Hàng Nhanh Livestream</h3>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Đóng ✕
              </button>
            </div>

            {pinnedProduct && (
              <div className="flex gap-3 items-center border-b border-gray-850 pb-4 mb-4 bg-white/5 rounded-2xl p-3 border border-white/5">
                <img
                  src={pinnedProduct.image_url || 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=100'}
                  alt="Selected"
                  className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-gray-200">{pinnedProduct.name}</h4>
                  <p className="text-red-400 font-bold text-xs mt-1">{Number(pinnedProduct.price).toLocaleString()} VND</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Mã SP: #{pinnedProduct.id}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Shipping Address Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Địa chỉ giao hàng</label>
                {addresses.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      className="w-full bg-gray-800 border border-gray-700 text-xs rounded-xl px-3 py-2.5 text-white outline-none focus:border-red-500"
                      onChange={(e) => {
                        const addr = addresses.find(a => a.id === Number(e.target.value));
                        if (addr) setSelectedAddress(addr);
                      }}
                      value={selectedAddress?.id || ''}
                    >
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.receiver_name} - {a.phone} - {a.address_detail}
                        </option>
                      ))}
                      <option value="">-- Sử dụng địa chỉ giao hàng mới --</option>
                    </select>
                  </div>
                ) : null}

                {(!selectedAddress || addresses.length === 0) && (
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-2.5">
                    <p className="text-[9px] text-gray-400 italic">Nhập địa chỉ nhận hàng của bạn:</p>
                    <input
                      type="text"
                      placeholder="Tên người nhận hàng"
                      value={newReceiverName}
                      onChange={(e) => setNewReceiverName(e.target.value)}
                      required={!selectedAddress}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Số điện thoại"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required={!selectedAddress}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường, Phường/Xã..."
                      value={newAddressDetail}
                      onChange={(e) => setNewAddressDetail(e.target.value)}
                      required={!selectedAddress}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Phương thức thanh toán</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs cursor-pointer select-none transition ${
                    paymentMethod === 'Wallet'
                      ? 'border-red-500 bg-red-950/20 text-red-400 font-bold'
                      : 'border-gray-700 bg-transparent text-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="Wallet"
                      checked={paymentMethod === 'Wallet'}
                      onChange={() => setPaymentMethod('Wallet')}
                      className="hidden"
                    />
                    <span className="text-xl">💳</span>
                    <span className="mt-1">Ví RedMall (Escrow)</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Số dư: {Number(walletBalance).toLocaleString()}đ</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs cursor-pointer select-none transition ${
                    paymentMethod === 'COD'
                      ? 'border-red-500 bg-red-950/20 text-red-400 font-bold'
                      : 'border-gray-700 bg-transparent text-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="hidden"
                    />
                    <span className="text-xl">🚚</span>
                    <span className="mt-1">Thanh toán khi nhận</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Nhận hàng thanh toán</span>
                  </label>
                </div>
              </div>

              {/* Financial calculations preview */}
              <div className="border-t border-gray-850 pt-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiền sản phẩm:</span>
                  <span>{pinnedProduct ? Number(pinnedProduct.price).toLocaleString() : 0} VND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phí vận chuyển (GHN):</span>
                  <span>30.000 VND</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-red-450 border-t border-gray-850/50 pt-1.5">
                  <span>Tổng cộng thanh toán:</span>
                  <span>{pinnedProduct ? (Number(pinnedProduct.price) + 30000).toLocaleString() : 0} VND</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold text-xs py-3 rounded-xl transition shadow mt-3 flex items-center justify-center gap-1.5"
              >
                {checkoutLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang xử lý đặt hàng...
                  </>
                ) : (
                  'Đặt hàng & Hoàn tất Checkout 🚀'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
      
      {/* Floating Hearts CSS Animations */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 1;
          }
          100% {
            transform: translateY(-260px) scale(1.6) rotate(${Math.random() * 60 - 30}deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
