/**
 * analyticsUtils.js
 * Comprehensive financial analytics, date aggregation, and smart insights calculation
 * for FridayTrack Personal Finance Tracker.
 */

// Category Palette - Accessible, modern, and consistent with FridayTrack branding
export const CATEGORY_COLORS = {
  // Expense Categories
  Food: '#10b981', // emerald-500
  Shopping: '#8b5cf6', // purple-500
  Travel: '#0ea5e9', // sky-500
  Bills: '#f43f5e', // rose-500
  Rent: '#f59e0b', // amber-500
  Entertainment: '#ec4899', // pink-500
  Health: '#14b8a6', // teal-500
  Education: '#6366f1', // indigo-500
  Other: '#64748b', // slate-500
  Others: '#64748b',

  // Income Categories
  Salary: '#059669', // emerald-600
  Freelance: '#0d9488', // teal-600
  'Business Income': '#2563eb', // blue-600
  'Investment Returns': '#16a34a', // green-600
  Dividends: '#7c3aed', // violet-600
  Interest: '#d97706', // amber-600
  Refund: '#0891b2', // cyan-600
  Gift: '#c026d3', // fuchsia-600
};

export const CATEGORY_ICONS = {
  Food: 'Utensils',
  Shopping: 'ShoppingBag',
  Travel: 'Compass',
  Bills: 'Receipt',
  Rent: 'Home',
  Entertainment: 'Film',
  Health: 'HeartPulse',
  Education: 'GraduationCap',
  Other: 'Tag',
  Others: 'Tag',
  Salary: 'Building2',
  Freelance: 'Laptop',
  'Business Income': 'Store',
  'Investment Returns': 'TrendingUp',
  Dividends: 'Coins',
  Interest: 'Percent',
  Refund: 'RotateCcw',
  Gift: 'Gift',
};

/**
 * Format an ISO Date object to local YYYY-MM-DD
 */
export function formatLocalDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format currency in Indian Rupees (INR ₹)
 */
export function formatINR(val, options = {}) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: options.fractionDigits ?? 2,
    minimumFractionDigits: options.fractionDigits ?? 0,
  }).format(num);
}

/**
 * Compute Date Range bounds [startDateStr, endDateStr, label] based on filter key
 */
export function getDateRangeBounds(filter, customStart = '', customEnd = '') {
  const now = new Date();
  const todayStr = formatLocalDate(now);

  switch (filter) {
    case 'today':
      return {
        startDate: todayStr,
        endDate: todayStr,
        label: 'Today',
        days: 1,
      };

    case 'this_week': {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      return {
        startDate: formatLocalDate(monday),
        endDate: todayStr,
        label: 'This Week',
        days: diffToMonday + 1,
      };
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: formatLocalDate(startOfMonth),
        endDate: todayStr,
        label: 'This Month',
        days: now.getDate(),
      };
    }

    case 'last_month': {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: formatLocalDate(prevMonthStart),
        endDate: formatLocalDate(prevMonthEnd),
        label: 'Last Month',
        days: prevMonthEnd.getDate(),
      };
    }

    case 'last_3_months': {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setDate(now.getDate() - 90);
      return {
        startDate: formatLocalDate(threeMonthsAgo),
        endDate: todayStr,
        label: 'Last 3 Months',
        days: 90,
      };
    }

    case 'last_6_months': {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setDate(now.getDate() - 180);
      return {
        startDate: formatLocalDate(sixMonthsAgo),
        endDate: todayStr,
        label: 'Last 6 Months',
        days: 180,
      };
    }

    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const dayCount = Math.round((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
      return {
        startDate: formatLocalDate(startOfYear),
        endDate: todayStr,
        label: 'This Year',
        days: dayCount,
      };
    }

    case 'custom': {
      const s = customStart || todayStr;
      const e = customEnd || todayStr;
      const startD = new Date(s);
      const endD = new Date(e);
      const days = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1);
      return {
        startDate: s,
        endDate: e,
        label: `${s} to ${e}`,
        days,
      };
    }

    default:
      return getDateRangeBounds('this_month');
  }
}

/**
 * Filter transactions matching date bounds
 */
export function filterExpensesByDate(transactions, startDateStr, endDateStr) {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter((e) => {
    const d = e.expense_date || e.date || (e.created_at ? e.created_at.slice(0, 10) : '');
    return d >= startDateStr && d <= endDateStr;
  });
}

