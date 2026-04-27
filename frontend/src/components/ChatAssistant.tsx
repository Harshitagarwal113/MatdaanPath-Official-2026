"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, ShieldCheck, X } from "lucide-react";

import "./ChatAssistant.css";
import { OPEN_CHAT_EVENT } from "@/lib/chat-events";
import { fetchJson } from "@/lib/fetch-json";
import { trackUserAction } from "@/lib/google-services";

interface ChatSource {
  name: string;
  url: string;
  source_type: string;
  last_verified_at?: string | null;
}

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources?: ChatSource[];
  disclaimer?: string;
}

interface ChatReply {
  response: string;
  sources?: ChatSource[];
  disclaimer?: string;
  fallback_used?: boolean;
}

interface PersistedMessage {
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  sources?: ChatSource[];
  disclaimer?: string;
}

const quickActions = ["How do I register to vote?", "Where can I find my polling station?", "What documents do I need?"];
const CHAT_MESSAGES_STORAGE_KEY = "matdaanpath:chat-messages:v1";
const MAX_SAVED_MESSAGES = 30;

function createWelcomeMessage(): Message {
  return {
    text: "Namaste! I'm your election assistant. Ask about registration, deadlines, or voting rules and I'll help.",
    sender: "bot",
    timestamp: new Date(),
  };
}

function getInitialMessages(): Message[] {
  if (typeof window === "undefined") {
    return [createWelcomeMessage()];
  }

  const rawMessages = window.localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
  if (!rawMessages) {
    return [createWelcomeMessage()];
  }

  try {
    const parsedMessages = JSON.parse(rawMessages) as PersistedMessage[];
    if (!Array.isArray(parsedMessages) || parsedMessages.length === 0) {
      return [createWelcomeMessage()];
    }

    const hydratedMessages = parsedMessages
      .filter(
        (message) =>
          message &&
          typeof message.text === "string" &&
          typeof message.timestamp === "string" &&
          (message.sender === "user" || message.sender === "bot"),
      )
      .map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }))
      .filter((message) => !Number.isNaN(message.timestamp.getTime()));

    return hydratedMessages.length > 0 ? hydratedMessages : [createWelcomeMessage()];
  } catch {
    window.localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY);
    return [createWelcomeMessage()];
  }
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages());
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const messagesSnapshot: PersistedMessage[] = messages.slice(-MAX_SAVED_MESSAGES).map((message) => ({
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp.toISOString(),
      sources: message.sources,
      disclaimer: message.disclaimer,
    }));
    window.localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messagesSnapshot));
  }, [messages]);

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
        {
          text: data.response,
          sender: "bot",
          timestamp: new Date(),
          sources: data.sources,
          disclaimer: data.disclaimer,
        },
      ]);
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error ? requestError.message : "Please ensure the backend is running.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          text: `I'm having trouble reaching the assistant right now. ${errorMessage}`,
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
                  {message.sender === "bot" && ((message.sources?.length ?? 0) > 0 || message.disclaimer) ? (
                    <div className="msg-supporting-info">
                      {message.sources && message.sources.length > 0 ? (
                        <div className="msg-source-list" aria-label="Source citations">
                          {message.sources.map((source) => (
                            <a
                              key={`${source.name}-${source.url}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="msg-source-link"
                            >
                              {source.name}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {message.disclaimer ? <p className="msg-disclaimer">{message.disclaimer}</p> : null}
                    </div>
                  ) : null}
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
