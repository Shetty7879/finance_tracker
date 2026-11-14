/**
 * reportExport.js
 * High-precision CSV and PDF export generator for FridayTrack financial reports.
 */

import { formatINR } from './analyticsUtils';

/**
 * Export report data to Excel-compatible CSV file
 */
export function exportToCSV({
  title = 'FridayTrack Financial Report',
  dateRangeLabel = '',
  summary = {},
  categoryBreakdown = [],
  accountAnalytics = [],
  transactions = [],
}) {
  const lines = [];

  // Metadata
  lines.push(`"FridayTrack - Personal Finance Report"`);
  lines.push(`"Report:","${title.replace(/"/g, '""')}"`);
  lines.push(`"Date Range:","${dateRangeLabel.replace(/"/g, '""')}"`);
  lines.push(`"Generated On:","${new Date().toLocaleString()}"`);
  lines.push('');

  // 1. Financial Summary
  lines.push(`"FINANCIAL SUMMARY"`);
  lines.push(`"Metric","Amount (INR)"`);
  lines.push(`"Total Income","${summary.totalIncome || 0}"`);
  lines.push(`"Total Expenses","${summary.totalExpenses || 0}"`);
  lines.push(`"Net Savings","${summary.netSavings || 0}"`);
  lines.push(`"Savings Rate (%)","${summary.savingsRate || 0}%"`);
  lines.push(`"Daily Run-Rate","${summary.avgDailySpending || 0}"`);
  lines.push('');

  // 2. Category Breakdown
  lines.push(`"EXPENSE BREAKDOWN BY CATEGORY"`);
  lines.push(`"Category","Amount (INR)","Percentage (%)","Transaction Count"`);
  categoryBreakdown.forEach((cat) => {
    lines.push(
      `"${cat.category}","${cat.amount}","${cat.percentage}%","${cat.count}"`
    );
  });
  lines.push('');

  // 3. Account-wise Breakdown
  lines.push(`"ACCOUNT ACTIVITY"`);
  lines.push(`"Account Name","Type","Current Balance","Total Outgoing","Spending Share (%)"`);
  accountAnalytics.forEach((acc) => {
    lines.push(
      `"${acc.name}","${acc.type}","${acc.currentBalance}","${acc.outgoing}","${acc.spendingShare}%"`
    );
  });
  lines.push('');

  // 4. Detailed Transactions (Including Type, Reason for Others, Description, Payment Method)
  lines.push(`"TRANSACTION HISTORY"`);
  lines.push(`"Date","Type","Category","Account","Amount (INR)","Payment Method","Description","Reason for Others"`);
  transactions.forEach((tx) => {
    const d = tx.expense_date || tx.date || (tx.created_at ? tx.created_at.slice(0, 10) : '');
    const isExp = (tx.type || tx.transaction_type) !== 'income';
    const txType = isExp ? 'Expense' : 'Income';
    const acc = tx.accountName || tx.account_name || tx.accounts?.account_name || 'Account';
    const pm = tx.paymentMethod || tx.payment_method || '';
    const desc = (tx.description || '').replace(/"/g, '""');
    const rsn = (tx.reason || '').replace(/"/g, '""');
    const signedAmount = isExp ? `-${tx.amount}` : `+${tx.amount}`;

    lines.push(`"${d}","${txType}","${tx.category}","${acc}","${signedAmount}","${pm}","${desc}","${rsn}"`);
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const fileName = `fridaytrack_report_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a printable and downloadable PDF report view
 */
export function exportToPDF({
  title = 'FridayTrack Financial Report',
  dateRangeLabel = '',
  summary = {},
  categoryBreakdown = [],
  accountAnalytics = [],
  transactions = [],
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and download the PDF report.');
    return;
  }

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - FridayTrack</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px;
      margin: 0;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-size: 22px; font-weight: 800; color: #0f172a; }
    .brand span { color: #10b981; }
    .report-title { font-size: 16px; font-weight: 700; color: #334155; margin-top: 4px; }
    .meta-info { font-size: 11px; color: #64748b; text-align: right; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .kpi-value { font-size: 16px; font-weight: 800; color: #0f172a; }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 12px;
      background: #10b981;
      border-radius: 2px;
      margin-right: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 10px;
      text-transform: uppercase;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .income-text { color: #059669; font-weight: 700; }
    .expense-text { color: #e11d48; font-weight: 700; }
    .reason-box { font-size: 10px; color: #b45309; background: #fef3c7; padding: 2px 6px; border-radius: 4px; display: inline-block; }
    
    .actions-bar {
      margin-bottom: 20px;
      padding: 10px 14px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 11px;
    }
    .btn:hover { background: #059669; }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }

    @media print {
      .actions-bar { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>

  <div class="actions-bar">
    <span style="font-size: 12px; font-weight: 600; color: #065f46;">
      📄 FridayTrack Formatted Report Ready
    </span>
    <div>
      <button class="btn" onclick="window.print()">Print or Save as PDF</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="brand">Friday<span>Track</span></div>
      <div class="report-title">${title}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
        Period: <strong>${dateRangeLabel || 'All Active Records'}</strong>
      </div>
    </div>
    <div class="meta-info">
      <div>Generated: ${generatedDate}</div>
      <div>Source: Supabase Live Database</div>
      <div>Status: Verified Statement</div>
    </div>
  </div>

  <!-- KPI SUMMARY -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Income</div>
      <div class="kpi-value" style="color: #059669;">${formatINR(summary.totalIncome)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Expenses</div>
      <div class="kpi-value" style="color: #e11d48;">${formatINR(summary.totalExpenses)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Savings</div>
      <div class="kpi-value" style="color: #10b981;">${formatINR(summary.netSavings)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Savings Rate</div>
      <div class="kpi-value">${summary.savingsRate || 0}%</div>
    </div>
  </div>

  <!-- CATEGORY BREAKDOWN -->
  ${categoryBreakdown && categoryBreakdown.length > 0 ? `
  <div class="section-title">Expense Breakdown by Category</div>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="text-right">Total Amount</th>
        <th class="text-right">Share (%)</th>
        <th class="text-right">Transactions</th>
      </tr>
    </thead>
    <tbody>
      ${categoryBreakdown.map((cat) => `
        <tr>
          <td class="font-bold">${cat.category}</td>
          <td class="text-right">${formatINR(cat.amount)}</td>
          <td class="text-right">${cat.percentage}%</td>
          <td class="text-right">${cat.count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- ACCOUNT ACTIVITY -->
  ${accountAnalytics && accountAnalytics.length > 0 ? `
  <div class="section-title">Account-Wise Activity</div>
  <table>
    <thead>
      <tr>
        <th>Account Name</th>
        <th>Type</th>
        <th class="text-right">Current Balance</th>
        <th class="text-right">Outgoing Spent</th>
        <th class="text-right">Spending Share</th>
      </tr>
    </thead>
    <tbody>
      ${accountAnalytics.map((acc) => `
        <tr>
          <td class="font-bold">${acc.name}</td>
          <td>${acc.type}</td>
          <td class="text-right">${formatINR(acc.currentBalance)}</td>
          <td class="text-right">${formatINR(acc.outgoing)}</td>
          <td class="text-right">${acc.spendingShare}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- ITEMISED TRANSACTIONS -->
  <div class="section-title">Itemized Transactions & Audit Ledger</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Category</th>
        <th>Account</th>
        <th>Description / Notes</th>
        <th>Reason for Others</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactions && transactions.length > 0 ? transactions.map((tx) => {
        const isExp = (tx.type || tx.transaction_type) !== 'income';
        const d = tx.expense_date || tx.date || (tx.created_at ? tx.created_at.slice(0, 10) : '');
        const acc = tx.accountName || tx.account_name || tx.accounts?.account_name || 'Account';
        return `
          <tr>
            <td>${d}</td>
            <td class="${isExp ? 'expense-text' : 'income-text'}">${isExp ? 'Expense' : 'Income'}</td>
            <td class="font-bold">${tx.category}</td>
            <td>${acc}</td>
            <td>${tx.description || tx.notes || '-'}</td>
            <td>${tx.reason ? `<span class="reason-box">${tx.reason}</span>` : '-'}</td>
            <td class="text-right ${isExp ? 'expense-text' : 'income-text'}">
              ${isExp ? `- ${formatINR(tx.amount)}` : `+ ${formatINR(tx.amount)}`}
            </td>
          </tr>
        `;
      }).join('') : `
        <tr>
          <td colspan="7" style="text-align: center; color: #94a3b8; padding: 16px;">
            No transactions found for this statement period.
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="footer">
    <div>FridayTrack Financial Management Platform</div>
    <div>Strictly Confidential • Generated via Secure Supabase RLS</div>
  </div>

</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
