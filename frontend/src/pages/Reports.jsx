import { useState } from 'react';
import { Download, FileText, BarChart2, Truck } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import { formatCurrency, formatDate, exportToCSV, getRatingColor } from '../utils/helpers';
import { LoadingPage, RatingStars } from '../components/UI';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [tab, setTab] = useState('inventory');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFilters, setDateFilters] = useState({ date_from: '', date_to: '', type: '' });

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'inventory') res = await reportsAPI.inventory();
      else if (tab === 'movements') res = await reportsAPI.movements(dateFilters);
      else res = await reportsAPI.supplierPerformance();
      setData(res.data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!data?.length) { toast.error('Generate report first'); return; }
    exportToCSV(data, `${tab}-report-${new Date().toISOString().split('T')[0]}`);
    toast.success('CSV exported!');
  };

  const tabs = [
    { key: 'inventory', label: 'Inventory Report', icon: FileText },
    { key: 'movements', label: 'Stock Movements', icon: BarChart2 },
    { key: 'supplier', label: 'Supplier Performance', icon: Truck },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">Generate and export warehouse reports</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setData(null); }}
            className={`card flex items-center gap-3 transition-all cursor-pointer text-left ${tab === key ? 'ring-2 ring-primary border-primary/20' : 'hover:shadow-md'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tab === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Icon size={20} />
            </div>
            <span className={`font-medium text-sm ${tab === key ? 'text-primary' : 'text-gray-700'}`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-wrap gap-3 items-end">
        {tab === 'movements' && (
          <>
            <div>
              <label className="label">Date From</label>
              <input type="date" value={dateFilters.date_from} onChange={e => setDateFilters({ ...dateFilters, date_from: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Date To</label>
              <input type="date" value={dateFilters.date_to} onChange={e => setDateFilters({ ...dateFilters, date_to: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Movement Type</label>
              <select value={dateFilters.type} onChange={e => setDateFilters({ ...dateFilters, type: e.target.value })} className="input-field">
                <option value="">All Types</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
              </select>
            </div>
          </>
        )}
        <div className="flex gap-2 ml-auto">
          <button onClick={loadReport} className="btn-primary">Generate Report</button>
          <button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export CSV</button>
        </div>
      </div>

      {/* Results */}
      {loading ? <LoadingPage /> : data && (
        <div className="card !p-0 overflow-hidden">
          {tab === 'inventory' && (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Inventory Report — {data.length} products</span>
                <span className="text-sm text-gray-500">Total Value: <strong>{formatCurrency(data.reduce((sum, r) => sum + parseFloat(r.total_value || 0), 0))}</strong></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['SKU','Product','Category','Supplier','Location','Qty','Unit','Unit Price','Total Value','Status'].map(h => <th key={h} className="table-th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i} className="table-tr">
                        <td className="table-td font-mono text-xs">{r.sku}</td>
                        <td className="table-td font-medium">{r.name}</td>
                        <td className="table-td text-xs">{r.category}</td>
                        <td className="table-td text-xs">{r.supplier || '—'}</td>
                        <td className="table-td font-mono text-xs text-primary">{r.location_label || '—'}</td>
                        <td className="table-td font-bold">{r.quantity}</td>
                        <td className="table-td text-xs">{r.unit}</td>
                        <td className="table-td">{formatCurrency(r.unit_price)}</td>
                        <td className="table-td font-medium">{formatCurrency(r.total_value)}</td>
                        <td className="table-td"><span className={r.status === 'Normal' ? 'badge-success' : r.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'movements' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Date','Type','SKU','Product','Qty','Before','After','Reference','Reason','By'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i} className="table-tr">
                      <td className="table-td text-xs">{formatDate(r.movement_date)}</td>
                      <td className="table-td"><span className={r.movement_type === 'stock_in' ? 'badge-success' : 'badge-danger'}>{r.movement_type}</span></td>
                      <td className="table-td font-mono text-xs">{r.sku}</td>
                      <td className="table-td">{r.product_name}</td>
                      <td className="table-td font-bold">{r.quantity}</td>
                      <td className="table-td text-gray-500">{r.quantity_before}</td>
                      <td className="table-td font-medium">{r.quantity_after}</td>
                      <td className="table-td text-xs">{r.reference_no || '—'}</td>
                      <td className="table-td text-xs">{r.reason || '—'}</td>
                      <td className="table-td text-xs">{r.performed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'supplier' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Supplier','Country','Contact','Lead Time','Delivery','Accuracy','Price','Overall Rating','Orders','Products'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i} className="table-tr">
                      <td className="table-td font-semibold">{r.name}</td>
                      <td className="table-td text-xs">{r.country}</td>
                      <td className="table-td text-xs">{r.contact_person || '—'}</td>
                      <td className="table-td">{r.lead_time_days}d</td>
                      <td className="table-td"><RatingStars rating={r.delivery_score} /></td>
                      <td className="table-td"><RatingStars rating={r.accuracy_score} /></td>
                      <td className="table-td"><RatingStars rating={r.price_score} /></td>
                      <td className="table-td"><span className={`font-bold text-lg ${getRatingColor(r.overall_rating)}`}>{r.overall_rating}</span></td>
                      <td className="table-td">{r.total_orders}</td>
                      <td className="table-td">{r.products_supplied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
