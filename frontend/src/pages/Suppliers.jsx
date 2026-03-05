import { useState, useEffect } from 'react';
import { Plus, Edit2, Star, Truck, Mail, Phone, Globe } from 'lucide-react';
import { suppliersAPI } from '../utils/api';
import { Modal, FormField, RatingStars, EmptyState, LoadingPage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const emptyForm = { name: '', contact_person: '', email: '', phone: '', address: '', country: 'Ghana', lead_time_days: '7', delivery_score: '5', accuracy_score: '5', price_score: '5', notes: '' };

export default function SuppliersPage() {
  const { isManager } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', supplier: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await suppliersAPI.getAll();
      setSuppliers(res.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setModal({ open: true, mode: 'add' }); };
  const openEdit = (s) => { setForm({ ...s, lead_time_days: String(s.lead_time_days), delivery_score: String(s.delivery_score), accuracy_score: String(s.accuracy_score), price_score: String(s.price_score) }); setModal({ open: true, mode: 'edit', supplier: s }); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'add') { await suppliersAPI.create(form); toast.success('Supplier added!'); }
      else { await suppliersAPI.update(modal.supplier.id, form); toast.success('Supplier updated!'); }
      setModal({ open: false }); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 text-sm">{suppliers.length} registered suppliers</p>
        </div>
        {isManager && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Supplier</button>}
      </div>

      {suppliers.length === 0 ? (
        <div className="card"><EmptyState icon={Truck} title="No suppliers yet" description="Add your first supplier" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Truck size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.country}</div>
                  </div>
                </div>
                {isManager && <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 size={14} /></button>}
              </div>

              <div className="space-y-1.5 mb-4">
                {s.contact_person && <div className="flex items-center gap-2 text-xs text-gray-500"><span className="font-medium">{s.contact_person}</span></div>}
                {s.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} className="text-gray-300" />{s.email}</div>}
                {s.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} className="text-gray-300" />{s.phone}</div>}
              </div>

              <div className="border-t border-gray-50 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Overall Rating</span>
                  <RatingStars rating={s.overall_rating} />
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[['Delivery', s.delivery_score], ['Accuracy', s.accuracy_score], ['Price', s.price_score]].map(([label, score]) => (
                    <div key={label} className="bg-gray-50 rounded-lg py-1.5">
                      <div className="text-xs font-bold text-gray-700">{Number(score).toFixed(1)}</div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Lead time: <strong className="text-gray-600">{s.lead_time_days} days</strong></span>
                  <span>{s.total_orders} orders</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Company Name" required><input {...f('name')} className="input-field" required /></FormField>
            <FormField label="Contact Person"><input {...f('contact_person')} className="input-field" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email"><input type="email" {...f('email')} className="input-field" /></FormField>
            <FormField label="Phone"><input {...f('phone')} className="input-field" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Country"><input {...f('country')} className="input-field" /></FormField>
            <FormField label="Lead Time (days)"><input type="number" {...f('lead_time_days')} className="input-field" min="1" /></FormField>
          </div>
          <FormField label="Address"><textarea {...f('address')} className="input-field" rows={2} /></FormField>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Performance Scores (1–5)</p>
            <div className="grid grid-cols-3 gap-3">
              {[['delivery_score','Delivery'], ['accuracy_score','Accuracy'], ['price_score','Price']].map(([key, label]) => (
                <FormField key={key} label={label}>
                  <input type="number" {...f(key)} className="input-field" min="1" max="5" step="0.1" />
                </FormField>
              ))}
            </div>
          </div>
          
          <FormField label="Notes"><textarea {...f('notes')} className="input-field" rows={2} /></FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Save Supplier'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