/**
 * Calculate Summary KPI Cards
 */
export function calculateFinancialSummary(accounts, allTransactions, filteredTransactions, rangeInfo) {
  const expenseTransactions = filteredTransactions.filter(
    (t) => (t.type || t.transaction_type) !== 'income'
  );
  const incomeTransactions = filteredTransactions.filter(
    (t) => (t.type || t.transaction_type) === 'income'
  );

  const totalExpenses = expenseTransactions.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const loggedIncome = incomeTransactions.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  // Total current bank balance across all accounts
  const totalBankBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  
  // Lifetime expenses deducted
  const lifetimeExpenses = allTransactions
    .filter((t) => (t.type || t.transaction_type) !== 'income')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // If explicit income logged in this period, use it; otherwise fallback to account capital
  const totalIncome = loggedIncome > 0 ? loggedIncome : (totalBankBalance + lifetimeExpenses);
  
  // Net Savings = Total Income - Total Expenses
  const netSavings = totalIncome - totalExpenses;
  
  // Savings Rate = (Net Savings / Total Income) * 100
  const savingsRate = totalIncome > 0 && netSavings > 0 ? (netSavings / totalIncome) * 100 : 0;
  
  // Average Daily Spending = Total Expenses / Days in Period
  const days = Math.max(1, rangeInfo?.days || 1);
  const avgDailySpending = totalExpenses / days;

  // Highest spending category in this period
  const catBreakdown = getCategoryBreakdown(expenseTransactions);
  const highestCategory = catBreakdown.length > 0 ? catBreakdown[0] : null;

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate: Math.round(savingsRate * 10) / 10,
    avgDailySpending: Math.round(avgDailySpending * 100) / 100,
    highestCategory,
    daysInPeriod: days,
    totalBankBalance,
  };
}

/**
 * Group expenses by category and compute percentages and counts
 */
export function getCategoryBreakdown(filteredTransactions) {
  if (!Array.isArray(filteredTransactions) || filteredTransactions.length === 0) return [];

  // Focus breakdown on expense transactions
  const expenseOnly = filteredTransactions.filter(
    (t) => (t.type || t.transaction_type) !== 'income'
  );
  const items = expenseOnly.length > 0 ? expenseOnly : filteredTransactions;

  const total = items.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const catMap = {};

  items.forEach((e) => {
    const cat = e.category || 'Other';
    const amt = Number(e.amount) || 0;
    if (!catMap[cat]) {
      catMap[cat] = {
        category: cat,
        amount: 0,
        count: 0,
        color: CATEGORY_COLORS[cat] || '#64748b',
      };
    }
    catMap[cat].amount += amt;
    catMap[cat].count += 1;
  });

  const list = Object.values(catMap).map((item) => ({
    ...item,
    amount: Math.round(item.amount * 100) / 100,
    percentage: total > 0 ? Math.round((item.amount / total) * 1000) / 10 : 0,
  }));

  return list.sort((a, b) => b.amount - a.amount);
}

/**
 * Generate daily spending series for bar chart
 */
export function getDailySpendingSeries(filteredTransactions, startDateStr, endDateStr) {
  const dayMap = {};

  const startD = new Date(startDateStr);
  const endD = new Date(endDateStr);
  const diffDays = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 31 && diffDays > 0) {
    const cur = new Date(startD);
    while (cur <= endD) {
      const k = formatLocalDate(cur);
      dayMap[k] = 0;
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Populate expense amounts
  (filteredTransactions || []).forEach((e) => {
    if ((e.type || e.transaction_type) === 'income') return; // daily chart focuses on expenditure run-rate
    const d = e.expense_date || e.date || (e.created_at ? e.created_at.slice(0, 10) : '');
    if (d >= startDateStr && d <= endDateStr) {
      dayMap[d] = (dayMap[d] || 0) + (Number(e.amount) || 0);
    }
  });

  const sortedDates = Object.keys(dayMap).sort();
  return sortedDates.map((d) => {
    const dateObj = new Date(d);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: d,
      label: diffDays <= 7 ? dayName : monthDay,
      fullLabel: `${dayName}, ${monthDay}`,
      amount: Math.round(dayMap[d] * 100) / 100,
    };
  });
}

