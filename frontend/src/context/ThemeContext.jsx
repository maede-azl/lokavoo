import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "theme";

const modes = {
  light: {
    bg: "#F5F7FB",
    surface: "#FFFFFF",
    card: "#EEF2FA",
    text: "#0B1220",
    "text-muted": "#5B6B84",
    primary: "#2547E8",
    "primary-tint": "#E8ECFD",
    accent: "#FF9736",
    "accent-2": "#FFC24B",
    "accent-contrast": "#1B1204",
    border: "#E3E8F2",
    "hero-a": "#14224D",
    "hero-b": "#2547E8",
  },
  dark: {
    bg: "#000000",
    surface: "#0C0C0E",
    card: "#18181C",
    text: "#F5F6FA",
    "text-muted": "#8A8F9C",
    primary: "#5271FF",
    "primary-tint": "#161B33",
    accent: "#FFB020",
    "accent-2": "#FFD166",
    "accent-contrast": "#1B1204",
    border: "#221F2A",
    "hero-a": "#05070F",
    "hero-b": "#0F1B4D",
  },
};

function applyThemeToDOM(theme) {
  const root = document.documentElement;
  const safe = theme === "dark" ? "dark" : "light";

  // Tailwind / class-based
  root.classList.toggle("dark", safe === "dark");

  // HomePage style
  root.setAttribute("data-theme", safe);
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${safe}`);

  // Profile + SellerDashboard style
  root.setAttribute("data-mode", safe);

  // CSS variables
  const vars = modes[safe];
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(THEME_KEY) || "light";
  });

  // اعمال تم هر بار که تغییر کند
  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // اگر در تب دیگری تغییر کرد
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY && e.newValue) {
        setThemeState(e.newValue === "dark" ? "dark" : "light");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = (value) => {
    setThemeState(value === "dark" ? "dark" : "light");
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}