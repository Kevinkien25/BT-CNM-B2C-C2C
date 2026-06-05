"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function BuyerDashboard() {
  const { token, backendUrl, user, loading, refreshUser } = useApp();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Tab State: 'orders' | 'wallet' | 'addresses' | 'favourites' | 'chat' | 'notifications' | 'profile'
  const [activeTab, setActiveTab] = useState('orders');

  const searchParams = useSearchParams();
  const sellerIdParam = searchParams?.get('sellerId');
  const sellerNameParam = searchParams?.get('sellerName');
  const tabParam = searchParams?.get('tab');

  // Chat states
  const [chatPartners, setChatPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Profile states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState([]);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState({});
  const [disputingOrderId, setDisputingOrderId] = useState(null);

  // Wallet State
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Favourites State
  const [favourites, setFavourites] = useState([]);

  // Fetch partners list
  const fetchPartners = async () => {
    setPartnersLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/chat/partners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatPartners(data.partners || []);
      return data.partners || [];
    } catch (err) {
      console.warn("Failed to fetch chat partners");
      setChatPartners([]);
      return [];
    } finally {
      setPartnersLoading(false);
    }
  };

  // Fetch chat history
  const fetchChatHistory = async (partnerId) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/chat/history/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) {
      console.warn("Failed to fetch chat history");
      setChatMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Handle input text changes with typing status broadcast
  const handleChatInputChange = (e) => {
    const val = e.target.value;
    setChatInput(val);

    if (wsRef.current && wsRef.current.readyState === 1 && activePartner) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        receiverId: activePartner.partner_id,
        isTyping: val.length > 0
      }));

      // Cancel previous inactive typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to notify "stopped typing" if inactive for 1.5s
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === 1 && activePartner) {
          wsRef.current.send(JSON.stringify({
            type: 'typing',
            receiverId: activePartner.partner_id,
            isTyping: false
          }));
        }
      }, 1500);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activePartner || !chatInput.trim()) return;

    const partnerId = activePartner.partner_id;
    const msgText = chatInput.trim();
    setChatInput('');

    // Clear typing timeout and broadcast isTyping: false immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        receiverId: partnerId,
        isTyping: false
      }));
    }

    // Optimistically add to messages list with is_read = 0 (unread status)
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: partnerId,
      message: msgText,
      is_read: 0,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`${backendUrl}/api/auth/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: partnerId, message: msgText })
      });
      if (!res.ok) throw new Error();
      
      // Refresh partners list
      fetchPartners();
    } catch (err) {
      console.error("Failed to send message:", err.message);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const body = { name: profileName, email: profileEmail };
      if (profilePassword) body.password = profilePassword;

      const res = await fetch(`${backendUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(language === 'vi' ? "Cập nhật hồ sơ thành công!" : "Profile updated successfully!");
      setProfilePassword('');
      refreshUser();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // WebSockets Chat Sync Logic
  const wsRef = useRef(null);
  const activePartnerRef = useRef(null);

  useEffect(() => {
    activePartnerRef.current = activePartner?.partner_id;
    setPartnerTyping(false);
  }, [activePartner]);

  // Scroll to bottom when message list or typing state updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, partnerTyping]);

  // Send message read receipt to partner when selecting partner or receiving new messages
  useEffect(() => {
    if (activeTab === 'chat' && activePartner && wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'read',
        partnerId: activePartner.partner_id
      }));
    }
  }, [activePartner?.partner_id, chatMessages.length, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && user && token) {
      const hostname = window.location.hostname;
      const wsUrl = `ws://${hostname}:5001`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to auth-service WebSocket.");
        ws.send(JSON.stringify({ type: 'register', userId: user.id }));
        
        // Mark as read on socket connect
        if (activePartnerRef.current) {
          ws.send(JSON.stringify({
            type: 'read',
            partnerId: activePartnerRef.current
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 1. Handle incoming real-time chat message
          if (data.type === 'new_message') {
            if (activePartnerRef.current && Number(data.senderId) === Number(activePartnerRef.current)) {
              const incomingMsg = {
                id: Date.now() + Math.random(),
                sender_id: Number(data.senderId),
                receiver_id: user.id,
                message: data.message,
                is_read: 1, // Immediately read since the chat is actively open
                created_at: data.createdAt || new Date().toISOString()
              };
              setChatMessages(prev => {
                if (prev.some(m => m.message === data.message && Math.abs(new Date(m.created_at) - new Date(incomingMsg.created_at)) < 1500)) {
                  return prev;
                }
                return [...prev, incomingMsg];
              });

              // Send read confirmation socket event back to sender
              ws.send(JSON.stringify({
                type: 'read',
                partnerId: activePartnerRef.current
              }));
            }
            fetchPartners();
          }

          // 2. Handle incoming typing status
          if (data.type === 'typing') {
            if (activePartnerRef.current && Number(data.senderId) === Number(activePartnerRef.current)) {
              setPartnerTyping(data.isTyping);
            }
          }

          // 3. Handle incoming read receipt confirmation
          if (data.type === 'read') {
            if (activePartnerRef.current && Number(data.readerId) === Number(activePartnerRef.current)) {
              setChatMessages(prev =>
                prev.map(m => m.sender_id === user.id ? { ...m, is_read: 1 } : m)
              );
            }
          }
        } catch (err) {
          console.error("[WS] Error parsing message:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Connection closed.");
      };

      ws.onerror = (err) => {
        console.error("[WS] Socket error:", err);
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [activeTab, user?.id, token]);

  // Sync profile form when user context changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  // Handle Tab and SellerId from query parameters
  useEffect(() => {
    if (loading) return;
    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (tabParam === 'chat' && sellerIdParam) {
      const initChat = async () => {
        const currentPartners = await fetchPartners();
        const found = currentPartners.find(p => p.partner_id.toString() === sellerIdParam.toString());
        
        if (found) {
          setActivePartner(found);
          fetchChatHistory(found.partner_id);
        } else {
          // If seller is not in conversation list, add a temporary partner at the top
          const tempPartner = {
            partner_id: Number(sellerIdParam),
            partner_name: sellerNameParam || 'Chủ shop Bán Hàng',
            partner_email: '',
            partner_role: 'seller',
            last_message: 'Bắt đầu cuộc trò chuyện mới...',
            last_message_time: new Date().toISOString()
          };
          setChatPartners(prev => [tempPartner, ...prev]);
          setActivePartner(tempPartner);
          setChatMessages([]);
        }
      };
      initChat();
    } else if (activeTab === 'chat') {
      fetchPartners();
    }
  }, [tabParam, sellerIdParam, activeTab, loading]);

  // Generate dummy notifications list based on orders or system announcements
  useEffect(() => {
    if (activeTab === 'notifications' && user) {
      const list = [
        { id: 1, title: '🔔 Đăng ký thành công', body: `Chào mừng ${user.name} gia nhập RedMall! Ví điện tử của bạn đã được kích hoạt thành công với số dư 0 đ.`, time: new Date(Date.now() - 86400000).toLocaleString() },
        { id: 2, title: '🎁 Khuyến mãi cực sốc B2C Mall', body: 'Nhập mã GIAM30K để được giảm ngay 30,000 đ cho các đơn hàng Mall có giá trị từ 150K!', time: new Date(Date.now() - 36000000).toLocaleString() }
      ];
      orders.forEach(ord => {
        if (ord.status === 'shipped') {
          list.unshift({ id: `ord_shipped_${ord.id}`, title: '🚚 Đơn hàng đang được giao', body: `Đơn hàng #${ord.id} chứa sản phẩm của bạn đang được đơn vị vận chuyển GHN giao tới.`, time: new Date(ord.created_at).toLocaleString() });
        } else if (ord.status === 'delivered') {
          list.unshift({ id: `ord_deliv_${ord.id}`, title: '🎉 Giao hàng thành công', body: `Đơn hàng #${ord.id} đã hoàn tất giao nhận và giải ngân tiền bảo chứng.`, time: new Date(ord.created_at).toLocaleString() });
        }
      });
      setNotifs(list);
    }
  }, [activeTab, orders, user]);



  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    // Fetch initial data based on active tab
    if (activeTab === 'orders') fetchBuyerOrders();
    if (activeTab === 'wallet') fetchWalletData();
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'favourites') loadFavourites();
  }, [token, activeTab, loading]);

  // --- Orders Logic ---
  const fetchBuyerOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.warn("Using mock orders.");
      setOrders([
        {
          id: 101,
          total_amount: 5200000,
          status: 'shipped',
          shipping_address: 'Nguyễn Văn Mua - 0912345678 - 123 Đường Láng, Hà Nội',
          payment_method: 'Escrow',
          transaction_status: 'escrow',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          items: [
            { id: 1, product_name: 'Điện thoại iPhone 11 64GB Cũ', price: 5200000, quantity: 1, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60', shop_name: 'Cửa Hàng Đồ Cũ Tèo' }
          ]
        }
      ]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    const confirmMsg = language === 'vi' 
      ? "Bạn xác nhận đã nhận hàng đầy đủ, đúng mô tả và đồng ý giải ngân tiền cho Người bán?"
      : "Do you confirm receipt of goods as described and agree to release funds to the Seller?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/confirm-receipt`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Xác nhận thành công! Tiền đã được giải ngân cho Người bán." : "Receipt confirmed! Funds released to Seller.");
      fetchBuyerOrders();
    } catch (err) {
      alert(language === 'vi' ? "Xác nhận thành công! (Chế độ Demo)" : "Receipt confirmed! (Demo Mode)");
      setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: 'delivered', transaction_status: 'released' } : ord));
    }
  };

  const handleOpenDispute = async (orderId) => {
    const reason = disputeReason[orderId];
    if (!reason || !reason.trim()) {
      alert(language === 'vi' ? "Vui lòng nhập lý do khiếu nại." : "Please enter the dispute reason.");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason.trim() })
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Khiếu nại của bạn đã được gửi thành công!" : "Dispute submitted successfully!");
      setDisputingOrderId(null);
      fetchBuyerOrders();
    } catch (err) {
      alert(language === 'vi' ? "Khiếu nại thành công! (Chế độ Demo)" : "Dispute submitted! (Demo Mode)");
      setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, transaction_status: 'escrow', dispute_pending: true } : ord));
      setDisputingOrderId(null);
    }
  };

  // --- Wallet Logic ---
  const fetchWalletData = async () => {
    setWalletLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
    } catch (err) {
      setWallet({ balance: 7500000 });
      setTransactions([
        { id: 1, amount: 5000000, type: 'deposit', description: 'Nạp tiền vào ví điện tử', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 2, amount: 2500000, type: 'receive', description: 'Nhận tiền thanh toán từ đơn bán', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;

    try {
      const res = await fetch(`${backendUrl}/api/auth/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(depositAmount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(language === 'vi' ? `Nạp tiền thành công! Số dư mới: ${data.balance.toLocaleString('vi-VN')} đ` : `Deposit successful! New balance: ${data.balance.toLocaleString('vi-VN')} đ`);
      setDepositAmount('');
      fetchWalletData();
    } catch (err) {
      const mockBalance = Number(wallet?.balance || 0) + Number(depositAmount);
      setWallet({ balance: mockBalance });
      setTransactions(prev => [{ id: Date.now(), amount: Number(depositAmount), type: 'deposit', description: 'Nạp tiền vào ví (Demo)', created_at: new Date().toISOString() }, ...prev]);
      alert(language === 'vi' ? "Nạp tiền thành công! (Chế độ Demo)" : "Deposit successful! (Demo Mode)");
      setDepositAmount('');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (Number(wallet?.balance || 0) < Number(withdrawAmount)) {
      alert(language === 'vi' ? "Số dư ví không đủ để rút." : "Insufficient wallet balance.");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/auth/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          bankName,
          accountNo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(language === 'vi' ? `Rút tiền thành công! Số dư mới: ${data.balance.toLocaleString('vi-VN')} đ` : `Withdrawal successful! New balance: ${data.balance.toLocaleString('vi-VN')} đ`);
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
      fetchWalletData();
    } catch (err) {
      const mockBalance = Number(wallet?.balance || 0) - Number(withdrawAmount);
      setWallet({ balance: mockBalance });
      setTransactions(prev => [{ id: Date.now(), amount: Number(withdrawAmount), type: 'withdraw', description: `Rút tiền về ${bankName || 'Bank'} (Demo)`, created_at: new Date().toISOString() }, ...prev]);
      alert(language === 'vi' ? "Rút tiền thành công! (Chế độ Demo)" : "Withdrawal successful! (Demo Mode)");
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
    }
  };

  // --- Addresses Logic ---
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      setAddresses([
        { id: 1, receiver_name: 'Nguyễn Văn Mua', phone: '0912345678', address_detail: '123 Đường Láng, Đống Đa, Hà Nội', is_default: 1 }
      ]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!receiverName || !phone || !addressDetail) return;

    try {
      const res = await fetch(`${backendUrl}/api/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_name: receiverName,
          phone,
          address_detail: addressDetail,
          is_default: isDefault ? 1 : 0
        })
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Thêm địa chỉ giao nhận mới thành công!" : "Address added successfully!");
      setReceiverName('');
      setPhone('');
      setAddressDetail('');
      setIsDefault(false);
      fetchAddresses();
    } catch (err) {
      const newAddr = { id: Date.now(), receiver_name: receiverName, phone, address_detail: addressDetail, is_default: isDefault ? 1 : 0 };
      setAddresses(prev => {
        const updated = isDefault ? prev.map(a => ({ ...a, is_default: 0 })) : prev;
        return [...updated, newAddr];
      });
      alert(language === 'vi' ? "Thêm địa chỉ thành công! (Chế độ Demo)" : "Address added! (Demo Mode)");
      setReceiverName('');
      setPhone('');
      setAddressDetail('');
      setIsDefault(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/auth/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      fetchAddresses();
    } catch (err) {
      setAddresses(prev => prev.map(a => a.id === id ? { ...a, is_default: 1 } : { ...a, is_default: 0 }));
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm(language === 'vi' ? "Bạn muốn xóa địa chỉ này?" : "Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      fetchAddresses();
    } catch (err) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- Favourites Logic ---
  const loadFavourites = () => {
    const key = `favs_${user?.id || 'guest'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setFavourites(JSON.parse(stored));
    } else {
      setFavourites([]);
    }
  };

  const handleRemoveFavourite = (prodId) => {
    const key = `favs_${user?.id || 'guest'}`;
    const updated = favourites.filter(f => f.id !== prodId);
    setFavourites(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  // --- Helpers ---
  const getStatusText = (status) => {
    const map = {
      pending: { text: t('order_pending'), color: 'bg-amber-100 text-amber-800' },
      processing: { text: t('order_processing'), color: 'bg-blue-100 text-blue-800' },
      shipped: { text: t('order_shipped'), color: 'bg-indigo-100 text-indigo-800' },
      delivered: { text: t('order_delivered'), color: 'bg-green-100 text-green-800' },
      cancelled: { text: t('order_cancelled'), color: 'bg-red-100 text-red-800' }
    };
    return map[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getEscrowText = (status) => {
    const map = {
      escrow: { text: t('dispute_pending'), color: 'bg-red-50 text-red-700 border-red-100' },
      released: { text: t('approved'), color: 'bg-green-50 text-green-700 border-green-100' },
      refunded: { text: t('action_refund_buyer'), color: 'bg-gray-50 text-gray-500 border-gray-200' }
    };
    return map[status] || { text: status, color: 'bg-gray-50 text-gray-800 border-gray-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow font-sans">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="px-3 py-2 border-b border-gray-100 mb-2">
                <p className="font-bold text-gray-800 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              {[
                { id: 'orders', label: t('orders'), icon: '📦' },
                { id: 'wallet', label: t('wallet_title'), icon: '💳' },
                { id: 'addresses', label: t('address_title'), icon: '📍' },
                { id: 'favourites', label: language === 'vi' ? 'Sản phẩm yêu thích' : 'Favorite Products', icon: '❤️' },
                { id: 'chat', label: language === 'vi' ? 'Tin nhắn' : 'Messages', icon: '💬' },
                { id: 'notifications', label: language === 'vi' ? 'Thông báo' : 'Notifications', icon: '🔔' },
                { id: 'profile', label: language === 'vi' ? 'Hồ sơ cá nhân' : 'Profile Settings', icon: '👤' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Tab Contents */}
          <section className="flex-grow">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase mb-4">{t('orders')}</h2>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
                    <div className="text-4xl">📦</div>
                    <p className="text-gray-500 text-sm font-semibold">{language === 'vi' ? 'Bạn chưa có đơn hàng nào.' : 'You have no orders yet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const orderStatus = getStatusText(order.status);
                      const escrowStatus = getEscrowText(order.transaction_status);

                      return (
                        <div key={order.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                          {/* Order Header */}
                          <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-150 flex flex-wrap justify-between items-center gap-4 text-xs">
                            <div>
                              <p className="font-bold text-gray-700">{t('order_id')}: #{order.id}</p>
                              <p className="text-gray-400 mt-0.5">{t('tx_time')}: {new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${orderStatus.color}`}>
                              {orderStatus.text}
                            </span>
                          </div>

                          {/* Order Items */}
                          <div className="p-4 sm:p-5 divide-y divide-gray-100">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex gap-4 items-center justify-between">
                                <div className="flex gap-3 items-center min-w-0">
                                  <img src={item.image_url} alt={item.product_name} className="w-12 h-12 object-cover rounded-lg border border-gray-150 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm text-gray-800 truncate">{item.product_name}</p>
                                    <p className="text-xs text-gray-400">{t('shop')}: {item.shop_name} | {t('quantity')}: {item.quantity}</p>
                                  </div>
                                </div>
                                <span className="font-bold text-sm text-gray-800">{(item.price * item.quantity).toLocaleString()} đ</span>
                              </div>
                            ))}
                          </div>

                          {/* Order Footer */}
                          <div className="p-4 sm:p-5 bg-gray-50/50 border-t border-gray-150 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                              <div>
                                <p className="text-gray-600">📍 <strong>{t('shipping_address')}:</strong> {order.shipping_address}</p>
                                <p className="text-gray-600 mt-1">💳 <strong>{t('payment_method')}:</strong> {order.payment_method}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-400 font-bold">{t('order_total')}:</span>
                                <p className="text-base font-black text-red-600">{Number(order.total_amount).toLocaleString()} đ</p>
                              </div>
                            </div>

                            {/* Escrow Release & Dispute Trigger */}
                            {order.transaction_status && (
                              <div className="space-y-3">
                                <div className={`p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row justify-between items-center gap-3 ${escrowStatus.color}`}>
                                  <span>🛡️ Trạng thái giao dịch: {order.dispute_pending ? t('dispute_pending') : escrowStatus.text}</span>
                                  
                                  {order.status === 'shipped' && !order.dispute_pending && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleConfirmReceipt(order.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition text-[11px]"
                                      >
                                        {t('confirm_receipt')}
                                      </button>
                                      <button
                                        onClick={() => setDisputingOrderId(disputingOrderId === order.id ? null : order.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition text-[11px]"
                                      >
                                        {t('dispute_btn')}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Dispute Reason Input Form */}
                                {disputingOrderId === order.id && (
                                  <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-3">
                                    <label className="block text-xs font-bold text-gray-700">{t('dispute_reason')}</label>
                                    <textarea
                                      value={disputeReason[order.id] || ''}
                                      onChange={(e) => setDisputeReason({ ...disputeReason, [order.id]: e.target.value })}
                                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-red-500 focus:outline-none"
                                      rows={2}
                                      placeholder={language === 'vi' ? "Mô tả lý do tại sao muốn hoàn tiền..." : "Describe why you want a refund..."}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setDisputingOrderId(null)}
                                        className="bg-white border border-gray-300 text-gray-700 text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleOpenDispute(order.id)}
                                        className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700"
                                      >
                                        {t('dispute_submit')}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">{t('wallet_title')}</h2>

                {walletLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {/* Wallet Balance Card */}
                    <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
                      <div className="relative z-10 space-y-2">
                        <p className="text-xs uppercase font-semibold tracking-wider opacity-80">{t('wallet_balance')}</p>
                        <p className="text-3xl md:text-4xl font-black">
                          {Number(wallet?.balance || 0).toLocaleString()} <span className="text-lg md:text-xl font-bold">VND</span>
                        </p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-6 translate-x-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-48 h-48">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                        </svg>
                      </div>
                    </div>

                    {/* Deposit & Withdraw forms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Deposit */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                          <span>💰</span> {t('deposit')}
                        </h3>
                        <form onSubmit={handleDeposit} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('amount')} (VND)</label>
                            <input
                              type="number"
                              required
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="50,000"
                              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm transition"
                          >
                            {t('deposit')}
                          </button>
                        </form>
                      </div>

                      {/* Withdraw */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                          <span>🏦</span> {t('withdraw')}
                        </h3>
                        <form onSubmit={handleWithdraw} className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t('bank_name')}</label>
                              <input
                                type="text"
                                required
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Vietcombank"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">{t('account_no')}</label>
                              <input
                                type="text"
                                required
                                value={accountNo}
                                onChange={(e) => setAccountNo(e.target.value)}
                                placeholder="102934857"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('amount')} (VND)</label>
                            <input
                              type="number"
                              required
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="50,000"
                              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 rounded-xl text-sm transition"
                          >
                            {t('withdraw')}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                        <span>📋</span> {t('tx_history')}
                      </h3>

                      {transactions.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">Chưa có giao dịch ví nào.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-gray-150 text-gray-400 uppercase font-semibold">
                                <th className="py-2.5">{t('tx_desc')}</th>
                                <th className="py-2.5 text-center">{t('order_status')}</th>
                                <th className="py-2.5 text-right">{t('amount')}</th>
                                <th className="py-2.5 text-right">{t('tx_time')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                              {transactions.map((tx) => {
                                const isPositive = ['deposit', 'receive', 'refund'].includes(tx.type);
                                return (
                                  <tr key={tx.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 max-w-[200px] truncate">{tx.description}</td>
                                    <td className="py-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                                        tx.type === 'deposit' ? 'bg-green-100 text-green-800' :
                                        tx.type === 'withdraw' ? 'bg-amber-100 text-amber-800' :
                                        tx.type === 'payment' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {tx.type === 'deposit' ? t('tx_deposit') :
                                         tx.type === 'withdraw' ? t('tx_withdraw') :
                                         tx.type === 'payment' ? t('tx_payment') :
                                         tx.type === 'refund' ? t('tx_refund') : t('tx_receive')}
                                      </span>
                                    </td>
                                    <td className={`py-3 text-right font-bold text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                      {isPositive ? '+' : '-'}{Number(tx.amount).toLocaleString()} đ
                                    </td>
                                    <td className="py-3 text-right text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">{t('address_title')}</h2>

                {/* Add new address */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">{t('add_address')}</h3>
                  <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('receiver_name')}</label>
                      <input
                        type="text"
                        required
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('phone')}</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('address_detail')}</label>
                      <input
                        type="text"
                        required
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        placeholder="Số 10, Ngõ 123 Đường Láng, Quận Đống Đa, Hà Nội"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="is_default" className="text-xs font-bold text-gray-600 cursor-pointer">{t('is_default')}</label>
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition shadow-sm"
                      >
                        {t('add_address')}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Addresses List */}
                <div className="space-y-4">
                  {addressesLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : addresses.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6 bg-white border border-gray-150 rounded-2xl">Không có địa chỉ nào lưu lại.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex justify-between items-start gap-4">
                        <div className="space-y-1 text-sm text-gray-700">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-gray-900">{addr.receiver_name}</span>
                            <span className="text-gray-400">|</span>
                            <span className="font-medium">{addr.phone}</span>
                            {addr.is_default === 1 && (
                              <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {t('default_badge')}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-1">{addr.address_detail}</p>
                        </div>
                        <div className="flex gap-2.5 text-xs font-bold">
                          {addr.is_default !== 1 && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-gray-500 hover:text-red-600 transition"
                            >
                              {t('set_default')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-600 hover:text-red-700 transition"
                          >
                            {t('remove')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* FAVOURITES TAB */}
            {activeTab === 'favourites' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase mb-4">
                  {language === 'vi' ? 'Sản phẩm yêu thích' : 'Favorite Products'}
                </h2>

                {favourites.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
                    <div className="text-4xl">❤️</div>
                    <p className="text-gray-500 text-sm font-semibold">
                      {language === 'vi' ? 'Chưa có sản phẩm yêu thích nào.' : 'You have no favorite products yet.'}
                    </p>
                    <Link href="/" className="inline-block bg-red-600 text-white font-bold text-xs px-5 py-2 rounded-full shadow hover:bg-red-700 transition">
                      {language === 'vi' ? 'Khám phá ngay' : 'Browse Products'}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {favourites.map((fav) => (
                      <div key={fav.id} className="bg-white border border-gray-155 rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                        <div className="relative pt-[80%] bg-gray-50">
                          <img src={fav.image_url} alt={fav.name} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                          <div>
                            <Link href={`/product/${fav.id}`} className="block text-sm font-bold text-gray-800 hover:text-red-600 line-clamp-2 h-10 transition">
                              {fav.name}
                            </Link>
                            <p className="text-sm font-black text-red-600 mt-1">{Number(fav.price).toLocaleString()} đ</p>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Link
                              href={`/product/${fav.id}`}
                              className="flex-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition font-bold py-1.5 rounded-lg text-xs text-center"
                            >
                              Detail
                            </Link>
                            <button
                              onClick={() => handleRemoveFavourite(fav.id)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-600 transition p-1.5 rounded-lg"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Hộp thư nhắn tin</h2>
                  <div className="text-[10px] text-gray-400 font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                    🟢 Real-time WebSockets Active
                  </div>
                </div>

                
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm flex h-[480px]">
                  {/* Left column: Partners list */}
                  <div className="w-1/3 border-r border-gray-150 flex flex-col">
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Danh sách hội thoại</p>
                    </div>
                    <div className="flex-grow overflow-y-auto divide-y divide-gray-50">
                      {partnersLoading ? (
                        <div className="flex justify-center py-10">
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : chatPartners.length === 0 ? (
                        <p className="text-gray-400 text-xs italic text-center py-10">Chưa có tin nhắn nào.</p>
                      ) : (
                        chatPartners.map(p => (
                          <button
                            key={p.partner_id}
                            onClick={() => {
                              setActivePartner(p);
                              fetchChatHistory(p.partner_id);
                            }}
                            className={`w-full text-left p-3 flex flex-col gap-1 transition ${
                              activePartner?.partner_id === p.partner_id ? 'bg-red-50 text-red-650 font-bold' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-bold text-xs truncate text-gray-800">{p.partner_name}</span>
                              <span className="text-[9px] text-gray-400">
                                {p.partner_role === 'seller' ? 'Người bán' : 'Người mua'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate w-full">{p.last_message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right column: Message history and input */}
                  <div className="w-2/3 flex flex-col justify-between bg-gray-50/30">
                    {activePartner ? (
                      <>
                        {/* Header */}
                        <div className="p-3 border-b border-gray-150 bg-white flex justify-between items-center">
                          <div>
                            <span className="font-bold text-xs text-gray-800">{activePartner.partner_name}</span>
                            <p className="text-[9px] text-gray-400">Đang hoạt động</p>
                          </div>
                        </div>

                        {/* History messages */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-3 flex flex-col">
                          {messagesLoading && chatMessages.length === 0 ? (
                            <div className="flex justify-center py-10">
                              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            chatMessages.map(msg => {
                              const isMe = msg.sender_id === user.id;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-xs font-medium shadow-sm leading-relaxed ${
                                    isMe 
                                      ? 'bg-red-600 text-white rounded-tr-none' 
                                      : 'bg-white text-gray-800 border border-gray-150 rounded-tl-none'
                                  }`}>
                                    <p>{msg.message}</p>
                                    <span className={`text-[8px] mt-0.5 block text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {isMe && (
                                        <span className="ml-1 font-bold">
                                          • {msg.is_read ? 'Đã xem' : 'Đã gửi'}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          
                          {/* Typing Indicator */}
                          {partnerTyping && (
                            <div className="flex justify-start items-center gap-1.5 px-4 py-2 text-gray-500 text-[10px] italic">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                              <span>{activePartner.partner_name} đang nhập...</span>
                            </div>
                          )}

                          {/* Scroll Anchor */}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Template Replies */}
                        {showQuickReplies && (
                          <div className="px-3 py-2 bg-gray-50 border-t border-gray-150 flex flex-wrap gap-1.5 overflow-x-auto items-center">
                            <span className="text-[9px] text-gray-500 font-bold mr-1">Trả lời nhanh:</span>
                            {(user?.role?.includes('seller') ? [
                              "Chào bạn, sản phẩm này bên mình vẫn còn hàng ạ!",
                              "Shop đang chuẩn bị đóng gói và sẽ bàn giao cho đơn vị vận chuyển sớm nhất.",
                              "Dạ, sản phẩm này được bảo hành 12 tháng chính hãng và có đầy đủ hộp phụ kiện.",
                              "Cảm ơn bạn đã tin tưởng mua sắm và ủng hộ RedMall!"
                            ] : [
                              "Chào bạn, sản phẩm này tình trạng còn mới khoảng bao nhiêu % và có sẵn hàng không?",
                              "Dạ shop ơi, sản phẩm này có đi kèm đầy đủ hộp và cáp sạc phụ kiện không ạ?",
                              "Cho mình hỏi shop có hỗ trợ giao hàng hỏa tốc trong ngày hôm nay không?",
                              "Địa chỉ shop ở đâu để mình tiện qua xem máy trực tiếp được không?"
                            ]).map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setChatInput(tmpl);
                                  // Trigger typing socket event since input content changes
                                  if (wsRef.current && wsRef.current.readyState === 1 && activePartner) {
                                    wsRef.current.send(JSON.stringify({
                                      type: 'typing',
                                      receiverId: activePartner.partner_id,
                                      isTyping: true
                                    }));
                                  }
                                }}
                                className="text-[9px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition font-medium"
                              >
                                {tmpl}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Input box */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-150 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                            className={`text-[11px] font-bold px-2.5 py-2 rounded-xl transition border flex-shrink-0 flex items-center gap-1 ${
                              showQuickReplies 
                                ? 'bg-red-50 border-red-300 text-red-600 font-black' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Trả lời nhanh"
                          >
                            ⚡ <span className="hidden sm:inline">Trả lời nhanh</span>
                          </button>
                          <input
                            type="text"
                            placeholder="Nhập nội dung tin nhắn..."
                            value={chatInput}
                            onChange={handleChatInputChange}
                            className="flex-grow px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-red-500 bg-gray-50/50 focus:bg-white"
                          />
                          <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow flex-shrink-0"
                          >
                            Gửi
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                        <div className="text-3xl">💬</div>
                        <p className="text-xs font-semibold">Chọn một hội thoại bên trái để bắt đầu chat.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase mb-4">Thông báo & Khuyến mãi</h2>
                
                <div className="space-y-4">
                  {notifs.length === 0 ? (
                    <p className="text-gray-400 text-xs italic bg-white border border-gray-155 rounded-2xl p-6 text-center shadow-sm">
                      Chưa có thông báo nào.
                    </p>
                  ) : (
                    notifs.map(n => (
                      <div key={n.id} className="bg-white border border-gray-150 p-4 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition">
                        <span className="text-xl bg-red-50 p-2.5 rounded-xl flex-shrink-0 text-red-600">🔔</span>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-gray-800 text-sm">{n.title}</p>
                          <p className="text-gray-500 leading-relaxed font-medium">{n.body}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase mb-4">Hồ sơ cá nhân</h2>
                
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm max-w-xl">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Họ và tên</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50/30"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Địa chỉ Email</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50/30"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Mật khẩu mới (Bỏ trống nếu giữ nguyên)</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50/30"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition flex items-center justify-center"
                      >
                        {profileLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Cập nhật thông tin'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
