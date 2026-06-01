"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ChatbotWidget() {
  const { user, backendUrl } = useApp();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize with a welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: language === 'vi' 
          ? 'Chào bạn! Mình là trợ lý AI. Mình có thể hỗ trợ gì cho bạn về sản phẩm, đơn hàng hoặc ví điện tử?'
          : 'Hello! I am your AI Assistant. How can I help you with products, orders, or your e-wallet today?'
      }
    ]);
  }, [language]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const userMsg = { role: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history payload for API (excluding initial welcome message to keep it clean)
      const chatHistory = messages.slice(1).map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await fetch(`${backendUrl}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessageText,
          history: chatHistory,
          userId: user?.id || null
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        throw new Error(data.message || 'Lỗi chatbot');
      }
    } catch (err) {
      console.error(err);
      const errMsg = language === 'vi'
        ? 'Rất tiếc, đã có lỗi xảy ra khi kết nối với trợ lý AI. Vui lòng thử lại sau.'
        : 'Sorry, an error occurred while connecting to the AI Assistant. Please try again later.';
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition duration-300 hover:scale-105"
          aria-label={t('chatbot_title')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[450px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
          {/* Header */}
          <div className="flex items-center justify-between bg-red-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
              </span>
              <h3 className="font-semibold text-sm tracking-wide">{t('chatbot_title')}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white hover:bg-red-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-150 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-white border border-gray-150 rounded-tl-none px-4 py-2.5 shadow-sm text-gray-500 text-sm flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-gray-100 p-2 bg-white flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chatbot_placeholder')}
              className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none transition duration-150 text-gray-700 bg-gray-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium text-sm hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition"
            >
              {t('send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
