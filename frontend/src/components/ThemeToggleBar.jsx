import { HiMoon, HiArrowRight } from 'react-icons/hi2'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggleBar() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 lg:px-8">
      <button
        type="button"
        aria-label="بازگشت"
        onClick={() => window.history.back()}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <HiArrowRight className="h-4 w-4" />
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="تغییر حالت تیره"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`focus-ring flex h-9 w-9 items-center justify-center rounded-full transition ${
          isDark
            ? 'bg-slate-900 text-white shadow-soft'
            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
        }`}
      >
        <HiMoon className="h-4 w-4" />
      </button>
    </div>
  )
}