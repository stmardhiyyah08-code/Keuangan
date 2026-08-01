import { Transaction, Category, Account, User } from '../types';
import { formatCurrency, formatDateIndonesian } from './formatters';

export function exportToCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  filename: string = 'Laporan_Keuangan_Dompetku.csv'
) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));

  // CSV Headers
  const headers = [
    'Tanggal',
    'Tipe',
    'Kategori',
    'Rekening',
    'Rekening Tujuan',
    'Jumlah (Rp)',
    'Keterangan',
    'Tag'
  ];

  const rows = transactions.map(t => {
    const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    const catName = categoryMap.get(t.categoryId) || 'Lain-lain';
    const accName = accountMap.get(t.accountId) || 'Rekening';
    const targetAccName = t.targetAccountId ? (accountMap.get(t.targetAccountId) || '-') : '-';
    const descriptionClean = `"${(t.description || '').replace(/"/g, '""')}"`;
    const tagsClean = `"${(t.tags || []).join(', ')}"`;

    return [
      t.date,
      typeLabel,
      `"${catName}"`,
      `"${accName}"`,
      `"${targetAccName}"`,
      t.amount,
      descriptionClean,
      tagsClean
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDFReport(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  user: User,
  dateRangeTitle: string = 'Bulan Ini'
) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const netBalance = totalIncome - totalExpense;

  const rowsHtml = transactions.slice(0, 100).map(t => {
    const isIncome = t.type === 'income';
    const isExpense = t.type === 'expense';
    const badgeColor = isIncome ? 'background:#dcfce7;color:#15803d;' : isExpense ? 'background:#fee2e2;color:#b91c1c;' : 'background:#e0e7ff;color:#4338ca;';
    const typeLabel = isIncome ? 'Pemasukan' : isExpense ? 'Pengeluaran' : 'Transfer';
    const catName = categoryMap.get(t.categoryId) || '-';
    const accName = accountMap.get(t.accountId) || '-';
    const formattedAmt = (isIncome ? '+' : isExpense ? '-' : '') + formatCurrency(t.amount);

    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${formatDateIndonesian(t.date)}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;">
          <span style="padding:4px 8px;border-radius:12px;font-weight:600;${badgeColor}">${typeLabel}</span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:500;">${catName}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">${accName}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${t.description || '-'}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;text-align:right;color:${isIncome ? '#16a34a' : isExpense ? '#dc2626' : '#2563eb'}">${formattedAmt}</td>
      </tr>
    `;
  }).join('');

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Keuangan - Dompetku</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: 800; color: #1e40af; margin: 0; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .card { padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .card-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 6px; }
        .card-value { font-size: 20px; font-weight: 700; }
        .inc { color: #16a34a; }
        .exp { color: #dc2626; }
        .net { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; padding: 10px; background: #f1f5f9; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
        .footer { margin-top: 32px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      <div class="header">
        <div>
          <h1 class="title">Dompetku Financial Report</h1>
          <div class="subtitle">Pengguna: <strong>${user.name}</strong> (${user.email}) | Periode: <strong>${dateRangeTitle}</strong></div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #64748b;">Tanggal Cetak</div>
          <div style="font-size: 13px; font-weight: 600;">${formatDateIndonesian(new Date().toISOString().split('T')[0])}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="card">
          <div class="card-title">Total Pemasukan</div>
          <div class="card-value inc">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="card">
          <div class="card-title">Total Pengeluaran</div>
          <div class="card-value exp">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="card">
          <div class="card-title">Arus Kas Bersih (Net)</div>
          <div class="card-value net">${formatCurrency(netBalance)}</div>
        </div>
      </div>

      <h3 style="font-size: 16px; color: #334155; margin-bottom: 8px;">Detail Transaksi (${transactions.length} Item)</h3>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori</th>
            <th>Rekening</th>
            <th>Keterangan</th>
            <th style="text-align:right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        Dicetak secara otomatis dari Aplikasi Keuangan Dompetku. Hak Cipta &copy; ${new Date().getFullYear()} Dompetku.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            // Auto trigger print window on load if desired
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  } else {
    alert('Silakan izinkan popup browser untuk membuka laporan PDF.');
  }
}
