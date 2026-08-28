import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";
import "./MyChatsPage.css";

const API_BASE = "http://localhost:5000";
const PALETTE = ["#2547E8", "#0D9488", "#EC4899", "#B45309", "#7C3AED", "#0891B2"];
const colorFor = (id) => PALETTE[id % PALETTE.length];
const initials = (name) => (name || "؟").trim().split(" ")[0].slice(0, 2);

const getToken = () => localStorage.getItem("token");
const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "همین الان";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 172800) return "دیروز";
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return date.toLocaleDateString("fa-IR");
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function apiRequest(method, path, body = null) {
  const token = getToken();
  const options = {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}/api${path}`, options);
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth";
    throw new Error("نشست منقضی شده");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `خطای سرور (${res.status})`);
  }
  return json;
}

export default function MyChatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const isLoggedIn = !!getToken();
  const authUser = getAuthUser();
  const logoImg = isDark ? logoWhite : logoBlack;

  const [hasOwnBusiness, setHasOwnBusiness] = useState(false);
  const [activeNav, setActiveNav] = useState("messages");

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: "" });

  const messagesEndRef = useRef(null);
  const toastTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // محافظت
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // بررسی کسب‌وکار فروشنده (برای منو)
  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== "seller") {
      setHasOwnBusiness(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setHasOwnBusiness(false);
      return;
    }
    fetch(`${API_BASE}/api/businesses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHasOwnBusiness(data.count > 0);
        else setHasOwnBusiness(false);
      })
      .catch(() => setHasOwnBusiness(false));
  }, [isLoggedIn, authUser]);

  const sellerMenuItem = useMemo(
    () => getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness),
    [isLoggedIn, authUser, hasOwnBusiness]
  );
  const SIDEBAR_NAV_ITEMS = useMemo(
    () => getSidebarItems(sellerMenuItem, isLoggedIn),
    [sellerMenuItem, isLoggedIn]
  );
  const BOTTOM_NAV_ITEMS = useMemo(
    () => getBottomNavItems(sellerMenuItem, isLoggedIn),
    [sellerMenuItem, isLoggedIn]
  );

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  const showToast = (msg) => {
    setToast({ visible: true, msg });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2600
    );
  };

  // ---------- لود گفتگوها از API ----------
  const loadConversations = async (preferId = null) => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/messages/mine");
      const list = (res?.data || []).map((c) => ({
        id: c.id,
        biz: c.business?.name || c.customer_name || "مغازه",
        businessId: c.business_id || c.business?.id,
        category: c.business?.category?.name || "",
        online: false,
        unread: 0,
        time: formatRelativeTime(c.updated_at),
        messages: (c.messages || []).map((m) => ({
          // مشتری: sender 'them' = پیام خودش (out) | 'me' = فروشنده (in)
          from: m.sender === "them" ? "out" : "in",
          text: m.text,
          time: formatTime(m.created_at),
          rawTime: m.created_at,
        })),
      }));
      setConversations(list);

      const fromState = preferId || location.state?.conversationId;
      if (fromState && list.some((c) => c.id === fromState)) {
        setActiveConvoId(fromState);
        if (typeof window !== "undefined" && window.innerWidth <= 860) {
          setMobileOpen(true);
        }
      } else if (
        typeof window !== "undefined" &&
        window.innerWidth > 860 &&
        list.length > 0 &&
        !activeConvoId
      ) {
        setActiveConvoId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "خطا در دریافت گفتگوها");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadConversations(location.state?.conversationId || null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeConvoId, conversations]);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  if (!isLoggedIn) return null;

  const activeConvo = conversations.find((c) => c.id === activeConvoId) || null;
  const isChatOpenMobile = mobileOpen && !!activeConvo;

  const lastMessage = (convo) =>
    convo.messages?.length ? convo.messages[convo.messages.length - 1] : null;

  const filteredConversations = conversations.filter((c) => {
    const term = searchTerm.trim();
    const lm = lastMessage(c);
    const matchesSearch =
      !term ||
      (c.biz && c.biz.includes(term)) ||
      (lm && lm.text && lm.text.includes(term));
    const matchesFilter = filter === "all" || (c.unread || 0) > 0;
    return matchesSearch && matchesFilter;
  });

  const openConvo = (id) => {
    setActiveConvoId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setMobileOpen(true);
    setDraft("");
    apiRequest("PUT", `/messages/${id}/customer-read`).catch(() => {});
  };

  const closeChatMobile = () => setMobileOpen(false);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeConvoId || sending) return;
    try {
      setSending(true);
      await apiRequest("POST", `/messages/${activeConvoId}/customer-send`, {
        text,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvoId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { from: "out", text, time: "اکنون" },
                ],
                time: "اکنون",
              }
            : c
        )
      );
      setDraft("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      console.error(err);
      showToast(err.message || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoGrow = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 110) + "px";
  };

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    showToast(`فایل «${file.name}» انتخاب شد — ارسال فایل به‌زودی`);
    e.target.value = "";
  };

  const goToShop = () => {
    if (activeConvo?.businessId) {
      navigate(`/business/${activeConvo.businessId}`);
    } else {
      showToast("صفحه مغازه در دسترس نیست");
    }
  };

  return (
    <div className="lookavoo" dir="rtl">
      <div className="app-shell">
        <Sidebar
          items={SIDEBAR_NAV_ITEMS}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          logoImg={logoImg}
        />
        <div className="main">
          <div className={`gc-wrap${isDark ? " dark" : ""}`}>
            {!isChatOpenMobile && (
              <nav className="gc-topnav">
                <div className="gc-nav-btns">
                  <button
                    className="gc-pill-btn gc-back"
                    onClick={() => navigate(-1)}
                    title="بازگشت"
                    aria-label="بازگشت"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <button
                    className="gc-pill-btn gc-home"
                    onClick={() => navigate("/")}
                    title="بازگشت به صفحه اصلی"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 11l9-8 9 8" />
                      <path d="M5 10v10h5v-6h4v6h5V10" />
                    </svg>
                  </button>
                </div>
                <div className="gc-nav-title">گفتگوهای من</div>
                <div className="gc-nav-end">
                  <button
                    className="gc-pill-btn gc-theme-toggle"
                    onClick={toggleTheme}
                    title={isDark ? "حالت روشن" : "حالت تیره"}
                    aria-label="تغییر تم"
                  >
                    {isDark ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="4.5" />
                        <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                      </svg>
                    )}
                  </button>
                  <div className="gc-user-avatar">
                    {(authUser?.name || authUser?.phone || "ک")[0]}
                  </div>
                </div>
              </nav>
            )}

            <div className="gc-shell">
              <aside className="gc-panel gc-convo-panel">
                <div className="gc-convo-search">
                  <div className="gc-search-input">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="جستجو در گفتگوها..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="gc-convo-filters">
                  <button
                    className={`gc-filter-chip ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    همه
                  </button>
                  <button
                    className={`gc-filter-chip ${filter === "unread" ? "active" : ""}`}
                    onClick={() => setFilter("unread")}
                  >
                    خوانده‌نشده
                  </button>
                </div>
                <div className="gc-convo-list">
                  {loading ? (
                    <div className="gc-convo-empty">در حال بارگذاری...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="gc-convo-empty">
                      هنوز گفتگویی ندارید. از صفحه یک مغازه «پیام به فروشنده» را بزنید.
                    </div>
                  ) : (
                    filteredConversations.map((c) => {
                      const lm = lastMessage(c);
                      const prefix = lm?.from === "out" ? "شما: " : "";
                      return (
                        <div
                          key={c.id}
                          className={`gc-convo-item ${c.id === activeConvoId ? "active" : ""}`}
                          onClick={() => openConvo(c.id)}
                        >
                          <div
                            className="gc-convo-avatar"
                            style={{ background: colorFor(c.id) }}
                          >
                            {initials(c.biz)}
                            {c.online && <span className="gc-online-dot" />}
                          </div>
                          <div className="gc-convo-body">
                            <div className="gc-convo-top-row">
                              <span className="gc-convo-name">{c.biz}</span>
                              <span className="gc-convo-time">{c.time}</span>
                            </div>
                            <div className="gc-convo-bottom-row">
                              <span className="gc-convo-snippet">
                                {prefix}
                                {lm?.text || ""}
                              </span>
                              {(c.unread || 0) > 0 && (
                                <span className="gc-convo-unread">
                                  {c.unread.toLocaleString("fa-IR")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              <section
                className={`gc-panel gc-chat-panel ${mobileOpen ? "open" : ""}`}
              >
                {!activeConvo ? (
                  <div className="gc-chat-empty">
                    <div className="gc-ce-ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3>یک گفتگو را انتخاب کن</h3>
                    <p>
                      پیام‌هایی که با فروشنده‌های مختلف رد و بدل کرده‌ای اینجا نمایش داده
                      می‌شود.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="gc-chat-header">
                      <button
                        className="gc-chat-back-mobile"
                        onClick={closeChatMobile}
                        aria-label="بازگشت به لیست"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                      <div
                        className="gc-ch-avatar"
                        style={{ background: colorFor(activeConvo.id) }}
                      >
                        {initials(activeConvo.biz)}
                      </div>
                      <div className="gc-ch-info">
                        <div className="gc-ch-name">{activeConvo.biz}</div>
                        <div className="gc-ch-status">
                          {activeConvo.online ? (
                            <>
                              <span className="gc-dot" /> آنلاین
                            </>
                          ) : (
                            `آخرین فعالیت: ${activeConvo.time}`
                          )}
                        </div>
                        <div className="gc-shop-link-chip" onClick={goToShop}>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                          >
                            <path d="M7 17 17 7M8 7h9v9" />
                          </svg>
                          مشاهده صفحه فروشگاه
                        </div>
                      </div>
                      <div className="gc-chat-header-actions">
                        <button
                          className="gc-icon-action-btn"
                          title="اطلاعات فروشگاه"
                          onClick={goToShop}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="gc-chat-messages">
                      {(() => {
                        let lastDayLabel = "";
                        return activeConvo.messages.map((m, idx) => {
                          const dayLabel =
                            m.time === "اکنون"
                              ? "امروز"
                              : m.rawTime
                              ? formatRelativeTime(m.rawTime).includes("پیش") ||
                                formatRelativeTime(m.rawTime) === "دیروز"
                                ? formatRelativeTime(m.rawTime)
                                : "امروز"
                              : "امروز";
                          const showDivider = dayLabel !== lastDayLabel;
                          lastDayLabel = dayLabel;
                          return (
                            <React.Fragment key={idx}>
                              {showDivider && (
                                <div className="gc-day-divider">{dayLabel}</div>
                              )}
                              <div
                                className={`gc-msg-row ${
                                  m.from === "out" ? "gc-out" : "gc-in"
                                }`}
                              >
                                <div>
                                  <div className="gc-msg-bubble">{m.text}</div>
                                  <div className="gc-msg-time">
                                    {m.time}
                                    {m.from === "out" && (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m5 12 4 4 10-10" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        });
                      })()}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="gc-chat-input-bar">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        style={{ display: "none" }}
                      />
                      <button
                        className="gc-attach-btn"
                        title="پیوست فایل"
                        onClick={openFilePicker}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.42 17.4a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49" />
                        </svg>
                      </button>
                      <textarea
                        ref={textareaRef}
                        className="gc-chat-textarea"
                        rows={1}
                        placeholder="پیام خود را بنویس..."
                        value={draft}
                        onChange={(e) => {
                          setDraft(e.target.value);
                          autoGrow(e);
                        }}
                        onKeyDown={handleComposerKeyDown}
                        disabled={sending}
                      />
                      <button
                        className="gc-send-btn"
                        onClick={handleSend}
                        title="ارسال"
                        disabled={sending || !draft.trim()}
                      >
                        ➤
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>

            <div className={`gc-toast ${toast.visible ? "show" : ""}`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 12 2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>{toast.msg}</span>
            </div>
          </div>
          <Footer />
        </div>
      </div>
      <BottomNav
        items={BOTTOM_NAV_ITEMS}
        activeNav={activeNav}
        onNavClick={handleNavClick}
      />
    </div>
  );
}