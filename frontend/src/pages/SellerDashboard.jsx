import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SellerDashboard.css';
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";
import { createPortal } from 'react-dom';
import api from '../api';
import SubscriptionCard from '../components/SubscriptionCard';

const HOME_PATH = '/';
const ADD_BUSINESS_PATH = '/add-business';

const TITLES = {
  overview: ['نمای کلی', 'خلاصه‌ای از وضعیت مغازه'],
  products: ['محصولات', 'مدیریت محصولات مغازه'],
  messages: ['پیام‌ها', 'پیام‌های کاربران و مشتریان'],
  reviews: ['نظرات', 'بازخورد کاربران درباره مغازه'],
  growth: ['رشد و تبلیغات', 'آمار دیده‌شدن و ابزارهای رشد'],
  settings: ['تنظیمات فروشگاه', 'تنظیمات اطلاعات و نمایش مغازه'],
  businesses: ['کسب‌وکارهای من', 'مدیریت کسب‌وکارهای شما'],
};

const PALETTE = ['#2547E8', '#0D9488', '#EC4899', '#B45309', '#7C3AED', '#0891B2'];
const colorFor = (id) => PALETTE[id % PALETTE.length];
const initials = (name) => (name || '؟').trim().split(' ')[0].slice(0, 2);

function statusPillClass(status) {
  if (status === 'موجود') return 'status-pill new';
  if (status === 'رو به اتمام') return 'status-pill processing';
  return 'status-pill cancelled';
}

