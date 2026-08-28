import React, { useState, useEffect, useRef, useMemo } from "react";
import "./AuthPage.css";

const API_BASE = "/api/auth";

const MODES = {
  light: { bg:"#F5F7FB", surface:"#FFFFFF", card:"#EEF2FA", text:"#0B1220", "text-muted":"#5B6B84", primary:"#2547E8", "primary-tint":"#E8ECFD", accent:"#FF9736", "accent-2":"#FFC24B", "accent-contrast":"#1B1204", border:"#E3E8F2", "hero-a":"#14224D", "hero-b":"#2547E8" },
  dark:  { bg:"#000000", surface:"#0C0C0E", card:"#18181C", text:"#F5F6FA", "text-muted":"#8A8F9C", primary:"#5271FF", "primary-tint":"#161B33", accent:"#FFB020", "accent-2":"#FFD166", "accent-contrast":"#1B1204", border:"#221F2A", "hero-a":"#05070F", "hero-b":"#0F1B4D" }
};

const faNum = n => n?.toString().replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]) || "۰";

function destinationFor(user) {
  return user?.role === "seller" ? "/seller/dashboard" : "/";
}

export default function App() {
  const [colorMode, setColorMode] = useState("light");
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [step, setStep] = useState(1);
  const [navDirection, setNavDirection] = useState("forward");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [otpStatus, setOtpStatus] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [resendReady, setResendReady] = useState(false);
  const [needsSignupPrompt, setNeedsSignupPrompt] = useState(false);
  const [phoneNotRegistered, setPhoneNotRegistered] = useState(false);
  const [name, setName] = useState("");
  const [wantsSeller, setWantsSeller] = useState(false);
  const [returningNote, setReturningNote] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingFinish, setLoadingFinish] = useState(false);
  const [redirectWidth, setRedirectWidth] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // آمار واقعی از دیتابیس
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    averageRating: 4.8,
    featuredBusinesses: []
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const otpRefs = useRef([]);

  // گرفتن آمار
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/public");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("خطا در دریافت آمار:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        window.location.href = destinationFor(parsedUser);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const t = MODES[colorMode];
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(t)) root.setProperty("--" + k, v);
  }, [colorMode]);

  useEffect(() => {
    if (step !== 2) return;
    setSeconds(45);
    setResendReady(false);
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(id);
          setResendReady(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, mode]);

  useEffect(() => {
    if (step === 4) {
      setRedirectWidth(0);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setRedirectWidth(100)));
      let redirectTimer;
      if (loggedInUser) {
        redirectTimer = setTimeout(() => {
          window.location.href = destinationFor(loggedInUser);
        }, 1400);
      }
      return () => {
        cancelAnimationFrame(raf);
        if (redirectTimer) clearTimeout(redirectTimer);
      };
    }
  }, [step, loggedInUser]);

  const confetti = useMemo(() => {
    if (step !== 4) return [];
    const colors = ["#16A34A", "#2547E8", "#FF9736", "#FFC24B", "#5EEAD4"];
    return Array.from({ length: 10 }).map((_, i) => {
      const angle = (Math.random() * 140 - 70) * Math.PI / 180;
      const dist = 40 + Math.random() * 40;
      return {
        dx: Math.sin(angle) * dist,
        dy: -Math.cos(angle) * dist - 10,
        rot: Math.random() * 360,
        color: colors[i % colors.length],
        delay: 0.3 + Math.random() * 0.15
      };
    });
  }, [step]);

  function goTo(newStep, dir = "forward") {
    setNavDirection(dir);
    setStep(newStep);
  }

  function switchMode(newMode) {
    if (newMode === mode) return;
    setNavDirection(newMode === "signup" ? "forward" : "back");
    setMode(newMode);
    setStep(1);
    setName("");
    setWantsSeller(false);
    setReturningNote(false);
    setOtp(["", "", "", "", ""]);
    setOtpStatus("");
    setOtpMsg("");
    setPhoneError("");
    setSignupError("");
    setNeedsSignupPrompt(false);
    setPhoneNotRegistered(false);
  }

  function heroCopy() {
    if (mode === "login") {
      return { h1: <>خوش برگشتی! دوباره <span>وارد</span> شو</>, sub: "با یک شماره موبایل وارد شو و به نظرها، آدرس‌ها و ساعات کاری دقیق همه‌ی کسب‌وکارهای شهر دسترسی داشته باش." };
    }
    if (role === "seller") {
      return { h1: <>کسب‌وکارت رو <span>حرفه‌ای</span> نشون بده</>, sub: "با ثبت‌نام به‌عنوان فروشنده، مغازه‌ت رو به هزاران مشتری نزدیک معرفی کن و نظرها رو مدیریت کن." };
    }
    return { h1: <>هر صنفی که بخوای، <span>اینجا</span> پیداش کن</>, sub: "با ثبت‌نام رایگان، به نظرها، آدرس‌ها و ساعات کاری دقیق همه‌ی کسب‌وکارهای شهر دسترسی داشته باش." };
  }

  const hero = heroCopy();
  const fullPhone = "0" + phone;

