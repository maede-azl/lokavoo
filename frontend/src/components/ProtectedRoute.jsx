import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// چک می‌کنه کاربر لاگین کرده یا نه (توکن موجود باشه)
export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

// اطلاعات کاربر لاگین‌شده رو از localStorage می‌خونه
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * ProtectedRoute
 * - اگر کاربر لاگین نکرده باشه -> میفرسته به /auth
 * - اگر allowedRoles داده بشه و نقش کاربر توش نباشه -> میفرسته به صفحه‌ی مناسب همون نقش
 *
 * استفاده:
 * <ProtectedRoute>                          // فقط نیاز به لاگین
 * <ProtectedRoute allowedRoles={["seller"]}> // فقط فروشنده
 * <ProtectedRoute allowedRoles={["user"]}>   // فقط کاربر عادی
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const authed = isAuthenticated();
  const user = getCurrentUser();

  // کاربر اصلاً لاگین نکرده
  if (!authed || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // کاربر لاگین کرده ولی نقشش اجازه‌ی دسترسی به این صفحه رو نداره
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "seller" ? "/seller/dashboard" : "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
}