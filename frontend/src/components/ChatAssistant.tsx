"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, X, Bot, User, 
  ShieldCheck, CornerDownRight, Zap 
} from 'lucide-react';
import './ChatAssistant.css';
import API_BASE_URL from '../lib/api';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Namaste! I'm your Election Intelligence Assistant. How can I help you navigate the democratic process today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "How to register?", 
    "Find polling station", 
    "Voter ID card help"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const messageText = customText || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { text: messageText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      
      if (!response.ok) throw new Error("Connection failed");
      
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, sender: 'bot', timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting to my AI core. Please ensure the backend is running.", 
        sender: 'bot', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-system">
      <motion.button 
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Chat Assistant"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && <span className="notification-dot" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chat-window-premium"
            role="dialog"
            aria-label="Election Intelligence Assistant"
            aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <header className="chat-header-premium">
              <div className="bot-identity">
                <div className="bot-avatar">
                  <Bot size={22} />
                </div>
                <div className="bot-info">
                  <h4>Election Assistant</h4>
                  <div className="status-row">
                    <span className="pulse" />
                    AI Active
                  </div>
                </div>
              </div>
              <ShieldCheck size={20} style={{ color: '#6366f1', opacity: 0.8 }} />
            </header>

            <div className="chat-body-premium" role="log" aria-live="polite">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  className={`msg-wrapper ${msg.sender}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="msg-bubble">
                    {msg.text}
                  </div>
                  <span className="msg-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {isLoading && (
                <div className="msg-wrapper bot">
                  <div className="msg-bubble" style={{ display: 'flex', gap: '4px' }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="chat-footer-premium">
              {messages.length < 3 && (
                <div className="quick-actions">
                  {quickActions.map((action, i) => (
                    <button key={i} className="action-chip" onClick={() => handleSend(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              )}
              <div className="input-container">
                <input 
                  type="text" 
                  placeholder="Ask a question..." 
                  aria-label="Chat input message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  className="send-button" 
                  onClick={() => handleSend()}
                  aria-label="Send message"
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={20} />
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
