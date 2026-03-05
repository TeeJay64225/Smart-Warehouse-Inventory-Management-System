import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Package, ChevronDown } from 'lucide-react';
import { productsAPI, categoriesAPI, suppliersAPI } from '../utils/api';
import { formatCurrency, formatDate, getStockStatusBadge, exportToCSV } from '../utils/helpers';
import { Modal, Pagination, LoadingPage, EmptyState, FormField } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const emptyForm = { sku: '', name: '', description: '', category_id: '', supplier_id: '', unit_price: '', quantity: '', reorder_level: '10', unit: 'pcs', location_label: '' };

export default function ProductsPage() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', page: 1 });
  const [modal, setModal] = useState({ open: false, mode: 'add', product: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        productsAPI.getAll({ ...filters, limit: 15 }),
        categoriesAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      setProducts(prodRes.data.data);
      setPagination(prodRes.data.pagination);
      setCategories(catRes.data.data);
      setSuppliers(supRes.data.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm); setModal({ open: true, mode: 'add' }); };
  const openEdit = (p) => { setForm({ ...p, unit_price: p.unit_price, quantity: p.quantity_on_hand }); setModal({ open: true, mode: 'edit', product: p }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await productsAPI.create(form);
        toast.success('Product created!');
      } else {
        await productsAPI.update(modal.product.id, form);
        toast.success('Product updated!');
      }
      setModal({ open: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading && !products.length) return <LoadingPage />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{pagination.total || 0} products in warehouse</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(products, 'products')} className="btn-secondary">Export CSV</button>
          {isManager && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Product</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search SKU, name, location..." value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="input-field pl-9" />
        </div>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value, page: 1 })} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">SKU</th>
                <th className="table-th">Category</th>
                <th className="table-th">Location</th>
                <th className="table-th">Qty</th>
                <th className="table-th">Unit Price</th>
                <th className="table-th">Total Value</th>
                <th className="table-th">Status</th>
                {isManager && <th className="table-th">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="9" className="py-16">
                  <EmptyState icon={Package} title="No products found" description="Add your first product to get started" />
                </td></tr>
              ) : products.map(p => {
                const badge = getStockStatusBadge(p.stock_status);
                return (
                  <tr key={p.id} className="table-tr">
                    <td className="table-td">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.unit} · Added {formatDate(p.created_at)}</div>
                    </td>
                    <td className="table-td"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{p.sku}</span></td>
                    <td className="table-td">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.category_color || '#ccc' }} />
                        <span className="text-xs">{p.category_name || '—'}</span>
                      </span>
                    </td>
                    <td className="table-td"><span className="font-mono text-xs text-primary">{p.location_label || '—'}</span></td>
                    <td className="table-td">
                      <span className={`font-bold ${p.stock_status === 'out_of_stock' ? 'text-danger' : p.stock_status === 'low_stock' ? 'text-accent-dark' : 'text-gray-700'}`}>
                        {p.quantity_on_hand}
                      </span>
                      <span className="text-xs text-gray-400"> /{p.reorder_level}</span>
                    </td>
                    <td className="table-td">{formatCurrency(p.unit_price)}</td>
                    <td className="table-td font-medium">{formatCurrency(p.total_value)}</td>
                    <td className="table-td"><span className={badge.class}>{badge.label}</span></td>
                    {isManager && (
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPage={p => setFilters(f => ({ ...f, page: p }))} />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Add New Product' : 'Edit Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" required>
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input-field" placeholder="SKU-001" required disabled={modal.mode === 'edit'} />
            </FormField>
            <FormField label="Product Name" required>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Product name" required />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input-field">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Supplier">
              <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} className="input-field">
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Unit Price (GHS)">
              <input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} className="input-field" min="0" step="0.01" />
            </FormField>
            {modal.mode === 'add' && (
              <FormField label="Initial Qty">
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input-field" min="0" />
              </FormField>
            )}
            <FormField label="Reorder Level">
              <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} className="input-field" min="0" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unit">
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input-field">
                {['pcs', 'kg', 'g', 'L', 'mL', 'rolls', 'boxes', 'sheets', 'm', 'pairs'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </FormField>
            <FormField label="Warehouse Location">
              <input value={form.location_label} onChange={e => setForm({ ...form, location_label: e.target.value })} className="input-field" placeholder="e.g. A-A1-S1-B01" />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : modal.mode === 'add' ? 'Add Product' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
