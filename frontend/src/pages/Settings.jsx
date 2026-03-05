import { useState, useEffect } from 'react';
import { Settings, User, Shield, Plus, Key } from 'lucide-react';
import { usersAPI, authAPI } from '../utils/api';
import { Modal, FormField, LoadingPage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersAPI.getAll().then(res => setUsers(res.data.data)).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await usersAPI.create(form);
      toast.success('User created!');
      setModal(false);
      const res = await usersAPI.getAll();
      setUsers(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingPage />;

  const roleColors = { admin: 'badge-danger', manager: 'badge-info', staff: 'badge-gray' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">{users.length} system users</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} /> Add User</button>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-th">User</th>
              <th className="table-th">Email</th>
              <th className="table-th">Role</th>
              <th className="table-th">Status</th>
              <th className="table-th">Last Login</th>
              <th className="table-th">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="table-tr">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">{u.name?.[0]?.toUpperCase()}</div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="table-td text-gray-500">{u.email}</td>
                <td className="table-td"><span className={roleColors[u.role_name] || 'badge-gray'}>{u.role_name}</span></td>
                <td className="table-td"><span className={u.is_active ? 'badge-success' : 'badge-danger'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="table-td text-xs text-gray-400">{formatDateTime(u.last_login) || 'Never'}</td>
                <td className="table-td text-xs text-gray-400">{formatDateTime(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add New User">
        <form onSubmit={handleAdd} className="space-y-4">
          <FormField label="Full Name" required>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </FormField>
          <FormField label="Password" required>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" minLength={8} required />
          </FormField>
          <FormField label="Role">
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account preferences</p>
      </div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <Settings size={20} className="text-gray-400" />
          <h3 className="font-semibold text-gray-800">Profile Information</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">{user?.name}</div>
            <div className="text-gray-500 text-sm">{user?.email}</div>
            <span className="badge-info capitalize mt-1 inline-block">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="flex items-center gap-4 mb-5">
          <Key size={20} className="text-gray-400" />
          <h3 className="font-semibold text-gray-800">Change Password</h3>
        </div>
        <form onSubmit={handlePwChange} className="space-y-4">
          <FormField label="Current Password">
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="input-field" required />
          </FormField>
          <FormField label="New Password">
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="input-field" minLength={8} required />
          </FormField>
          <FormField label="Confirm New Password">
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-field" required />
          </FormField>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>

      {/* System info */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">System Information</h3>
        <div className="space-y-2 text-sm">
          {[['System', 'Smart Warehouse IMS v1.0'], ['Frontend', 'React 18 + Tailwind CSS'], ['Backend', 'Node.js + Express'], ['Database', 'PostgreSQL (Supabase)']].map(([k,v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-700">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
