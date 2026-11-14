/**
 * analyticsUtils.js
 * Comprehensive financial analytics, date aggregation, and smart insights calculation
 * for FridayTrack Personal Finance Tracker.
 */

// Category Palette - Accessible, modern, and consistent with FridayTrack branding
export const CATEGORY_COLORS = {
  Food: '#10b981', // emerald-500
  Shopping: '#8b5cf6', // purple-500
  Travel: '#0ea5e9', // sky-500
  Bills: '#f43f5e', // rose-500
  Rent: '#f59e0b', // amber-500
  Entertainment: '#ec4899', // pink-500
  Health: '#14b8a6', // teal-500
  Education: '#6366f1', // indigo-500
  Other: '#64748b', // slate-500
};

export const CATEGORY_ICONS = {
  Food: 'Utensils',
  Shopping: 'ShoppingBag',
  Travel: 'Plane',
  Bills: 'Receipt',
  Rent: 'Home',
  Entertainment: 'Tv',
  Health: 'HeartPulse',
  Education: 'GraduationCap',
  Other: 'MoreHorizontal',
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
      // Start of current week (Monday)
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
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
 * Filter expenses matching date bounds
 */
export function filterExpensesByDate(expenses, startDateStr, endDateStr) {
  if (!Array.isArray(expenses)) return [];
  return expenses.filter((e) => {
    const d = e.expense_date || (e.created_at ? e.created_at.slice(0, 10) : '');
    return d >= startDateStr && d <= endDateStr;
  });
}

/**
 * Calculate Summary KPI Cards
 */
export function calculateFinancialSummary(accounts, expenses, filteredExpenses, rangeInfo) {
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  // Total current bank balance across all accounts
  const totalBankBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  
  // Total lifetime expenses deducted
  const lifetimeExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  // Total capital funded into accounts = current balance + lifetime expenses
  const totalFunding = totalBankBalance + lifetimeExpenses;
  
  // Effective Income for period:
  // If period is all-time or starting funds, initial deposits constitute incoming capital.
  // In personal finance tracking with accounts, total income represents account funding.
  const totalIncome = totalFunding;
  
  // Net Savings = Total Income - Total Expenses
  const netSavings = Math.max(0, totalIncome - totalExpenses);
  
  // Savings Rate = (Net Savings / Total Income) * 100
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  
  // Average Daily Spending = Total Expenses / Days in Period
  const days = Math.max(1, rangeInfo?.days || 1);
  const avgDailySpending = totalExpenses / days;

  // Highest spending category in this period
  const catBreakdown = getCategoryBreakdown(filteredExpenses);
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
export function getCategoryBreakdown(filteredExpenses) {
  if (!Array.isArray(filteredExpenses) || filteredExpenses.length === 0) return [];

  const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const catMap = {};

  filteredExpenses.forEach((e) => {
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

  // Sort descending by total amount
  return list.sort((a, b) => b.amount - a.amount);
}

/**
 * Generate daily spending series for bar chart
 */
export function getDailySpendingSeries(filteredExpenses, startDateStr, endDateStr) {
  const dayMap = {};

  // Initialize all days in range with 0 if range <= 31 days
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

  // Populate actual amounts
  (filteredExpenses || []).forEach((e) => {
    const d = e.expense_date || (e.created_at ? e.created_at.slice(0, 10) : '');
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
export function getMonthlyTrends(expenses) {
  if (!Array.isArray(expenses)) return [];

  const monthMap = {};
  expenses.forEach((e) => {
    const d = e.expense_date || (e.created_at ? e.created_at.slice(0, 10) : '');
    const m = d.slice(0, 7); // YYYY-MM
    if (m) {
      monthMap[m] = (monthMap[m] || 0) + (Number(e.amount) || 0);
    }
  });

  const sortedMonths = Object.keys(monthMap).sort();
  return sortedMonths.map((m, idx) => {
    const [year, month] = m.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, 1);
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const amount = Math.round(monthMap[m] * 100) / 100;
    
    // MoM Calculation
    let momChange = 0;
    if (idx > 0) {
      const prev = monthMap[sortedMonths[idx - 1]];
      if (prev > 0) {
        momChange = Math.round(((amount - prev) / prev) * 1000) / 10;
      }
    }

    return {
      monthKey: m,
      label,
      amount,
      momChange,
    };
  });
}

/**
 * Compute Account-wise Analytics
 */
export function getAccountAnalytics(accounts, expenses, filteredExpenses) {
  if (!Array.isArray(accounts)) return [];

  const totalPeriodExpenses = (filteredExpenses || []).reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  return accounts.map((acc) => {
    // Total expenses for this account in the filtered period
    const accountPeriodExpenses = (filteredExpenses || [])
      .filter((e) => e.account_id === acc.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Lifetime expenses for this account
    const lifetimeAccExpenses = (expenses || [])
      .filter((e) => e.account_id === acc.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const currentBalance = Number(acc.balance) || 0;
    const initialDeposit = currentBalance + lifetimeAccExpenses;

    const spendingShare = totalPeriodExpenses > 0
      ? Math.round((accountPeriodExpenses / totalPeriodExpenses) * 1000) / 10
      : 0;

    return {
      id: acc.id,
      name: acc.account_name,
      type: acc.account_type,
      currentBalance,
      initialDeposit,
      outgoing: Math.round(accountPeriodExpenses * 100) / 100,
      spendingShare,
      transactionCount: (filteredExpenses || []).filter((e) => e.account_id === acc.id).length,
    };
  });
}

/**
 * Generate Smart Financial Insights from actual transaction records
 */
export function generateSmartInsights(summary, categoryBreakdown, dailySeries, monthlyTrends) {
  const insights = [];

  // Insight 1: Highest spending category dominance
  if (categoryBreakdown && categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    if (top.percentage > 35) {
      insights.push({
        type: 'warning',
        title: `Heavy ${top.category} Spending`,
        description: `${top.category} represents ${top.percentage}% (${formatINR(top.amount)}) of your total expenses in this period. Consider establishing a dedicated limit.`,
      });
    } else {
      insights.push({
        type: 'info',
        title: `Top Spending Category: ${top.category}`,
        description: `Your highest expense was ${top.category} with ${formatINR(top.amount)} across ${top.count} transactions (${top.percentage}% of total).`,
      });
    }
  }

  // Insight 2: Peak Spending Day
  if (dailySeries && dailySeries.length > 0) {
    const sortedDays = [...dailySeries].sort((a, b) => b.amount - a.amount);
    const peak = sortedDays[0];
    if (peak && peak.amount > 0) {
      insights.push({
        type: 'neutral',
        title: `Peak Daily Spending: ${peak.fullLabel || peak.label}`,
        description: `Your highest daily expenditure in this period was ${formatINR(peak.amount)} on ${peak.date}.`,
      });
    }
  }

  // Insight 3: Savings Rate Evaluation
  if (summary && summary.totalIncome > 0) {
    if (summary.savingsRate >= 40) {
      insights.push({
        type: 'positive',
        title: 'Outstanding Savings Rate',
        description: `Your current savings rate is ${summary.savingsRate}%, significantly outperforming the standard 20% financial benchmark.`,
      });
    } else if (summary.savingsRate < 20 && summary.totalExpenses > 0) {
      insights.push({
        type: 'warning',
        title: 'Savings Rate Below 20% Target',
        description: `Your savings rate sits at ${summary.savingsRate}%. Review discretionary categories like Shopping or Entertainment to bolster savings.`,
      });
    }
  }

  // Insight 4: Month-over-Month Trend
  if (monthlyTrends && monthlyTrends.length >= 2) {
    const currentMonth = monthlyTrends[monthlyTrends.length - 1];
    const momChange = currentMonth.momChange;
    if (momChange > 15) {
      insights.push({
        type: 'warning',
        title: `Spending Surge (+${momChange}%)`,
        description: `Your expenses in ${currentMonth.label} rose by ${momChange}% compared to the prior month.`,
      });
    } else if (momChange < -10) {
      insights.push({
        type: 'positive',
        title: `Spending Cut (${momChange}%)`,
        description: `Great discipline! Your spending in ${currentMonth.label} is down by ${Math.abs(momChange)}% compared to the prior month.`,
      });
    }
  }

  // Insight 5: Average Daily Spending Run-Rate
  if (summary && summary.avgDailySpending > 0) {
    insights.push({
      type: 'info',
      title: 'Daily Run-Rate',
      description: `Your average daily expenditure is ${formatINR(summary.avgDailySpending)}/day across ${summary.daysInPeriod} active days in this selection.`,
    });
  }

  return insights;
}

