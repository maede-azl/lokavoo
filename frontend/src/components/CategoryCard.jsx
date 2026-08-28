import { Link } from 'react-router-dom'

export default function CategoryCard({ id, label, icon, color1, color2 }) {
  return (
    <Link
      to={`/category/${id}`}
      className="focus-ring flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
        style={{
          background: `linear-gradient(135deg, ${color1 || '#E8ECFD'}, ${color2 || '#2547E8'}22)`,
          color: color1 || '#2547E8',
        }}
      >
        {icon || '📦'}
      </span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
    </Link>
  )
}