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
  lines.push(`"Total Incoming Capital","${summary.totalIncome || 0}"`);
  lines.push(`"Total Expenses","${summary.totalExpenses || 0}"`);
  lines.push(`"Net Capital Surplus","${summary.netSavings || 0}"`);
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

  // 4. Detailed Transactions
  lines.push(`"TRANSACTION HISTORY"`);
  lines.push(`"Date","Category","Account","Amount (INR)"`);
  transactions.forEach((tx) => {
    const d = tx.expense_date || (tx.created_at ? tx.created_at.slice(0, 10) : '');
    const acc = tx.account_name || tx.accounts?.account_name || 'Account';
    lines.push(`"${d}","${tx.category}","${acc}","${tx.amount}"`);
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
    alert('Please allow popups to generate and download the PDF report.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - FridayTrack</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 30px;
      font-size: 13px;
      line-height: 1.5;
    }
    @media print {
      body { padding: 15px; }
      .no-print { display: none !important; }
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #10b981;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-title span { color: #10b981; }
    .subtitle { color: #64748b; font-size: 11px; margin-top: 2px; }
    .meta-box { text-align: right; font-size: 11px; color: #64748b; }
    .meta-box strong { color: #0f172a; font-size: 12px; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #10b981;
      border-radius: 2px;
      margin-right: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    
    .actions-bar {
      margin-bottom: 20px;
      padding: 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    }
    .btn:hover { background: #059669; }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 30px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <div class="actions-bar no-print">
    <div><strong>FridayTrack Report Viewer</strong> — Save as PDF using your browser's Print dialog.</div>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand-title">Friday<span>Track</span></div>
      <div class="subtitle">Personal Expense & Bank Account Financial Report</div>
    </div>
    <div class="meta-box">
      <div><strong>${title}</strong></div>
      <div>Period: ${dateRangeLabel}</div>
      <div>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Incoming</div>
      <div class="kpi-value">${formatINR(summary.totalIncome || 0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Expenses</div>
      <div class="kpi-value" style="color: #e11d48;">${formatINR(summary.totalExpenses || 0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Surplus</div>
      <div class="kpi-value" style="color: #059669;">${formatINR(summary.netSavings || 0)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Savings Rate</div>
      <div class="kpi-value" style="color: #10b981;">${summary.savingsRate || 0}%</div>
    </div>
  </div>

  <div class="section-title">Expense Breakdown by Category</div>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="text-right">Transaction Count</th>
        <th class="text-right">Share of Total</th>
        <th class="text-right">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${categoryBreakdown.map((cat) => `
        <tr>
          <td><strong>${cat.category}</strong></td>
          <td class="text-right">${cat.count}</td>
          <td class="text-right">${cat.percentage}%</td>
          <td class="text-right font-bold">${formatINR(cat.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">Account Activity</div>
  <table>
    <thead>
      <tr>
        <th>Account Name</th>
        <th>Type</th>
        <th class="text-right">Current Balance</th>
        <th class="text-right">Period Expenses</th>
        <th class="text-right">Share</th>
      </tr>
    </thead>
    <tbody>
      ${accountAnalytics.map((acc) => `
        <tr>
          <td><strong>${acc.name}</strong></td>
          <td>${acc.type}</td>
          <td class="text-right font-bold">${formatINR(acc.currentBalance)}</td>
          <td class="text-right" style="color: #e11d48;">${formatINR(acc.outgoing)}</td>
          <td class="text-right">${acc.spendingShare}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">Transaction History (${transactions.length} records)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Account</th>
        <th class="text-right">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map((tx) => `
        <tr>
          <td>${tx.expense_date || (tx.created_at ? tx.created_at.slice(0, 10) : '')}</td>
          <td>${tx.category}</td>
          <td>${tx.account_name || tx.accounts?.account_name || 'Account'}</td>
          <td class="text-right font-bold">${formatINR(tx.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>FridayTrack — Confidential Personal Financial Statement</div>
    <div>Secured via Supabase Row Level Security (RLS)</div>
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog after render
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

