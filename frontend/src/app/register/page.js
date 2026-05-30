"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Register() {
  const { register } = useApp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(name, email, password, role);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-gray-50">
        <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">TẠO TÀI KHOẢN MỚI</h1>
            <p className="text-xs text-gray-500 font-medium">Bắt đầu trải nghiệm mua bán tuyệt vời cùng RedMall</p>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold p-4 rounded-xl">
              🎉 Đăng ký tài khoản thành công! Đang chuyển hướng đến trang Đăng nhập...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-4 rounded-xl">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Họ và Tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Địa chỉ Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Mật khẩu</label>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Vai trò tài khoản</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
              >
                <option value="buyer">Người Mua (Chỉ mua hàng)</option>
                <option value="c2c_seller">Người Bán Cá Nhân C2C (Bán thanh lý đồ cũ)</option>
                <option value="b2c_seller">Doanh Nghiệp B2C (Hàng chính hãng Red Mall)</option>
              </select>
            </div>

            {/* Dynamic role helper note */}
            <div className="p-3.5 bg-red-50/50 rounded-2xl border border-red-100/50 text-[11px] text-gray-600 leading-relaxed">
              {role === 'buyer' && (
                <p>🛒 <strong>Người Mua:</strong> Phục vụ nhu cầu lướt xem hàng, thêm vào giỏ, đặt mua hàng và thanh toán bảo vệ qua cơ chế Escrow của sàn.</p>
              )}
              {role === 'c2c_seller' && (
                <p>🙋‍♂️ <strong>Người Bán Cá Nhân C2C:</strong> Dành cho cá nhân thanh lý quần áo, điện thoại cũ,... Cửa hàng của bạn được duyệt ngay sau khi tạo shop. Không yêu cầu Mã số thuế.</p>
              )}
              {role === 'b2c_seller' && (
                <p>🏢 <strong>Doanh Nghiệp B2C:</strong> Dành cho cửa hàng có đăng ký kinh doanh. Yêu cầu nhập Mã số thuế khi tạo shop. Cần được <strong>Admin phê duyệt</strong> để hiển thị logo <strong>MALL</strong> chính hãng màu đỏ trên sản phẩm.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Đăng Ký Tài Khoản'
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 font-medium">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-bold text-red-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