function handlePhoneChange(e) {
  setPhone(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10));
  setPhoneError("");
  setPhoneNotRegistered(false);
}

  async function sendCode() {
    setLoadingPhone(true);
    setPhoneError("");
    setNeedsSignupPrompt(false);
    setPhoneNotRegistered(false);
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, mode })
      });
      const data = await res.json();
      setLoadingPhone(false);
      if (!data.success) {
        setPhoneError(data.message || "ارسال کد با خطا مواجه شد");
        if (data.notRegistered) setPhoneNotRegistered(true);
        return;
      }
      if (data.devCode) console.log("[DEV] کد تایید:", data.devCode);
      goTo(2, "forward");
    } catch (err) {
      setLoadingPhone(false);
      setPhoneError("امکان اتصال به سرور نبود. مطمئن شو بک‌اند روشنه.");
    }
  }

  function handleOtpChange(i, val) {
    val = val.replace(/\D/g, "");
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setOtpStatus("");
    setOtpMsg("");
    setNeedsSignupPrompt(false);
    if (val && i < 4 && otpRefs.current[i + 1]) otpRefs.current[i + 1].focus();
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1].focus();
  }

  async function verifyCode() {
    const code = otp.join("");
    setLoadingVerify(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code })
      });
      const data = await res.json();
      setLoadingVerify(false);
      if (!data.success) {
        setOtpStatus("error");
        setOtpMsg(data.message || "کد وارد شده صحیح نیست، دوباره تلاش کن.");
        setOtp(["", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        return;
      }
      if (data.isNewUser && mode === "login") {
        setOtpStatus("error");
        setOtpMsg("این شماره هنوز ثبت‌نام نکرده. لطفاً اول ثبت‌نام کن.");
        setNeedsSignupPrompt(true);
        setOtp(["", "", "", "", ""]);
        return;
      }
      setOtpStatus("success");
      setNeedsSignupPrompt(false);
      setTimeout(() => {
        if (data.isNewUser) {
          goTo(3, "forward");
        } else {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          setLoggedInUser(data.data.user);
          setName(data.data.user.name);
          setReturningNote(mode === "signup");
          goTo(4, "forward");
        }
      }, 380);
    } catch (err) {
      setLoadingVerify(false);
      setOtpStatus("error");
      setOtpMsg("امکان اتصال به سرور نبود.");
    }
  }

  async function finishSignup() {
    setLoadingFinish(true);
    setSignupError("");
    const finalRole = (role === "seller" || wantsSeller) ? "seller" : "user";
    try {
      const res = await fetch(`${API_BASE}/complete-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          name: name.trim() || "کاربر لوکاوو",
          role: finalRole
        })
      });
      const data = await res.json();
      setLoadingFinish(false);
      if (!data.success) {
        setSignupError(data.message || "ثبت‌نام با خطا مواجه شد");
        return;
      }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      setLoggedInUser(data.data.user);
      setName(data.data.user.name);
      goTo(4, "forward");
    } catch (err) {
      setLoadingFinish(false);
      setSignupError("امکان اتصال به سرور نبود.");
    }
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : step === 3 ? 90 : 100;
  const maskedPhone = phone ? "0" + phone.slice(0, 3) + " *** " + phone.slice(-2) : "";
  const goingToSeller = loggedInUser?.role === "seller";
  const successTitle = name
    ? "خوش اومدی، " + name + "!"
    : mode === "login" ? "ورود با موفقیت انجام شد" : (returningNote ? "این شماره قبلاً ثبت شده بود!" : "ثبت‌نام با موفقیت انجام شد");
  const successDesc = returningNote
    ? "با همون حساب قبلی‌ت واردت کردیم. در حال انتقال..."
    : (goingToSeller ? "در حال انتقال به پنل فروشنده هستیم..." : "در حال انتقال به صفحه‌ی اصلی لوکاوو هستیم...");

  return (
    <div dir="rtl" lang="fa">
      <button
        className="theme-fab"
        onClick={() => setColorMode(m => (m === "light" ? "dark" : "light"))}
        title="تغییر به حالت شب/روز"
      >
        {colorMode === "light" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.4M12 19v2.5M4.2 4.2l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19 12h2.5M4.2 19.8l1.7-1.7M18 6l1.7-1.7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5Z" />
          </svg>
        )}
      </button>

      <div className="auth-shell">
        {/* ===================== سمت چپ (هیرو) ===================== */}
        <div className="auth-visual">
          <div className="mesh"><span className="m1"></span><span className="m2"></span></div>
          
          <div className="av-logo">
            <span className="brand-logo">
              LOCAV
              <span className="pin">
                <svg viewBox="0 0 24 30" fill="none">
                  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18C24 5.4 18.6 0 12 0Z" fill="var(--accent)"/>
                  <circle cx="12" cy="12" r="5.2" fill="var(--hero-a)"/>
                </svg>
              </span>
            </span>
          </div>

          <div className="av-copy">
            <div className="eyebrow">
              <span className="pulse"></span>
              {statsLoading
                ? "در حال بارگذاری..."
                : `بیش از ${faNum(stats.totalBusinesses)} کسب‌وکار فعال`}
            </div>

            <h1>{hero.h1}</h1>
            <p>{hero.sub}</p>

            {/* فقط دو تا آمار */}
            <div className="av-stats">
              <div className="av-stat">
                <b>{statsLoading ? "..." : faNum(stats.totalBusinesses) + (stats.totalBusinesses > 0 ? "+" : "")}</b>
                <span>کسب‌وکار فعال</span>
              </div>
              <div className="av-stat">
                <b>{statsLoading ? "..." : faNum(stats.averageRating)}</b>
                <span>میانگین رضایت</span>
              </div>
            </div>
          </div>

          {/* کارت‌های شناور */}
          <div className="float-card">
            {statsLoading ? (
              <div className="fc-row">
                <div className="fc-ico" style={{ background: "linear-gradient(135deg,#FF7A45,#FFC24B)" }}>⏳</div>
                <div className="fc-info">
                  <b>در حال بارگذاری...</b>
                  <span>لطفاً صبر کنید</span>
                </div>
                <div className="fc-star">—</div>
              </div>
            ) : stats.featuredBusinesses?.length > 0 ? (
              stats.featuredBusinesses.map((biz, i) => (
                <div className="fc-row" key={biz.id}>
                  <div
                    className="fc-ico"
                    style={{
                      background: i === 0
                        ? "linear-gradient(135deg,#FF7A45,#FFC24B)"
                        : "linear-gradient(135deg,#16A34A,#5EEAD4)"
                    }}
                  >
                    {i === 0 ? "🥖" : "💇"}
                  </div>
                  <div className="fc-info">
                    <b>{biz.name || "بدون نام"}</b>
                    <span>{biz.address ? biz.address.slice(0, 20) : "آدرس ثبت نشده"}</span>
                  </div>
                  <div className="fc-star">۴.۸★</div>
                </div>
              ))
            ) : (
              <div className="fc-row">
                <div className="fc-ico" style={{ background: "linear-gradient(135deg,#FF7A45,#FFC24B)" }}>🏪</div>
                <div className="fc-info">
                  <b>هنوز کسب‌وکاری نیست</b>
                  <span>اولین نفر باش!</span>
                </div>
                <div className="fc-star">—</div>
              </div>
            )}
          </div>
        </div>

        {/* ===================== سمت راست (فرم) ===================== */}
        <div className="auth-panel">
          <div className="panel-top">
            <div className="panel-logo">
              <span className="brand-logo">
                LOCAV
                <span className="pin">
                  <svg viewBox="0 0 24 30" fill="none">
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18C24 5.4 18.6 0 12 0Z" fill="var(--primary)"/>
                    <circle cx="12" cy="12" r="5.2" fill="var(--surface)"/>
                  </svg>
                </span>
              </span>
            </div>
            <div style={{ flex: 1 }}></div>
          </div>

          <div className="mode-stage">
            {mode === "signup" && (
              <div className="role-tabs">
                <button className={role === "user" ? "active" : ""} onClick={() => setRole("user")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                  ثبت‌نام کاربر
                </button>
                <button className={role === "seller" ? "active" : ""} onClick={() => setRole("seller")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v10h16V9"/><path d="M9 21v-6h6v6"/></svg>
                  ثبت‌نام فروشنده
                </button>
              </div>
            )}

            <div className="progress-track">
              <div className="progress-fill" style={{ width: progress + "%" }}></div>
            </div>

            <div key={mode + "-" + step}>
              {/* بقیه مراحل فرم دقیقاً مثل قبل باقی می‌مونه */}
              {step === 1 && (
                <div className={"step enter-" + navDirection}>
                  <h2>{mode === "login" ? "خوش اومدی " : (role === "seller" ? "ثبت‌نام فروشنده" : "ثبت‌نام کاربر")}</h2>
                  <p className="sub">
                    {mode === "login"
                      ? "شماره موبایلت رو وارد کن، یک کد ورود برات پیامک می‌کنیم."
                      : "برای شروع، شماره موبایلت رو وارد کن تا کد ثبت‌نام برات پیامک بشه."}
                  </p>
                  <span className="field-label">شماره موبایل</span>
                  <div className="phone-field">
                    <span className="cc">۹۸+</span>
                    <input type="tel" inputMode="numeric" placeholder="912 345 6789" maxLength={10} value={phone} onChange={handlePhoneChange} autoFocus />
                  </div>
                  {phoneError && <div className="otp-msg err" style={{ marginTop: 8 }}>{phoneError}</div>}
                  {phoneNotRegistered ? (
                    <>
                      <div style={{ height: 12 }}></div>
                      <button className="primary-btn" onClick={() => switchMode("signup")}>
                        <span className="btn-label">رفتن به صفحه‌ی ثبت‌نام</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ height: 22 }}></div>
                      <button className={"primary-btn" + (loadingPhone ? " loading" : "")} disabled={phone.length !== 10} onClick={sendCode}>
                        <span className="spinner"></span>
                        <span className="btn-label">{mode === "login" ? "ارسال کد ورود" : "ارسال کد ثبت‌نام"}</span>
                      </button>
                    </>
                  )}
                  <div className="divider"><span>یا</span></div>
                  <button className="google-btn">
                    <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.07-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1Z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M6 14.2a6.6 6.6 0 0 1 0-4.4V7H2.4a11 11 0 0 0 0 9.9L6 14.2Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.1-3.1A11 11 0 0 0 2.4 7l3.6 2.8c.8-2.6 3.2-4.4 6-4.4Z"/></svg>
                    {mode === "login" ? "ورود سریع با گوگل" : "ثبت‌نام سریع با گوگل"}
                  </button>
                  <p className="legal">با ادامه، <a href="#">شرایط استفاده</a> و <a href="#">حریم خصوصی</a> لوکاوو را می‌پذیری.</p>
                  {mode === "login" ? (
                    <p className="switch-link">حساب نداری؟ <a href="#" onClick={e => { e.preventDefault(); switchMode("signup"); }}>ثبت‌نام کن</a></p>
                  ) : (
                    <p className="switch-link">قبلاً ثبت‌نام کردی؟ <a href="#" onClick={e => { e.preventDefault(); switchMode("login"); }}>وارد شو</a></p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className={"step enter-" + navDirection}>
                  <h2>کد تایید رو وارد کن</h2>
                  <p className="sub">کد ۵ رقمی به شماره <b>{faNum(maskedPhone)}</b> پیامک شد.</p>
                  <div className={"otp-row" + (otpStatus ? " " + otpStatus : "")}>
                    {otp.map((v, i) => (
                      <input
                        key={i}
                        ref={el => (otpRefs.current[i] = el)}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={v}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  <div className={"otp-msg" + (otpStatus === "error" ? " err" : "")}>{otpMsg}</div>
                  {needsSignupPrompt && (
                    <button className="primary-btn" style={{ marginTop: 4, marginBottom: 18 }} onClick={() => switchMode("signup")}>
                      <span className="btn-label">رفتن به صفحه‌ی ثبت‌نام</span>
                    </button>
                  )}
                  <div className="otp-meta">
                    <span className="edit-phone" onClick={() => goTo(1, "back")}>✎ ویرایش شماره <b>{faNum("0" + phone)}</b></span>
                    <span className={"resend" + (resendReady ? " ready" : "")} onClick={() => resendReady && sendCode()}>
                      {resendReady ? "ارسال مجدد کد" : <>ارسال مجدد تا <span>{faNum("00:" + String(seconds).padStart(2, "0"))}</span></>}
                    </span>
                  </div>
                  <button className={"primary-btn" + (loadingVerify ? " loading" : "")} disabled={otp.join("").length !== 5} onClick={verifyCode}>
                    <span className="spinner"></span>
                    <span className="btn-label">تایید کد</span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className={"step enter-" + navDirection}>
                  <h2>یک قدم تا تموم شدن</h2>
                  <p className="sub">اسمت رو برامون بنویس تا حسابت کامل بشه.</p>
                  <span className="field-label">نام و نام خانوادگی</span>
                  <input className="text-field" placeholder="مثلاً سارا محمدی" value={name} onChange={e => setName(e.target.value)} autoFocus />
                  {signupError && <div className="otp-msg err" style={{ marginBottom: 12 }}>{signupError}</div>}
                  <button className={"primary-btn" + (loadingFinish ? " loading" : "")} onClick={finishSignup}>
                    <span className="spinner"></span>
                    <span className="btn-label">تکمیل ثبت‌نام</span>
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className={"success-wrap enter-" + navDirection}>
                  <div className="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7"/></svg>
                    {confetti.map((c, i) => (
                      <span
                        key={i}
                        className="confetti"
                        style={{ "--dx": c.dx + "px", "--dy": c.dy + "px", "--rot": c.rot + "deg", background: c.color, animationDelay: c.delay + "s" }}
                      ></span>
                    ))}
                  </div>
                  <h2>{successTitle}</h2>
                  <p>{successDesc}</p>
                  <div className="redirect-track"><div className="redirect-fill" style={{ width: redirectWidth + "%" }}></div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}