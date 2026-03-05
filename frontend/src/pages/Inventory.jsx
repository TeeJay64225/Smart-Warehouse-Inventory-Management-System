import { useState, useEffect, useCallback } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search, History, AlertCircle } from 'lucide-react';
import { inventoryAPI, productsAPI } from '../utils/api';
import { formatCurrency, formatDateTime, getStockStatusBadge, getMovementTypeBadge, exportToCSV } from '../utils/helpers';
import { Modal, Pagination, LoadingPage, EmptyState, FormField } from '../components/UI';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [tab, setTab] = useState('inventory'); // inventory | movements | alerts
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [movPagination, setMovPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [movFilters, setMovFilters] = useState({ page: 1, type: '' });
  const [modal, setModal] = useState({ open: false, type: '' }); // type: stock_in | stock_out
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ product_id: '', quantity: '', reference_no: '', notes: '', supplier_id: '', reason: '', destination: '', unit_cost: '' });
  const [saving, setSaving] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll({ ...filters, limit: 15 });
      setInventory(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  const loadMovements = useCallback(async () => {
    const res = await inventoryAPI.getMovements({ ...movFilters, limit: 15 });
    setMovements(res.data.data);
    setMovPagination(res.data.pagination);
  }, [movFilters]);

  const loadAlerts = async () => {
    const res = await inventoryAPI.getAlerts();
    setAlerts(res.data.data);
  };

  useEffect(() => { loadInventory(); }, [loadInventory]);
  useEffect(() => { if (tab === 'movements') loadMovements(); }, [tab, loadMovements]);
  useEffect(() => { if (tab === 'alerts') loadAlerts(); }, [tab]);

  const openModal = async (type) => {
    const [pRes, sRes] = await Promise.all([productsAPI.getAll({ limit: 200 }), import('../utils/api').then(m => m.suppliersAPI.getAll())]);
    setProducts(pRes.data.data);
    setSuppliers(sRes.data.data);
    setForm({ product_id: '', quantity: '', reference_no: '', notes: '', supplier_id: '', reason: '', destination: '', unit_cost: '' });
    setModal({ open: true, type });
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'stock_in') {
        await inventoryAPI.stockIn(form);
        toast.success('Stock in recorded successfully!');
      } else {
        await inventoryAPI.stockOut(form);
        toast.success('Stock out recorded successfully!');
      }
      setModal({ open: false });
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const resolveAlert = async (id) => {
    await inventoryAPI.resolveAlert(id);
    toast.success('Alert resolved');
    loadAlerts();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">Track stock levels and movements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal('stock_out')} className="btn-secondary">
            <ArrowUpCircle size={16} className="text-danger" /> Stock Out
          </button>
          <button onClick={() => openModal('stock_in')} className="btn-primary">
            <ArrowDownCircle size={16} /> Stock In
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['inventory','Stock Levels'],['movements','Movement History'],['alerts','Alerts']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}{key === 'alerts' && alerts.length > 0 && <span className="ml-1.5 bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">{alerts.length}</span>}
          </button>
        ))}
      </div>

      {/* Inventory tab */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="card !p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search products..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} className="input-field pl-9" />
            </div>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })} className="input-field w-auto">
              <option value="">All Status</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <button onClick={() => exportToCSV(inventory, 'inventory')} className="btn-secondary">Export CSV</button>
          </div>

          {loading ? <LoadingPage /> : (
            <div className="card !p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-th">Product</th>
                    <th className="table-th">Location</th>
                    <th className="table-th">On Hand</th>
                    <th className="table-th">Available</th>
                    <th className="table-th">Reorder At</th>
                    <th className="table-th">Unit Value</th>
                    <th className="table-th">Total Value</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Last Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const badge = getStockStatusBadge(item.stock_status);
                    return (
                      <tr key={item.id} className="table-tr">
                        <td className="table-td">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.sku} · {item.category_name}</div>
                        </td>
                        <td className="table-td"><span className="font-mono text-xs text-primary">{item.location_label || '—'}</span></td>
                        <td className="table-td"><span className={`font-bold text-base ${item.stock_status === 'out_of_stock' ? 'text-danger' : item.stock_status === 'low_stock' ? 'text-accent-dark' : 'text-gray-700'}`}>{item.quantity_on_hand}</span></td>
                        <td className="table-td text-gray-600">{item.quantity_available}</td>
                        <td className="table-td text-gray-500">{item.reorder_level}</td>
                        <td className="table-td">{formatCurrency(item.unit_price)}</td>
                        <td className="table-td font-medium">{formatCurrency(item.total_value)}</td>
                        <td className="table-td"><span className={badge.class}>{badge.label}</span></td>
                        <td className="table-td text-xs text-gray-400">{formatDateTime(item.last_movement_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination pagination={pagination} onPage={p => setFilters(f => ({ ...f, page: p }))} />
            </div>
          )}
        </div>
      )}

      {/* Movements tab */}
      {tab === 'movements' && (
        <div className="space-y-4">
          <div className="card !p-4 flex gap-3">
            <select value={movFilters.type} onChange={e => setMovFilters({ ...movFilters, type: e.target.value, page: 1 })} className="input-field w-auto">
              <option value="">All Types</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <button onClick={() => exportToCSV(movements, 'stock-movements')} className="btn-secondary ml-auto">Export CSV</button>
          </div>
          <div className="card !p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Product</th>
                  <th className="table-th">Qty</th>
                  <th className="table-th">Before</th>
                  <th className="table-th">After</th>
                  <th className="table-th">Reference</th>
                  <th className="table-th">Reason/Supplier</th>
                  <th className="table-th">By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => {
                  const badge = getMovementTypeBadge(m.movement_type);
                  return (
                    <tr key={m.id} className="table-tr">
                      <td className="table-td text-xs">{formatDateTime(m.movement_date)}</td>
                      <td className="table-td"><span className={badge.class}>{badge.label}</span></td>
                      <td className="table-td">
                        <div className="font-medium">{m.product_name}</div>
                        <div className="text-xs text-gray-400">{m.sku}</div>
                      </td>
                      <td className="table-td"><span className={`font-bold ${m.movement_type === 'stock_in' ? 'text-secondary' : 'text-danger'}`}>{m.movement_type === 'stock_in' ? '+' : '-'}{m.quantity}</span></td>
                      <td className="table-td text-gray-500">{m.quantity_before}</td>
                      <td className="table-td font-medium">{m.quantity_after}</td>
                      <td className="table-td text-xs font-mono">{m.reference_no || '—'}</td>
                      <td className="table-td text-xs">{m.supplier_name || m.reason || m.destination || '—'}</td>
                      <td className="table-td text-xs text-gray-400">{m.performed_by_name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination pagination={movPagination} onPage={p => setMovFilters(f => ({ ...f, page: p }))} />
          </div>
        </div>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="card"><EmptyState icon={AlertCircle} title="No active alerts" description="All stock levels are within acceptable range" /></div>
          ) : alerts.map(alert => (
            <div key={alert.id} className={`card flex items-center justify-between gap-4 border-l-4 ${alert.severity === 'critical' ? 'border-danger' : 'border-accent'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className={alert.severity === 'critical' ? 'text-danger' : 'text-accent-dark'} />
                <div>
                  <div className="font-medium text-gray-900 text-sm">{alert.message}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{alert.product_name} · {alert.sku} · {alert.category_name}</div>
                  <div className="text-xs text-gray-400">Qty: <strong>{alert.quantity}</strong> · Min: <strong>{alert.reorder_level}</strong></div>
                </div>
              </div>
              <button onClick={() => resolveAlert(alert.id)} className="btn-secondary text-xs whitespace-nowrap">Mark Resolved</button>
            </div>
          ))}
        </div>
      )}

      {/* Stock In/Out Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.type === 'stock_in' ? '📥 Record Stock In' : '📤 Record Stock Out'}>
        <form onSubmit={handleStockMovement} className="space-y-4">
          <FormField label="Product" required>
            <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="input-field" required>
              <option value="">Select product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.quantity_on_hand}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity" required>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input-field" min="1" required />
            </FormField>
            {modal.type === 'stock_in' ? (
              <FormField label="Unit Cost (GHS)">
                <input type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} className="input-field" min="0" step="0.01" />
              </FormField>
            ) : (
              <FormField label="Destination">
                <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="input-field" placeholder="e.g. Customer A" />
              </FormField>
            )}
          </div>
          {modal.type === 'stock_in' ? (
            <FormField label="Supplier">
              <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} className="input-field">
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
          ) : (
            <FormField label="Reason">
              <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="input-field" placeholder="e.g. Sale, Damaged, Transfer" />
            </FormField>
          )}
          <FormField label="Reference No.">
            <input value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} className="input-field" placeholder="PO or SO number" />
          </FormField>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className={`flex-1 justify-center ${modal.type === 'stock_in' ? 'btn-primary' : 'btn-danger'}`}>
              {saving ? 'Processing...' : modal.type === 'stock_in' ? 'Confirm Stock In' : 'Confirm Stock Out'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
