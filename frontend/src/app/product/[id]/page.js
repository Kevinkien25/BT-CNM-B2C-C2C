"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';

export default function ProductDetail({ params }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { backendUrl, addToCart } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchProductDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${backendUrl}/api/products/${productId}`);
        if (!res.ok) throw new Error("Không thể tải thông tin sản phẩm.");
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        console.warn("Using mock detail due to error:", err.message);
        
        // Mock fallback database
        const mockProducts = [
          { id: 1, name: 'Điện thoại iPhone 11 64GB Cũ', description: 'Máy cũ qua sử dụng còn đẹp 95%, pin 82%. Bản quốc tế, mọi chức năng hoạt động hoàn hảo. Phụ kiện đi kèm gồm cáp sạc.', price: 5200000, stock: 3, sku: 'IP11-64G-USED', is_mall: 0, shop_name: 'Cửa Hàng Đồ Cũ Tèo', shop_type: 'individual', shop_address: '123 Đường Láng, Đống Đa, Hà Nội', shop_phone: '0912345678', tax_code: null, shop_approved: 1, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60' },
          { id: 2, name: 'Tai nghe Sony WH-1000XM4 Like New', description: 'Tai nghe chụp tai Sony XM4 chống ồn chủ động đỉnh cao, mới 99% không vết trầy xước. Pin nghe liên tục 30 tiếng, chất âm đỉnh cao.', price: 4200000, stock: 1, sku: 'SONY-XM4-USED', is_mall: 0, shop_name: 'Cửa Hàng Đồ Cũ Tèo', shop_type: 'individual', shop_address: '123 Đường Láng, Đống Đa, Hà Nội', shop_phone: '0912345678', tax_code: null, shop_approved: 1, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
          { id: 3, name: 'iPhone 15 Pro Max 256GB Chính Hãng VN/A', description: 'Điện thoại thông minh cao cấp thế hệ mới nhất của Apple với khung viền Titanium siêu bền nhẹ, nút Action mới và hệ thống camera zoom quang học 5x đẳng cấp.', price: 29490000, stock: 15, sku: 'IP15PM-256G', is_mall: 1, shop_name: 'Apple Authorized Reseller VN', shop_type: 'business', shop_address: '456 Lê Lợi, Quận 1, TP. HCM', shop_phone: '19001508', tax_code: '0102030405', shop_approved: 1, image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60' },
          { id: 4, name: 'MacBook Air 13-inch M2 (8GB RAM / 256GB SSD)', description: 'Mẫu máy tính xách tay siêu mỏng nhẹ trang bị chip Apple M2 mạnh mẽ, màn hình Liquid Retina sắc nét và thời lượng pin lên đến 18 giờ liên tục.', price: 24890000, stock: 10, sku: 'MBAIR-M2-256G', is_mall: 1, shop_name: 'Apple Authorized Reseller VN', shop_type: 'business', shop_address: '456 Lê Lợi, Quận 1, TP. HCM', shop_phone: '19001508', tax_code: '0102030405', shop_approved: 1, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' }
        ];

        const matched = mockProducts.find(p => p.id.toString() === productId.toString());
        if (matched) {
          setProduct(matched);
        } else {
          setError("Không tìm thấy sản phẩm.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProductDetail();
  }, [productId, backendUrl]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Đang tải thông tin sản phẩm...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className="flex-grow max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800">Lỗi tải sản phẩm</h2>
          <p className="text-sm text-gray-400">{error || 'Không tìm thấy sản phẩm yêu cầu.'}</p>
          <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md">
            Quay lại Trang chủ
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (quantity > product.stock) {
      alert("Số lượng yêu cầu vượt quá hàng tồn kho hiện có.");
      return;
    }
    addToCart(product, quantity);
    alert(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng thành công!`);
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 flex gap-2 mb-8">
          <Link href="/" className="hover:text-red-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-400">{product.is_mall === 1 ? 'Thương Hiệu Mall' : 'Thanh Lý C2C'}</span>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 md:p-10 border border-gray-100 rounded-3xl shadow-sm">
          {/* Column 1: Image */}
          <div className="flex flex-col space-y-4">
            <div className="bg-gray-50 rounded-2xl overflow-hidden aspect-square relative border border-gray-100">
              <img
                src={product.image_url}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Column 2: Info details */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {product.is_mall === 1 ? (
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow">MALL CHÍNH HÃNG</span>
                ) : (
                  <span className="bg-gray-800 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded shadow">THANH LÝ C2C</span>
                )}
                <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
              </div>

              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                {product.name}
              </h1>

              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 flex items-baseline gap-2">
                <span className="text-2xl font-black text-red-600">
                  {Number(product.price).toLocaleString('vi-VN')} đ
                </span>
                {product.is_mall === 1 && (
                  <span className="text-xs text-gray-400 line-through">
                    {(product.price * 1.1).toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>

              {/* Shop profile box */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{product.shop_name}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {product.shop_type === 'business' ? '🏬 Gian hàng Doanh nghiệp B2C' : '👤 Người bán cá nhân C2C'}
                    </p>
                  </div>
                  {product.shop_approved === 1 ? (
                    <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ Đã xác minh
                    </span>
                  ) : (
                    <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ⌛ Đang chờ duyệt
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <p>📍 <strong>Địa chỉ:</strong> {product.shop_address}</p>
                  <p>📞 <strong>Điện thoại:</strong> {product.shop_phone}</p>
                  {product.tax_code && (
                    <p className="sm:col-span-2">💼 <strong>Mã số thuế:</strong> {product.tax_code}</p>
                  )}
                </div>
              </div>

              {/* Stock and Quantity selector */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
                  <span>Số lượng:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 hover:bg-gray-100 font-bold"
                      disabled={isOutOfStock}
                    >
                      −
                    </button>
                    <span className="px-4 py-1.5 font-bold select-none">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                      className="px-3 py-1.5 hover:bg-gray-100 font-bold"
                      disabled={isOutOfStock}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 font-normal">
                    ({product.stock > 0 ? `Còn lại ${product.stock} sản phẩm trong kho` : 'Hết hàng'})
                  </span>
                </div>
              </div>
            </div>

            {/* Cart Button */}
            <div className="pt-6">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {isOutOfStock ? 'Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
              </button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-10 bg-white p-6 md:p-10 border border-gray-100 rounded-3xl shadow-sm space-y-6">
          <h2 className="text-lg font-black text-gray-800 tracking-tight pb-2 border-b border-gray-100 uppercase">MÔ TẢ CHI TIẾT SẢN PHẨM</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-4 whitespace-pre-line">
            {product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
