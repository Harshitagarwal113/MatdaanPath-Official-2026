"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, ShieldCheck, X } from "lucide-react";

import "./ChatAssistant.css";
import { OPEN_CHAT_EVENT } from "@/lib/chat-events";
import { fetchJson } from "@/lib/fetch-json";
import { trackUserAction } from "@/lib/google-services";

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatReply {
  response: string;
}

const quickActions = ["How do I register to vote?", "Where can I find my polling station?", "What documents do I need?"];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Namaste! I’m your election assistant. Ask about registration, deadlines, or voting rules and I’ll help.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  useEffect(() => {
    function handleOpenChat() {
      setIsOpen(true);
    }

    window.addEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    return () => {
      window.removeEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    };
  }, []);

  async function handleSend(customText?: string) {
    const messageText = (customText ?? input).trim();

    if (!messageText || isLoading) {
      return;
    }

    const userMessage: Message = {
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    void trackUserAction("chat_question_sent", {
      entry_type: customText ? "quick_action" : "typed_message",
      question_length: messageText.length,
    });

    try {
      const data = await fetchJson<ChatReply>("/api/chat/", {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        { text: data.response, sender: "bot", timestamp: new Date() },
      ]);
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error ? requestError.message : "Please ensure the backend is running.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          text: `I’m having trouble reaching the assistant right now. ${errorMessage}`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleChat() {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);

    if (nextOpenState) {
      void trackUserAction("chat_opened", { source: "floating_action_button" });
    }
  }

  return (
    <div className="chat-system">
      <motion.button
        type="button"
        className="chat-fab"
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Chat Assistant"
        aria-expanded={isOpen}
        aria-controls="chat-assistant-window"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen ? <span className="notification-dot" /> : null}
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="chat-assistant-window"
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
              <ShieldCheck size={20} style={{ color: "#6366f1", opacity: 0.8 }} />
            </header>

            <div className="chat-body-premium" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.sender}-${message.timestamp.getTime()}-${index}`}
                  className={`msg-wrapper ${message.sender}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="msg-bubble">{message.text}</div>
                  <span className="msg-time">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </motion.div>
              ))}
              {isLoading ? (
                <div className="msg-wrapper bot">
                  <div className="msg-bubble" style={{ display: "flex", gap: "4px" }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <footer className="chat-footer-premium">
              {messages.length < 4 ? (
                <div className="quick-actions">
                  {quickActions.map((action) => (
                    <button key={action} type="button" className="action-chip" onClick={() => void handleSend(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              ) : null}

              <p className="chat-helper-text">Tip: ask about registration, candidate info, deadlines, or voting rules.</p>

              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask a question..."
                  aria-label="Chat input message"
                  aria-describedby="chat-helper-text"
                  value={input}
                  maxLength={500}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={() => void handleSend()}
                  aria-label="Send message"
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={20} />
                </button>
              </div>
              <span id="chat-helper-text" className="sr-only">
                Ask a question and press Enter to send.
              </span>
            </footer>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
