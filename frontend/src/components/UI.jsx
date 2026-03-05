import { X, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${sizes[size]} animate-slide-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Loading spinner
export function Spinner({ size = 'md' }) {
  const s = { sm: 16, md: 24, lg: 40 };
  return <Loader2 className="animate-spin text-primary" size={s[size]} />;
}

// Loading page
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm mt-3">Loading...</p>
      </div>
    </div>
  );
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-gray-200 mb-4" />}
      <h3 className="font-semibold text-gray-600">{title}</h3>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Stat card
export function StatCard({ icon: Icon, label, value, sub, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent-dark',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// Pagination
export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = i + Math.max(1, page - 2);
          if (p > pages) return null;
          return (
            <button key={p} onClick={() => onPage(p)} className={`px-3 py-1 text-xs rounded border transition-colors ${p === page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-50'}`}>{p}</button>
          );
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className="px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
      </div>
    </div>
  );
}

// Alert banner
export function AlertBanner({ type = 'warning', message, onClose }) {
  const styles = {
    success: { bg: 'bg-secondary/10 border-secondary/30', text: 'text-secondary-dark', Icon: CheckCircle },
    warning: { bg: 'bg-accent/10 border-accent/30', text: 'text-accent-dark', Icon: AlertTriangle },
    error: { bg: 'bg-danger/10 border-danger/30', text: 'text-danger-dark', Icon: AlertTriangle },
    info: { bg: 'bg-primary/10 border-primary/30', text: 'text-primary', Icon: Info },
  };
  const { bg, text, Icon } = styles[type];
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${bg}`}>
      <Icon size={16} className={`${text} mt-0.5 flex-shrink-0`} />
      <span className={`text-sm ${text} flex-1`}>{message}</span>
      {onClose && <button onClick={onClose} className={`${text} hover:opacity-70`}><X size={14} /></button>}
    </div>
  );
}

// Rating stars
export function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(rating) ? 'text-accent' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

// Form field wrapper
export function FormField({ label, error, children, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-danger ml-1">*</span>}</label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
