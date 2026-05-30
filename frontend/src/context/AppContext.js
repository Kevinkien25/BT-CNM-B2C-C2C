"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const BACKEND_URL = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:5000` 
  : 'http://localhost:5000';

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync auth and cart state from localStorage on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedCart = localStorage.getItem('cart');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    setLoading(false);
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, loading]);

  // Refresh user data (useful after registering shop or admin approval)
  const refreshUser = async (customToken = token) => {
    const activeToken = customToken || localStorage.getItem('token');
    if (!activeToken) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu người dùng:", err);
    }
    return null;
  };

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký không thành công.');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    setCart([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
  };

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <AppContext.Provider value={{
      user,
      token,
      cart,
      loading,
      login,
      register,
      logout,
      refreshUser,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      backendUrl: BACKEND_URL
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
