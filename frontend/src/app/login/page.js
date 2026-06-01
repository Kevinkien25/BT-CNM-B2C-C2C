"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Login() {
  const { login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác.');
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ĐĂNG NHẬP</h1>
            <p className="text-xs text-gray-500 font-medium">Chào mừng bạn quay trở lại với RedMall</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-4 rounded-xl">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Địa chỉ Email</label>
              <input
                type="email"
                placeholder="buyer@test.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                required
              />
            </div>

            <div className="text-right">
              <Link href="#" className="text-xs font-semibold text-red-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Đăng Nhập'
              )}
            </button>
          </form>

          {/* Seed demo accounts info */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Tài khoản thử nghiệm hệ thống (Seed Accounts):</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 font-medium">
              <div>
                <p className="font-bold text-red-600 uppercase">1. Buyer (Người Mua)</p>
                <p>Email: <span className="font-semibold select-all">buyer@test.com</span></p>
                <p>Pass: <span className="font-semibold select-all">buyer123</span></p>
              </div>
              <div>
                <p className="font-bold text-red-600 uppercase">2. C2C Seller (Cá Nhân)</p>
                <p>Email: <span className="font-semibold select-all">seller_c2c@test.com</span></p>
                <p>Pass: <span className="font-semibold select-all">seller123</span></p>
              </div>
              <div>
                <p className="font-bold text-red-600 uppercase">3. B2C Seller (Doanh nghiệp)</p>
                <p>Email: <span className="font-semibold select-all">business_b2c@test.com</span></p>
                <p>Pass: <span className="font-semibold select-all">business123</span></p>
              </div>
              <div>
                <p className="font-bold text-red-600 uppercase">4. Admin Hệ Thống</p>
                <p>Email: <span className="font-semibold select-all">admin@test.com</span></p>
                <p>Pass: <span className="font-semibold select-all">admin123</span></p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 font-medium">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-bold text-red-600 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
