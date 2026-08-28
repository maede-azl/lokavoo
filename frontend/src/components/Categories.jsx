import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryCard from './CategoryCard.jsx'

const API_BASE = 'http://localhost:5000'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCategories(json.data || [])
        }
      })
      .catch((err) => {
        console.error('خطا در دریافت دسته‌بندی‌ها:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/categories"
          className="focus-ring text-sm font-medium text-brand-blue hover:underline"
        >
          مشاهده همه ←
        </Link>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          دسته‌بندی‌ها
        </h3>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-8">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.slice(0, 8).map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.key_name}
              label={cat.name}
              icon={cat.icon}
              color1={cat.color_1}
              color2={cat.color_2}
            />
          ))}
        </div>
      )}
    </section>
  )
}