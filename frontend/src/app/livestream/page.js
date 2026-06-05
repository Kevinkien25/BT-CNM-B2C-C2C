"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatbotWidget from '@/components/ChatbotWidget';
import LivestreamModal from '@/components/LivestreamModal';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export default function LivestreamHub() {
  const { backendUrl } = useApp();
  const { language } = useLanguage();

  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState(null);

  const fetchActiveStreams = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/products/livestreams/active`);
      if (res.ok) {
        const data = await res.json();
        setStreams(data.streams || []);
      }
    } catch (err) {
      console.warn("Failed to fetch active livestreams:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStreams();
    // Poll every 10s on this dedicated live hub page
    const interval = setInterval(fetchActiveStreams, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[600px] font-sans">
        {/* Navigation Breadcrumb */}
        <nav className="text-xs font-semibold text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-red-600 transition">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-800">Livestream Bán Hàng Trực Tiếp</span>
        </nav>

        {/* Header Title */}
        <div className="border-b border-gray-150 pb-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              📺 Kênh Phát Sóng Trực Tiếp
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Giao lưu trực tuyến với người bán, săn deal độc quyền và mua sắm bảo chứng an toàn qua ví Escrow.
            </p>
          </div>
          <button 
            onClick={fetchActiveStreams}
            className="self-start sm:self-center border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5"
          >
            🔄 Cập nhật danh sách
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-150 rounded-2xl max-w-lg mx-auto space-y-4">
            <div className="text-6xl">📺</div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-800 text-sm">Hiện tại không có Livestream nào hoạt động</h3>
              <p className="text-gray-400 text-xs max-w-xs mx-auto">
                Hãy quay lại sau hoặc đăng nhập Kênh Người Bán để bắt đầu phiên phát sóng trực tiếp đầu tiên của bạn!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/seller"
                className="bg-red-650 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow"
              >
                Vào Kênh Người Bán ➔
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {streams.map(stream => (
              <div
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 cursor-pointer group flex flex-col justify-between"
              >
                {/* Backdrop Video Simulation Container */}
                <div className="h-44 bg-gradient-to-br from-indigo-900 to-red-950 relative flex items-center justify-center text-white">
                  <div className="absolute top-2 left-2 bg-red-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    LIVE
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 text-[8px] font-bold px-2 py-0.5 rounded-full text-white">
                    👀 {stream.viewer_count} xem
                  </div>

                  <span className="text-4xl filter group-hover:scale-110 transition duration-300">📺</span>
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[9px] font-bold truncate max-w-[95%]">
                    {stream.shop_name}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-xs text-gray-800 line-clamp-2 min-h-[32px] group-hover:text-red-650 transition">
                    {stream.title}
                  </h3>

                  {stream.pinned_product_id ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex gap-2 items-center text-[10px]">
                      <img
                        src={stream.product_image || 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=50'}
                        alt="Pinned"
                        className="w-8 h-8 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="min-w-0 flex-grow">
                        <p className="font-bold truncate text-gray-700">{stream.product_name}</p>
                        <p className="text-red-500 font-bold mt-0.5">{Number(stream.product_price).toLocaleString()} VND</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic py-2 text-center bg-gray-50 rounded-xl">Chưa ghim sản phẩm</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Livestream Overlay Modal */}
      {selectedStream && (
        <LivestreamModal
          stream={selectedStream}
          onClose={() => setSelectedStream(null)}
        />
      )}

      <ChatbotWidget />
      <Footer />
    </>
  );
}
