"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex-grow max-w-lg relative">
      <input
        type="text"
        placeholder={t('search_placeholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-4 pr-12 py-2 border-2 border-red-500 rounded-full text-sm outline-none focus:ring-2 focus:ring-red-200 transition-all"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 bottom-1 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition-colors"
      >
        {t('search_btn')}
      </button>
    </form>
  );
}

export default function Header() {
  const { user, logout, cart } = useApp();
  const { t, language, changeLanguage } = useLanguage();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-red-100 shadow-sm font-sans">
      {/* Top mini-bar */}
      <div className="bg-red-600 text-white text-xs py-1.5 px-4 font-light">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <span className="hidden sm:inline">Đồ án tốt nghiệp: Hệ thống Thương mại Điện tử C2C & B2C</span>
            <span className="sm:hidden">C2C & B2C E-Commerce</span>
          </div>
          <div className="flex gap-4 items-center">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-red-700/50 border border-white/20 rounded px-2 py-0.5 text-[10px] font-bold">
              <button 
                onClick={() => changeLanguage('vi')} 
                className={`hover:text-red-200 transition ${language === 'vi' ? 'text-white underline underline-offset-2' : 'text-white/60'}`}
              >
                VI
              </button>
              <span className="text-white/20">|</span>
              <button 
                onClick={() => changeLanguage('en')} 
                className={`hover:text-red-200 transition ${language === 'en' ? 'text-white underline underline-offset-2' : 'text-white/60'}`}
              >
                EN
              </button>
            </div>

            <Link href="/seller" className="hover:underline">{t('seller_channel')}</Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="hover:underline font-semibold">{t('admin_channel')}</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-black tracking-tight text-red-600">
            RED<span className="text-gray-900">MALL</span>
          </span>
          <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden xs:inline">
            B2C & C2C
          </span>
        </Link>

        {/* Search form with Suspense boundary */}
        <Suspense fallback={
          <div className="flex-grow max-w-lg h-9 bg-gray-100 border border-gray-100 rounded-full animate-pulse" />
        }>
          <SearchBar />
        </Suspense>

        {/* Actions bar */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Cart Icon */}
          <Link href="/cart" className="relative p-2 text-gray-700 hover:text-red-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Link>

          {/* User Account Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold uppercase">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.name || 'User'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                    <p className="mt-1">
                      <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-bold uppercase">
                        {user?.role === 'admin' ? 'Admin' : user?.role === 'b2c_seller' ? t('business') : user?.role === 'c2c_seller' ? t('individual') : 'Buyer'}
                      </span>
                    </p>
                  </div>
                  
                  <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                    {t('orders')}
                  </Link>

                  <Link href="/seller" className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                    {t('seller_channel')}
                  </Link>

                  {user?.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2 text-red-600 font-semibold hover:bg-red-50 transition-colors">
                      {t('admin_channel')}
                    </Link>
                  )}

                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors px-3 py-1.5 rounded-full hover:bg-gray-50">
                {t('login')}
              </Link>
              <Link href="/register" className="text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all px-4 py-1.5 rounded-full shadow-sm">
                {language === 'vi' ? 'Đăng ký' : 'Register'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
