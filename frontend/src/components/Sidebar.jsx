import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Warehouse, TruckIcon, Users, BarChart3, 
  Settings, Bell, ChevronRight, LogOut, ShieldCheck, PackageSearch
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/inventory', icon: PackageSearch, label: 'Inventory' },
  { path: '/suppliers', icon: TruckIcon, label: 'Suppliers' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const adminItems = [
  { path: '/users', icon: Users, label: 'User Management' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      
      <aside className={`fixed left-0 top-0 h-full w-64 bg-sidebar z-30 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Warehouse size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Smart WMS</div>
            <div className="text-gray-400 text-xs mt-0.5">Warehouse System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Main Menu</div>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mt-4 mb-2">Administration</div>
              {adminItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.name}</div>
              <div className="text-gray-400 text-xs capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={logout} className="sidebar-link w-full">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
