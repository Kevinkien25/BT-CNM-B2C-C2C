"use client";

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function Cart() {
  const { cart, updateCartQuantity, removeFromCart } = useApp();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <h1 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">GIỎ HÀNG CỦA BẠN</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm">
            <div className="text-5xl">🛒</div>
            <h2 className="text-lg font-bold text-gray-800">Giỏ hàng trống</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy chọn mua các sản phẩm từ người bán C2C và B2C nhé!</p>
            <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md">
              Quay lại mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex gap-4 items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden relative flex-shrink-0 border border-gray-100">
                      <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div>
                      {item.is_mall === 1 ? (
                        <span className="bg-red-50 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-red-100">MALL</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-gray-200">Đồ Cũ</span>
                      )}
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1 mt-1">{item.name}</h3>
                      <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{item.shop_name}</p>
                      <p className="text-xs font-black text-red-600 mt-1">{Number(item.price).toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white text-xs">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 hover:bg-gray-100 font-bold"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 hover:bg-gray-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Xóa khỏi giỏ hàng"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Panel */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-6">
              <h2 className="text-base font-black text-gray-800 pb-2 border-b border-gray-100 uppercase">TỔNG ĐƠN HÀNG</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Số lượng sản phẩm:</span>
                  <span className="font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600 font-medium">Miễn phí</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-gray-800 text-base">
                  <span className="font-bold">Tổng thanh toán:</span>
                  <span className="font-black text-red-600 text-lg">{totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm"
              >
                Tiến Hành Thanh Toán
              </Link>

              <div className="p-3.5 bg-red-50/50 rounded-2xl border border-red-100/50 text-[10px] text-gray-500 leading-relaxed">
                🛡️ Mua sắm của bạn được bảo vệ qua hệ thống Escrow. Người bán sẽ chỉ nhận được tiền khi bạn xác nhận nhận hàng thành công.
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
