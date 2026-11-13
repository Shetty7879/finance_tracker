export const ACCOUNT_TYPES = [
  'Bank Account',
  'Cash',
  'UPI',
  'Wallet',
];

export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Rent',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

export const CATEGORY_META = {
  Food: {
    icon: 'Utensils',
    bgLight: 'bg-amber-500/10',
    borderLight: 'border-amber-500/20',
    textLight: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  },
  Travel: {
    icon: 'Compass',
    bgLight: 'bg-sky-500/10',
    borderLight: 'border-sky-500/20',
    textLight: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
  },
  Shopping: {
    icon: 'ShoppingBag',
    bgLight: 'bg-pink-500/10',
    borderLight: 'border-pink-500/20',
    textLight: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
  },
  Rent: {
    icon: 'Home',
    bgLight: 'bg-indigo-500/10',
    borderLight: 'border-indigo-500/20',
    textLight: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
  },
  Bills: {
    icon: 'Receipt',
    bgLight: 'bg-rose-500/10',
    borderLight: 'border-rose-500/20',
    textLight: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
  },
  Entertainment: {
    icon: 'Film',
    bgLight: 'bg-purple-500/10',
    borderLight: 'border-purple-500/20',
    textLight: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
  },
  Health: {
    icon: 'HeartPulse',
    bgLight: 'bg-emerald-500/10',
    borderLight: 'border-emerald-500/20',
    textLight: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  },
  Education: {
    icon: 'GraduationCap',
    bgLight: 'bg-teal-500/10',
    borderLight: 'border-teal-500/20',
    textLight: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
  },
  Other: {
    icon: 'Tag',
    bgLight: 'bg-slate-500/10',
    borderLight: 'border-slate-500/20',
    textLight: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border-slate-200 dark:border-slate-700/50',
  },
};

export const ACCOUNT_TYPE_META = {
  'Bank Account': {
    icon: 'Building2',
    color: 'from-blue-600 to-indigo-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  Cash: {
    icon: 'Banknote',
    color: 'from-emerald-600 to-teal-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  UPI: {
    icon: 'Smartphone',
    color: 'from-amber-500 to-orange-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
  Wallet: {
    icon: 'Wallet',
    color: 'from-violet-600 to-purple-600',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/40',
    accentText: 'text-violet-600 dark:text-violet-400',
  },
};

/**
 * Currency formatter for Indian Rupee (₹)
 * Example: 250 -> ₹250, 125000 -> ₹1,25,000
 */
export function formatINR(value, includeDecimals = false) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Format date for friendly display
 * e.g., "13 Nov 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Get current date in YYYY-MM-DD
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

