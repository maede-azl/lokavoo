//ProfilePage
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { getSellerMenuItem, getSidebarItems, getBottomNavItems } from '../components/navConfig';
import { useTheme } from '../context/ThemeContext';
import "./ProfilePage.css";

// TODO: اینو با import واقعی لوگوی پروژه‌ت جایگزین کن
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
      <path d="M20 3C11.7 3 5 9.7 5 18c0 11 15 19 15 19s15-8 15-19c0-8.3-6.7-15-15-15Z" fill="#2547E8"/>
      <circle cx="20" cy="18" r="6.5" fill="#FFFFFF"/>
    </svg>`
  );

const SUPPORT_PHONE_RAW = '+982191000000';
const SUPPORT_PHONE_DISPLAY = '۰۲۱ - ۹۱۰۰۰۰۰۰';
const SUPPORT_EMAIL = 'support@lokavo.ir';

const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');
const getAuthUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});



const IRAN_LOCATIONS = {
  'تهران': ['تهران', 'کرج', 'اسلام‌شهر', 'شهریار', 'قدس', 'ملارد', 'پاکدشت', 'ری', 'ورامین'],
  'البرز': ['کرج', 'فردیس', 'کمال‌شهر', 'نظرآباد', 'محمدشهر', 'ماهدشت'],
  'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'فولادشهر', 'زرین‌شهر'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'کاشمر', 'قوچان', 'تربت جام'],
  'فارس': ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لار', 'داراب'],
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر', 'سراب'],
  'آذربایجان غربی': ['ارومیه', 'خوی', 'مهاباد', 'میاندوآب', 'بوکان', 'سلماس'],
  'خوزستان': ['اهواز', 'آبادان', 'دزفول', 'خرمشهر', 'ماهشهر', 'اندیمشک', 'بهبهان'],
  'مازندران': ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'بهشهر', 'چالوس', 'تنکابن', 'نوشهر'],
  'گیلان': ['رشت', 'بندرانزلی', 'لاهیجان', 'لنگرود', 'تالش', 'آستارا', 'صومعه‌سرا'],
  'کرمان': ['کرمان', 'سیرجان', 'رفسنجان', 'جیرفت', 'بم', 'زرند'],
  'هرمزگان': ['بندرعباس', 'میناب', 'دهبارز', 'کیش', 'قشم', 'بندرلنگه'],
  'سیستان و بلوچستان': ['زاهدان', 'چابهار', 'ایرانشهر', 'زابل', 'خاش'],
  'کرمانشاه': ['کرمانشاه', 'اسلام‌آباد غرب', 'جوانرود', 'کنگاور', 'سنقر'],
  'همدان': ['همدان', 'ملایر', 'نهاوند', 'اسدآباد', 'تویسرکان'],
  'مرکزی': ['اراک', 'ساوه', 'خمین', 'محلات', 'دلیجان'],
  'قزوین': ['قزوین', 'تاکستان', 'الوند', 'آبیک'],
  'زنجان': ['زنجان', 'ابهر', 'خرمدره', 'قیدار'],
  'یزد': ['یزد', 'میبد', 'اردکان', 'بافق'],
  'قم': ['قم'],
  'کردستان': ['سنندج', 'سقز', 'بانه', 'مریوان', 'قروه'],
  'لرستان': ['خرم‌آباد', 'بروجرد', 'دورود', 'کوهدشت', 'الیگودرز'],
  'بوشهر': ['بوشهر', 'برازجان', 'گناوه', 'کنگان', 'عسلویه'],
  'چهارمحال و بختیاری': ['شهرکرد', 'بروجن', 'فرخ‌شهر', 'لردگان'],
  'کهگیلویه و بویراحمد': ['یاسوج', 'دوگنبدان', 'دهدشت'],
  'ایلام': ['ایلام', 'دهلران', 'آبدانان', 'ایوان'],
  'سمنان': ['سمنان', 'شاهرود', 'دامغان', 'گرمسار'],
  'گلستان': ['گرگان', 'گنبد کاووس', 'علی‌آباد', 'آق‌قلا', 'بندرترکمن'],
  'اردبیل': ['اردبیل', 'پارس‌آباد', 'مشگین‌شهر', 'خلخال'],
};

const LokavoProfile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('delete');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState('about');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [publicProfileOpen, setPublicProfileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const isLoggedIn = !!getToken();
  const authUser = getAuthUser();
  const hasOwnBusiness = !!authUser?.hasOwnBusiness;

  const [activeNav, setActiveNav] = useState('');
  const sellerMenuItem = getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness);
  const sidebarItems = getSidebarItems(sellerMenuItem, isLoggedIn);
  const bottomNavItems = getBottomNavItems(sellerMenuItem, isLoggedIn);

  function handleNavClick(item) {
    setActiveNav(item.key);
    if (item?.path) {
      navigate(item.path);
    }
  }

  // ============ PROFILE STATE ============
  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    birthdate: '',
    bio: '',
    avatar: null,
    avatarImage: null,
    province: 'تهران',
    city: 'تهران',
    lastLoginAt: null,
    lastLoginDevice: null,
    stats: {
      businesses: 0,
      reviews: 0,
      favorites: 0,
      recentViews: 0,
    },
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [locationForm, setLocationForm] = useState({
    province: 'تهران',
    city: 'تهران',
  });

  const relativeTime = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'چند دقیقه پیش';
    if (diffH < 24) return `${diffH} ساعت پیش`;
    const diffDay = Math.floor(diffH / 24);
    if (diffDay === 1) return 'دیروز';
    return `${diffDay} روز پیش`;
  };

  const parseDevice = (ua) => {
    if (!ua) return 'نامشخص';
    let browser = 'مرورگر نامشخص';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/') && !ua.includes('OPR')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

    let os = 'سیستم‌عامل نامشخص';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `مرورگر ${browser} روی ${os}`;
  };

  const formatLoginTime = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `امروز، ساعت ${time}`;
    const isYesterday =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString() === d.toDateString();
    if (isYesterday) return `دیروز، ساعت ${time}`;
    return `${d.toLocaleDateString('fa-IR')}، ساعت ${time}`;
  };

  // ============ AVATAR UPLOAD ============
  const avatarInputRef = useRef(null);

  const activityRef = useRef(null);

  const openAvatarPicker = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  // گرفتن پروفایل از سرور
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (json.success) {
          const u = json.data;
          const newProfile = {
            fullName: u.name || '',
            username: u.username || '',
            email: u.email || '',
            phone: u.phone || '',
            birthdate: u.birthdate || '',
            bio: u.bio || '',
            avatar: u.avatar,
            avatarImage: u.avatar ? `http://localhost:5000${u.avatar}` : null,
            province: u.province || 'تهران',
            city: u.city || 'تهران',
            lastLoginAt: u.lastLoginAt || null,
            lastLoginDevice: u.lastLoginDevice || null,
            stats: u.stats || {
              businesses: 0,
              reviews: 0,
              favorites: 0,
              recentViews: 0,
            },
          };
          setProfile(newProfile);
          setEditForm(newProfile);
          setLocationForm({
            province: newProfile.province,
            city: newProfile.city,
          });
        } else {
          showToast(json.message || 'خطا در دریافت پروفایل');
        }
      } catch (err) {
        console.error(err);
        showToast('خطا در ارتباط با سرور');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const [recentViews, setRecentViews] = useState([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_BASE}/activity/recent-views?limit=6`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRecentViews(json.data);
      })
      .catch((err) => console.error('خطا در دریافت بازدیدهای اخیر:', err));
  }, []);

  const [recentSearches, setRecentSearches] = useState([]);

  const [timeline, setTimeline] = useState([]);

useEffect(() => {
  const token = getToken();
  if (!token) return;

  fetch(`${API_BASE}/activity/timeline?limit=6`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.success) setTimeline(json.data);
    })
    .catch((err) => console.error('خطا در دریافت تایم‌لاین:', err));
}, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_BASE}/activity/recent-searches?limit=6`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRecentSearches(json.data);
      })
      .catch((err) => console.error('خطا در دریافت جستجوهای اخیر:', err));
  }, []);

  // آپلود عکس
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری انتخاب کنید');
      e.target.value = '';
      return;
    }

    // پیش‌نمایش فوری
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatarImage: reader.result }));
      setEditForm((prev) => ({ ...prev, avatarImage: reader.result }));
    };
    reader.readAsDataURL(file);

    // ارسال به سرور
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE}/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        const avatarUrl = `http://localhost:5000${json.data.avatar}`;
        setProfile((prev) => ({
          ...prev,
          avatar: json.data.avatar,
          avatarImage: avatarUrl,
        }));
        setEditForm((prev) => ({
          ...prev,
          avatar: json.data.avatar,
          avatarImage: avatarUrl,
        }));
        showToast('تصویر پروفایل با موفقیت به‌روزرسانی شد');
      } else {
        showToast(json.message || 'خطا در آپلود');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در آپلود عکس');
    }

    e.target.value = '';
  };

  // حذف عکس
  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const json = await res.json();

      if (json.success) {
        setProfile((prev) => ({ ...prev, avatar: null, avatarImage: null }));
        setEditForm((prev) => ({ ...prev, avatar: null, avatarImage: null }));
        showToast('تصویر پروفایل حذف شد');
      } else {
        showToast(json.message || 'خطا در حذف');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در حذف عکس');
    }
  };

  const getInitials = (name) => {
    const parts = (name || '').trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2);
    return `${parts[0][0]}.${parts[1][0]}`;
  };

  const openEditModal = () => {
    setEditForm(profile);
    setEditModalOpen(true);
  };

  const closeEditModal = () => setEditModalOpen(false);

  const handleEditChange = (field) => (e) => {
    const value = e.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // ذخیره پروفایل
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editForm.fullName,
          username: editForm.username || null,
          email: editForm.email || null,
          bio: editForm.bio || null,
          birthdate: editForm.birthdate || null,
        }),
      });

      const json = await res.json();

      if (json.success) {
        const u = json.data;
        // مهم: province و city و stats رو از دست نده
        setProfile((prev) => ({
          ...prev,
          fullName: u.name || '',
          username: u.username || '',
          email: u.email || '',
          phone: u.phone || prev.phone,
          birthdate: u.birthdate || '',
          bio: u.bio || '',
          avatar: u.avatar ?? prev.avatar,
          avatarImage: u.avatar
            ? `http://localhost:5000${u.avatar}`
            : prev.avatarImage,
          // اگر بک‌اند province/city برگردوند، آپدیت کن
          province: u.province ?? prev.province,
          city: u.city ?? prev.city,
          stats: u.stats ?? prev.stats,
        }));
        setEditForm((prev) => ({
          ...prev,
          fullName: u.name || '',
          username: u.username || '',
          email: u.email || '',
          birthdate: u.birthdate || '',
          bio: u.bio || '',
        }));
        setEditModalOpen(false);
        showToast('پروفایل با موفقیت به‌روزرسانی شد');

        // آپدیت localStorage
        const stored = getAuthUser();
        if (stored) {
          localStorage.setItem(
            'user',
            JSON.stringify({ ...stored, name: u.name })
          );
        }
      } else {
        showToast(json.message || 'خطا در ذخیره');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          province: locationForm.province,
          city: locationForm.city,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setProfile((prev) => ({
          ...prev,
          province: json.data.province,
          city: json.data.city,
        }));
        showToast('موقعیت ترجیحی ذخیره شد');
      } else {
        showToast(json.message || 'خطا در ذخیره موقعیت');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در ارتباط با سرور');
    }
  };

  // تشخیص موقعیت فعلی با Geolocation مرورگر
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند');
      return;
    }

    setDetectingLocation(true);
    showToast('در حال تشخیص موقعیت شما...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // اگر بک‌اند endpoint برای reverse geocode داره ازش استفاده کن
          // در غیر این صورت فقط مختصات رو نشون می‌دیم و کاربر خودش انتخاب می‌کنه
          const res = await fetch(
            `${API_BASE}/profile/reverse-geocode?lat=${latitude}&lng=${longitude}`,
            {
              headers: { Authorization: `Bearer ${getToken()}` },
            }
          );

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.province && json.data?.city) {
              const { province, city } = json.data;

              // اگر استان در لیست ما هست، فرم رو آپدیت کن
              if (IRAN_LOCATIONS[province]) {
                const cities = IRAN_LOCATIONS[province];
                const matchedCity = cities.includes(city) ? city : cities[0];

                setLocationForm({
                  province,
                  city: matchedCity,
                });
                showToast(`موقعیت تشخیص داده شد: ${matchedCity}، ${province}`);
              } else {
                showToast(
                  `موقعیت تقریبی: ${city || ''} ${province || ''} (لطفاً دستی انتخاب کنید)`
                );
              }
            } else {
              showToast(
                `مختصات دریافت شد (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) — لطفاً استان و شهر را دستی انتخاب کنید`
              );
            }
          } else {
            // اگر endpoint وجود نداشت
            showToast(
              `مختصات دریافت شد (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) — لطفاً استان و شهر را دستی انتخاب کنید`
            );
          }
        } catch (err) {
          console.error(err);
          showToast(
            `مختصات دریافت شد (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) — لطفاً استان و شهر را دستی انتخاب کنید`
          );
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          showToast('دسترسی به موقعیت مکانی رد شد');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          showToast('موقعیت مکانی در دسترس نیست');
        } else {
          showToast('خطا در تشخیص موقعیت');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  // ============ REPORT PROBLEM FORM STATE ============
  const [reportForm, setReportForm] = useState({ subject: '', description: '' });
  const handleReportChange = (field) => (e) => {
    const value = e.target.value;
    setReportForm((prev) => ({ ...prev, [field]: value }));
  };
  const closeReportModal = () => setReportModalOpen(false);
  const handleReportSubmit = async (e) => {
    e.preventDefault();

    if (!reportForm.subject.trim() || !reportForm.description.trim()) {
      showToast('لطفاً موضوع و توضیحات را وارد کنید');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/profile/report`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          subject: reportForm.subject.trim(),
          description: reportForm.description.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        setReportModalOpen(false);
        setReportForm({ subject: '', description: '' });
        showToast('گزارش شما با موفقیت ثبت شد');
      } else {
        showToast(json.message || 'خطا در ثبت گزارش');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در ارتباط با سرور');
    }
  };

  const showToast = (msg) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  };

  const openModal = (m) => {
    setModalMode(m);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const confirmModalAction = async () => {
    if (modalMode === 'logout') {
      closeModal();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth', { replace: true });
      return;
    }

    // حالت حذف حساب
    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        showToast('خطا در ارتباط با سرور');
        return;
      }

      const json = await res.json();

      if (json.success) {
        closeModal();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      } else {
        showToast(json.message || 'خطا در حذف حساب');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در ارتباط با سرور');
    }
  };

  const openInfoModal = (type) => {
    setInfoModalType(type);
    setInfoModalOpen(true);
  };
  const closeInfoModal = () => setInfoModalOpen(false);

  const faqItems = [
    {
      q: 'چطور می‌توانم کسب‌وکارم را در لوکاوو ثبت کنم؟',
      a: 'از منوی «پنل فروشنده» گزینه‌ی افزودن کسب‌وکار را انتخاب کنید و اطلاعات لازم را وارد نمایید.',
    },
    {
      q: 'آیا استفاده از لوکاوو رایگان است؟',
      a: 'بله، جستجو و مشاهده‌ی کسب‌وکارها برای کاربران کاملاً رایگان است.',
    },
    {
      q: 'چطور نظر خودم را برای یک کسب‌وکار ثبت کنم؟',
      a: 'وارد صفحه‌ی کسب‌وکار مورد نظر شوید و از بخش نظرات، امتیاز و متن خود را ثبت کنید.',
    },
  ];

  if (loading) {
    return (
      <div
        className="app-shell"
        dir="rtl"
        lang="fa"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div>در حال بارگذاری پروفایل...</div>
      </div>
    );
  }

  return (
    <div className="app-shell" dir="rtl" lang="fa">
      {/* ICON SPRITE */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="i-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></symbol>
          <symbol id="i-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></symbol>
          <symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.5 2.1L7.9 10.2a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2Z" /></symbol>
          <symbol id="i-badge" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></symbol>
          <symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></symbol>
          <symbol id="i-crown" viewBox="0 0 24 24" fill="currentColor"><path d="m2 20 2-11 5 4 3-7 3 7 5-4 2 11Z" /></symbol>
          <symbol id="i-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></symbol>
          <symbol id="i-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18" /></symbol>
          <symbol id="i-heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.8-10-9.5C.4 8 2 4.5 5.5 4a5.4 5.4 0 0 1 6.5 3 5.4 5.4 0 0 1 6.5-3C22 4.5 23.6 8 22 11.5 19.5 16.2 12 21 12 21Z" /></symbol>
          <symbol id="i-bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /></symbol>
          <symbol id="i-star" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7Z" /></symbol>
          <symbol id="i-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></symbol>
          <symbol id="i-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></symbol>
          <symbol id="i-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></symbol>
          <symbol id="i-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></symbol>
          <symbol id="i-at" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5" /></symbol>
          <symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z" /></symbol>
          <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 21a2 2 0 0 0 4 0" /></symbol>
          <symbol id="i-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" /></symbol>
          <symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></symbol>
          <symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></symbol>
          <symbol id="i-mappin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></symbol>
          <symbol id="i-crosshair" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="2" /></symbol>
          <symbol id="i-save" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></symbol>
          <symbol id="i-store" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 4 4h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /><path d="M3 9h18" /></symbol>
          <symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></symbol>
          <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></symbol>
          <symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></symbol>
          <symbol id="i-message" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></symbol>
          <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></symbol>
          <symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></symbol>
          <symbol id="i-history" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 5v5h5" /><path d="M12 7v5l3 2" /></symbol>
          <symbol id="i-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></symbol>
          <symbol id="i-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></symbol>
          <symbol id="i-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" /><path d="M12 17h.01" /></symbol>
          <symbol id="i-headset" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><rect x="2" y="14" width="5" height="7" rx="1.5" /><rect x="17" y="14" width="5" height="7" rx="1.5" /></symbol>
          <symbol id="i-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></symbol>
          <symbol id="i-flag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4" /><path d="M4 4h13l-2 4 2 4H4" /></symbol>
          <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-5M12 8h.01" /></symbol>
          <symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></symbol>
          <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></symbol>
          <symbol id="i-map" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.4" /></symbol>
          <symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></symbol>
          <symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></symbol>
        </defs>
      </svg>

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        accept="image/*"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />

      <Sidebar
        items={sidebarItems}
        activeNav={activeNav}
        onNavClick={handleNavClick}
        logoImg={logo}
        logoAlt="لوکاوو"
      />

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              className="icon-btn"
              onClick={() => navigate(-1)}
              aria-label="بازگشت"
            >
              <svg style={{ width: 15, height: 15, transform: 'scaleX(-1)' }}>
                <use href="#i-chevron" />
              </svg>
            </button>
            <div className="page-title">پروفایل من</div>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              aria-label="تغییر پوسته"
            >
              <svg className="icon-sun">
                <use href="#i-sun" />
              </svg>
              <svg className="icon-moon">
                <use href="#i-moon" />
              </svg>
            </button>
            <button
              className="icon-btn"
              aria-label="اعلان‌ها"
              onClick={() => navigate('/my-chats')}
            >
              <svg>
                <use href="#i-bell" />
              </svg>
              <span className="dot"></span>
            </button>
          </div>
        </div>

        <div className="content">
          {/* HERO */}
          <section className="hero">
            <div className="mesh">
              <span className="m1"></span>
              <span className="m2"></span>
            </div>
            <div className="hero-inner">
              <div className="hero-left">
                <div className="avatar-wrap">
                  <div className="avatar-ring">
                    {profile.avatarImage ? (
                      <img
                        className="avatar-img"
                        src={profile.avatarImage}
                        alt={profile.fullName}
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {getInitials(profile.fullName)}
                      </div>
                    )}
                  </div>
                  <button
                    className="avatar-edit"
                    aria-label="ویرایش تصویر پروفایل"
                    onClick={openAvatarPicker}
                  >
                    <svg>
                      <use href="#i-camera" />
                    </svg>
                  </button>
                </div>
                <div className="hero-id">
                  <h1>{profile.fullName || 'کاربر'}</h1>
                  <div className="hero-username">
                    {profile.username ? `@${profile.username}` : ''}
                  </div>
                  <div className="hero-contacts">
                    {profile.email && (
                      <div className="hc-item">
                        <svg>
                          <use href="#i-mail" />
                        </svg>
                        {profile.email}
                      </div>
                    )}
                    <div className="hc-item">
                      <svg>
                        <use href="#i-phone" />
                      </svg>
                      {profile.phone}
                    </div>
                  </div>
                  <div className="hero-badges">
                    <span className="verified-badge-lg">
                      <svg>
                        <use href="#i-badge" />
                      </svg>
                      تایید شده
                    </span>
                  </div>
                </div>
              </div>
              <div className="hero-right">
                <button className="ghost-btn-white" onClick={openEditModal}>
                  <svg>
                    <use href="#i-edit" />
                  </svg>
                  ویرایش پروفایل
                </button>
                <button
                  className="ghost-btn-white"
                  style={{ marginTop: 8 }}
                  onClick={() => setPublicProfileOpen(true)}
                >
                  <svg>
                    <use href="#i-eye" />
                  </svg>
                  پیش‌نمایش عمومی
                </button>
              </div>
            </div>
          </section>

          {/* QUICK STATS */}
          <section className="stat-grid">
            <div
              className="stat-card card"
              onClick={() => navigate('/favorites')}
            >
              <div className="si-icon">
                <svg>
                  <use href="#i-bookmark" />
                </svg>
              </div>
              <div className="si-num">{profile.stats?.favorites ?? 0}</div>
              <div className="si-label">بوکمارک‌های من</div>
            </div>

            {/* نظرات من */}
            <div className="stat-card card">
              <div className="si-icon">
                <svg>
                  <use href="#i-star" />
                </svg>
              </div>
              <div className="si-num">{profile.stats?.reviews ?? 0}</div>
              <div className="si-label">نظرات من</div>
            </div>

            <div className="stat-card card">
              <div className="si-icon">
                <svg>
                  <use href="#i-eye" />
                </svg>
              </div>
              <div className="si-num">{profile.stats?.recentViews ?? 0}</div>
              <div className="si-label">بازدید اخیر</div>
            </div>

            <div
              className="stat-card card"
              onClick={() => navigate('/seller-dashboard')}
            >
              <div className="si-icon">
                <svg>
                  <use href="#i-store" />
                </svg>
              </div>
              <div className="si-num">{profile.stats?.businesses ?? 0}</div>
              <div className="si-label">کسب‌وکارهای من</div>
            </div>
          </section>

          <div className="overview-grid">
            <div className="main-col">
              {/* ACCOUNT SETTINGS */}
              <section className="section card">
                <div className="section-head">
                  <div className="sh-text">
                    <div className="sh-ico">
                      <svg>
                        <use href="#i-user" />
                      </svg>
                    </div>
                    <div>
                      <h2>تنظیمات حساب</h2>
                      <p>مدیریت اطلاعات شخصی و امنیت حساب شما</p>
                    </div>
                  </div>
                </div>
                <div className="settings-list">
                  <div className="setting-row setting-row-static">
                    <div className="sr-icon">
                      <svg>
                        <use href="#i-user" />
                      </svg>
                    </div>
                    <div className="sr-text">
                      <b>نام و نام خانوادگی</b>
                      <span>{profile.fullName || '—'}</span>
                    </div>
                  </div>
                  <div className="setting-row setting-row-static">
                    <div className="sr-icon">
                      <svg>
                        <use href="#i-at" />
                      </svg>
                    </div>
                    <div className="sr-text">
                      <b>نام کاربری</b>
                      <span>{profile.username || '—'}</span>
                    </div>
                  </div>
                  <div className="setting-row setting-row-static">
                    <div className="sr-icon">
                      <svg>
                        <use href="#i-mail" />
                      </svg>
                    </div>
                    <div className="sr-text">
                      <b>ایمیل</b>
                      <span>{profile.email || '—'}</span>
                    </div>
                  </div>
                  <div className="setting-row setting-row-static">
                    <div className="sr-icon">
                      <svg>
                        <use href="#i-phone" />
                      </svg>
                    </div>
                    <div className="sr-text">
                      <b>شماره موبایل</b>
                      <span>{profile.phone || '—'}</span>
                    </div>
                  </div>
                  <div
                    className="setting-row"
                    onClick={() => showToast('در حال حاضر فقط فارسی پشتیبانی می‌شود')}
                  >
                    <div className="sr-icon">
                      <svg>
                        <use href="#i-globe" />
                      </svg>
                    </div>
                    <div className="sr-text">
                      <b>زبان</b>
                      <span>زبان نمایش برنامه</span>
                    </div>
                    <div className="sr-right">
                      فارسی
                      <svg>
                        <use href="#i-chevron" />
                      </svg>
                    </div>
                  </div>
                  <div
                    className="setting-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme();
                    }}
                  >
                    <div className="sr-icon">
                      <svg>
                        <use href="#i-moon" />
                      </svg>
                    </div>
                    <div className="sr-text">
                      <b>حالت تیره / روشن</b>
                      <span>تغییر ظاهر کلی برنامه</span>
                    </div>
                    <div className="sr-right">
                      <div className={`switch ${isDark ? 'on' : ''}`}></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* LOCATION */}
              <section className="section card">
                <div className="section-head">
                  <div className="sh-text">
                    <div className="sh-ico">
                      <svg>
                        <use href="#i-mappin" />
                      </svg>
                    </div>
                    <div>
                      <h2>موقعیت مکانی</h2>
                      <p>محلی که می‌خواهید نتایج بر اساس آن نمایش داده شود</p>
                    </div>
                  </div>
                </div>

                <div className="loc-current">
                  <svg>
                    <use href="#i-mappin" />
                  </svg>
                  <div>
                    <b>
                      موقعیت فعلی: {profile.city}، {profile.province}
                    </b>
                    <span>
                      برای شخصی‌سازی کسب‌وکارهای نزدیک استفاده می‌شود
                    </span>
                  </div>
                </div>

                <div className="loc-form">
                  <div className="field">
                    <label>استان</label>
                    <select
                      value={locationForm.province}
                      onChange={(e) => {
                        const newProvince = e.target.value;
                        const cities = IRAN_LOCATIONS[newProvince] || [];
                        setLocationForm({
                          province: newProvince,
                          city: cities[0] || '',
                        });
                      }}
                    >
                      {Object.keys(IRAN_LOCATIONS).map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>شهر</label>
                    <select
                      value={locationForm.city}
                      onChange={(e) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                    >
                      {(IRAN_LOCATIONS[locationForm.province] || []).map(
                        (city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="loc-actions">
                  <button
                    className="ghost-btn"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                  >
                    <svg>
                      <use href="#i-crosshair" />
                    </svg>
                    {detectingLocation
                      ? 'در حال تشخیص...'
                      : 'تشخیص موقعیت فعلی'}
                  </button>
                  <button className="primary-btn" onClick={handleSaveLocation}>
                    <svg>
                      <use href="#i-save" />
                    </svg>
                    ذخیره موقعیت ترجیحی
                  </button>
                </div>
              </section>

              {/* ACTIVITY */}
              <section className="section card" ref={activityRef}>
                <div className="section-head">
                  <div className="sh-text">
                    <div className="sh-ico"><svg><use href="#i-history" /></svg></div>
                    <div>
                      <h2>فعالیت</h2>
                      <p>نگاهی سریع به کارهایی که اخیراً انجام داده‌اید</p>
                    </div>
                  </div>
                </div>
                <div className="login-row">
                  <svg><use href="#i-clock" /></svg>
                  <div>
                    <b>
                      {profile.lastLoginAt
                        ? `آخرین ورود: ${formatLoginTime(profile.lastLoginAt)}`
                        : 'اطلاعات ورود در دسترس نیست'}
                    </b>
                    {profile.lastLoginDevice && (
                      <span>{parseDevice(profile.lastLoginDevice)}</span>
                    )}
                  </div>
                </div>
                {recentSearches.length > 0 && (
                  <div className="chip-row" style={{ marginBottom: 18 }}>
                    {recentSearches.map((q, i) => (
                      <span
                        key={i}
                        className="chip"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                      >
                        <svg><use href="#i-search" /></svg>
                        {q}
                      </span>
                    ))}
                  </div>
                )}
                <div className="recent-scroll">
                  {recentViews.length > 0 ? (
                    recentViews.map((v) => (
                      <div
                        className="rv-card"
                        key={v.businessId}
                        onClick={() => navigate(`/business/${v.businessId}`)}
                      >
                        <div className="rv-thumb" style={{ background: 'linear-gradient(135deg,#2547E8,#5271FF)' }}>
                          <svg><use href="#i-store" /></svg>
                        </div>
                        <div className="rv-body">
                          <b>{v.name}</b>
                          <span>{relativeTime(v.viewedAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>هنوز بازدیدی ثبت نشده است.</p>
                  )}
                </div>
                <div className="timeline">
  {timeline.length > 0 ? (
    timeline.map((t) => (
      <div className="t-item" key={t.id}>
        <b>{t.message}</b>
        <span>{relativeTime(t.createdAt)}</span>
      </div>
    ))
  ) : (
    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
      هنوز فعالیتی ثبت نشده است.
    </p>
  )}
</div>
              </section>

              {/* ACCOUNT ACTIONS */}
              <section className="section card">
                <div className="section-head">
                  <div className="sh-text">
                    <div className="sh-ico">
                      <svg>
                        <use href="#i-logout" />
                      </svg>
                    </div>
                    <div>
                      <h2>خروج و حذف حساب</h2>
                      <p>مدیریت دسترسی شما به این حساب کاربری</p>
                    </div>
                  </div>
                </div>
                <div className="danger-row">
                  <div className="dr-text">
                    <b>خروج از حساب</b>
                    <span>خروج از این دستگاه</span>
                  </div>
                  <button
                    className="danger-ghost-btn"
                    onClick={() => openModal('logout')}
                  >
                    <svg>
                      <use href="#i-logout" />
                    </svg>
                    خروج
                  </button>
                </div>
                <div className="danger-row">
                  <div className="dr-text">
                    <b>حذف حساب کاربری</b>
                    <span>این عملیات غیرقابل بازگشت است</span>
                  </div>
                  <button
                    className="danger-btn"
                    onClick={() => openModal('delete')}
                  >
                    <svg>
                      <use href="#i-trash" />
                    </svg>
                    حذف حساب
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <BottomNav
        items={bottomNavItems}
        activeNav={activeNav}
        onNavClick={handleNavClick}
      />

      {/* DANGER CONFIRM MODAL */}
      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closeModal()}
      >
        <div className="modal-box">
          <div className="mb-ico">
            <svg>
              <use href="#i-alert" />
            </svg>
          </div>
          <h3>
            {modalMode === 'delete' ? 'حذف حساب کاربری؟' : 'خروج از حساب؟'}
          </h3>
          <p>
            {modalMode === 'delete'
              ? 'با این کار پروفایل، موارد ذخیره‌شده و تاریخچه سفارش‌های شما برای همیشه حذف می‌شود و قابل بازگشت نیست.'
              : 'برای ورود دوباره باید شماره موبایل خود را تایید کنید.'}
          </p>
          <div className="modal-actions">
            <button
              className="ghost-btn"
              style={{ justifyContent: 'center' }}
              onClick={closeModal}
            >
              انصراف
            </button>
            <button
              className="danger-btn"
              style={{ justifyContent: 'center' }}
              onClick={confirmModalAction}
            >
              <svg>
                <use
                  href={modalMode === 'delete' ? '#i-trash' : '#i-logout'}
                />
              </svg>
              {modalMode === 'delete' ? 'حذف' : 'خروج'}
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE FORM MODAL */}
      <div
        className={`modal-overlay ${editModalOpen ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closeEditModal()}
      >
        <div className="modal-box form-modal-box">
          <button
            className="modal-close-x"
            onClick={closeEditModal}
            aria-label="بستن"
          >
            <svg>
              <use href="#i-x" />
            </svg>
          </button>
          <div className="mb-ico info">
            <svg>
              <use href="#i-edit" />
            </svg>
          </div>
          <h3>ویرایش پروفایل</h3>
          <p>اطلاعات نمایشی حساب خود را به‌روزرسانی کنید.</p>
          <form className="edit-form" onSubmit={handleSaveProfile}>
            <div className="field">
              <label>عکس پروفایل</label>
              <div className="avatar-edit-row">
                <div className="avatar-edit-preview">
                  {editForm.avatarImage ? (
                    <img src={editForm.avatarImage} alt={editForm.fullName} />
                  ) : (
                    getInitials(editForm.fullName)
                  )}
                </div>
                <div className="avatar-edit-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={openAvatarPicker}
                  >
                    <svg>
                      <use href="#i-camera" />
                    </svg>
                    تغییر عکس
                  </button>
                  {editForm.avatarImage && (
                    <button
                      type="button"
                      className="danger-ghost-btn"
                      onClick={handleRemoveAvatar}
                    >
                      <svg>
                        <use href="#i-trash" />
                      </svg>
                      حذف عکس
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="field">
              <label>نام و نام خانوادگی</label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={handleEditChange('fullName')}
                placeholder="نام و نام خانوادگی"
                required
              />
            </div>

            <div className="loc-form">
              <div className="field">
                <label>نام کاربری</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={handleEditChange('username')}
                  placeholder="نام کاربری"
                />
              </div>
              <div className="field">
                <label>تاریخ تولد</label>
                <input
                  type="text"
                  value={editForm.birthdate}
                  onChange={handleEditChange('birthdate')}
                  placeholder="مثلاً ۱۳۷۵/۰۴/۱۲"
                />
              </div>
            </div>

            <div className="loc-form">
              <div className="field">
                <label>ایمیل</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange('email')}
                  placeholder="example@mail.com"
                />
              </div>
              <div className="field">
                <label>شماره موبایل</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  disabled
                  placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                />
              </div>
            </div>

            <div className="field">
              <label>بیوگرافی</label>
              <textarea
                value={editForm.bio}
                onChange={handleEditChange('bio')}
                placeholder="چند جمله درباره خودتان بنویسید..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn"
                style={{ justifyContent: 'center' }}
                onClick={closeEditModal}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="primary-btn"
                style={{ justifyContent: 'center' }}
                disabled={saving}
              >
                {saving ? (
                  'در حال ذخیره...'
                ) : (
                  <>
                    <svg>
                      <use href="#i-save" />
                    </svg>
                    ذخیره تغییرات
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CONTACT SUPPORT MODAL */}
      <div
        className={`modal-overlay ${contactModalOpen ? 'open' : ''}`}
        onClick={(e) =>
          e.target === e.currentTarget && setContactModalOpen(false)
        }
      >
        <div className="modal-box">
          <button
            className="modal-close-x"
            onClick={() => setContactModalOpen(false)}
            aria-label="بستن"
          >
            <svg>
              <use href="#i-x" />
            </svg>
          </button>
          <div className="mb-ico info">
            <svg>
              <use href="#i-headset" />
            </svg>
          </div>
          <h3>تماس با پشتیبانی</h3>
          <p>
            می‌توانید از یکی از راه‌های زیر با تیم پشتیبانی لوکاوو در ارتباط
            باشید.
          </p>
          <div className="about-meta">
            <div className="about-meta-row">
              <span>شماره تماس</span>
              <b style={{ direction: 'ltr' }}>{SUPPORT_PHONE_DISPLAY}</b>
            </div>
            <div className="about-meta-row">
              <span>ایمیل پشتیبانی</span>
              <b style={{ direction: 'ltr' }}>{SUPPORT_EMAIL}</b>
            </div>
          </div>
          <div className="modal-actions">
            <a
              href={`sms:${SUPPORT_PHONE_RAW}`}
              className="ghost-btn"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <svg>
                <use href="#i-message" />
              </svg>
              ارسال پیامک
            </a>
            <a
              href={`tel:${SUPPORT_PHONE_RAW}`}
              className="primary-btn"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <svg>
                <use href="#i-phone" />
              </svg>
              تماس
            </a>
          </div>
        </div>
      </div>

      {/* REPORT PROBLEM MODAL */}
      <div
        className={`modal-overlay ${reportModalOpen ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closeReportModal()}
      >
        <div className="modal-box form-modal-box">
          <button
            className="modal-close-x"
            onClick={closeReportModal}
            aria-label="بستن"
          >
            <svg>
              <use href="#i-x" />
            </svg>
          </button>
          <div className="mb-ico info">
            <svg>
              <use href="#i-flag" />
            </svg>
          </div>
          <h3>گزارش مشکل</h3>
          <p>
            مشکل خود را برای ما شرح دهید تا در سریع‌ترین زمان ممکن آن را بررسی
            کنیم.
          </p>
          <form className="report-form" onSubmit={handleReportSubmit}>
            <div className="field">
              <label>موضوع</label>
              <input
                type="text"
                value={reportForm.subject}
                onChange={handleReportChange('subject')}
                placeholder="عنوان مشکل را وارد کنید"
                required
              />
            </div>
            <div className="field">
              <label>توضیحات</label>
              <textarea
                value={reportForm.description}
                onChange={handleReportChange('description')}
                placeholder="مشکل را با جزئیات توضیح دهید..."
                rows={4}
                required
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn"
                style={{ justifyContent: 'center' }}
                onClick={closeReportModal}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="primary-btn"
                style={{ justifyContent: 'center' }}
              >
                <svg>
                  <use href="#i-flag" />
                </svg>
                ثبت گزارش
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PUBLIC PROFILE PREVIEW MODAL */}
      <div
        className={`modal-overlay ${publicProfileOpen ? 'open' : ''}`}
        onClick={(e) =>
          e.target === e.currentTarget && setPublicProfileOpen(false)
        }
      >
        <div className="modal-box info-box" style={{ textAlign: 'center' }}>
          <button
            className="modal-close-x"
            onClick={() => setPublicProfileOpen(false)}
            aria-label="بستن"
          >
            <svg>
              <use href="#i-x" />
            </svg>
          </button>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              marginBottom: 14,
            }}
          >
            پیش‌نمایش پروفایل عمومی
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div className="avatar-ring" style={{ width: 84, height: 84 }}>
              {profile.avatarImage ? (
                <img
                  className="avatar-img"
                  src={profile.avatarImage}
                  alt={profile.fullName}
                />
              ) : (
                <div className="avatar-fallback" style={{ fontSize: 24 }}>
                  {getInitials(profile.fullName)}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>{profile.fullName}</h3>
              <div
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {profile.username ? `@${profile.username}` : ''}
              </div>
            </div>
            <span className="verified-badge-lg">
              <svg>
                <use href="#i-badge" />
              </svg>
              تایید شده
            </span>
            {profile.bio && (
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.8 }}>
                {profile.bio}
              </p>
            )}
          </div>
          <div
            className="about-meta"
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {profile.stats?.favorites ?? 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                بوکمارک {/* قبلاً "علاقه‌مندی" بود */}
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {profile.stats?.reviews ?? 0}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                نظر
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {profile.stats?.recentViews ?? 0}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                بازدید
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="primary-btn"
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={() => setPublicProfileOpen(false)}
            >
              بستن
            </button>
          </div>
        </div>
      </div>

      {/* INFO MODAL (FAQ / ABOUT) */}
      <div
        className={`modal-overlay ${infoModalOpen ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closeInfoModal()}
      >
        <div className="modal-box info-box">
          <button
            className="modal-close-x"
            onClick={closeInfoModal}
            aria-label="بستن"
          >
            <svg>
              <use href="#i-x" />
            </svg>
          </button>
          {infoModalType === 'about' ? (
            <>
              <div className="mb-ico info">
                <svg>
                  <use href="#i-info" />
                </svg>
              </div>
              <h3>درباره لوکاوو</h3>
              <p style={{ textAlign: 'center' }}>
                لوکاوو پلتفرمی برای کشف و معرفی کسب‌وکارهای محلی است؛ از کافه و
                رستوران گرفته تا خدمات زیبایی و ورزشی. هدف ما این است که پیدا
                کردن بهترین‌ها در شهر شما ساده و قابل‌اعتماد باشد.
              </p>
              <div className="about-meta">
                <div className="about-meta-row">
                  <span>نسخه برنامه</span>
                  <b>۱.۰.۰</b>
                </div>
                <div className="about-meta-row">
                  <span>تماس با ما</span>
                  <b style={{ direction: 'ltr' }}>support@lokavo.ir</b>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="primary-btn"
                  style={{ justifyContent: 'center', width: '100%' }}
                  onClick={closeInfoModal}
                >
                  متوجه شدم
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-ico info">
                <svg>
                  <use href="#i-help" />
                </svg>
              </div>
              <h3>سوالات متداول</h3>
              <div className="faq-list">
                {faqItems.map((item, idx) => (
                  <div className="faq-item" key={idx}>
                    <b>{item.q}</b>
                    <span>{item.a}</span>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button
                  className="primary-btn"
                  style={{ justifyContent: 'center', width: '100%' }}
                  onClick={closeInfoModal}
                >
                  بستن
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOASTS */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <svg>
              <use href="#i-check" />
            </svg>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LokavoProfile;