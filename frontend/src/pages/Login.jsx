import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Warehouse, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@warehouse.com', password: 'Admin@1234' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { label: 'Admin', email: 'admin@warehouse.com', password: 'Admin@1234', color: 'bg-primary' },
    { label: 'Manager', email: 'manager@warehouse.com', password: 'Manager@1234', color: 'bg-secondary' },
    { label: 'Staff', email: 'staff@warehouse.com', password: 'Staff@1234', color: 'bg-accent' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/30">
            <Warehouse size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Smart WMS</h1>
          <p className="text-blue-300 text-sm">Warehouse Inventory Management System</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-danger/20 border border-danger/30 rounded-lg px-4 py-3 mb-4">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span className="text-danger text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-blue-300 text-xs text-center mb-3 font-medium">DEMO ACCOUNTS</p>
            <div className="grid grid-cols-3 gap-2">
              {demoLogins.map(({ label, email, password, color }) => (
                <button
                  key={label}
                  onClick={() => setForm({ email, password })}
                  className={`${color} text-white text-xs py-2 px-3 rounded-lg font-medium hover:opacity-90 transition-opacity`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">Smart Warehouse IMS © 2024</p>
      </div>
    </div>
  );
}
