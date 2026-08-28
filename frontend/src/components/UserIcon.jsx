import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserIcon = () => {
  const navigate = useNavigate();

  // خواندن وضعیت لاگین از localStorage (همون روشی که در HomePage استفاده کردید)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || '';

  const handleAuthAction = () => {
    if (isLoggedIn) {
      // لاگ‌اوت
      if (window.confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('token'); // اگر توکن هم دارید
        localStorage.removeItem('user'); // اگر اطلاعات کاربر رو هم ذخیره کردید
        
        // رفرش صفحه برای به‌روزرسانی وضعیت
        window.location.reload();
        // یا می‌تونید به صفحه اصلی هدایت کنید
        // navigate('/');
      }
    } else {
      // رفتن به صفحه لاگین
      navigate('/auth');
    }
  };

  // دریافت حرف اول نام کاربر برای آواتار
  const getUserInitial = () => {
    if (!userName) return '👤';
    return userName.charAt(0).toUpperCase();
  };

  return (
    <div className="user-icon-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isLoggedIn ? (
        <>
          {/* آواتار کاربر */}
          <div
            className="user-avatar"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2547E8, #5271FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              userSelect: 'none',
            }}
          >
            {getUserInitial()}
          </div>

          {/* دکمه خروج */}
          <button
            className="icon-btn logout-btn"
            onClick={handleAuthAction}
            title="خروج از حساب"
            style={{
              background: '#E0344C15',
              border: '1px solid #E0344C',
              color: '#E0344C',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E0344C25';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#E0344C15';
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>خروج</span>
          </button>
        </>
      ) : (
        // دکمه ورود
        <button
          className="icon-btn login-btn"
          onClick={handleAuthAction}
          title="ورود به حساب"
          style={{
            background: '#2547E815',
            border: '1px solid #2547E8',
            color: '#2547E8',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2547E825';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2547E815';
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>ورود</span>
        </button>
      )}
    </div>
  );
};

export default UserIcon;