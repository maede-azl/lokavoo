import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import HomePage from "./HomePage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import BusinessDetailPage from "./pages/BusinessDetailPage.jsx";
import AddBusiness from "./pages/AddBusiness.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";
import LokaooCategories from "./pages/LokaooCategories.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MyChatsPage from "./pages/MyChatsPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* ===== صفحات عمومی ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/businesses/:id" element={<BusinessDetailPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} /> {/* اضافه شد */}
          <Route path="/categories" element={<LokaooCategories />} />
          <Route path="/reviews" element={<Navigate to="/favorites" replace />} />

          {/* ===== پنل ادمین ===== */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* ===== کاربر لاگین‌کرده ===== */}
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ===== چت‌ها (خریدار و فروشنده) ===== */}
          <Route
            path="/my-chats"
            element={
              <ProtectedRoute>
                <MyChatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-chats/:businessId"
            element={
              <ProtectedRoute>
                <MyChatsPage />
              </ProtectedRoute>
            }
          />

          {/* مسیرهای قدیمی → ریدایرکت به مسیر جدید */}
          <Route path="/chat/:businessId" element={<Navigate to="/my-chats" replace />} />
          <Route path="/seller/messages" element={<Navigate to="/my-chats" replace />} />

          {/* ===== فقط فروشنده ===== */}
          <Route
            path="/add-business"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <AddBusiness />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}