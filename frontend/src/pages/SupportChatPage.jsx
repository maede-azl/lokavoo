import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import {
  getSidebarItems,
  getBottomNavItems,
  getSellerMenuItem,
} from "../components/navConfig";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";
import "./SupportChatPage.css";

const getToken = () => localStorage.getItem("token");

const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

async function supportRequest(method, path, body = null) {
  const token = getToken();
  const options = {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, options);

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth";
    throw new Error("نشست شما منقضی شده است");
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || `خطای سرور (${response.status})`);
  }

  return data;
}

function normalizeThread(thread) {
  return {
    id: thread?.id ?? null,
    unread: Number(thread?.unread || 0),
    messages: Array.isArray(thread?.messages)
      ? thread.messages.map((message) => ({
          id: message.id,
          sender: message.sender,
          text: message.text || "",
          created_at: message.created_at,
        }))
      : [],
  };
}

export default function SupportChatPage() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const token = getToken();
  const authUser = getAuthUser();
  const logoImg = isDark ? logoWhite : logoBlack;

  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [hasOwnBusiness, setHasOwnBusiness] = useState(false);
  const messagesEndRef = useRef(null);
  const toastTimerRef = useRef(null);

  const isLoggedIn = Boolean(token);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== "seller") {
      setHasOwnBusiness(false);
      return;
    }

    const currentToken = getToken();
    fetch(`${API_BASE_URL}/api/businesses/mine`, {
      headers: currentToken
        ? { Authorization: `Bearer ${currentToken}` }
        : {},
    })
      .then((response) => response.json())
      .then((data) => {
        setHasOwnBusiness(Boolean(data?.success && data?.count > 0));
      })
      .catch(() => setHasOwnBusiness(false));
  }, [authUser?.role, isLoggedIn]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const loadThread = useCallback(
    async (silent = false) => {
      if (!isLoggedIn) return;

      try {
        if (!silent) setLoading(true);
        const response = await supportRequest("GET", "/support/thread");
        setThread(normalizeThread(response?.data));
      } catch (error) {
        console.error("خطا در دریافت گفتگوی پشتیبانی:", error);
        if (!silent) {
          showToast(error.message || "خطا در دریافت پیام‌های پشتیبانی");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isLoggedIn, showToast]
  );

  useEffect(() => {
    if (isLoggedIn) loadThread();
  }, [isLoggedIn, loadThread]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadThread(true);
      }
    }, 7000);

    return () => window.clearInterval(interval);
  }, [isLoggedIn, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.messages?.length]);

  const sellerMenuItem = getSellerMenuItem(
    isLoggedIn,
    authUser,
    hasOwnBusiness
  );
  const sidebarItems = getSidebarItems(sellerMenuItem, isLoggedIn);
  const bottomNavItems = getBottomNavItems(sellerMenuItem, isLoggedIn);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const response = await supportRequest(
        "POST",
        "/support/thread/messages",
        { text }
      );
      const sentMessage = response?.data;

      setThread((previous) => ({
        ...(previous || { id: null, unread: 0, messages: [] }),
        messages: [
          ...(previous?.messages || []),
          {
            id: sentMessage?.id || `local-${Date.now()}`,
            sender: "user",
            text: sentMessage?.text || text,
            created_at: sentMessage?.created_at || new Date().toISOString(),
          },
        ],
      }));
      setDraft("");
    } catch (error) {
      console.error("خطا در ارسال پیام پشتیبانی:", error);
      showToast(error.message || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="lookavoo support-chat-page" dir="rtl">
      <div className="app-shell">
        <Sidebar
          items={sidebarItems}
          activeNav="messages"
          onNavClick={(item) => item.path && navigate(item.path)}
          logoImg={logoImg}
        />

        <main className="main support-main">
          <header className="support-topbar">
            <div className="support-topbar-actions">
              <button
                className="support-circle-btn"
                type="button"
                onClick={() => navigate(-1)}
                title="بازگشت"
                aria-label="بازگشت"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <button
                className="support-circle-btn"
                type="button"
                onClick={() => navigate("/")}
                title="صفحه اصلی"
                aria-label="صفحه اصلی"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l9-8 9 8" />
                  <path d="M5 10v10h5v-6h4v6h5V10" />
                </svg>
              </button>
            </div>

            <div className="support-topbar-title">ارتباط با پشتیبانی</div>

            <div className="support-topbar-end">
              <button
                className="support-circle-btn"
                type="button"
                onClick={toggleTheme}
                title={isDark ? "حالت روشن" : "حالت تیره"}
                aria-label="تغییر تم"
              >
                {isDark ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4.5" />
                    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                  </svg>
                )}
              </button>
              <div className="support-user-avatar">
                {(authUser?.name || authUser?.phone || "ک").slice(0, 1)}
              </div>
            </div>
          </header>

          <section className="support-content">
            <div className="support-card">
              <div className="support-card-head">
                <div className="support-admin-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 13a8 8 0 0 1 16 0" />
                    <rect x="2.5" y="12" width="4" height="6" rx="2" />
                    <rect x="17.5" y="12" width="4" height="6" rx="2" />
                    <path d="M6.5 18c.9 2 3 3 5.5 3s4.6-1 5.5-3" />
                  </svg>
                </div>
                <div>
                  <h1>پشتیبانی لوکاوو</h1>
                  <p>پیام شما مستقیماً برای تیم پشتیبانی ارسال می‌شود.</p>
                </div>
              </div>

              <div className="support-messages">
                {loading ? (
                  <div className="support-empty">
                    <span className="support-spinner" />
                    در حال بارگذاری گفتگو...
                  </div>
                ) : !thread?.messages?.length ? (
                  <div className="support-empty">
                    <div className="support-empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </div>
                    <b>هنوز پیامی ارسال نشده است</b>
                    <span>پیام خود را پایین صفحه بنویسید تا گفت‌وگو با پشتیبانی شروع شود.</span>
                  </div>
                ) : (
                  thread.messages.map((message) => {
                    const isUser = message.sender === "user";
                    return (
                      <div
                        className={`support-message-row ${isUser ? "is-user" : "is-admin"}`}
                        key={message.id}
                      >
                        <div className="support-bubble">
                          <div className="support-message-text">{message.text}</div>
                          <div className="support-message-time">
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="support-composer">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="پیام خود را برای پشتیبانی بنویسید..."
                  rows={1}
                  maxLength={2000}
                  disabled={sending}
                />
                <button
                  type="button"
                  className="support-send-btn"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  title="ارسال پیام"
                >
                  {sending ? (
                    <span className="support-spinner support-spinner-small" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" />
                      <path d="M22 2l-7 20-4-9-9-4 20-7Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </section>

          <Footer />
          <BottomNav items={bottomNavItems} activeNav="messages" onNavClick={(item) => item.path && navigate(item.path)} />
        </main>
      </div>

      {toast ? <div className="support-toast">{toast}</div> : null}
    </div>
  );
}
