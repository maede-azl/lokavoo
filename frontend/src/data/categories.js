import {
  HiOutlineEllipsisHorizontal,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiOutlineHomeModern,
  HiOutlineAcademicCap,
  HiOutlineHeart,
  HiOutlineTruck,
  HiOutlineCake,
} from 'react-icons/hi2'

export const categories = [
  {
    id: 'more',
    label: 'بیشتر',
    icon: HiOutlineEllipsisHorizontal,
    bg: 'bg-slate-100 dark:bg-slate-800',
    fg: 'text-slate-500 dark:text-slate-300',
  },
  {
    id: 'beauty',
    label: 'زیبایی و آرایش',
    icon: HiOutlineSparkles,
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    fg: 'text-orange-500',
  },
  {
    id: 'shops',
    label: 'فروشگاه‌ها',
    icon: HiOutlineShoppingBag,
    bg: 'bg-pink-50 dark:bg-pink-500/10',
    fg: 'text-pink-500',
  },
  {
    id: 'construction',
    label: 'خدمات ساختمانی',
    icon: HiOutlineHomeModern,
    bg: 'bg-slate-100 dark:bg-slate-800',
    fg: 'text-slate-500 dark:text-slate-300',
  },
  {
    id: 'education',
    label: 'آموزش',
    icon: HiOutlineAcademicCap,
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    fg: 'text-purple-500',
  },
  {
    id: 'health',
    label: 'سلامت و پزشکی',
    icon: HiOutlineHeart,
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    fg: 'text-emerald-500',
  },
  {
    id: 'auto',
    label: 'خدمات خودرو',
    icon: HiOutlineTruck,
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    fg: 'text-blue-500',
  },
  {
    id: 'food',
    label: 'رستوران و کافه',
    icon: HiOutlineCake,
    bg: 'bg-red-50 dark:bg-red-500/10',
    fg: 'text-red-500',
  },
]
