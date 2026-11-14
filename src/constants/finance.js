export const ACCOUNT_TYPES = [
  'Bank Account',
  'Cash',
  'UPI',
  'Wallet',
];

export const TRANSACTION_TYPES = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
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

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business Income',
  'Investment Returns',
  'Dividends',
  'Interest',
  'Refund',
  'Gift',
  'Other',
];

export const PAYMENT_METHODS = [
  'UPI',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Cash',
  'Net Banking',
  'Cheque',
  'Other',
];

export const isOthersCategory = (cat) => {
  if (!cat) return false;
  const normalized = String(cat).trim().toLowerCase();
  return normalized === 'other' || normalized === 'others';
};

/**
 * Check if a category belongs strictly to Income
 */
export const isKnownIncomeCategory = (cat) => {
  if (!cat) return false;
  const clean = String(cat).trim().toLowerCase();
  return [
    'salary',
    'freelance',
    'business income',
    'investment returns',
    'dividends',
    'interest',
    'refund',
    'gift',
  ].includes(clean);
};

/**
 * Check if a category belongs strictly to Expense
 */
export const isKnownExpenseCategory = (cat) => {
  if (!cat) return false;
  const clean = String(cat).trim().toLowerCase();
  return [
    'food',
    'travel',
    'shopping',
    'rent',
    'bills',
    'entertainment',
    'health',
    'education',
  ].includes(clean);
};

export const CATEGORY_META = {
  // --- Expense Categories ---
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
  Others: {
    icon: 'Tag',
    bgLight: 'bg-slate-500/10',
    borderLight: 'border-slate-500/20',
    textLight: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border-slate-200 dark:border-slate-700/50',
  },

  // --- Income Categories ---
  Salary: {
    icon: 'Building2',
    bgLight: 'bg-emerald-500/10',
    borderLight: 'border-emerald-500/20',
    textLight: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  },
  Freelance: {
    icon: 'Laptop',
    bgLight: 'bg-teal-500/10',
    borderLight: 'border-teal-500/20',
    textLight: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
  },
  'Business Income': {
    icon: 'Store',
    bgLight: 'bg-blue-500/10',
    borderLight: 'border-blue-500/20',
    textLight: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
  },
  'Investment Returns': {
    icon: 'TrendingUp',
    bgLight: 'bg-green-500/10',
    borderLight: 'border-green-500/20',
    textLight: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-800/40',
  },
  Dividends: {
    icon: 'Coins',
    bgLight: 'bg-violet-500/10',
    borderLight: 'border-violet-500/20',
    textLight: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
  },
  Interest: {
    icon: 'Percent',
    bgLight: 'bg-amber-500/10',
    borderLight: 'border-amber-500/20',
    textLight: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  },
  Refund: {
    icon: 'RotateCcw',
    bgLight: 'bg-cyan-500/10',
    borderLight: 'border-cyan-500/20',
    textLight: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
  },
  Gift: {
    icon: 'Gift',
    bgLight: 'bg-fuchsia-500/10',
    borderLight: 'border-fuchsia-500/20',
    textLight: 'text-fuchsia-600 dark:text-fuchsia-400',
    badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/40',
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

/**
 * Bank & Wallet Presets with official logos and default types
 */
export const BANK_PRESETS = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    type: 'Bank Account',
    logo: '/logos/sbi.png',
    keywords: ['sbi', 'state bank', 'state bank of india'],
  },
  {
    id: 'slice',
    name: 'Slice',
    shortName: 'Slice',
    type: 'Wallet',
    logo: '/logos/slice.png',
    keywords: ['slice', 'slice card', 'slice mini', 'slice account'],
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    type: 'Bank Account',
    logo: null,
    keywords: ['hdfc', 'hdfc bank'],
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    type: 'Bank Account',
    logo: null,
    keywords: ['icici', 'icici bank'],
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    type: 'Bank Account',
    logo: null,
    keywords: ['axis', 'axis bank'],
  },
  {
    id: 'paytm',
    name: 'Paytm',
    shortName: 'Paytm',
    type: 'UPI',
    logo: null,
    keywords: ['paytm', 'paytm wallet'],
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    type: 'UPI',
    logo: null,
    keywords: ['phonepe', 'phone pe'],
  },
  {
    id: 'cash',
    name: 'Cash in Hand',
    shortName: 'Cash',
    type: 'Cash',
    logo: null,
    keywords: ['cash', 'cash in hand'],
  },
];

/**
 * Detect official bank/wallet logo from account name
 * @param {string} accountName
 * @returns {string|null} Path to logo in /logos/ or null
 */
export function detectBankLogo(accountName) {
  if (!accountName) return null;
  const clean = String(accountName).trim().toLowerCase();

  // State Bank of India (SBI)
  if (/(^|\b|\s)(sbi|state\s*bank|state\s*bank\s*of\s*india)($|\b|\s)/i.test(clean)) {
    return '/logos/sbi.png';
  }

  // Slice
  if (/(^|\b|\s)slice($|\b|\s)/i.test(clean)) {
    return '/logos/slice.png';
  }

  return null;
}

