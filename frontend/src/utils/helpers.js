import { format } from 'date-fns';

export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(val || 0);

export const formatNumber = (val) => new Intl.NumberFormat().format(val || 0);

export const formatDate = (date) => date ? format(new Date(date), 'MMM dd, yyyy') : '-';

export const formatDateTime = (date) => date ? format(new Date(date), 'MMM dd, yyyy HH:mm') : '-';

export const getStockStatusBadge = (status) => {
  const map = {
    out_of_stock: { label: 'Out of Stock', class: 'badge-danger' },
    low_stock: { label: 'Low Stock', class: 'badge-warning' },
    overstock: { label: 'Overstock', class: 'badge-info' },
    normal: { label: 'Normal', class: 'badge-success' },
  };
  return map[status] || map.normal;
};

export const getMovementTypeBadge = (type) => {
  const map = {
    stock_in: { label: 'Stock In', class: 'badge-success' },
    stock_out: { label: 'Stock Out', class: 'badge-danger' },
    adjustment: { label: 'Adjustment', class: 'badge-info' },
    transfer: { label: 'Transfer', class: 'badge-warning' },
  };
  return map[type] || { label: type, class: 'badge-gray' };
};

export const exportToCSV = (data, filename) => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => `"${v ?? ''}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'text-secondary';
  if (rating >= 3.5) return 'text-accent';
  return 'text-danger';
};
