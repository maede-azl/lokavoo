import { businesses } from '../data/businesses.js'
import BusinessCard from './BusinessCard.jsx'

export default function NearbyBusinesses() {
  return (
    <section className="mt-10 pb-16">
      <div className="mb-4 flex items-center justify-between">
        <a href="#" className="focus-ring text-sm font-medium text-brand-blue hover:underline">
          مشاهده نقشه ←
        </a>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">نزدیک‌ترین‌ها به شما</h3>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => (
          <BusinessCard key={b.id} {...b} />
        ))}
      </div>
    </section>
  )
}