/**
 * Group expenses by month (YYYY-MM) for line trend charts and MoM comparisons
 */
export function getMonthlyTrends(allTransactions) {
  if (!Array.isArray(allTransactions)) return [];

  const monthMap = {};
  allTransactions.forEach((e) => {
    if ((e.type || e.transaction_type) === 'income') return;
    const d = e.expense_date || e.date || (e.created_at ? e.created_at.slice(0, 10) : '');
    if (!d) return;
    const monthKey = d.slice(0, 7); // YYYY-MM
    monthMap[monthKey] = (monthMap[monthKey] || 0) + (Number(e.amount) || 0);
  });

  const sortedMonths = Object.keys(monthMap).sort();
  if (sortedMonths.length === 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return [{
      monthKey: currentMonth,
      label: new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount: 0,
      momChange: 0,
    }];
  }

  return sortedMonths.map((mKey, idx) => {
    const amount = Math.round(monthMap[mKey] * 100) / 100;
    const prevAmount = idx > 0 ? monthMap[sortedMonths[idx - 1]] : null;
    let momChange = 0;
    if (prevAmount !== null && prevAmount > 0) {
      momChange = Math.round(((amount - prevAmount) / prevAmount) * 100);
    }

    const [year, month] = mKey.split('-');
    const labelDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const label = labelDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    return {
      monthKey: mKey,
      label,
      amount,
      momChange,
    };
  });
}

/**
 * Account-wise spending & balance analytics
 */
export function getAccountAnalytics(accounts, allTransactions, filteredTransactions) {
  if (!Array.isArray(accounts)) return [];

  const totalPeriodExpense = filteredTransactions
    .filter((t) => (t.type || t.transaction_type) !== 'income')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return accounts.map((acc) => {
    const outgoing = filteredTransactions
      .filter((e) => (e.accountId === acc.id || e.account_id === acc.id) && (e.type || e.transaction_type) !== 'income')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const spendingShare = totalPeriodExpense > 0
      ? Math.round((outgoing / totalPeriodExpense) * 1000) / 10
      : 0;

    return {
      id: acc.id,
      name: acc.name || acc.account_name,
      type: acc.type || acc.account_type,
      currentBalance: Number(acc.balance) || 0,
      outgoing: Math.round(outgoing * 100) / 100,
      spendingShare,
    };
  });
}

/**
 * Dynamic Automated Smart Insights
 */
export function generateSmartInsights(summary, categoryBreakdown, dailySeries, monthlyTrends) {
  const insights = [];

  // Insight 1: Dominant Expense Category
  if (categoryBreakdown && categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    if (top.percentage >= 35) {
      insights.push({
        type: 'warning',
        title: `Heavy Spend in ${top.category}`,
        description: `${top.category} accounts for ${top.percentage}% of your expenses (${formatINR(top.amount)}). Trimming this category will produce the highest immediate savings.`,
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Balanced Category Distribution',
        description: `Your highest expense is ${top.category} at ${top.percentage}%, reflecting healthy portfolio diversification across spending buckets.`,
      });
    }
  }

  // Insight 2: Daily Run-Rate context
  if (summary.avgDailySpending > 0) {
    const monthlyProjection = summary.avgDailySpending * 30;
    insights.push({
      type: 'neutral',
      title: 'Daily Spending Run-Rate',
      description: `You are spending an average of ${formatINR(summary.avgDailySpending)} per day. Over a 30-day billing cycle, this projects to ${formatINR(monthlyProjection)}.`,
    });
  }

  // Insight 3: Savings Health
  if (summary.totalIncome > 0) {
    if (summary.savingsRate >= 20) {
      insights.push({
        type: 'positive',
        title: 'Strong Savings Rate',
        description: `Your savings rate of ${summary.savingsRate}% meets the classic 50/30/20 benchmark (saving at least 20% of net incoming capital).`,
      });
    } else if (summary.savingsRate > 0) {
      insights.push({
        type: 'warning',
        title: 'Savings Rate Below 20%',
        description: `Your current savings rate is ${summary.savingsRate}%. Try identifying non-essential recurring bills to reach the 20% savings threshold.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      title: 'Real-Time Financial Intelligence',
      description: 'As you log more daily transactions across multiple accounts, automated predictive insights and trajectory warnings will appear here.',
    });
  }

  return insights;
}
