import { useState, useEffect } from 'react';
import { Menu, Bell, Search, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { inventoryAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    inventoryAPI.getAlerts().then(res => setAlerts(res.data.data || [])).catch(() => {});
  }, []);

  const unresolvedCount = alerts.filter(a => !a.is_read).length;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
        <Menu size={22} />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Quick search products..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Alerts */}
        <div className="relative">
          <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            {unresolvedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unresolvedCount > 9 ? '9+' : unresolvedCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-slide-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm">Alerts</span>
                <button onClick={() => setShowAlerts(false)}><X size={16} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">No alerts</div>
                ) : alerts.slice(0, 8).map(alert => (
                  <div key={alert.id} className={`px-4 py-3 border-b border-gray-50 ${!alert.is_read ? 'bg-amber-50' : ''}`}>
                    <div className={`text-xs font-semibold mb-1 ${alert.severity === 'critical' ? 'text-danger' : 'text-accent-dark'}`}>
                      {alert.type === 'out_of_stock' ? '🔴' : '🟡'} {alert.severity?.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-700">{alert.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-800">{user?.name}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
