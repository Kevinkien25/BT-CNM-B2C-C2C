"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  vi: {
    // Common / Navigation
    home: "Trang chủ",
    cart: "Giỏ hàng",
    orders: "Đơn mua",
    seller_channel: "Kênh Người Bán",
    admin_channel: "Kênh Admin",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    welcome: "Chào mừng",
    language: "Ngôn ngữ",
    search_placeholder: "Tìm sản phẩm, thương hiệu (ví dụ: điện thoại, laptop...)",
    search_btn: "Tìm kiếm",
    all_products: "Tất cả sản phẩm",
    mall_products: "B2C Mall (Chính hãng)",
    c2c_products: "Chợ C2C (Cá nhân)",
    categories: "Danh mục sản phẩm",
    sponsored: "Được tài trợ",
    international_shipping: "Giao hàng quốc tế",
    no_products: "Không tìm thấy sản phẩm nào.",
    
    // Product Details
    price: "Giá",
    stock: "Còn lại",
    sku: "Mã sản phẩm (SKU)",
    shop: "Cửa hàng",
    product_description: "Mô tả sản phẩm",
    ai_description_btn: "🤖 Viết mô tả bằng AI",
    add_to_cart: "Thêm vào giỏ hàng",
    buy_now: "Mua ngay",
    reviews: "Đánh giá từ người mua",
    no_reviews: "Chưa có đánh giá nào cho sản phẩm này.",
    rating: "Điểm đánh giá",
    comment: "Nhận xét",
    write_review: "Viết đánh giá của bạn",
    submit_review: "Gửi đánh giá",
    shop_reply: "Phản hồi từ người bán",
    reply_placeholder: "Trả lời đánh giá của người mua...",
    reply_btn: "Gửi phản hồi",
    
    // Cart / Checkout
    cart_title: "Giỏ hàng của bạn",
    cart_empty: "Giỏ hàng trống. Hãy mua sắm ngay!",
    group_by_shop: "Nhóm theo cửa hàng",
    product: "Sản phẩm",
    quantity: "Số lượng",
    action: "Hành động",
    remove: "Xóa",
    checkout_summary: "Tổng thanh toán",
    shipping_fee: "Phí vận chuyển",
    shipping_partner: "Đơn vị vận chuyển",
    payment_method: "Phương thức thanh toán",
    cod: "Thanh toán khi nhận hàng (COD)",
    wallet_pay: "Ví điện tử nội bộ",
    escrow_pay: "Bảo chứng Escrow (Sàn giữ tiền)",
    shipping_address: "Địa chỉ nhận hàng",
    place_order: "Đặt hàng",
    order_success: "Đặt hàng thành công!",
    
    // Wallet
    wallet_title: "Ví điện tử nội bộ",
    wallet_balance: "Số dư ví",
    deposit: "Nạp tiền vào ví",
    withdraw: "Rút tiền về ngân hàng",
    amount: "Số tiền",
    bank_name: "Tên ngân hàng",
    account_no: "Số tài khoản",
    tx_history: "Lịch sử giao dịch ví",
    tx_deposit: "Nạp tiền",
    tx_withdraw: "Rút tiền",
    tx_payment: "Thanh toán",
    tx_refund: "Hoàn tiền",
    tx_receive: "Nhận tiền",
    tx_desc: "Nội dung",
    tx_time: "Thời gian",
    
    // Address Management
    address_title: "Sổ địa chỉ giao hàng",
    receiver_name: "Tên người nhận",
    phone: "Số điện thoại",
    address_detail: "Địa chỉ chi tiết",
    is_default: "Đặt làm mặc định",
    add_address: "Thêm địa chỉ mới",
    default_badge: "Mặc định",
    set_default: "Đặt mặc định",
    
    // Orders / Disputes
    order_id: "Mã đơn hàng",
    order_status: "Trạng thái đơn hàng",
    order_total: "Tổng thanh toán",
    order_pending: "Chờ xác nhận",
    order_processing: "Đang xử lý",
    order_shipped: "Đang giao hàng",
    order_delivered: "Đã giao hàng",
    order_cancelled: "Đã hủy",
    confirm_receipt: "Đã nhận được hàng (Giải ngân)",
    dispute_btn: "Khiếu nại/Hoàn tiền",
    dispute_reason: "Lý do khiếu nại hoàn tiền",
    dispute_submit: "Gửi khiếu nại",
    dispute_pending: "Đang chờ Admin xử lý tranh chấp",
    
    // Seller Dashboard
    seller_dashboard: "Bảng điều khiển người bán",
    my_shop_info: "Thông tin cửa hàng",
    shop_name: "Tên cửa hàng",
    shop_type: "Loại cửa hàng",
    individual: "Cá nhân (C2C)",
    business: "Doanh nghiệp (B2C)",
    tax_code: "Mã số thuế",
    address: "Địa chỉ",
    register_shop_btn: "Đăng ký mở cửa hàng",
    shop_approved: "Trạng thái phê duyệt",
    approved: "Đã phê duyệt",
    pending_approval: "Đang chờ phê duyệt",
    shop_banner: "Ảnh Banner cửa hàng",
    update_banner: "Cập nhật Banner",
    add_product: "Đăng sản phẩm mới",
    edit_product: "Sửa sản phẩm",
    product_name: "Tên sản phẩm",
    image: "Hình ảnh sản phẩm",
    upload_file: "Tải file ảnh lên",
    sponsored_ad: "Quảng cáo nổi bật (Sponsored)",
    sales_report: "Báo cáo doanh thu",
    export_excel: "Xuất báo cáo Excel",
    no_orders_seller: "Chưa có đơn hàng nào của shop.",
    
    // Admin Dashboard
    admin_dashboard: "Bảng điều khiển Admin",
    b2c_approval_tab: "Duyệt shop B2C",
    dispute_resolution_tab: "Trọng tài tranh chấp",
    user_management_tab: "Quản lý người dùng",
    gmv_stats: "Tổng giao dịch toàn sàn (GMV)",
    active_users: "Người dùng hoạt động",
    approve_btn: "Phê duyệt",
    block_btn: "Khóa tài khoản",
    unblock_btn: "Mở khóa tài khoản",
    action_refund_buyer: "Hoàn trả người mua",
    action_release_seller: "Giải ngân người bán",
    resolution_label: "Quyết định xử lý",
    
    // Chatbot widget
    chatbot_title: "Trợ lý mua sắm AI",
    chatbot_placeholder: "Nhập câu hỏi tại đây...",
    send: "Gửi"
  },
  en: {
    // Common / Navigation
    home: "Home",
    cart: "Cart",
    orders: "My Orders",
    seller_channel: "Seller Channel",
    admin_channel: "Admin Dashboard",
    login: "Log In",
    logout: "Log Out",
    welcome: "Welcome",
    language: "Language",
    search_placeholder: "Search products, brands (e.g. phone, laptop...)",
    search_btn: "Search",
    all_products: "All Products",
    mall_products: "B2C Mall (Official)",
    c2c_products: "C2C Market (Individual)",
    categories: "Categories",
    sponsored: "Sponsored",
    international_shipping: "Int'l Shipping",
    no_products: "No products found.",
    
    // Product Details
    price: "Price",
    stock: "Stock",
    sku: "SKU",
    shop: "Shop",
    product_description: "Product Description",
    ai_description_btn: "🤖 AI Description Writer",
    add_to_cart: "Add to Cart",
    buy_now: "Buy Now",
    reviews: "Buyer Reviews",
    no_reviews: "No reviews for this product yet.",
    rating: "Rating",
    comment: "Comment",
    write_review: "Write a Review",
    submit_review: "Submit Review",
    shop_reply: "Seller Reply",
    reply_placeholder: "Reply to buyer review...",
    reply_btn: "Submit Reply",
    
    // Cart / Checkout
    cart_title: "Your Cart",
    cart_empty: "Your cart is empty. Shop now!",
    group_by_shop: "Group by Shop",
    product: "Product",
    quantity: "Qty",
    action: "Action",
    remove: "Remove",
    checkout_summary: "Order Summary",
    shipping_fee: "Shipping Fee",
    shipping_partner: "Shipping Carrier",
    payment_method: "Payment Method",
    cod: "Cash on Delivery (COD)",
    wallet_pay: "Internal Wallet",
    escrow_pay: "Escrow Escort (Platform Held)",
    shipping_address: "Shipping Address",
    place_order: "Place Order",
    order_success: "Ordered successfully!",
    
    // Wallet
    wallet_title: "E-Wallet Portal",
    wallet_balance: "Wallet Balance",
    deposit: "Deposit to Wallet",
    withdraw: "Withdraw to Bank",
    amount: "Amount",
    bank_name: "Bank Name",
    account_no: "Account Number",
    tx_history: "Transaction History",
    tx_deposit: "Deposit",
    tx_withdraw: "Withdrawal",
    tx_payment: "Payment",
    tx_refund: "Refund",
    tx_receive: "Receive",
    tx_desc: "Description",
    tx_time: "Time",
    
    // Address Management
    address_title: "Shipping Address Book",
    receiver_name: "Recipient Name",
    phone: "Phone Number",
    address_detail: "Detailed Address",
    is_default: "Set as default",
    add_address: "Add New Address",
    default_badge: "Default",
    set_default: "Set Default",
    
    // Orders / Disputes
    order_id: "Order ID",
    order_status: "Status",
    order_total: "Total",
    order_pending: "Pending",
    order_processing: "Processing",
    order_shipped: "Shipped",
    order_delivered: "Delivered",
    order_cancelled: "Cancelled",
    confirm_receipt: "Confirm Delivery (Release funds)",
    dispute_btn: "Dispute / Refund",
    dispute_reason: "Refund Dispute Reason",
    dispute_submit: "Submit Claim",
    dispute_pending: "Awaiting Admin Arbitration",
    
    // Seller Dashboard
    seller_dashboard: "Seller Dashboard",
    my_shop_info: "Shop Profile",
    shop_name: "Shop Name",
    shop_type: "Shop Type",
    individual: "Individual (C2C)",
    business: "Business (B2C)",
    tax_code: "Tax ID Code",
    address: "Address",
    register_shop_btn: "Register Shop Profile",
    shop_approved: "Approval Status",
    approved: "Approved",
    pending_approval: "Pending Approval",
    shop_banner: "Shop Banner Image",
    update_banner: "Update Banner",
    add_product: "Add Product",
    edit_product: "Edit Product",
    product_name: "Product Name",
    image: "Product Image",
    upload_file: "Upload Photo",
    sponsored_ad: "Sponsored Showcase",
    sales_report: "Sales Report",
    export_excel: "Export Excel Report",
    no_orders_seller: "No orders placed in your shop.",
    
    // Admin Dashboard
    admin_dashboard: "Admin Management Portal",
    b2c_approval_tab: "Verify B2C Shops",
    dispute_resolution_tab: "Arbitrate Disputes",
    user_management_tab: "User Accounts",
    gmv_stats: "Gross Merchandise Value (GMV)",
    active_users: "Active Accounts",
    approve_btn: "Approve Mall",
    block_btn: "Freeze Account",
    unblock_btn: "Unfreeze Account",
    action_refund_buyer: "Refund to Buyer",
    action_release_seller: "Release to Seller",
    resolution_label: "Arbitration Notes",
    
    // Chatbot widget
    chatbot_title: "AI Shop Assistant",
    chatbot_placeholder: "Ask me anything...",
    send: "Send"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('vi');

  // Load language preference from localStorage
  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang && (storedLang === 'vi' || storedLang === 'en')) {
      setLanguage(storedLang);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
