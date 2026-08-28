import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineUser } from 'react-icons/hi2'

export default function AccountMenu() {
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    console.log('AccountMenu useEffect — raw localStorage user:', savedUser)
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        console.log('AccountMenu useEffect — parsed user:', parsed)
        setUser(parsed)
      } catch (err) {
        console.log('AccountMenu useEffect — parse error:', err)
      }
    }
  }, [])

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  console.log('AccountMenu RENDER — current user state:', user)

  function handleIconClick() {
    console.log('AccountMenu — icon clicked, user is:', user)
    if (user) {
      setOpen(o => !o)
    } else {
      navigate('/auth')
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setOpen(false)
    navigate('/')
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={handleIconClick}
        aria-label={user ? 'حساب کاربری' : 'ورود به حساب'}
        className={
          "focus-ring flex h-10 w-10 items-center justify-center rounded-full border transition " +
          (user
            ? "border-brand-blue text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20"
            : "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800")
        }
      >
        <HiOutlineUser className="h-5 w-5" />
      </button>

      {user && open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-[999] w-56 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">
            سلام {user.name} 👋
          </p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            شما وارد حساب کاربری خودت هستی.
          </p>
          <button
            onClick={handleLogout}
            className="focus-ring w-full rounded-full bg-brand-blue py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            خروج از حساب
          </button>
        </div>
      )}
    </div>
  )
}