const NAV_ITEMS = [
  { key: 'overview', label: 'نمای کلی', icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /> },
  { key: 'products', label: 'محصولات', icon: <><path d="M20 7 12 3 4 7l8 4 8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></> },
  { key: 'messages', label: 'پیام‌ها', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, badge: true },
  { key: 'reviews', label: 'نظرات', icon: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /> },
  { key: 'growth', label: 'رشد و تبلیغات', icon: <path d="M3 20V10M9 20V4M15 20v-7M21 20V7" /> },
  { key: 'settings', label: 'تنظیمات فروشگاه', icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1-2.8 2.8-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5v.1h-4v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1-2.8-2.8.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3v-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1 2.8-2.8.1.1a1.65 1.65 0 0 0 1.8.3 1.65 1.65 0 0 0 1-1.5V3h4v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1 2.8 2.8-.1.1a1.65 1.65 0 0 0-.3 1.8 1.65 1.65 0 0 0 1.5 1h.1v4h-.1a1.65 1.65 0 0 0-1.5 1Z" /></> },
  { key: 'businesses', label: 'کسب‌وکارهای من', icon: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 9h2M14 9h2M8 13h2M14 13h2" /></> },
];

const emptyProductForm = {
  name: '',
  category: '',
  price: '',
  stock: '',
  status: 'موجود',
  emoji: '📦',
  image: null,
};

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  const fromAttr = document.documentElement.getAttribute('data-mode');
  if (fromAttr === 'dark' || fromAttr === 'light') return fromAttr;
  try {
    const fromStorage = localStorage.getItem('theme') || localStorage.getItem('mode') || localStorage.getItem('data-mode');
    if (fromStorage === 'dark' || fromStorage === 'light') return fromStorage;
  } catch (_) { }
  return 'light';
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 172800) return 'دیروز';
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return date.toLocaleDateString('fa-IR');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotifIcon(iconKey) {
  // آیکون‌های پیش‌فرض بر اساس کلید یا رنگ
  if (iconKey === 'order' || iconKey === 'package') {
    return <path d="M20 8l-8-5-8 5v8l8 5 8-5V8Z" />;
  }
  if (iconKey === 'message' || iconKey === 'chat') {
    return <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
  }
  if (iconKey === 'warning' || iconKey === 'alert') {
    return (<><path d="M12 9v4" /><path d="M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></>);
  }
  if (iconKey === 'star' || iconKey === 'review') {
    return <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />;
  }
  if (iconKey === 'money' || iconKey === 'payment') {
    return (<><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></>);
  }
  // پیش‌فرض
  return <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [msgFilter, setMsgFilter] = useState('all');
  const [msgSearch, setMsgSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [myBusinesses, setMyBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [activeBusinessId, setActiveBusinessId] = useState(() => {
    try {
      const saved = localStorage.getItem("activeBusinessId");
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const selectBusiness = (id) => {
    const numId = id == null ? null : Number(id);
    setActiveBusinessId(numId);
    try {
      if (numId) localStorage.setItem("activeBusinessId", String(numId));
      else localStorage.removeItem("activeBusinessId");
    } catch (_) { }
  };
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsMeta, setReviewsMeta] = useState({ count: 0, average: 0 });
  const [reviewReplyText, setReviewReplyText] = useState('');
  const [activeReviewReplyId, setActiveReviewReplyId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const [notifPopStyle, setNotifPopStyle] = useState({});
  const [isMobileTopbar, setIsMobileTopbar] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 900
  );
  const bellBtnRef = useRef(null);

  const [stats, setStats] = useState({
    productsCount: 0,
    reviewsCount: 0,
    avgRating: 0,
    unreadMessages: 0,
  });
  const [reports, setReports] = useState({
    monthlyViews: 0,
    profileViews: 0,
    productClicks: 0,
    visibilityScore: 0,
    weeklyViews: [],
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [switches, setSwitches] = useState({ showPhone: true, allowMessages: true, showReviews: true });
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    website: '',
    address: '',
  });

  const businessDetailPath = `/business/${activeBusinessId}`;
  const [planMode, setPlanMode] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const toastTimer = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // همگام‌سازی تم
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', theme);
    document.documentElement.dir = 'rtl';
    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('mode', theme);
      localStorage.setItem('data-mode', theme);
    } catch (_) { }
  }, [theme]);

  useEffect(() => {
    const applyIfChanged = (next) => {
      if (next === 'dark' || next === 'light') {
        setTheme((prev) => (prev === next ? prev : next));
      }
    };
    const onStorage = (e) => {
      if (e.key === 'theme' || e.key === 'mode' || e.key === 'data-mode') {
        applyIfChanged(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    const observer = new MutationObserver(() => {
      const mode = document.documentElement.getAttribute('data-mode');
      applyIfChanged(mode);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });
    applyIfChanged(document.documentElement.getAttribute('data-mode'));
    return () => {
      window.removeEventListener('storage', onStorage);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeConvoId, conversations]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (e.target.closest('.notif-pop') || e.target.closest('.notif-wrap')) return;
      setNotifOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (e) => setIsMobileTopbar(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    loadMyBusinesses();
  }, []);

  useEffect(() => {
    if (!activeBusinessId) {
      setProducts([]);
      setConversations([]);
      setReviews([]);
      setNotifications([]);
      setStats({ productsCount: 0, reviewsCount: 0, avgRating: 0, unreadMessages: 0 });
      return;
    }

    loadProducts(activeBusinessId);
    loadConversations(activeBusinessId);
    loadReviews(activeBusinessId);
    loadNotifications(activeBusinessId);
    loadStats(activeBusinessId);
    loadReports(activeBusinessId);
    loadSettings(activeBusinessId);
    loadCurrentUser();
    loadMySubscription(activeBusinessId);

    // هر ۲۰ ثانیه نوتیف و پیام‌ها را رفرش کن (وقتی تب فعال است)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications(activeBusinessId);
        loadConversations(activeBusinessId);
        loadStats(activeBusinessId);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [activeBusinessId]);

  useEffect(() => {
  loadPlans();
}, []);

  function go(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth < 901) setSidebarOpen(false);
  }

  function toast(msg) {
    setToastMsg(msg);
    setShowToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 2600);
  }

  // ---------- کسب‌وکارها ----------
  const loadMyBusinesses = async () => {
    try {
      setBusinessesLoading(true);
      const res = await api.business.getMyBusinesses();
      const list = res?.data || [];
      const normalized = list.map((b) => ({
        id: b.id,
        name: b.name || 'بدون نام',
        cat: b.category?.name || b.status || 'کسب‌وکار',
        avatar: (b.name || 'م')[0],
        color: colorFor(b.id),
        status: b.status,
      }));

      setMyBusinesses(normalized);

      if (normalized.length === 0) {
        selectBusiness(null);
        return;
      }

      // فقط اگر id فعلی در لیست نبود، به اولین کسب‌وکار برو
      setActiveBusinessId((prev) => {
        const exists = normalized.some((b) => b.id === prev);
        if (exists) return prev; // همان قبلی بماند → محصولات دوباره لود نمی‌شوند

        const nextId = normalized[0].id;
        try {
          localStorage.setItem('activeBusinessId', String(nextId));
        } catch (_) { }
        return nextId;
      });
    } catch (err) {
      console.error('خطا در دریافت کسب‌وکارها:', err);
      toast('خطا در دریافت لیست کسب‌وکارها');
    } finally {
      setBusinessesLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      // اول از localStorage (اگه موقع لاگین ذخیره کردی)
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.name || parsed?.phone) {
            setCurrentUser(parsed);
          }
        } catch (_) { }
      }

      // بعد از API تا همیشه به‌روز باشه
      const res = await api.auth.getMe();
      const user = res?.data || res?.user || res;
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch (_) { }
      }
    } catch (err) {
      console.error('خطا در دریافت اطلاعات کاربر:', err);
    }
  };
  // ---------- محصولات ----------
  const loadProducts = async (businessId) => {
    if (!businessId) {
      setProducts([]);
      return;
    }
    try {
      setProductsLoading(true);
      const res = await api.business.getProducts(businessId);
      const list = res?.data || res || [];
      const normalized = list.map((p) => {
        let status = 'موجود';
        if (p.active === false || p.stock === 0) status = 'ناموجود';
        else if (p.stock <= 2) status = 'رو به اتمام';
        const imageUrl = p.image_url
          ? p.image_url.startsWith('http')
            ? p.image_url
            : `http://localhost:5000${p.image_url.startsWith('/') ? '' : '/'}${p.image_url}`
          : null;
        return {
          id: p.id,
          name: p.name || 'بدون نام',
          category: p.category || '',
          price: p.price != null ? Number(p.price).toLocaleString('fa-IR') : '۰',
          stock: String(p.stock ?? 0),
          status,
          emoji: '📦',
          image: imageUrl,
          raw: p,
        };
      });
      setProducts(normalized);
    } catch (err) {
      console.error('خطا در دریافت محصولات:', err);
      toast('خطا در دریافت محصولات');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setImagePreview(null);
    setProductModalOpen(true);
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      category: product.category || '',
      price: product.raw?.price != null ? String(product.raw.price) : product.price.replace(/[,٬]/g, ''),
      stock: product.stock || '0',
      status: product.status || 'موجود',
      emoji: product.emoji || '📦',
      image: product.image || null,
    });
    setImagePreview(product.image || null);
    setProductModalOpen(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('فقط فایل تصویری مجاز است');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('حجم تصویر نباید بیشتر از ۵ مگابایت باشد');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setImagePreview(result);
      setProductForm((f) => ({ ...f, image: result }));
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagePreview(null);
    setProductForm((f) => ({ ...f, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function saveProduct() {
    if (!productForm.name.trim() || !productForm.price.trim()) {
      toast('نام و قیمت محصول الزامی است');
      return;
    }
    if (!activeBusinessId) {
      toast('ابتدا یک مغازه انتخاب کنید');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', productForm.name.trim());
      formData.append('price', String(productForm.price).replace(/[,٬]/g, ''));
      formData.append('businessId', activeBusinessId);
      let stock = Number(productForm.stock) || 0;
      let active = true;
      if (productForm.status === 'ناموجود') {
        active = false;
        stock = 0;
      } else if (productForm.status === 'رو به اتمام') {
        active = true;
        if (stock > 2) stock = 2;
      } else {
        active = true;
        if (stock <= 2) stock = 10;
      }
      formData.append('stock', String(stock));
      formData.append('active', String(active));
      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      }
      if (editingProduct) {
        await api.business.updateProduct(editingProduct.id, formData);
        toast('محصول با موفقیت ویرایش شد');
      } else {
        await api.business.createProduct(formData);
        toast('محصول جدید اضافه شد');
      }
      await loadProducts(activeBusinessId);
      setProductModalOpen(false);
      setEditingProduct(null);
      setProductForm(emptyProductForm);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('خطا در ذخیره محصول:', err);
      toast(err.message || 'خطا در ذخیره محصول');
    }
  }

  function confirmDeleteProduct(id) {
    setDeleteConfirmId(id);
  }

  async function deleteProduct() {
    if (!deleteConfirmId) return;
    try {
      await api.business.deleteProduct(deleteConfirmId);
      toast('محصول حذف شد');
      await loadProducts(activeBusinessId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('خطا در حذف محصول:', err);
      toast(err.message || 'خطا در حذف محصول');
    }
  }

  // ---------- آمار ----------
  const loadStats = async (businessId) => {
    try {
      const res = await api.business.getDashboardStats(businessId);
      setStats(res?.data || { productsCount: 0, reviewsCount: 0, avgRating: 0, unreadMessages: 0 });
    } catch (err) {
      console.error('خطا در دریافت آمار:', err);
    }
  };
  const loadReports = async (businessId) => {
    if (!businessId) return;
    try {
      const res = await api.business.getDashboardReports(businessId);
      setReports(
        res?.data || {
          monthlyViews: 0,
          profileViews: 0,
          productClicks: 0,
          visibilityScore: 0,
          weeklyViews: [],
        }
      );
    } catch (err) {
      console.error('خطا در دریافت گزارشات:', err);
    }
  };

  //-------------- اشتراک ها ------------//
  const loadPlans = async () => {
    try {
      const res = await api.subscription.getPlans();
      setPlans(res?.data || []);
    } catch (err) {
      console.error('خطا در دریافت پلن‌ها:', err);
    }
  };
  const loadMySubscription = async (businessId) => {
    if (!businessId) {
      setCurrentSubscription(null);
      return;
    }
    try {
      const res = await api.subscription.getMySubscription(businessId);
      setCurrentSubscription(res?.data || null);
    } catch (err) {
      console.error('خطا در دریافت اشتراک فعلی:', err);
      setCurrentSubscription(null);
    }
  };

 const handleSubscribe = async (planKey) => {
  if (!activeBusinessId) {
    toast('ابتدا یک مغازه انتخاب کنید');
    return;
  }

  const plan = getPlan(planKey);
  if (!plan) {
    toast('پلن پیدا نشد');
    return;
  }

  // نام‌های تمیز برای نمایش
  const displayNames = {
    basic: 'پایه',
    pro: 'حرفه‌ای',
    pro_plus: 'حرفه‌ای پلاس',
  };

  const displayName = displayNames[planKey] || plan.name;

  try {
    setSubscribing(true);

    const res = await api.subscription.subscribe(activeBusinessId, plan.id);
    setCurrentSubscription(res?.data || { plan: { key: planKey }, status: 'active' });
    toast(`اشتراک «${displayName}» با موفقیت فعال شد`);
  } catch (err) {
    console.error(err);
    toast(err.message || 'خطا در فعال‌سازی اشتراک');
  } finally {
    setSubscribing(false);
  }
};

  // ---------- پیام‌ها ----------
  const loadConversations = async (businessId) => {
    if (!businessId) return;
    try {
      setMessagesLoading(true);
      const res = await api.business.getConversations(businessId);
      const list = (res?.data || []).map((c) => ({
        id: c.id,
        name: c.customer_name || 'مشتری',
        online: false,
        unread: c.unread ? 1 : 0,
        time: formatRelativeTime(c.updated_at),
        messages: (c.messages || []).map((m) => ({
          from: m.sender === 'me' ? 'out' : 'in',
          text: m.text,
          time: formatTime(m.created_at),
          rawTime: m.created_at,
        })),
      }));
      setConversations(list);
      if (typeof window !== 'undefined' && window.innerWidth > 860 && list.length > 0 && !activeConvoId) {
        setActiveConvoId(list[0].id);
      }
    } catch (err) {
      console.error('خطا در دریافت پیام‌ها:', err);
      toast('خطا در دریافت پیام‌ها');
      setConversations([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeConvoId) || null;
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  function openConvo(id) {
    setActiveConvoId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setMobileChatOpen(true);
    setDraft('');
    api.business.markConversationRead(id).catch(() => { });
  }

  function closeChatMobile() {
    setMobileChatOpen(false);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !activeConvoId) return;
    try {
      await api.business.sendMessage(activeConvoId, text);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvoId
            ? {
              ...c,
              messages: [...c.messages, { from: 'out', text, time: 'اکنون' }],
              time: 'اکنون',
              unread: 0,
            }
            : c
        )
      );
      setDraft('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error(err);
      toast(err.message || 'خطا در ارسال پیام');
    }
  }

  function handleComposerKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function autoGrow(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
  }

  // ---------- نظرات ----------
  const loadReviews = async (businessId) => {
    if (!businessId) return;
    try {
      setReviewsLoading(true);
      const res = await api.business.getReviews(businessId);
      const data = res?.data || {};
      const list = (data.reviews || []).map((r) => ({
        id: r.id,
        name: r.user?.name || 'کاربر',
        date: formatRelativeTime(r.created_at),
        rating: r.rating,
        text: r.comment || '',
        replied: !!r.reply,
        replyText: r.reply || '',
      }));
      setReviews(list);
      setReviewsMeta({
        count: data.count || list.length,
        average: data.average || 0,
      });
    } catch (err) {
      console.error('خطا در دریافت نظرات:', err);
      toast('خطا در دریافت نظرات');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  function openReviewReply(id) {
    setActiveReviewReplyId(id);
    setReviewReplyText('');
  }

  async function submitReviewReply() {
    if (!reviewReplyText.trim()) {
      toast('متن پاسخ را وارد کنید');
      return;
    }
    if (!activeReviewReplyId) return;
    try {
      await api.business.replyToReview(activeReviewReplyId, reviewReplyText.trim());
      toast('پاسخ شما ثبت شد');
      await loadReviews(activeBusinessId);
      setActiveReviewReplyId(null);
      setReviewReplyText('');
    } catch (err) {
      console.error(err);
      toast(err.message || 'خطا در ثبت پاسخ');
    }
  }

  // ---------- نوتیفیکیشن‌ها ----------
  const loadNotifications = async (businessId) => {
    if (!businessId) return;
    try {
      setNotifsLoading(true);
      const res = await api.business.getNotifications(businessId);
      const list = (res?.data || []).map((n) => ({
        id: n.id,
        title: n.title,
        desc: n.desc || '',
        time: formatRelativeTime(n.created_at),
        read: n.read,
        color: n.color || '#2547E8',
        icon: getNotifIcon(n.icon),
      }));
      setNotifications(list);
    } catch (err) {
      console.error('خطا در دریافت نوتیفیکیشن‌ها:', err);
      setNotifications([]);
    } finally {
      setNotifsLoading(false);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  function computeNotifPopPosition() {
    if (isMobileTopbar || !bellBtnRef.current) {
      setNotifPopStyle({});
      return;
    }
    const rect = bellBtnRef.current.getBoundingClientRect();
    const popWidth = 378;
    const margin = 10;
    let left = rect.right - popWidth;
    if (left < margin) left = margin;
    if (left + popWidth > window.innerWidth - margin) {
      left = window.innerWidth - popWidth - margin;
    }
    setNotifPopStyle({
      top: rect.bottom + 14,
      left,
    });
  }

  function handleToggleNotif(e) {
    e.stopPropagation();
    setNotifOpen((o) => {
      const next = !o;
      if (next) {
        setBellRinging(true);
        setTimeout(() => setBellRinging(false), 550);
        computeNotifPopPosition();
      }
      return next;
    });
  }

  useEffect(() => {
    if (!notifOpen) return;
    function onResize() {
      computeNotifPopPosition();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [notifOpen, isMobileTopbar]);

  async function markNotifRead(id) {
    try {
      await api.business.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllNotifRead() {
    if (!activeBusinessId) return;
    try {
      await api.business.markAllNotificationsRead(activeBusinessId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast('همه نوتیفیکیشن‌ها خوانده شد');
    } catch (err) {
      toast(err.message || 'خطا');
    }
  }

  function openNotifModal() {
    setNotifOpen(false);
    setNotifModalOpen(true);
  }

  function closeNotifModal() {
    setNotifModalOpen(false);
  }

  // ---------- تنظیمات ----------
  const loadSettings = async (businessId) => {
    if (!businessId) return;
    try {
      const res = await api.business.getBusinessSettings(businessId);
      const b = res?.data;
      if (b) {
        setContactInfo({
          phone: b.phone || '',
          website: '',
          address: b.address || '',
        });
        setSwitches((prev) => ({
          ...prev,
          allowMessages: b.notif_message ?? true,
          showReviews: b.notif_review ?? false,
        }));
      }
    } catch (err) {
      console.error('خطا در دریافت تنظیمات:', err);
    }
  };

  function toggleSwitch(key) {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveSettings() {
    if (!activeBusinessId) {
      toast('ابتدا یک مغازه انتخاب کنید');
      return;
    }
    try {
      await api.business.updateBusinessSettings(activeBusinessId, {
        phone: contactInfo.phone,
        address: contactInfo.address,
        notif_message: switches.allowMessages,
        notif_review: switches.showReviews,
      });
      toast('تنظیمات با موفقیت ذخیره شد');
    } catch (err) {
      console.error(err);
      toast(err.message || 'خطا در ذخیره تنظیمات');
    }
  }

  // ---------- فیلترها ----------
  const isChatOpenMobile = activePage === 'messages' && mobileChatOpen && !!activeConvo;
  const lastMessage = (convo) => convo.messages[convo.messages.length - 1];

  const filteredConversations = conversations.filter((c) => {
    const term = msgSearch.trim();
    const lm = lastMessage(c);
    const matchesSearch = !term || c.name.includes(term) || (lm && lm.text.includes(term));
    const matchesFilter = msgFilter === 'all' || (c.unread || 0) > 0;
    return matchesSearch && matchesFilter;
  });


  const activeProductsCount = products.filter((p) => p.status === 'موجود').length;
  const filteredProducts = products.filter((p) =>
    p.name.includes(productFilter || '')
  );

  const formatPrice = (n) => (n || 0).toLocaleString('fa-IR');

  const getPlan = (key) =>
    plans.find((p) => p.key === key && p.billing_cycle === planMode);

  console.log('plans from state:', plans);
console.log('pro plan found:', getPlan('pro'));

  const prices = {
    start: formatPrice(getPlan('basic')?.price ?? 0),
    growth: formatPrice(getPlan('pro')?.price ?? 0),
    plus: formatPrice(getPlan('pro_plus')?.price ?? 0),
    unit: planMode === 'monthly' ? 'تومان / ماه' : 'تومان / سال',
  };

  const currentPlanKey = currentSubscription?.plan?.key || 'basic';

  return (
    <div className="seller-dashboard-page" data-mode={theme}>
      <style>{`
        :root, [data-mode="light"] {
          --bg: #f4f6fb;
          --surface: #ffffff;
          --card: #f1f5f9;
          --text: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --primary: #2547e8;
          --primary-tint: rgba(37, 71, 232, 0.12);
          --accent: #f59e0b;
          --ok: #16a34a;
          --ok-tint: rgba(22, 163, 74, 0.12);
          --danger: #e0344c;
        }
        [data-mode="dark"] {
          --bg: #0b1220;
          --surface: #111827;
          --card: #1e293b;
          --text: #f1f5f9;
          --text-muted: #94a3b8;
          --border: #1e293b;
          --primary: #5b7cfa;
          --primary-tint: rgba(91, 124, 250, 0.18);
          --accent: #fbbf24;
          --ok: #22c55e;
          --ok-tint: rgba(34, 197, 94, 0.15);
          --danger: #f87171;
        }
        .seller-dashboard-page {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        .seller-dashboard-page .app-shell {
          flex: 1 0 auto;
          min-height: 0;
        }
        .seller-dashboard-page + footer,
        .seller-dashboard-page ~ footer,
        body > footer,
        #root > footer,
        .app-footer,
        .site-footer,
        footer.footer {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 10 !important;
        }
      `}</style>

      <div className="app-shell">
        {/* ===================== SIDEBAR ===================== */}
        <aside className={`sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="بستن منو">
            ×
          </button>
          <div className="logo">
            <img src={theme === 'dark' ? logoWhite : logoBlack} alt="لوکاوو" className="logo-img" />
            <span className="seller-tag">فروشنده</span>
          </div>
          <nav className="nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={activePage === item.key ? 'active' : ''}
                onClick={() => go(item.key)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {item.icon}
                </svg>
                {item.label}
                {item.badge && unreadCount > 0 && <span className="badge-mini">{unreadCount}</span>}
              </button>
            ))}
            <Link className="add-business-btn" to={ADD_BUSINESS_PATH}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              افزودن کسب‌وکار
            </Link>
          </nav>
          <div className="sidebar-footer">
            {(() => {
              const active = myBusinesses.find((b) => b.id === activeBusinessId);
              return (
                <div className="shop-plate">
                  <div
                    className="sp-avatar"
                    style={{ background: active?.color || 'linear-gradient(135deg, #F59E0B, #FFC24B)' }}
                  >
                    {active?.avatar || '؟'}
                  </div>
                  <div>
                    <b>{active?.name || 'مغازه‌ای انتخاب نشده'}</b>
                    <span>{active?.cat || '—'}</span>
                  </div>
                </div>
              );
            })()}
            <Link className="exit-btn" to={HOME_PATH}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11l9-8 9 8" />
                <path d="M5 10v10h5v-6h4v6h5V10" />
              </svg>
              بازگشت به صفحه اصلی
            </Link>
            <button className="exit-btn" onClick={() => toast('خروج انجام شد')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              خروج
            </button>
          </div>
        </aside>

        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* ===================== MAIN ===================== */}
        <div className="main">
          {!isChatOpenMobile && (
            <header className="topbar">
              <img src={theme === 'dark' ? logoWhite : logoBlack} alt="لوکاوو" className="topbar-mobile-logo" />
              <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="منو">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
              <button className="back-btn" onClick={() => window.history.back()} title="بازگشت">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className="topbar-store">
                <b>{TITLES[activePage][0]}</b>
                <div className="page-sub">{TITLES[activePage][1]}</div>
              </div>
              <div className="topbar-center" />
              <div className="topbar-icons">
                <button
                  className="icon-btn theme-toggle"
                  onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                  title="تغییر تم"
                >
                  <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </button>
                <div className="notif-wrap">
                  <button className="icon-btn" onClick={handleToggleNotif} title="نوتیفیکیشن‌ها" ref={bellBtnRef}>
                    {unreadNotifCount > 0 && <span className="dot" />}
                    <svg className={bellRinging ? 'bell-ring' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                    </svg>
                  </button>
                  {createPortal(
                    <div className="seller-dashboard-page" data-mode={theme}>
                      <div className={`notif-pop${notifOpen ? ' open' : ''}`} style={notifPopStyle}>
                        <div className="notif-pop-head">
                          <div className="notif-pop-head-title">
                            <h4>نوتیفیکیشن‌ها</h4>
                            {unreadNotifCount > 0 && (
                              <span className="notif-pop-count">{unreadNotifCount.toLocaleString('fa-IR')}</span>
                            )}
                          </div>
                          <button
                            className="notif-pop-mark"
                            style={{ visibility: unreadNotifCount > 0 ? 'visible' : 'hidden' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllNotifRead();
                            }}
                          >
                            علامت‌گذاری همه به‌عنوان خوانده‌شده
                          </button>
                        </div>
                        <div className="notif-pop-list">
                          {notifications.length === 0 ? (
                            <div className="notif-pop-empty">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                              </svg>
                              نوتیفیکیشن جدیدی نداری
                            </div>
                          ) : (
                            notifications.slice(0, 5).map((n, i) => (
                              <div
                                key={n.id}
                                className={`notif-pop-item${n.read ? '' : ' unread'}`}
                                style={{ animationDelay: `${i * 0.035}s` }}
                                onClick={() => markNotifRead(n.id)}
                              >
                                {!n.read && <span className="np-dot" />}
                                <div className="np-ico" style={{ background: n.color, '--ic-color': n.color }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {n.icon}
                                  </svg>
                                </div>
                                <div className="np-body">
                                  <div className="np-top">
                                    <b>{n.title}</b>
                                    <span className="np-time">{n.time}</span>
                                  </div>
                                  <p>{n.desc}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="notif-pop-foot">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              openNotifModal();
                            }}
                          >
                            مشاهده همه نوتیفیکیشن‌ها ←
                          </a>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
                <div className="profile-chip">
                  <div className="pc-avatar">
                    {(currentUser?.name || currentUser?.phone || 'ف')[0]}
                  </div>
                  <span>
                    {currentUser?.name || currentUser?.phone || 'فروشنده'}
                  </span>
                </div>
              </div>
            </header>
          )}

          <div className="content">
            {/* ================= OVERVIEW ================= */}
            <section className={`dash-section${activePage === 'overview' ? ' active' : ''}`}>
              <div className="hello-row">
                <div>
                  <h1>به پنل فروشنده خوش آمدی</h1>
                  <p>از اینجا می‌تونی مغازه، محصولات، پیام‌ها و حضورت در لوکاوو رو مدیریت کنی.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link className="ghost-btn" to={businessDetailPath} style={{ textDecoration: 'none' }}>
                    مشاهده مغازه
                  </Link>
                  <button className="primary-btn" onClick={() => go('products')}>
                    مدیریت محصولات
                  </button>
                </div>
              </div>

              <div className="stat-grid">
                <div className="card stat-card">
                  <div className="si-icon" style={{ background: 'var(--primary)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7 12 3 4 7l8 4 8-4Z" />
                      <path d="M4 7v10l8 4 8-4V7" />
                    </svg>
                  </div>
                  <div className="si-num">{stats.productsCount || activeProductsCount}</div>
                  <div className="si-label">محصولات فعال</div>
                  <div className="si-trend up">↑ موجود</div>
                </div>
                <div className="card stat-card">
                  <div className="si-icon" style={{ background: '#f59e0b' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="si-num">{stats.unreadMessages || unreadCount}</div>
                  <div className="si-label">پیام‌های جدید</div>
                  <div className="si-trend down">نیازمند پاسخ</div>
                </div>
                <div className="card stat-card">
                  <div className="si-icon" style={{ background: 'var(--accent)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="si-num">{(stats.avgRating || reviewsMeta.average || 0).toLocaleString('fa-IR')}</div>
                  <div className="si-label">امتیاز مغازه</div>
                  <div className="si-trend up">از {(stats.reviewsCount || reviewsMeta.count || 0).toLocaleString('fa-IR')} نظر</div>
                </div>
                <div className="card stat-card">
                  <div className="si-icon" style={{ background: 'var(--ok)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div className="si-num">—</div>
                  <div className="si-label">بازدید این ماه</div>
                  <div className="si-trend up">به‌زودی</div>
                </div>
              </div>

              <div className="section-head">
                <div>
                  <h2>محصولات اخیر</h2>
                  <p>آخرین محصولاتی که در مغازه ثبت کرده‌اید</p>
                </div>
                <button className="ghost-btn" onClick={() => go('products')}>
                  مشاهده همه
                </button>
              </div>

              <div className="prod-grid">
                {products.slice(0, 4).map((p) => (
                  <div className="card prod-card" key={p.id}>
                    <div
                      className="prod-media"
                      style={{ background: p.image ? 'transparent' : 'linear-gradient(135deg, var(--primary), #4361ee)' }}
                    >
                      {p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 32 }}>{p.emoji}</span>
                      )}
                    </div>
                    <div className="prod-body">
                      <b>{p.name}</b>
                      <div className="prod-foot">
                        <span className="prod-price">{p.price} تومان</span>
                        <span className={`prod-stock${p.status !== 'موجود' ? ' low' : ''}`}>{p.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================= PRODUCTS ================= */}
            <section className={`dash-section${activePage === 'products' ? ' active' : ''}`}>
              <div className="section-head">
                <div>
                  <h2>محصولات</h2>
                  <p>محصولات نمایش داده‌شده در صفحه مغازه</p>
                </div>
                <button className="primary-btn" onClick={openAddProduct}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  افزودن محصول
                </button>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="table-toolbar">
                  <div className="mini-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      placeholder="جستجو در محصولات..."
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>تصویر</th>
                        <th>محصول</th>
                        <th>قیمت</th>
                        <th>موجودی</th>
                        <th>وضعیت</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsLoading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            در حال بارگذاری...
                          </td>
                        </tr>
                      ) : filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            محصولی یافت نشد
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p, idx) => (
                          <tr key={p.id} style={{ animationDelay: `${idx * 0.04}s` }}>
                            <td>
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 10,
                                  overflow: 'hidden',
                                  background: 'var(--card)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 20,
                                }}
                              >
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  p.emoji
                                )}
                              </div>
                            </td>
                            <td className="cust">{p.name}</td>
                            <td>{p.price} تومان</td>
                            <td>{p.stock}</td>
                            <td>
                              <span className={statusPillClass(p.status)}>
                                <span className="d" />
                                {p.status}
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button title="ویرایش" onClick={() => openEditProduct(p)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  title="حذف"
                                  style={{ color: 'var(--danger)' }}
                                  onClick={() => confirmDeleteProduct(p.id)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <path d="M10 11v6M14 11v6" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ================= MESSAGES ================= */}
            <section className={`dash-section${activePage === 'messages' ? ' active' : ''}`}>
              <div className="section-head">
                <div>
                  <h2>پیام‌ها</h2>
                  <p>پیام‌های کاربران و مشتریان مغازه</p>
                </div>
              </div>
              <div className="gc-shell">
                <aside className="gc-panel gc-convo-panel">
                  <div className="gc-convo-search">
                    <div className="gc-search-input">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder="جستجو در گفتگوها..."
                        value={msgSearch}
                        onChange={(e) => setMsgSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="gc-convo-filters">
                    <button
                      className={`gc-filter-chip${msgFilter === 'all' ? ' active' : ''}`}
                      onClick={() => setMsgFilter('all')}
                    >
                      همه
                    </button>
                    <button
                      className={`gc-filter-chip${msgFilter === 'unread' ? ' active' : ''}`}
                      onClick={() => setMsgFilter('unread')}
                    >
                      خوانده‌نشده
                    </button>
                  </div>
                  <div className="gc-convo-list">
                    {messagesLoading ? (
                      <div className="gc-convo-empty">در حال بارگذاری...</div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="gc-convo-empty">گفتگویی با این مشخصات پیدا نشد</div>
                    ) : (
                      filteredConversations.map((c) => {
                        const lm = lastMessage(c);
                        const prefix = lm?.from === 'out' ? 'شما: ' : '';
                        return (
                          <div
                            key={c.id}
                            className={`gc-convo-item${c.id === activeConvoId ? ' active' : ''}`}
                            onClick={() => openConvo(c.id)}
                          >
                            <div className="gc-convo-avatar" style={{ background: colorFor(c.id) }}>
                              {initials(c.name)}
                              {c.online && <span className="gc-online-dot" />}
                            </div>
                            <div className="gc-convo-body">
                              <div className="gc-convo-top-row">
                                <span className="gc-convo-name">{c.name}</span>
                                <span className="gc-convo-time">{c.time}</span>
                              </div>
                              <div className="gc-convo-bottom-row">
                                <span className="gc-convo-snippet">
                                  {prefix}
                                  {lm?.text}
                                </span>
                                {(c.unread || 0) > 0 && (
                                  <span className="gc-convo-unread">{c.unread.toLocaleString('fa-IR')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </aside>

                <section className={`gc-panel gc-chat-panel${mobileChatOpen ? ' open' : ''}`}>
                  {!activeConvo ? (
                    <div className="gc-chat-empty">
                      <div className="gc-ce-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <h3>یک گفتگو را انتخاب کن</h3>
                      <p>
                        پیام‌هایی که مشتریان با مغازه شما رد و بدل کرده‌اند اینجا نمایش داده می‌شود. یکی از گفتگوها را از
                        لیست کنار انتخاب کنید.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="gc-chat-header">
                        <button className="gc-chat-back-mobile" onClick={closeChatMobile} aria-label="بازگشت به لیست">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                        <div className="gc-ch-avatar" style={{ background: colorFor(activeConvo.id) }}>
                          {initials(activeConvo.name)}
                        </div>
                        <div className="gc-ch-info">
                          <div className="gc-ch-name">{activeConvo.name}</div>
                          <div className="gc-ch-status">
                            {activeConvo.online ? (
                              <>
                                <span className="gc-dot" /> آنلاین
                              </>
                            ) : (
                              `آخرین بازدید: ${activeConvo.time}`
                            )}
                          </div>
                        </div>
                        <div className="gc-chat-header-actions">
                          <button
                            className="gc-icon-action-btn"
                            title="اطلاعات مشتری"
                            onClick={() => toast(`اطلاعات ${activeConvo.name}`)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4M12 8h.01" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="gc-chat-messages">
                        {(() => {
                          let lastDayLabel = '';
                          return activeConvo.messages.map((m, idx) => {
                            const dayLabel =
                              m.time === 'اکنون'
                                ? 'امروز'
                                : m.rawTime
                                  ? formatRelativeTime(m.rawTime).includes('پیش') || formatRelativeTime(m.rawTime) === 'دیروز'
                                    ? formatRelativeTime(m.rawTime)
                                    : 'امروز'
                                  : 'امروز';
                            const showDivider = dayLabel !== lastDayLabel;
                            lastDayLabel = dayLabel;
                            return (
                              <React.Fragment key={idx}>
                                {showDivider && <div className="gc-day-divider">{dayLabel}</div>}
                                <div className={`gc-msg-row ${m.from === 'out' ? 'gc-out' : 'gc-in'}`}>
                                  <div>
                                    <div className="gc-msg-bubble">{m.text}</div>
                                    <div className="gc-msg-time">
                                      {m.time}
                                      {m.from === 'out' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                        <button
                          className="gc-attach-btn"
                          title="پیوست فایل"
                          onClick={() => toast('امکان ارسال فایل به‌زودی اضافه می‌شود')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.42 17.4a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49" />
                          </svg>
                        </button>
                        <textarea
                          ref={textareaRef}
                          className="gc-chat-textarea"
                          rows={1}
                          placeholder="پاسخ خود را بنویسید..."
                          value={draft}
                          onChange={(e) => {
                            setDraft(e.target.value);
                            autoGrow(e);
                          }}
                          onKeyDown={handleComposerKeyDown}
                        />
                        <button className="gc-send-btn" onClick={handleSend} title="ارسال">
                          ➤
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </section>

            {/* ================= REVIEWS ================= */}
            <section className={`dash-section${activePage === 'reviews' ? ' active' : ''}`}>
              <div className="section-head">
                <div>
                  <h2>نظرات</h2>
                  <p>بازخورد کاربران درباره مغازه و محصولات</p>
                </div>
              </div>
              <div className="card rev-summary">
                <div className="rs-big">
                  <b>{(reviewsMeta.average || stats.avgRating || 0).toLocaleString('fa-IR')}</b>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span>از {(reviewsMeta.count || stats.reviewsCount || 0).toLocaleString('fa-IR')} نظر</span>
                </div>
                <div className="rs-bars">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const total = reviewsMeta.count || reviews.length || 1;
                    const count = reviews.filter((r) => r.rating === star).length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div className="rs-bar-row" key={star}>
                        <span>{star}</span>
                        <div className="track">
                          <div className="fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card" style={{ marginTop: 16 }}>
                {reviewsLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>در حال بارگذاری...</div>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>هنوز نظری ثبت نشده</div>
                ) : (
                  reviews.map((r) => (
                    <div className="rev-item" key={r.id}>
                      <div className="r-avatar" style={{ background: colorFor(r.id) }}>
                        {r.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="r-head">
                          <b>{r.name}</b>
                          <span className="r-date">{r.date}</span>
                        </div>
                        <div className="r-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              viewBox="0 0 24 24"
                              fill={i < r.rating ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                        <p className="r-text">{r.text}</p>
                        {r.replied ? (
                          <div className="reply-sent" style={{ marginTop: 10 }}>
                            <b>پاسخ شما:</b>
                            <p style={{ marginTop: 4, color: 'var(--text)' }}>{r.replyText}</p>
                          </div>
                        ) : activeReviewReplyId === r.id ? (
                          <div className="reply-box open" style={{ marginTop: 12 }}>
                            <textarea
                              className="text-field"
                              placeholder="پاسخ خود را بنویسید..."
                              value={reviewReplyText}
                              onChange={(e) => setReviewReplyText(e.target.value)}
                              rows={3}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button className="primary-btn" onClick={submitReviewReply}>
                                ارسال پاسخ
                              </button>
                              <button className="ghost-btn" onClick={() => setActiveReviewReplyId(null)}>
                                انصراف
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rev-actions">
                            <button onClick={() => openReviewReply(r.id)}>پاسخ به نظر</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ================= GROWTH ================= */}
            <section className={`dash-section${activePage === 'growth' ? ' active' : ''}`}>
              <div className="section-head">
                <div>
                  <h2>رشد و تبلیغات</h2>
                  <p>عملکرد حضور مغازه در لوکاوو و ابزارهای افزایش دیده‌شدن</p>
                </div>
                <button className="primary-btn" onClick={() => toast('درخواست تبلیغ ثبت شد')}>
                  فعال‌سازی تبلیغ
                </button>
              </div>
              <div className="stat-grid">
                <div className="card stat-card">
                  <div className="si-icon" style={{ background: 'var(--primary)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div className="si-num">{(reports.monthlyViews || 0).toLocaleString('fa-IR')}</div>
                  <div className="si-label">بازدید ماهانه</div>
                  <div className="si-trend up">از دیتابیس</div>
                </div>

                <div className="card stat-card">
                  <div className="si-icon" style={{ background: '#0EA5E9' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="si-num">{(reports.profileViews || 0).toLocaleString('fa-IR')}</div>
                  <div className="si-label">بازدید پروفایل</div>
                  <div className="si-trend up">از دیتابیس</div>
                </div>

                <div className="card stat-card">
                  <div className="si-icon" style={{ background: 'var(--accent)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7 12 3 4 7l8 4 8-4Z" />
                      <path d="M4 7v10l8 4 8-4V7" />
                    </svg>
                  </div>
                  <div className="si-num">{(reports.productClicks || 0).toLocaleString('fa-IR')}</div>
                  <div className="si-label">کلیک روی محصولات</div>
                  <div className="si-trend up">به‌زودی</div>
                </div>

                <div className="card stat-card">
                  <div className="si-icon" style={{ background: 'var(--ok)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div className="si-num">{(reports.visibilityScore || 0).toLocaleString('fa-IR')}٪</div>
                  <div className="si-label">امتیاز دیده‌شدن</div>
                  <div className="si-trend up">
                    {(reports.visibilityScore || 0) >= 70 ? 'وضعیت خوب' : 'قابل بهبود'}
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 22, marginBottom: 18 }}>
                <div className="section-head" style={{ marginTop: 0, marginBottom: 18 }}>
                  <div>
                    <h2 style={{ fontSize: 16 }}>اشتراک و تبلیغات</h2>
                    <p>با انتخاب یک اشتراک، امکانات رشد و دیده‌شدن مغازه خود را فعال کنید</p>
                  </div>
                  <div className="plan-tabs">
                    <button
                      className={`plan-tab-btn ${planMode === 'monthly' ? 'active' : ''}`}
                      onClick={() => setPlanMode('monthly')}
                    >
                      ماهانه
                    </button>
                    <button
                      className={`plan-tab-btn ${planMode === 'yearly' ? 'active' : ''}`}
                      onClick={() => setPlanMode('yearly')}
                    >
                      سالانه
                    </button>
                  </div>
                </div>
                <div className="subscription-grid">
                  <SubscriptionCard
                    plan={{
                      key: 'basic',
                      name: 'اشتراک پایه',
                      price: 0,
                      unit: prices.unit,
                      duration: planMode === 'monthly' ? 'ماهانه' : 'سالانه',
                      features: [
                        'اضافه کردن ۲۰ تصویر از محصولات',
                        'نمایش در نتایج جستجو',
                        'دریافت تماس و کلیک کاربران',
                        'پشتیبانی عادی',
                        'تعرفه عادی کلیک و تماس',
                      ],
                    }}
                    isActive={currentPlanKey === 'basic'}
                    onSubscribe={handleSubscribe}
                  />

                  <SubscriptionCard
                    plan={{
                      key: 'pro',
                      name: 'اشتراک حرفه‌ای',
                      price: Number(getPlan('pro')?.price || 0),
                      unit: prices.unit,
                      duration: planMode === 'monthly' ? 'ماهانه' : 'سالانه',
                      features: [
                        'همه امکانات اشتراک پایه',
                        'اضافه کردن ۴۰ تصویر از محصولات',
                        'مشاهده تعداد بازدید از پروفایل',
                        'مشاهده تعداد کلیک روی شماره تلفن',
                        'مشاهده تعداد کلیک روی سایت',
                        'نمایش در جایگاه‌های بالاتر نتایج جستجو',
                        'امکان تبلیغ داخل اپ',
                        'پشتیبانی با اولویت بالاتر',
                        '۲۰٪ تخفیف در هزینه کلیک و تماس',
                      ],
                    }}
                    isActive={currentPlanKey === 'pro'}
                    onSubscribe={handleSubscribe}
                  />

                  <SubscriptionCard
                    plan={{
                      key: 'pro_plus',
                      name: 'اشتراک حرفه‌ای پلاس',
                      price: Number(getPlan('pro_plus')?.price || 0),
                      unit: prices.unit,
                      duration: planMode === 'monthly' ? 'ماهانه' : 'سالانه',
                      features: [
                        'همه امکانات اشتراک حرفه‌ای',
                        'اضافه کردن ۱۰۰ تصویر از محصولات',
                        'بالاترین جایگاه در نتایج جستجو',
                        'نمایش در بخش «پیشنهاد ما»',
                        'پین کردن پروفایل در نتایج جستجو',
                        'اولویت بالاتر در تبلیغات داخل اپ',
                        'پشتیبانی VIP',
                        '۴۰٪ تخفیف در هزینه کلیک و تماس',
                      ],
                    }}
                    isActive={currentPlanKey === 'pro_plus'}
                    onSubscribe={handleSubscribe}
                  />
                </div>
              </div>
              <div className="growth-layout">
                <div className="card chart-card">
                  <div className="section-head" style={{ marginTop: 0 }}>
                    <div>
                      <h2 style={{ fontSize: 15 }}>روند بازدید</h2>
                      <p>هفت روز اخیر (به‌زودی)</p>
                    </div>
                  </div>
                  <div className="growth-bars">
                    {(reports.weeklyViews && reports.weeklyViews.length > 0
                      ? reports.weeklyViews
                      : [
                        { day: 'شنبه', value: 0 },
                        { day: 'یکشنبه', value: 0 },
                        { day: 'دوشنبه', value: 0 },
                        { day: 'سه‌شنبه', value: 0 },
                        { day: 'چهارشنبه', value: 0 },
                        { day: 'پنجشنبه', value: 0 },
                        { day: 'جمعه', value: 0 },
                      ]
                    ).map((item) => (
                      <div className="growth-col" key={item.day}>
                        <div className="bar" style={{ height: `${item.value}%` }} />
                        <div className="bar-label">{item.day}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card side-card">
                  <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 14 }}>پیشنهادهای رشد</h3>
                  <div className="growth-suggest-row">
                    <span>تکمیل اطلاعات مغازه</span>
                    <b>۹۰٪</b>
                  </div>
                  <div className="growth-suggest-row">
                    <span>افزودن تصویر محصول</span>
                    <b>۷۵٪</b>
                  </div>
                  <div className="growth-suggest-row">
                    <span>فعال‌سازی تبلیغ</span>
                    <button
                      className="ghost-btn"
                      style={{ padding: '6px 12px', fontSize: 11 }}
                      onClick={() => toast('صفحه تبلیغات باز شد')}
                    >
                      مشاهده
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= SETTINGS ================= */}
            <section className={`dash-section${activePage === 'settings' ? ' active' : ''}`}>
              <div className="section-head">
                <div>
                  <h2>تنظیمات فروشگاه</h2>
                  <p>اطلاعات و نحوه نمایش مغازه را مدیریت کنید</p>
                </div>
                <button className="primary-btn" onClick={saveSettings}>
                  ذخیره تغییرات
                </button>
              </div>
              <div className="settings-grid">
                <div className="card form-card">
                  <h3>اطلاعات عمومی</h3>
                  <div className="setting-row">
                    <div>
                      <b>نمایش شماره تماس</b>
                      <span>شماره تماس در صفحه مغازه نمایش داده شود</span>
                    </div>
                    <div
                      className={`switch${switches.showPhone ? ' on' : ''}`}
                      onClick={() => toggleSwitch('showPhone')}
                    />
                  </div>
                  <div className="setting-row">
                    <div>
                      <b>دریافت پیام کاربران</b>
                      <span>کاربران بتوانند برای شما پیام ارسال کنند</span>
                    </div>
                    <div
                      className={`switch${switches.allowMessages ? ' on' : ''}`}
                      onClick={() => toggleSwitch('allowMessages')}
                    />
                  </div>
                  <div className="setting-row">
                    <div>
                      <b>نمایش نظرات</b>
                      <span>نظرات تاییدشده روی صفحه مغازه نمایش داده شوند</span>
                    </div>
                    <div
                      className={`switch${switches.showReviews ? ' on' : ''}`}
                      onClick={() => toggleSwitch('showReviews')}
                    />
                  </div>
                </div>
                <div className="card form-card">
                  <h3>اطلاعات تماس</h3>
                  <label className="field-label">شماره تلفن</label>
                  <input
                    className="text-field"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo((c) => ({ ...c, phone: e.target.value }))}
                  />
                  <label className="field-label">وب‌سایت مغازه</label>
                  <input
                    className="text-field"
                    value={contactInfo.website}
                    onChange={(e) => setContactInfo((c) => ({ ...c, website: e.target.value }))}
                  />
                  <label className="field-label">آدرس</label>
                  <input
                    className="text-field"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo((c) => ({ ...c, address: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            {/* ================= BUSINESSES ================= */}
            <section className={`dash-section${activePage === 'businesses' ? ' active' : ''}`}>
              <div className="section-head">
                <div>
                  <h2>کسب‌وکارهای من</h2>
                  <p>مدیریت تمام کسب‌وکارهای متصل به حساب شما</p>
                </div>
                <Link className="primary-btn" to={ADD_BUSINESS_PATH}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  افزودن کسب‌وکار
                </Link>
              </div>
              {businessesLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>در حال بارگذاری...</div>
              ) : myBusinesses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  هنوز کسب‌وکاری ثبت نکرده‌اید
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {myBusinesses.map((s) => (
                    <div
                      key={s.id}
                      className={`shop-card${activeBusinessId === s.id ? ' active' : ''}`}
                      onClick={() => {
                        selectBusiness(s.id);   // به‌جای setActiveBusinessId(s.id)
                        toast(`«${s.name}» فعال شد`);
                      }}
                    >
                      <div className="sc-avatar" style={{ background: s.color }}>
                        {s.avatar}
                      </div>
                      <div className="sc-info">
                        <b>{s.name}</b>
                        <span>{s.cat}</span>
                      </div>
                      <Link
                        to={`/business/${s.id}`}
                        className="ghost-btn"
                        style={{ fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        مشاهده صفحه عمومی
                      </Link>
                      <div className="sc-check">
                        {activeBusinessId === s.id && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* مودال محصول */}
      <div className={`drawer-overlay${productModalOpen ? ' open' : ''}`} onClick={() => setProductModalOpen(false)} />
      <div className={`drawer${productModalOpen ? ' open' : ''}`}>
        <div className="drawer-head">
          <h3>{editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
          <button className="drawer-close" onClick={() => setProductModalOpen(false)}>
            ×
          </button>
        </div>
        <div className="drawer-body">
          <label className="field-label">تصویر محصول</label>
          <div style={{ marginBottom: 16 }}>
            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: 220, marginBottom: 10 }}>
                <img
                  src={imagePreview}
                  alt="پیش‌نمایش"
                  style={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--danger)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  maxWidth: 220,
                  height: 120,
                  border: '2px dashed var(--border)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" />
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                </svg>
                انتخاب تصویر
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <button
              type="button"
              className="ghost-btn"
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? 'تغییر تصویر' : 'انتخاب از گالری'}
            </button>
          </div>
          <label className="field-label">نام محصول *</label>
          <input
            className="text-field"
            value={productForm.name}
            onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="مثلاً قهوه اسپرسو ویژه"
          />
          <label className="field-label">قیمت (تومان) *</label>
          <input
            className="text-field"
            value={productForm.price}
            onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="۳۸۰٬۰۰۰"
          />
          <label className="field-label">موجودی</label>
          <input
            className="text-field"
            value={productForm.stock}
            onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))}
            placeholder="۲۴"
          />
          <label className="field-label">وضعیت</label>
          <select
            className="text-field"
            value={productForm.status}
            onChange={(e) => setProductForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="موجود">موجود</option>
            <option value="رو به اتمام">رو به اتمام</option>
            <option value="ناموجود">ناموجود</option>
          </select>
          <label className="field-label">آیکون / ایموجی (اختیاری)</label>
          <input
            className="text-field"
            value={productForm.emoji}
            onChange={(e) => setProductForm((f) => ({ ...f, emoji: e.target.value }))}
            placeholder="☕"
            maxLength={2}
          />
        </div>
        <div className="drawer-foot">
          <button className="ghost-btn" onClick={() => setProductModalOpen(false)} style={{ flex: 1 }}>
            انصراف
          </button>
          <button className="primary-btn" onClick={saveProduct} style={{ flex: 1, justifyContent: 'center' }}>
            {editingProduct ? 'ذخیره تغییرات' : 'افزودن محصول'}
          </button>
        </div>
      </div>

      {/* تأیید حذف */}
      <div className={`drawer-overlay${deleteConfirmId ? ' open' : ''}`} onClick={() => setDeleteConfirmId(null)} />
      <div className={`drawer${deleteConfirmId ? ' open' : ''}`} style={{ maxWidth: 380 }}>
        <div className="drawer-head">
          <h3>حذف محصول</h3>
          <button className="drawer-close" onClick={() => setDeleteConfirmId(null)}>
            ×
          </button>
        </div>
        <div className="drawer-body">
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' }}>
            آیا از حذف این محصول مطمئن هستید؟ این عمل قابل بازگشت نیست.
          </p>
        </div>
        <div className="drawer-foot">
          <button className="ghost-btn" onClick={() => setDeleteConfirmId(null)} style={{ flex: 1 }}>
            انصراف
          </button>
          <button
            className="primary-btn"
            onClick={deleteProduct}
            style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)' }}
          >
            حذف محصول
          </button>
        </div>
      </div>

      {/* مودال همه نوتیفیکیشن‌ها */}
      <div className={`list-modal-overlay${notifModalOpen ? ' open' : ''}`} onClick={closeNotifModal}>
        <div className="list-modal" onClick={(e) => e.stopPropagation()}>
          <div className="list-modal-head">
            <div className="list-modal-head-txt">
              <h3>همه نوتیفیکیشن‌ها</h3>
              <p>
                {notifications.length.toLocaleString('fa-IR')} نوتیفیکیشن
                {unreadNotifCount > 0 ? ` · ${unreadNotifCount.toLocaleString('fa-IR')} خوانده‌نشده` : ''}
              </p>
            </div>
            <button className="list-modal-close" onClick={closeNotifModal}>
              ×
            </button>
          </div>
          <div className="list-modal-body">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={`notif-pop-item${n.read ? '' : ' unread'}`}
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => markNotifRead(n.id)}
              >
                {!n.read && <span className="np-dot" />}
                <div className="np-ico" style={{ background: n.color, '--ic-color': n.color }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {n.icon}
                  </svg>
                </div>
                <div className="np-body">
                  <div className="np-top">
                    <b>{n.title}</b>
                    <span className="np-time">{n.time}</span>
                  </div>
                  <p>{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="list-modal-foot">
            <button className="ghost-btn" onClick={closeNotifModal} style={{ flex: 1 }}>
              بستن
            </button>
            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={markAllNotifRead}>
              علامت‌گذاری همه به‌عنوان خوانده‌شده
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-stack">
        {showToast && (
          <div className="toast success">
            <div className="t-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m9 12 2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}