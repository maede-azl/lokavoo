import { HiOutlineStar } from 'react-icons/hi2'

export default function BusinessCard({ title, category, distance, rating, address, badge, icon: Icon, gradient }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}>
        <span className="absolute right-4 top-4 rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {badge}
        </span>
        <Icon className="h-10 w-10 text-white/90" />
      </div>

      <div className="p-4">
        <h4 className="font-bold text-slate-800 dark:text-slate-100">{title}</h4>
        <div className="mt-1 flex items-center justify-between text-sm text-slate-400">
          <span>{category} · {distance}</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <a href="#" className="focus-ring text-sm font-medium text-brand-blue hover:underline">
            مشاهده ←
          </a>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
            {rating}
            <HiOutlineStar className="h-4 w-4 fill-amber-400 text-amber-400" />
          </span>
        </div>

        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
          {address}
        </p>
      </div>
    </div>
  )
}
