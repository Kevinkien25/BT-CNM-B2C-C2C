import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div>
            <span className="text-xl font-black text-white tracking-tight">
              RED<span className="text-red-500">MALL</span>
            </span>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Giải pháp thương mại điện tử kết hợp mô hình B2C (hàng chính hãng doanh nghiệp) và C2C (người bán cá nhân đồ cũ), đem lại trải nghiệm mua sắm an toàn, nhanh chóng và tin cậy tuyệt đối nhờ cơ chế bảo vệ dòng tiền Escrow.
            </p>
          </div>

          {/* Col 2: Customer support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Hỗ Trợ Khách Hàng</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="hover:text-red-500 transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Hướng dẫn mua hàng B2C</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Hướng dẫn đăng bán C2C</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Chính sách bảo mật thanh toán</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Giải quyết tranh chấp Escrow</Link></li>
            </ul>
          </div>

          {/* Col 3: Policies */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Về Chúng Tôi</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="hover:text-red-500 transition-colors">Giới thiệu RedMall</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Tuyển dụng</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Chính sách vận chuyển</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition-colors">Liên hệ truyền thông</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Thông Tin Liên Hệ</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Tòa nhà Innovation, Công viên phần mềm Quang Trung, Quận 12, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>Hotline: 1900 1508 (8:00 - 22:00)</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>support@redmall.com</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-gray-800" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} RedMall Group. Phát triển cho mục tiêu Đồ án tốt nghiệp.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-400 cursor-pointer">Bản quyền thuộc về Trường Công Nghệ</span>
            <span className="hover:text-gray-400 cursor-pointer">Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
