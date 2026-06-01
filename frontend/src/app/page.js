"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatbotWidget from '@/components/ChatbotWidget';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

function HomeContent() {
  const { user, backendUrl, addToCart } = useApp();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const searchQuery = searchParams ? searchParams.get('search') || '' : '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  
  // Slide Banner State
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: language === 'vi' ? "HỘI CHỢ MUA BÁN C2C - ĐỒ CŨ GIÁ TỐT" : "C2C MARKET - GREAT SECOND-HAND DEALS",
      description: language === 'vi' 
        ? "Thanh lý đồ cũ nhanh chóng, mua sắm thả ga với cơ chế giữ tiền Escrow an toàn tuyệt đối."
        : "Liquidate used goods quickly, shop with peace of mind using our secure Escrow payment protection.",
      bg: "bg-gradient-to-r from-red-600 to-red-800",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: language === 'vi' ? "GIAN HÀNG CHÍNH HÃNG B2C - RED MALL" : "OFFICIAL B2C STORES - RED MALL",
      description: language === 'vi'
        ? "Mua sắm thiết bị công nghệ chính hãng từ doanh nghiệp uy tín, bảo hành chuẩn hãng."
        : "Shop official tech products and electronics from verified businesses with official warranties.",
      bg: "bg-gradient-to-r from-gray-800 to-red-950",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: language === 'vi' ? "TỰ ĐỘNG VIẾT MÔ TẢ BẰNG GEMINI AI" : "AUTO-GENERATE DESCRIPTIONS WITH AI",
      description: language === 'vi'
        ? "Người bán C2C chỉ cần nhập tên sản phẩm, AI sẽ soạn thảo bài đăng hấp dẫn và chuẩn SEO."
        : "C2C Sellers only need to input product names; our AI drafts attractive, SEO-ready descriptions instantly.",
      bg: "bg-gradient-to-r from-red-500 to-pink-700",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
    }
  ];

  // Auto-scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Fetch Predictive Recommendations & Log View
  useEffect(() => {
    const logUserAction = async () => {
      try {
        await fetch(`${backendUrl}/api/analytics/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id || null,
            action: 'view',
            metadata: { page: 'home' }
          })
        });
      } catch (err) {
        console.warn("Analytics log skipped:", err.message);
      }
    };
    logUserAction();

    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/analytics/recommendations?user_id=${user?.id || ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRecommendations(data.recommendations);
          }
        }
      } catch (err) {
        console.warn("Recommendations skipped:", err.message);
      }
    };
    fetchRecommendations();
  }, [user, backendUrl]);

  // Log Search Query to Predictive Analytics
  useEffect(() => {
    if (searchQuery) {
      const logSearch = async () => {
        try {
          await fetch(`${backendUrl}/api/analytics/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id || null,
              action: 'search',
              metadata: { keyword: searchQuery }
            })
          });
        } catch (e) {}
      };
      logSearch();
    }
  }, [searchQuery, user, backendUrl]);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        let url = `${backendUrl}/api/products`;
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Không thể kết nối đến cơ sở dữ liệu.");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.warn("Using mock frontend data due to disconnected backend:", err.message);
        setError(language === 'vi' 
          ? "Đang hiển thị sản phẩm mẫu hệ thống (Offline Mode)."
          : "Displaying system template products (Offline Mode).");
        
        // Mock fallback products
        const mockProducts = [
          { id: 1, name: 'Điện thoại iPhone 11 64GB Cũ', description: 'Máy cũ 95%, nguyên bản', price: 5200000, stock: 3, is_mall: 0, shop_name: 'Cửa Hàng Đồ Cũ Tèo', shop_type: 'individual', image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60' },
          { id: 2, name: 'Tai nghe Sony WH-1000XM4 Like New', description: 'Chống ồn đỉnh cao, mới 99%', price: 4200000, stock: 1, is_mall: 0, shop_name: 'Cửa Hàng Đồ Cũ Tèo', shop_type: 'individual', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
          { id: 3, name: 'iPhone 15 Pro Max 256GB Chính Hãng', description: 'Chính hãng VN/A nguyên seal', price: 29490000, stock: 15, is_mall: 1, shop_name: 'Apple Store VN', shop_type: 'business', image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60' },
          { id: 4, name: 'MacBook Air 13-inch M2 SSD 256GB', description: 'Chip M2 mỏng nhẹ cực đẹp', price: 24890000, stock: 10, is_mall: 1, shop_name: 'Apple Store VN', shop_type: 'business', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' }
        ];
        
        if (searchQuery) {
          setProducts(mockProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
          setProducts(mockProducts);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchQuery, backendUrl, language]);

  // Split B2C Mall items and C2C items
  const mallProducts = products.filter(p => p.is_mall === 1);
  const c2cProducts = products.filter(p => p.is_mall === 0);

  // FAQ State
  const [activeFaq, setActiveFaq] = useState(null);
  const faqs = [
    {
      q: language === 'vi' ? "Cơ chế bảo vệ dòng tiền Escrow hoạt động như thế nào?" : "How does the Escrow payment protection work?",
      a: language === 'vi'
        ? "Khi bạn đặt hàng bằng ví hoặc escrow, số tiền thanh toán sẽ được hệ thống giữ làm trung gian chứ chưa chuyển ngay cho người bán. Chỉ khi bạn nhận được hàng và bấm nút 'Xác nhận đã nhận hàng', sàn mới giải ngân tiền cho người bán. Nếu có khiếu nại, tiền sẽ được giữ lại để xử lý."
        : "When you place an order with e-wallet or escrow, the system holds your funds as an intermediary. Only when you receive your order and click 'Confirm Receipt' will the funds be released to the seller. If you open a dispute, the funds are safely locked until admin review."
    },
    {
      q: language === 'vi' ? "Làm thế nào để đăng ký mở gian hàng B2C doanh nghiệp?" : "How do I register a B2C business storefront?",
      a: language === 'vi'
        ? "Bạn đăng ký tài khoản với vai trò Doanh Nghiệp (B2C Seller), điền thông tin shop kèm theo Mã số thuế. Sau khi Admin hệ thống đối chiếu thông tin và nhấn duyệt, shop của bạn mới chính thức nâng cấp thành Mall và các sản phẩm của bạn sẽ tự động có nhãn hiệu Mall chính hãng màu đỏ."
        : "Sign up with a Business (B2C Seller) account, and fill in your shop info along with your Tax ID. Once the system Admin verifies the details and approves it, your store upgrades to a Mall, and your items display the red 'MALL' badge automatically."
    },
    {
      q: language === 'vi' ? "Tôi là cá nhân, tôi có thể bán đồ cũ trên sàn được không?" : "I am an individual, can I sell second-hand goods on the platform?",
      a: language === 'vi'
        ? "Hoàn toàn được! Bạn đăng ký tài khoản với vai trò Cá Nhân (C2C Seller). Cửa hàng cá nhân của bạn sẽ được kích hoạt ngay lập tức mà không cần Admin kiểm duyệt mã số thuế. Bạn có thể đăng bán đồ thanh lý ngay."
        : "Absolutely! Simply register as an Individual (C2C Seller). Your second-hand shop is activated instantly without requiring Tax ID verification. You can list items and start selling immediately."
    },
    {
      q: language === 'vi' ? "Chức năng AI viết mô tả hoạt động như thế nào?" : "How does the AI description writer function?",
      a: language === 'vi'
        ? "Khi thêm sản phẩm mới trong Kênh Người Bán, bạn chỉ cần gõ Tên sản phẩm, chọn Danh mục và bấm nút 'AI viết mô tả'. Hệ thống sẽ tự động gọi AI Gemini để phân tích và viết một bài mô tả chi tiết chuẩn SEO trong 3 giây."
        : "When adding products in the Seller Channel, type the product name, category, and click 'AI Description Writer'. The system queries Gemini AI to generate a detailed, SEO-friendly description in under 3 seconds."
    }
  ];

  return (
    <>
      <Header />

      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden h-[380px] md:h-[450px] font-sans">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 flex items-center ${slide.bg} ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  {slide.title}
                </h1>
                <p className="text-sm md:text-lg font-light text-red-50 max-w-lg">
                  {slide.description}
                </p>
                <div className="pt-4 flex gap-4">
                  <Link
                    href="#categories"
                    className="bg-white text-red-600 font-bold px-6 py-2.5 rounded-full shadow hover:bg-red-50 transition-all text-sm"
                  >
                    {language === 'vi' ? 'Mua sắm ngay' : 'Shop Now'}
                  </Link>
                  <Link
                    href="/seller"
                    className="border border-white/80 hover:bg-white/10 text-white font-bold px-6 py-2.5 rounded-full transition-all text-sm"
                  >
                    {language === 'vi' ? 'Đăng ký bán hàng' : 'Become a Seller'}
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="rounded-2xl shadow-2xl h-[300px] w-[450px] object-cover border-4 border-white/20"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Carousel indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentSlide ? 'bg-white scale-125' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Info notice bar */}
      {error && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs md:text-sm py-2 px-4 text-center font-medium font-sans">
          ⚠️ {error}
        </div>
      )}

      {/* Predictive Recommendations Notification Banner */}
      {recommendations && (recommendations.preferredCategories?.length > 0 || recommendations.preferredKeywords?.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 font-sans">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl p-4 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 border border-red-500/20">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white text-lg">
                🎯
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">{language === 'vi' ? 'Dành riêng cho bạn' : 'Just For You'}</p>
                <p className="text-sm font-semibold mt-0.5">
                  {language === 'vi' 
                    ? `Phân tích AI dự đoán bạn đang tìm kiếm: "${recommendations.preferredCategories[0] || recommendations.preferredKeywords[0]}"`
                    : `AI predicts you are searching for: "${recommendations.preferredCategories[0] || recommendations.preferredKeywords[0]}"`
                  }
                </p>
              </div>
            </div>
            <Link 
              href={`/?search=${encodeURIComponent(recommendations.preferredCategories[0] || recommendations.preferredKeywords[0])}`}
              className="bg-white text-red-600 hover:bg-red-50 text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition duration-200 flex-shrink-0"
            >
              {language === 'vi' ? 'Khám phá ngay' : 'Explore Now'}
            </Link>
          </div>
        </div>
      )}

      {/* Categories section */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight mb-6 uppercase">{t('categories')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[
            { name: language === 'vi' ? "Điện thoại & Tablet" : "Phones & Tablets", icon: "📱", href: "/?search=điện thoại" },
            { name: language === 'vi' ? "Laptop & PC" : "Laptops & PCs", icon: "💻", href: "/?search=laptop" },
            { name: language === 'vi' ? "Tai nghe & Âm thanh" : "Headphones & Audio", icon: "🎧", href: "/?search=tai nghe" },
            { name: language === 'vi' ? "Đồ gia dụng" : "Home Appliances", icon: "🔌", href: "/?search=gia dụng" },
            { name: language === 'vi' ? "Thời trang thanh lý" : "Clearance Fashion", icon: "👕", href: "/?search=áo" },
            { name: language === 'vi' ? "Phụ kiện số" : "Digital Accessories", icon: "⌚", href: "/?search=phụ kiện" }
          ].map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="bg-white border border-gray-150 hover:border-red-500 hover:shadow-md p-4 rounded-2xl text-center transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <div className="text-xs font-semibold text-gray-700 group-hover:text-red-600 transition-colors">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main product listings */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 font-sans">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm font-medium">{language === 'vi' ? 'Đang tải danh sách sản phẩm...' : 'Loading products...'}</p>
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="bg-red-50 text-red-700 py-3 px-6 rounded-2xl flex justify-between items-center border border-red-100">
                <span className="font-medium text-sm">
                  {language === 'vi' 
                    ? `Kết quả tìm kiếm cho: "${searchQuery}" (${products.length} sản phẩm)`
                    : `Search results for: "${searchQuery}" (${products.length} products)`
                  }
                </span>
                <Link href="/" className="text-xs font-bold hover:underline">
                  {language === 'vi' ? 'Xóa bộ lọc' : 'Clear Filter'}
                </Link>
              </div>
            )}

            {/* SECTION 1: B2C MALL Products */}
            {mallProducts.length > 0 && (
              <section className="space-y-6">
                <div className="flex justify-between items-end border-b-2 border-red-600 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-xs font-black uppercase px-2.5 py-1 rounded">MALL</span>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">{t('mall_products')}</h2>
                  </div>
                  <span className="text-xs text-red-600 font-bold hover:underline cursor-pointer">{language === 'vi' ? 'Xem tất cả' : 'View all'} &rarr;</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {mallProducts.map((prod) => (
                    <div key={prod.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between">
                      <div className="relative pt-[80%] bg-gray-50 overflow-hidden">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">MALL</span>
                        {prod.is_sponsored === 1 && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow uppercase">
                            {t('sponsored')}
                          </span>
                        )}
                      </div>
                      
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 font-medium truncate">{prod.shop_name}</p>
                          <Link href={`/product/${prod.id}`} className="block text-sm font-bold text-gray-800 hover:text-red-600 line-clamp-2 transition-colors h-10">
                            {prod.name}
                          </Link>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400 line-through">{(prod.price * 1.1).toLocaleString('vi-VN')} đ</p>
                            <p className="text-sm font-black text-red-600">{Number(prod.price).toLocaleString('vi-VN')} đ</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              addToCart(prod, 1);
                              alert(language === 'vi' ? `Đã thêm "${prod.name}" vào giỏ hàng!` : `Added "${prod.name}" to cart!`);
                            }}
                            className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white p-2 rounded-full transition-all"
                            title={t('add_to_cart')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: C2C Products */}
            {c2cProducts.length > 0 && (
              <section className="space-y-6">
                <div className="flex justify-between items-end border-b-2 border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-800 text-white text-xs font-black uppercase px-2.5 py-1 rounded">C2C</span>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">{t('c2c_products')}</h2>
                  </div>
                  <span className="text-xs text-gray-600 font-bold hover:underline cursor-pointer">{language === 'vi' ? 'Xem tất cả' : 'View all'} &rarr;</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {c2cProducts.map((prod) => (
                    <div key={prod.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between">
                      <div className="relative pt-[80%] bg-gray-50 overflow-hidden">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 bg-gray-700 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                          {language === 'vi' ? 'Đồ Cũ' : 'Used'}
                        </span>
                        {prod.is_sponsored === 1 && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow uppercase">
                            {t('sponsored')}
                          </span>
                        )}
                      </div>
                      
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 font-medium truncate">{language === 'vi' ? `Chủ shop: ${prod.shop_name}` : `Seller: ${prod.shop_name}`}</p>
                          <Link href={`/product/${prod.id}`} className="block text-sm font-bold text-gray-800 hover:text-red-600 line-clamp-2 transition-colors h-10">
                            {prod.name}
                          </Link>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">{language === 'vi' ? 'Giá thanh lý' : 'Clearance Price'}</p>
                            <p className="text-sm font-black text-gray-900">{Number(prod.price).toLocaleString('vi-VN')} đ</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              addToCart(prod, 1);
                              alert(language === 'vi' ? `Đã thêm "${prod.name}" vào giỏ hàng!` : `Added "${prod.name}" to cart!`);
                            }}
                            className="bg-gray-100 hover:bg-gray-800 text-gray-700 hover:text-white p-2 rounded-full transition-all"
                            title={t('add_to_cart')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {products.length === 0 && (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm">
                <div className="text-5xl">🔍</div>
                <h3 className="text-lg font-bold text-gray-800">{t('no_products')}</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  {language === 'vi' 
                    ? 'Vui lòng thử tìm kiếm bằng từ khóa khác hoặc quay lại trang chủ.'
                    : 'Please try searching with another keyword or return to homepage.'}
                </p>
                <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-full text-xs transition-colors">
                  {language === 'vi' ? 'Quay lại Trang chủ' : 'Return to Home'}
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {/* Review Section */}
      <section className="bg-red-50 py-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-center text-gray-900 mb-2 uppercase">{language === 'vi' ? 'Ý kiến khách hàng' : 'Customer Testimonials'}</h2>
          <p className="text-center text-gray-500 text-sm mb-12">
            {language === 'vi'
              ? 'Những nhận xét thực tế từ người bán và người mua trên hệ thống'
              : 'Real comments from sellers and buyers on our system'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: "Phạm Văn Minh", 
                role: language === 'vi' ? "Người Mua Điện Thoại Cũ" : "Secondhand Phone Buyer", 
                review: language === 'vi'
                  ? "Tôi đã mua chiếc iPhone 11 cũ thanh lý ở đây. Lúc đầu rất lo vì mua hàng cá nhân C2C, nhưng nhờ sàn có cơ chế giữ tiền Escrow nên tôi rất an tâm. Nhận hàng đúng mô tả mới bấm xác nhận."
                  : "I bought a used iPhone 11 here. At first, I was worried about C2C purchases, but thanks to the platform's Escrow system holding the funds, I felt safe. I only released payment after verifying it.",
                rating: 5 
              },
              { 
                name: "Lê Thị Hồng", 
                role: language === 'vi' ? "Doanh Nghiệp Thời Trang" : "B2C Fashion Merchant", 
                review: language === 'vi'
                  ? "Từ khi được Admin phê duyệt tài khoản B2C lên Mall, doanh số của gian hàng chúng tôi tăng rõ rệt nhờ nhãn hiệu Mall chính hãng nổi bật và tạo dựng lòng tin tối đa với khách hàng."
                  : "Since the Admin approved our B2C store for Mall status, our sales increased significantly due to the prominent Mall badge giving customers maximum confidence.",
                rating: 5 
              },
              { 
                name: "Nguyễn Văn Nam", 
                role: language === 'vi' ? "Người Bán C2C Cá Nhân" : "C2C Individual Seller", 
                review: language === 'vi'
                  ? "Chức năng AI viết mô tả sản phẩm của web cực kỳ đỉnh! Tôi chỉ nhập 'Sony WH-1000XM4' mà AI viết ra bài chi tiết đầy đủ thông số, tính năng và cam kết luôn. Đăng bài siêu nhanh."
                  : "The AI product description writer is amazing! I just typed 'Sony WH-1000XM4' and the AI drafted a detailed sheet covering all specifications and guarantees. Listing items is so fast now.",
                rating: 5 
              }
            ].map((rev, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <span key={i} className="text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 italic">"{rev.review}"</p>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{rev.name}</h4>
                  <p className="text-xs text-red-600 font-medium">{rev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust partners */}
      <section className="bg-white py-12 border-b border-gray-100 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-gray-400 tracking-widest uppercase mb-8">
            {language === 'vi' ? 'ĐỐI TÁC THANH TOÁN VÀ VẬN CHUYỂN TIN CẬY' : 'TRUSTED PAYMENT AND SHIPPING PARTNERS'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-50 grayscale hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold text-gray-800">Apple</span>
            <span className="text-lg font-bold text-gray-800">Samsung</span>
            <span className="text-lg font-bold text-gray-800">Sony</span>
            <span className="text-lg font-bold text-gray-800">VNPAY</span>
            <span className="text-lg font-bold text-gray-800">Giao Hàng Nhanh</span>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-6 font-sans">
        <h2 className="text-2xl font-black text-center text-gray-800 mb-2 uppercase">{language === 'vi' ? 'CÂU HỎI THƯỜNG GẶP' : 'FREQUENTLY ASKED QUESTIONS'}</h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          {language === 'vi' ? 'Giải đáp nhanh các thắc mắc về luồng vận hành của RedMall' : 'Quick answers to common questions about RedMall operations'}
        </p>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm transition-all">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left px-6 py-4 font-bold text-sm md:text-base text-gray-800 hover:text-red-600 transition-colors flex justify-between items-center"
              >
                <span>{faq.q}</span>
                <span className="text-lg">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-4 pt-1 text-sm text-gray-500 border-t border-gray-100 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <ChatbotWidget />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm">Đang tải ứng dụng RedMall...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
