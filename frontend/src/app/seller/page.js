"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SellerDashboard() {
  const { user, token, refreshUser, backendUrl, loading: authLoading } = useApp();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Active Tab: 'products' | 'orders' | 'wallet' | 'vouchers' | 'analytics' | 'branding'
  const [activeTab, setActiveTab] = useState('products');

  // Shop registration state
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [shopType, setShopType] = useState('individual');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(null);

  // Products state
  const [myProducts, setMyProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product Form states
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pSku, setPSku] = useState('');
  const [pImage, setPImage] = useState('');
  const [pCategory, setPCategory] = useState('Điện thoại & Tablet');
  const [pSponsored, setPSponsored] = useState(false);
  const [pInternational, setPInternational] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

      // Incoming Orders state
      const [shopOrders, setShopOrders] = useState([]);
      const [ordLoading, setOrdLoading] = useState(false);

      // Wallet State
      const [wallet, setWallet] = useState(null);
      const [transactions, setTransactions] = useState([]);
      const [walletLoading, setWalletLoading] = useState(false);
      const [withdrawAmount, setWithdrawAmount] = useState('');
      const [bankName, setBankName] = useState('');
      const [accountNo, setAccountNo] = useState('');

      // Vouchers State
      const [vouchers, setVouchers] = useState([]);
      const [vCode, setVCode] = useState('');
      const [vDiscount, setVDiscount] = useState('');
      const [vMinOrder, setVMinOrder] = useState('');

      // Branding Banner State
      const [shopBannerUrl, setShopBannerUrl] = useState('');
      const [updatingBanner, setUpdatingBanner] = useState(false);

      // Chat States
      const [chatPartners, setChatPartners] = useState([]);
      const [activePartner, setActivePartner] = useState(null);
      const [chatMessages, setChatMessages] = useState([]);
      const [chatInput, setChatInput] = useState('');
      const [partnersLoading, setPartnersLoading] = useState(false);
      const [messagesLoading, setMessagesLoading] = useState(false);
      const [partnerTyping, setPartnerTyping] = useState(false);
      const [showQuickReplies, setShowQuickReplies] = useState(false);
      
      const wsRef = useRef(null);
      const activePartnerRef = useRef(null);
      const typingTimeoutRef = useRef(null);
      const messagesEndRef = useRef(null);

      // Livestream States for Seller
      const [streamTitle, setStreamTitle] = useState('');
      const [isLive, setIsLive] = useState(false);
      const [activeStream, setActiveStream] = useState(null);
      const [streamComments, setStreamComments] = useState([]);
      const [streamHearts, setStreamHearts] = useState(0);
      const [streamPinnedProduct, setStreamPinnedProduct] = useState(null);

      const videoRef = useRef(null);
      const mediaStreamRef = useRef(null);
      const commentsEndRef = useRef(null);
      const frameIntervalRef = useRef(null);

      // Fetch Shop Profile State & Logic
      const [shop, setShop] = useState(null);
      const [shopLoading, setShopLoading] = useState(true);

      const fetchShopProfile = async () => {
        if (!token) return;
        setShopLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/shop/my-shop`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.shop) {
            setShop(data.shop);
          } else {
            setShop(null);
          }
        } catch (err) {
          console.warn("Failed to fetch shop:", err.message);
          setShop(null);
        } finally {
          setShopLoading(false);
        }
      };

      useEffect(() => {
        if (token) {
          fetchShopProfile();
        } else {
          setShopLoading(false);
        }
      }, [token]);

      useEffect(() => {
        if (user) {
          if (user.role === 'b2c_seller') {
            setShopType('business');
          } else {
            setShopType('individual');
          }
        }
      }, [user]);

      // Guard routing
      useEffect(() => {
        if (!authLoading && !token) {
          router.push('/login');
        }
      }, [token, authLoading]);

      // Load data based on tab and shop availability (only if shop is approved)
      useEffect(() => {
        if (shop && shop.is_approved === 1) {
          if (activeTab === 'products' || activeTab === 'livestream') fetchMyProducts();
          if (activeTab === 'orders' || activeTab === 'analytics') fetchShopOrders();
          if (activeTab === 'wallet') fetchWalletData();
          if (activeTab === 'vouchers') loadVouchers();
          if (activeTab === 'branding') setShopBannerUrl(shop.banner_url || '');
          if (activeTab === 'chat') fetchPartners();
        }
      }, [shop, activeTab]);

      // WebSockets Chat Sync Logic for Seller Dashboard
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

      // Establish WebSocket connection when tab is 'chat' or 'livestream'
      useEffect(() => {
        if ((activeTab === 'chat' || activeTab === 'livestream') && user && token) {
          const hostname = window.location.hostname;
          const wsUrl = `ws://${hostname}:5001`;
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log("[WS] Connected to auth-service WebSocket (Seller Console).");
            ws.send(JSON.stringify({ type: 'register', userId: user.id }));
            
            // Mark as read on socket connect
            if (activePartnerRef.current && activeTab === 'chat') {
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
                    is_read: 1, // Read since the chat is open
                    created_at: data.createdAt || new Date().toISOString()
                  };
                  setChatMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m.message === data.message && Math.abs(new Date(m.created_at) - new Date(incomingMsg.created_at)) < 1500)) {
                      return prev;
                    }
                    return [...prev, incomingMsg];
                  });

                  // Send read receipt
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

              // 4. Handle incoming livestream events
              if (data.type === 'stream_comment') {
                setStreamComments(prev => [...prev, data]);
              }
              if (data.type === 'stream_heart') {
                setStreamHearts(prev => prev + 1);
              }
              if (data.type === 'stream_user_joined') {
                setStreamComments(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  username: 'Hệ thống',
                  comment: `${data.username} đã tham gia livestream.`,
                  isSystem: true
                }]);
              }
              if (data.type === 'stream_pinned_product_updated') {
                setStreamPinnedProduct(data.productId ? {
                  id: data.productId,
                  name: data.productName,
                  price: data.productPrice,
                  image_url: data.productImage
                } : null);
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
            ws.close();
          };
        }
      }, [activeTab]);

      const fetchMyProducts = async () => {
        if (!shop) return;
    setProdLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/products?shop_id=${shop.id}`);
          const data = await res.json();
          setMyProducts(data.products || []);
        } catch (err) {
          console.error(err);
        } finally {
          setProdLoading(false);
        }
      };

      const fetchShopOrders = async () => {
        if (!shop) return;
        setOrdLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/orders/seller`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          setShopOrders(data.orders || []);
        } catch (err) {
          console.warn("Using mock shop orders.");
          setShopOrders([
            {
              id: 101,
              total_amount: 5200000,
              status: 'shipped',
              shipping_address: 'Nguyễn Văn Mua - 0912345678 - 123 Đường Láng, Hà Nội',
              payment_method: 'Wallet',
              shipping_partner: 'GHN',
              shipping_fee: 30000,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              items: [
                { id: 1, product_name: 'Điện thoại iPhone 11 64GB Cũ', price: 5200000, quantity: 1, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60', shop_name: shop.shop_name }
              ]
            }
          ]);
        } finally {
      setOrdLoading(false);
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
      setWallet({ balance: 12500000 });
      setTransactions([
        { id: 1, amount: 5200000, type: 'receive', description: 'Nhận tiền thanh toán từ đơn #101', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (Number(wallet?.balance || 0) < Number(withdrawAmount)) {
      alert("Số dư ví không đủ.");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/auth/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(withdrawAmount), bankName, accountNo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(language === 'vi' ? `Rút tiền thành công! Số dư còn lại: ${data.balance.toLocaleString()} đ` : `Withdrawal successful! Remaining balance: ${data.balance.toLocaleString()} đ`);
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
      fetchWalletData();
    } catch (err) {
      const newBal = Number(wallet?.balance || 0) - Number(withdrawAmount);
      setWallet({ balance: newBal });
      setTransactions(prev => [{ id: Date.now(), amount: Number(withdrawAmount), type: 'withdraw', description: `Rút tiền về ${bankName} (Demo)`, created_at: new Date().toISOString() }, ...prev]);
      alert("Rút tiền thành công! (Chế độ Demo)");
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
    }
  };

  // --- Vouchers State ---
  const loadVouchers = () => {
    const key = `vouchers_${shop?.id || 'default'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setVouchers(JSON.parse(stored));
    } else {
      const defaults = [
        { code: 'GIAM50K', discount: 50000, minOrder: 300000 },
        { code: 'MALLFREE', discount: 100000, minOrder: 1000000 }
      ];
      setVouchers(defaults);
      localStorage.setItem(key, JSON.stringify(defaults));
    }
  };

  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!vCode || !vDiscount) return;

    const newV = {
      code: vCode.toUpperCase().trim(),
      discount: Number(vDiscount),
      minOrder: Number(vMinOrder || 0)
    };

    const updated = [newV, ...vouchers];
    setVouchers(updated);
    localStorage.setItem(`vouchers_${shop?.id || 'default'}`, JSON.stringify(updated));
    setVCode('');
    setVDiscount('');
    setVMinOrder('');
    alert(language === 'vi' ? "Tạo mã giảm giá thành công!" : "Voucher created successfully!");
  };

  const handleDeleteVoucher = (code) => {
    const updated = vouchers.filter(v => v.code !== code);
    setVouchers(updated);
    localStorage.setItem(`vouchers_${shop?.id || 'default'}`, JSON.stringify(updated));
  };

  // --- Branding Logic ---
  const handleUpdateBanner = async (e) => {
    e.preventDefault();
    if (!shopBannerUrl) return;
    setUpdatingBanner(true);

    try {
      const res = await fetch(`${backendUrl}/api/shop/my-shop/banner`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ banner_url: shopBannerUrl })
      });
      if (!res.ok) throw new Error();
      alert(language === 'vi' ? "Cập nhật Banner thành công!" : "Banner updated successfully!");
      await fetchShopProfile();
    } catch (err) {
      alert(language === 'vi' ? "Cập nhật Banner thành công! (Chế độ Demo)" : "Banner updated! (Demo Mode)");
    } finally {
      setUpdatingBanner(false);
    }
  };

  // --- Chat Support Logic ---
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

    // Optimistically add to messages list
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

  // --- Livestream Controlling Logic ---
  const handleStartStream = async (e) => {
    e.preventDefault();
    if (!streamTitle.trim()) return;

    try {
      const res = await fetch(`${backendUrl}/api/products/livestreams/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: streamTitle.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi bắt đầu stream.');

      setIsLive(true);
      setActiveStream(data.streamId);
      setStreamComments([{
        id: 'sys-start',
        username: 'Hệ thống',
        comment: 'Livestream đã bắt đầu! Đang kết nối camera...',
        isSystem: true
      }]);
      setStreamHearts(0);
      setStreamPinnedProduct(null);

      // Start webcam capture locally
      setTimeout(async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(err => console.warn("Lỗi gọi play() trên video:", err));
            }

            // Periodically send frames over websocket to bypass device locking on same-machine testing
            const canvas = document.createElement('canvas');
            canvas.width = 240;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            
            const frameInterval = setInterval(() => {
              if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== 1) return;
              try {
                const vid = videoRef.current;
                // Direct draw and fallback via try-catch to avoid strict readyState locks
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                const base64Frame = canvas.toDataURL('image/jpeg', 0.25);
                wsRef.current.send(JSON.stringify({
                  type: 'stream_frame',
                  streamId: data.streamId,
                  frame: base64Frame
                }));
              } catch (err) {
                console.error("Lỗi gửi frame hình:", err);
              }
            }, 200);

            frameIntervalRef.current = frameInterval;
          }
        } catch (mediaErr) {
          console.warn("Không truy cập được Camera/Microphone:", mediaErr.message);
          setStreamComments(prev => [...prev, {
            id: 'sys-cam-err',
            username: 'Hệ thống',
            comment: 'Cảnh báo: Không tìm thấy camera, hệ thống sẽ sử dụng hình ảnh giả lập thay thế.',
            isSystem: true
          }]);
        }
      }, 500);

      // Register the livestream room on WebSockets
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type: 'join_stream',
          streamId: data.streamId,
          username: shop?.shop_name || 'Chủ shop'
        }));
      }

    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleEndStream = async () => {
    if (!activeStream) return;
    try {
      await fetch(`${backendUrl}/api/products/livestreams/end/${activeStream}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.warn("Failed to notify backend of ended stream:", err.message);
    }

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsLive(false);
    setActiveStream(null);
    setStreamTitle('');
  };

  const handlePinProduct = async (prodId) => {
    if (!activeStream) return;
    try {
      const res = await fetch(`${backendUrl}/api/products/livestreams/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ streamId: activeStream, productId: prodId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi ghim sản phẩm.');

      // Update local state and broadcast via WebSocket
      const prod = myProducts.find(p => p.id === Number(prodId)) || null;
      setStreamPinnedProduct(prod);

      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type: 'stream_pin_product',
          streamId: activeStream,
          productId: prod ? prod.id : null,
          productName: prod ? prod.name : '',
          productPrice: prod ? prod.price : 0,
          productImage: prod ? prod.image_url : ''
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const sendLiveComment = (commentText) => {
    if (!activeStream || !commentText.trim()) return;
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'stream_comment',
        streamId: activeStream,
        username: `${shop?.shop_name || 'Người bán'} (Chủ shop)`,
        comment: commentText.trim()
      }));
    }
  };

  // Scroll live comments list to bottom
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamComments]);

  // Cleanup stream on tab change
  useEffect(() => {
    if (activeTab !== 'livestream' && isLive) {
      handleEndStream();
    }
  }, [activeTab]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- Register Shop Logic ---
  const handleRegisterShop = async (e) => {
    e.preventDefault();
    if (!shopName || !address || !phone) {
      setRegError('Vui lòng điền các thông tin bắt buộc.');
      return;
    }

    if (shopType === 'business' && !taxCode) {
      setRegError('Doanh nghiệp bắt buộc phải cung cấp Mã số thuế.');
      return;
    }

    setRegLoading(true);
    setRegError(null);
    try {
      const res = await fetch(`${backendUrl}/api/shop/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_name: shopName,
          address,
          phone,
          tax_code: taxCode,
          shop_type: shopType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(language === 'vi' ? "Đăng ký mở gian hàng thành công!" : "Shop registered successfully!");
      await refreshUser();
      await fetchShopProfile();
    } catch (err) {
      alert(language === 'vi' ? "Đăng ký shop thành công! (Chế độ Demo)" : "Shop registered! (Demo Mode)");
      setShop({
        id: 1,
        shop_name: shopName,
        shop_type: user?.role === 'b2c_seller' ? 'business' : 'individual',
        banner_url: '',
        address,
        phone,
        tax_code: taxCode,
        is_approved: user?.role === 'b2c_seller' ? 0 : 1
      });
    } finally {
      setRegLoading(false);
    }
  };

  const handleResetAndReRegister = async () => {
    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa hồ sơ bị từ chối này và làm lại hồ sơ mới?' : 'Are you sure you want to delete this rejected profile and start a new registration?')) return;
    setRegLoading(true);
    setRegError(null);
    try {
      const res = await fetch(`${backendUrl}/api/shop/my-shop`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(language === 'vi' ? 'Đã reset hồ sơ. Vui lòng điền thông tin đăng ký mới!' : 'Profile reset. Please fill in new registration info!');
      setShopName('');
      setAddress('');
      setPhone('');
      setTaxCode('');
      setShop(null);
      await refreshUser();
      await fetchShopProfile();
    } catch (err) {
      alert(language === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setRegLoading(false);
    }
  };


  // --- AI Description Generator ---
  const handleGenerateAIDescription = async () => {
    if (!pName) {
      alert("Vui lòng nhập tên sản phẩm để AI viết bài mô tả.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/products/ai-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: pName, category: pCategory })
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setPDescription(data.description);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback local description
      const desc = `### ${pName}\n\nSản phẩm thuộc danh mục **${pCategory}** chất lượng cao. Thích hợp cho mọi đối tượng sử dụng.\n\n- **Đặc điểm nổi bật**: Bền bỉ, tinh tế.\n- **Bảo hành**: 12 tháng.\n- Cập nhật bởi AI Assistant.`;
      setPDescription(desc);
    } finally {
      setAiLoading(false);
    }
  };

  // --- Photo Upload Logic ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await fetch(`${backendUrl}/api/products/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPImage(data.url);
        alert(language === 'vi' ? 'Tải ảnh sản phẩm lên thành công!' : 'Product image uploaded successfully!');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setPImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60');
      alert(language === 'vi' ? 'Đã tải ảnh lên! (Chế độ Demo)' : 'Photo uploaded! (Demo Mode)');
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Create/Edit Product Logic ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!pName || !pPrice || !pStock || !pSku) return;

    const payload = {
      name: pName,
      description: pDescription,
      price: Number(pPrice),
      stock: Number(pStock),
      sku: pSku,
      image_url: pImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      is_sponsored: pSponsored ? 1 : 0,
      international_shipping: pInternational ? 1 : 0
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${backendUrl}/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${backendUrl}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error();
      alert(editingProduct ? "Cập nhật thành công!" : "Đăng bán sản phẩm thành công!");
      resetForm();
      setShowAddForm(false);
      fetchMyProducts();
    } catch (err) {
      // Demo Fallback
      const mockProduct = {
        id: editingProduct ? editingProduct.id : Date.now(),
        shop_id: shop?.id || 1,
        shop_name: shop?.shop_name || 'My Shop',
        is_mall: user?.role === 'b2c_seller' ? 1 : 0,
        ...payload
      };

      setMyProducts(prev => {
        if (editingProduct) {
          return prev.map(p => p.id === editingProduct.id ? mockProduct : p);
        } else {
          return [mockProduct, ...prev];
        }
      });
      alert(language === 'vi' ? "Đã lưu sản phẩm! (Chế độ Demo)" : "Product saved! (Demo Mode)");
      resetForm();
      setShowAddForm(false);
    }
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPDescription(prod.description || '');
    setPPrice(prod.price);
    setPStock(prod.stock);
    setPSku(prod.sku);
    setPImage(prod.image_url || '');
    setPSponsored(prod.is_sponsored === 1);
    setPInternational(prod.international_shipping === 1);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm(language === 'vi' ? "Bạn chắc chắn muốn xóa sản phẩm này?" : "Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      alert("Xóa sản phẩm thành công!");
      fetchMyProducts();
    } catch (err) {
      setMyProducts(prev => prev.filter(p => p.id !== productId));
      alert(language === 'vi' ? "Đã xóa! (Chế độ Demo)" : "Deleted! (Demo Mode)");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setPName('');
    setPDescription('');
    setPPrice('');
    setPStock('');
    setPSku('');
    setPImage('');
    setPSponsored(false);
    setPInternational(false);
  };

  // --- Order preparation / handover logic ---
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${backendUrl}/api/orders/seller/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      alert("Cập nhật trạng thái đơn hàng thành công!");
      fetchShopOrders();
    } catch (err) {
      setShopOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status } : ord));
      alert(language === 'vi' 
        ? `Đã cập nhật trạng thái đơn hàng thành: ${status === 'processing' ? 'Đang chuẩn bị' : 'Đang giao hàng (GHN API simulated)'}`
        : `Order status updated to: ${status}`);
    }
  };

  // --- Excel / CSV Export ---
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Product,Buyer,Total Amount,Status,Carrier,Date\n";
    
    shopOrders.forEach(ord => {
      const prodNames = ord.items.map(i => i.product_name).join("; ");
      const row = `${ord.id},"${prodNames}","${ord.shipping_address.split('-')[0].trim()}",${ord.total_amount},${ord.status},${ord.shipping_partner},${ord.created_at}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${shop?.shop_name || 'shop'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAnalyticsData = () => {
    const data = [];
    const daysOfWeek = language === 'vi' 
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = daysOfWeek[d.getDay()];
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      
      const dayOrders = shopOrders.filter(o => {
        const orderTime = new Date(o.created_at).getTime();
        return orderTime >= startOfDay && orderTime < endOfDay;
      });
      
      const dayTotal = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      data.push({
        day: dayLabel,
        amount: dayTotal
      });
    }
    
    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    
    const formatAmount = (num) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return `${num}`;
    };

    return data.map(item => {
      const pct = maxAmount > 1 ? Math.max(5, Math.min(95, Math.round((item.amount / maxAmount) * 95))) : 5;
      return {
        day: item.day,
        val: `${pct}%`,
        amount: formatAmount(item.amount)
      };
    });
  };

  if (authLoading || shopLoading) {
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
        {!shop ? (
          /* REGISTRATION SCREEN */
          <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">🏪</span>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{t('register_shop_btn')}</h1>
              <p className="text-sm text-gray-400">
                {shopType === 'business' 
                  ? 'Đăng ký gian hàng Mall doanh nghiệp chính hãng (B2C) cần phê duyệt.'
                  : 'Đăng ký gian hàng cá nhân C2C thanh lý đồ cũ (tự động kích hoạt).'}
              </p>
            </div>

            {regError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3.5 rounded-xl text-xs font-semibold">
                ⚠️ {regError}
              </div>
            )}

            <form onSubmit={handleRegisterShop} className="space-y-4">
              {user?.role === 'buyer' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Loại hình gian hàng *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`border rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition ${
                      shopType === 'individual' ? 'border-red-650 bg-red-50/50 text-red-650 font-bold' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="shopType"
                        value="individual"
                        checked={shopType === 'individual'}
                        onChange={() => setShopType('individual')}
                        className="hidden"
                      />
                      <span className="text-2xl">🏷️</span>
                      <span className="font-bold text-xs">Cá nhân (C2C)</span>
                      <span className="text-[10px] text-gray-400 text-center">Thanh lý đồ cũ cá nhân, tự động kích hoạt</span>
                    </label>
                    <label className={`border rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition ${
                      shopType === 'business' ? 'border-red-650 bg-red-50/50 text-red-650 font-bold' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="shopType"
                        value="business"
                        checked={shopType === 'business'}
                        onChange={() => setShopType('business')}
                        className="hidden"
                      />
                      <span className="text-2xl">🏪</span>
                      <span className="font-bold text-xs">Doanh nghiệp (B2C Mall)</span>
                      <span className="text-[10px] text-gray-400 text-center">Gian hàng chính hãng, yêu cầu Mã số thuế & duyệt</span>
                    </label>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('shop_name')} *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ví dụ: Shop Đồ Cũ An Nhiên / Samsung Mall"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              {shopType === 'business' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('tax_code')} *</label>
                  <input
                    type="text"
                    required
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="Mã số thuế doanh nghiệp (10 chữ số)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('phone')} *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t('address')} *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số 20, Lê Lợi, Quận 1, TPHCM"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:bg-gray-200"
              >
                {regLoading ? '⏳ Đang đăng ký...' : t('register_shop_btn')}
              </button>
            </form>
          </div>
        ) : shop.is_approved === 0 ? (
          /* PENDING APPROVAL SCREEN */
          <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-center">
            <span className="text-5xl">⏳</span>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
              {language === 'vi' ? 'Đang Chờ Phê Duyệt' : 'Awaiting Admin Approval'}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {shop.shop_type === 'business' 
                ? (language === 'vi' 
                    ? 'Cửa hàng Mall doanh nghiệp (B2C) của bạn đang được duyệt. Ban quản trị đang xác minh Mã số thuế và thông tin doanh nghiệp.'
                    : 'Your B2C Mall store profile is awaiting Admin verification and approval.')
                : (language === 'vi' 
                    ? 'Cửa hàng cá nhân (C2C) của bạn đang được duyệt. Ban quản trị đang xem xét hồ sơ.'
                    : 'Your C2C store profile is awaiting Admin review and approval.')
              }
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs text-gray-600 space-y-2 border border-gray-100">
              <p><strong>{t('shop_name')}:</strong> {shop.shop_name}</p>
              <p><strong>{t('shop_type')}:</strong> {shop.shop_type === 'business' ? 'B2C Mall' : 'C2C Shop'}</p>
              {shop.tax_code && <p><strong>{t('tax_code')}:</strong> {shop.tax_code}</p>}
              <p><strong>{t('phone')}:</strong> {shop.phone}</p>
              <p><strong>{t('address')}:</strong> {shop.address}</p>
              <p><strong>{t('shop_approved')}:</strong> <span className="text-amber-600 font-bold">{t('pending_approval')}</span></p>
            </div>

            <div className="pt-2 text-xs text-gray-400">
              {language === 'vi'
                ? '💡 Mẹo test: Bạn có thể đăng nhập tài khoản Admin (admin@test.com / admin123) để phê duyệt cửa hàng này ngay lập tức.'
                : '💡 Testing tip: You can log in to the Admin account (admin@test.com / admin123) to approve this shop instantly.'}
            </div>

            <button
              onClick={fetchShopProfile}
              className="mt-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs shadow hover:bg-red-700 transition"
            >
              🔄 {language === 'vi' ? 'Kiểm tra lại trạng thái' : 'Re-check Approval Status'}
            </button>
          </div>
        ) : shop.is_approved === 2 ? (
          /* REJECTED SCREEN */
          <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-center">
            <span className="text-5xl text-red-500">❌</span>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
              {language === 'vi' ? 'Yêu Cầu Bị Từ Chối' : 'Registration Rejected'}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {language === 'vi' 
                ? 'Yêu cầu mở gian hàng của bạn không được phê duyệt bởi Ban quản trị.'
                : 'Your shop registration request has been rejected by the administrator.'}
            </p>
            
            <div className="bg-red-50 rounded-2xl p-4 text-left text-xs text-red-700 space-y-2 border border-red-100">
              <p className="font-bold text-sm text-red-800">
                {language === 'vi' ? 'Lý do từ chối:' : 'Rejection Reason:'}
              </p>
              <p className="bg-white p-3 rounded-xl border border-red-200 mt-1 italic text-gray-700">
                {shop.reject_reason || (language === 'vi' ? 'Không có lý do cụ thể.' : 'No reason provided.')}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs text-gray-600 space-y-2 border border-gray-100">
              <p><strong>{t('shop_name')}:</strong> {shop.shop_name}</p>
              <p><strong>{t('shop_type')}:</strong> {shop.shop_type === 'business' ? 'B2C Mall' : 'C2C Shop'}</p>
              {shop.tax_code && <p><strong>{t('tax_code')}:</strong> {shop.tax_code}</p>}
              <p><strong>{t('phone')}:</strong> {shop.phone}</p>
              <p><strong>{t('address')}:</strong> {shop.address}</p>
            </div>

            <button
              onClick={handleResetAndReRegister}
              disabled={regLoading}
              className="mt-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs shadow hover:bg-red-700 transition disabled:bg-gray-200"
            >
              {regLoading ? '⏳ Loading...' : (language === 'vi' ? 'Đăng ký lại' : 'Register Again')}
            </button>
          </div>
        ) : (
          /* SELLER CONSOLE SCREEN */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-1">
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="font-bold text-gray-800 text-sm">{shop.shop_name}</p>
                  <p className="text-[10px] mt-0.5"><span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-bold uppercase">
                    {shop.shop_type === 'business' ? 'B2C Mall' : 'C2C Shop'}
                  </span></p>
                </div>

                {[
                  { id: 'products', label: language === 'vi' ? 'Sản phẩm của tôi' : 'My Products', icon: '📦' },
                  { id: 'orders', label: language === 'vi' ? 'Đơn hàng bán' : 'Incoming Orders', icon: '📥' },
                  { id: 'wallet', label: language === 'vi' ? 'Ví doanh thu' : 'Sales Wallet', icon: '💳' },
                  { id: 'vouchers', label: language === 'vi' ? 'Mã giảm giá shop' : 'Shop Vouchers', icon: '🎟️' },
                  { id: 'chat', label: language === 'vi' ? 'Hỗ trợ khách hàng' : 'Customer Support', icon: '💬' },
                  { id: 'livestream', label: language === 'vi' ? 'Phát trực tiếp (Live)' : 'Go Live', icon: '📺' },
                  { id: 'analytics', label: t('sales_report'), icon: '📈' },
                  { id: 'branding', label: language === 'vi' ? 'Trang trí Shop' : 'Shop Branding', icon: '🎨' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
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

            {/* Console Content */}
            <section className="flex-grow">
              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Quản lý sản phẩm' : 'Products Manager'}</h2>
                    <button
                      onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
                      className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow hover:bg-red-700 transition"
                    >
                      {showAddForm ? 'Cancel' : t('add_product')}
                    </button>
                  </div>

                  {showAddForm && (
                    /* ADD/EDIT FORM */
                    <form onSubmit={handleSaveProduct} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">
                        {editingProduct ? t('edit_product') : t('add_product')}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('product_name')} *</label>
                          <input
                            type="text"
                            required
                            value={pName}
                            onChange={(e) => setPName(e.target.value)}
                            placeholder="Ví dụ: iPhone 15 Pro Max 256GB"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('categories')}</label>
                          <select
                            value={pCategory}
                            onChange={(e) => setPCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none bg-white text-gray-700"
                          >
                            <option value="Điện thoại & Tablet">Điện thoại & Tablet</option>
                            <option value="Laptop & PC">Laptop & PC</option>
                            <option value="Tai nghe & Âm thanh">Tai nghe & Âm thanh</option>
                            <option value="Đo gia dung">Đồ gia dụng</option>
                            <option value="Thời trang thanh lý">Thời trang thanh lý</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('price')} (VND) *</label>
                          <input
                            type="number"
                            required
                            value={pPrice}
                            onChange={(e) => setPPrice(e.target.value)}
                            placeholder="5000000"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('stock')} *</label>
                          <input
                            type="number"
                            required
                            value={pStock}
                            onChange={(e) => setPStock(e.target.value)}
                            placeholder="5"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('sku')} *</label>
                          <input
                            type="text"
                            required
                            value={pSku}
                            onChange={(e) => setPSku(e.target.value)}
                            placeholder="IP15-256G"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('image')} *</label>
                          <div className="flex items-center gap-3">
                            <label className="flex-grow flex items-center justify-center border border-dashed border-gray-300 rounded-xl p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm font-semibold transition-colors">
                              <span>{uploadingImage ? '⏳ Loading...' : t('upload_file')}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                            </label>
                            {pImage && (
                              <div className="w-10 h-10 border border-gray-150 rounded-lg overflow-hidden relative flex-shrink-0">
                                <img src={pImage} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="sponsored"
                              checked={pSponsored}
                              onChange={(e) => setPSponsored(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-red-600"
                            />
                            <label htmlFor="sponsored" className="text-xs font-bold text-gray-600 cursor-pointer">{t('sponsored_ad')}</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="international"
                              checked={pInternational}
                              onChange={(e) => setPInternational(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-red-600"
                            />
                            <label htmlFor="international" className="text-xs font-bold text-gray-600 cursor-pointer">{t('international_shipping')}</label>
                          </div>
                        </div>
                      </div>

                      {/* Product Description */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">{t('product_description')}</label>
                          <button
                            type="button"
                            onClick={handleGenerateAIDescription}
                            disabled={aiLoading}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1.5"
                          >
                            {aiLoading ? '🤖 Writing...' : t('ai_description_btn')}
                          </button>
                        </div>
                        <textarea
                          value={pDescription}
                          onChange={(e) => setPDescription(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:border-red-500 focus:outline-none"
                          rows={6}
                          placeholder="Mô tả chi tiết sản phẩm..."
                        />
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => { resetForm(); setShowAddForm(false); }}
                          className="bg-white border border-gray-300 text-gray-700 text-xs font-bold px-5 py-2 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {/* PRODUCTS LIST */}
                  {prodLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : myProducts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8 bg-white border border-gray-150 rounded-2xl shadow-sm">Shop chưa đăng sản phẩm nào.</p>
                  ) : (
                    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-150 bg-gray-50/50 text-gray-400 uppercase font-semibold">
                              <th className="p-4">{t('product')}</th>
                              <th className="p-4">SKU</th>
                              <th className="p-4 text-right">{t('price')}</th>
                              <th className="p-4 text-center">{t('stock')}</th>
                              <th className="p-4 text-center">Tags</th>
                              <th className="p-4 text-center">{t('action')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 text-gray-700 font-medium">
                            {myProducts.map((prod) => (
                              <tr key={prod.id} className="hover:bg-gray-50/30">
                                <td className="p-4 flex items-center gap-3">
                                  <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                  <span className="font-bold text-gray-800 line-clamp-1 max-w-[200px]">{prod.name}</span>
                                </td>
                                <td className="p-4 font-mono">{prod.sku}</td>
                                <td className="p-4 text-right font-bold text-sm text-red-600">{Number(prod.price).toLocaleString()} đ</td>
                                <td className="p-4 text-center font-bold text-gray-800">{prod.stock}</td>
                                <td className="p-4 text-center space-y-1 sm:space-y-0 sm:space-x-1">
                                  {prod.is_sponsored === 1 && (
                                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">AD</span>
                                  )}
                                  {prod.international_shipping === 1 && (
                                    <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">INT</span>
                                  )}
                                  {prod.is_mall === 1 && (
                                    <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">MALL</span>
                                  )}
                                </td>
                                <td className="p-4 text-center text-[10px] font-bold space-x-2">
                                  <button onClick={() => handleEditClick(prod)} className="text-blue-600 hover:underline">Edit</button>
                                  <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Quản lý đơn hàng bán' : 'Incoming Order Management'}</h2>

                  {ordLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : shopOrders.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8 bg-white border border-gray-150 rounded-2xl shadow-sm">{t('no_orders_seller')}</p>
                  ) : (
                    <div className="space-y-4">
                      {shopOrders.map((ord) => (
                        <div key={ord.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm p-4 sm:p-5 space-y-4">
                          <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                            <div>
                              <p className="font-bold text-gray-800">ĐƠN HÀNG: #{ord.id}</p>
                              <p className="text-gray-400 mt-0.5">Ngày: {new Date(ord.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              ord.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              ord.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              ord.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {ord.status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {ord.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{item.product_name} (x{item.quantity})</span>
                                <span>{Number(item.price * item.quantity).toLocaleString()} đ</span>
                              </div>
                            ))}
                          </div>

                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                            <p>📍 <strong>Buyer:</strong> {ord.shipping_address}</p>
                            <p className="font-bold text-sm text-gray-800">Doanh thu: {Number(ord.total_amount).toLocaleString()} đ</p>
                          </div>

                          {/* Action update status */}
                          {ord.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                                className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
                              >
                                {language === 'vi' ? 'Chuẩn bị hàng' : 'Prepare Order'}
                              </button>
                            </div>
                          )}
                          {ord.status === 'processing' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                                className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                              >
                                {language === 'vi' ? 'Bàn giao GHN/GHTK API' : 'Handover to Shipping API'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WALLET TAB */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Ví doanh thu người bán' : 'Seller Sales Wallet'}</h2>
                  {walletLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl p-6 shadow-md">
                        <p className="text-xs uppercase font-semibold opacity-85">{t('wallet_balance')}</p>
                        <p className="text-3xl font-black mt-1">{Number(wallet?.balance || 0).toLocaleString()} VND</p>
                      </div>

                      {/* Withdraw form */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          <span>🏦</span> {t('withdraw')}
                        </h3>
                        <form onSubmit={handleWithdraw} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 font-bold mb-1">{t('bank_name')}</label>
                              <input
                                type="text"
                                required
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Vietinbank"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 font-bold mb-1">{t('account_no')}</label>
                              <input
                                type="text"
                                required
                                value={accountNo}
                                onChange={(e) => setAccountNo(e.target.value)}
                                placeholder="102938475"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 font-bold mb-1">{t('amount')} (VND)</label>
                            <input
                              type="number"
                              required
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="1,000,000"
                              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm transition"
                          >
                            {t('withdraw')}
                          </button>
                        </form>
                      </div>

                      {/* Transaction table */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Lịch sử doanh thu</h3>
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left font-medium text-gray-700 divide-y divide-gray-100">
                            <thead>
                              <tr className="text-gray-400 font-semibold uppercase">
                                <th className="py-2">Mô tả</th>
                                <th className="py-2 text-right">Số tiền</th>
                                <th className="py-2 text-right">Ngày</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map(t => (
                                <tr key={t.id}>
                                  <td className="py-2">{t.description}</td>
                                  <td className={`py-2 text-right font-bold ${['deposit', 'receive'].includes(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                                    {['deposit', 'receive'].includes(t.type) ? '+' : '-'}{Number(t.amount).toLocaleString()} đ
                                  </td>
                                  <td className="py-2 text-right text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VOUCHERS TAB */}
              {activeTab === 'vouchers' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Quản lý mã giảm giá' : 'Shop Vouchers'}</h2>

                  <div className="bg-white border border-gray-155 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 text-sm mb-4">Tạo Voucher Mới</h3>
                    <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mã Voucher</label>
                        <input
                          type="text"
                          required
                          value={vCode}
                          onChange={(e) => setVCode(e.target.value)}
                          placeholder="GIAM30K"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mức Giảm (đ)</label>
                        <input
                          type="number"
                          required
                          value={vDiscount}
                          onChange={(e) => setVDiscount(e.target.value)}
                          placeholder="30000"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Đơn tối thiểu (đ)</label>
                        <input
                          type="number"
                          value={vMinOrder}
                          onChange={(e) => setVMinOrder(e.target.value)}
                          placeholder="150000"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3 flex justify-end">
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl text-xs shadow">
                          Tạo Voucher
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vouchers.map((v, i) => (
                      <div key={i} className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="bg-red-50 text-red-600 border border-red-100 font-mono font-black text-sm px-2.5 py-1 rounded">
                            {v.code}
                          </span>
                          <p className="text-xs text-gray-700 font-bold mt-2">Giảm {Number(v.discount).toLocaleString()} đ cho đơn từ {Number(v.minOrder).toLocaleString()} đ</p>
                        </div>
                        <button
                          onClick={() => handleDeleteVoucher(v.code)}
                          className="text-xs text-red-600 font-bold hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="space-y-6 font-sans">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-800 uppercase">{t('sales_report')}</h2>
                    <button
                      onClick={handleExportCSV}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
                    >
                      📊 {t('export_excel')}
                    </button>
                  </div>

                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase">GMV (Doanh thu)</p>
                      <p className="text-xl font-black text-red-600 mt-1">
                        {shopOrders.reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()} đ
                      </p>
                    </div>
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase">Tổng đơn hàng</p>
                      <p className="text-xl font-black text-gray-800 mt-1">{shopOrders.length}</p>
                    </div>
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase">Tỉ lệ chuyển đổi</p>
                      <p className="text-xl font-black text-green-600 mt-1">3.2%</p>
                    </div>
                  </div>

                  {/* Simulated Line Chart representing growth */}
                  <div className="bg-white border border-gray-155 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm">Biểu đồ tăng trưởng doanh số (7 ngày qua)</h3>
                    <div className="h-40 flex items-end justify-between px-4 pt-6 border-b border-l border-gray-200">
                      {getAnalyticsData().map((item, i) => (
                        <div key={i} className="h-full flex flex-col justify-end items-center gap-1.5 w-1/8 group cursor-pointer relative">
                          <span className="absolute -top-6 bg-gray-800 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.amount}
                          </span>
                          <div 
                            style={{ height: item.val }} 
                            className="w-8 bg-red-500 hover:bg-red-600 rounded-t transition-all" 
                          />
                          <span className="text-[10px] text-gray-500 font-bold">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CHAT TAB */}
              {activeTab === 'chat' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h2 className="text-xl font-black text-gray-800 uppercase">
                      {language === 'vi' ? 'Hộp thư hỗ trợ khách hàng' : 'Customer Support Chat'}
                    </h2>
                    <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                      🟢 Real-time WebSockets Active
                    </span>
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
                                <span className="text-[9px] text-gray-400">Khách hàng</span>
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
                          <div className="p-3 border-b border-gray-155 bg-white flex justify-between items-center">
                            <div>
                              <span className="font-bold text-xs text-gray-800">{activePartner.partner_name}</span>
                              <p className="text-[9px] text-gray-400">Đang trò chuyện</p>
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
                              {[
                                "Chào bạn, sản phẩm này bên mình vẫn còn hàng ạ!",
                                "Shop đang chuẩn bị đóng gói và sẽ bàn giao cho đơn vị vận chuyển sớm nhất.",
                                "Dạ, sản phẩm này được bảo hành 12 tháng chính hãng và có đầy đủ hộp phụ kiện.",
                                "Cảm ơn bạn đã tin tưởng mua sắm và ủng hộ RedMall!"
                              ].map((tmpl, idx) => (
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
                                  ? 'bg-red-50 border-red-300 text-red-650 font-black' 
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
                          <p className="text-xs font-semibold">Chọn một cuộc trò chuyện bên trái để bắt đầu hỗ trợ khách hàng.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LIVESTREAM TAB */}
              {activeTab === 'livestream' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h2 className="text-xl font-black text-gray-800 uppercase">
                      {language === 'vi' ? 'Phát sóng trực tiếp' : 'Selling Livestream'}
                    </h2>
                    {isLive && (
                      <span className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full border border-red-200 animate-pulse">
                        <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                        REC LIVE
                      </span>
                    )}
                  </div>

                  {!isLive ? (
                    <div className="bg-white border border-gray-150 rounded-2xl p-8 text-center shadow-sm max-w-xl mx-auto space-y-5">
                      <div className="text-5xl">📺</div>
                      <div className="space-y-2">
                        <h3 className="font-black text-gray-800 text-lg">Bắt đầu Livestream giới thiệu sản phẩm</h3>
                        <p className="text-gray-500 text-xs leading-relaxed max-w-md mx-auto">
                          Phát trực tiếp webcam của bạn để giới thiệu sản phẩm tới khách hàng. Cho phép người mua thả tim, bình luận trực tiếp và mua hàng nhanh thông qua ví điện tử.
                        </p>
                      </div>

                      <form onSubmit={handleStartStream} className="space-y-4 text-left">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Tiêu đề Livestream *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Xả hàng Galaxy Fold5 giá rẻ hôm nay!"
                            value={streamTitle}
                            onChange={(e) => setStreamTitle(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-red-500 bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl transition shadow"
                        >
                          Bắt đầu phát sóng trực tiếp 🚀
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[560px]">
                      {/* Left: Video broadcast and Pinned Product selector */}
                      <div className="w-full md:w-3/5 border-r border-gray-150 flex flex-col bg-black text-white relative">
                        {/* Stream Header Stats */}
                        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-center pointer-events-none">
                          <div className="bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                            <span className="truncate max-w-[200px]">{streamTitle}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="bg-black/60 px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1">
                              👀 <span>{activeStream ? '1+' : '0'} đang xem</span>
                            </div>
                            <div className="bg-black/60 px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1">
                              ❤️ <span>{streamHearts} thả tim</span>
                            </div>
                          </div>
                        </div>

                        {/* Webcam View */}
                        <div className="flex-grow flex items-center justify-center relative overflow-hidden bg-gray-900 min-h-[300px]">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {/* Simulated media loop overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                        </div>

                        {/* Bottom Bar: Pinned product control */}
                        <div className="p-4 bg-gray-900 text-white border-t border-gray-800 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-grow">
                              <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Ghim sản phẩm đang bán</label>
                              <select
                                onChange={(e) => handlePinProduct(e.target.value)}
                                value={streamPinnedProduct?.id || ''}
                                className="w-full bg-gray-800 border border-gray-700 text-xs rounded-xl px-3 py-2 text-white outline-none"
                              >
                                <option value="">-- Chọn sản phẩm để ghim bán hàng --</option>
                                {myProducts.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} - {Number(p.price).toLocaleString()} VND</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={handleEndStream}
                              className="bg-red-650 hover:bg-red-700 text-xs font-bold px-4 py-3 rounded-xl transition flex-shrink-0 self-end"
                            >
                              Tắt Livestream 🛑
                            </button>
                          </div>

                          {/* Pinned product preview card */}
                          {streamPinnedProduct ? (
                            <div className="bg-gray-800/85 border border-gray-700 rounded-xl p-3 flex gap-3 items-center">
                              <img
                                src={streamPinnedProduct.image_url || 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=100'}
                                alt="Pinned"
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-grow min-w-0">
                                <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Đang Ghim</span>
                                <h4 className="text-xs font-bold truncate mt-1">{streamPinnedProduct.name}</h4>
                                <p className="text-[10px] text-red-400 font-bold mt-0.5">{Number(streamPinnedProduct.price).toLocaleString()} VND</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500 italic text-center py-2">Chưa ghim sản phẩm nào lên livestream.</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Live Chat Box */}
                      <div className="w-full md:w-2/5 flex flex-col justify-between bg-gray-50/30">
                        <div className="p-3 border-b border-gray-150 bg-white">
                          <span className="font-bold text-xs text-gray-800">Trò chuyện trực tiếp (Live Chat)</span>
                          <p className="text-[9px] text-gray-400">Bình luận của người xem sẽ hiện ở đây</p>
                        </div>

                        {/* Comments history */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-3 flex flex-col max-h-[380px]">
                          {streamComments.map((cmt, idx) => (
                            <div key={cmt.id || idx} className="text-xs leading-relaxed">
                              {cmt.isSystem ? (
                                <p className="text-gray-400 italic text-[10px]">{cmt.comment}</p>
                              ) : (
                                <div className="bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
                                  <strong className="text-red-600 font-bold block text-[10px] mb-0.5">{cmt.username}</strong>
                                  <span className="text-gray-700 font-medium">{cmt.comment}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={commentsEndRef} />
                        </div>

                        {/* Send comment box */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.target.elements.liveCommentText;
                            if (input.value.trim()) {
                              sendLiveComment(input.value);
                              input.value = '';
                            }
                          }}
                          className="p-3 bg-white border-t border-gray-150 flex gap-2"
                        >
                          <input
                            name="liveCommentText"
                            type="text"
                            placeholder="Nhập phản hồi trực tiếp..."
                            className="flex-grow px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-red-500 bg-gray-50/50 focus:bg-white"
                          />
                          <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow flex-shrink-0"
                          >
                            Gửi
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BRANDING TAB */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-800 uppercase">{language === 'vi' ? 'Trang trí cửa hàng' : 'Store Branding'}</h2>

                  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-800">{t('shop_banner')}</h3>
                    
                    {shop.banner_url && (
                      <div className="w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                        <img src={shop.banner_url} alt="Shop Banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <form onSubmit={handleUpdateBanner} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Đường dẫn Banner URL</label>
                        <input
                          type="text"
                          required
                          value={shopBannerUrl}
                          onChange={(e) => setShopBannerUrl(e.target.value)}
                          placeholder="Nhập link hình ảnh banner của shop (hoặc URL)"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={updatingBanner}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl text-xs shadow disabled:bg-gray-200"
                      >
                        {updatingBanner ? '⏳ Updating...' : t('update_banner')}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
