import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign, Truck, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardAPI } from '../utils/api';
import { formatCurrency, formatNumber, formatDateTime, getMovementTypeBadge, getStockStatusBadge } from '../utils/helpers';
import { StatCard, LoadingPage } from '../components/UI';
import { format } from 'date-fns';

const CHART_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (!data) return <div className="text-center py-16 text-gray-400">Failed to load dashboard data.</div>;

  const { stats, lowStockProducts, recentMovements, categoryBreakdown, monthlyMovements } = data;

  const monthlyChartData = monthlyMovements?.map(m => ({
    month: format(new Date(m.month), 'MMM yy'),
    'Stock In': parseInt(m.stock_in) || 0,
    'Stock Out': parseInt(m.stock_out) || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time warehouse overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Products" value={formatNumber(stats.total_products)} color="primary" />
        <StatCard icon={DollarSign} label="Inventory Value" value={formatCurrency(stats.total_inventory_value)} color="secondary" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={formatNumber(stats.low_stock_count)} sub={`${stats.out_of_stock_count} out of stock`} color="accent" />
        <StatCard icon={Truck} label="Suppliers" value={formatNumber(stats.total_suppliers)} color="primary" />
      </div>

      {/* Alerts banner */}
      {parseInt(stats.unresolved_alerts) > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 flex items-center gap-3">
          <ShieldAlert size={20} className="text-danger flex-shrink-0" />
          <span className="text-danger text-sm font-medium">
            {stats.unresolved_alerts} unresolved stock alert{stats.unresolved_alerts > 1 ? 's' : ''} — visit Inventory page to resolve
          </span>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly movements bar chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Monthly Stock Movement</h3>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Stock In" fill="#10B981" radius={[4,4,0,0]} />
                <Bar dataKey="Stock Out" fill="#EF4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No movement data yet</div>
          )}
        </div>

        {/* Category breakdown pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">By Category</h3>
          {categoryBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="product_count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Products']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low stock table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Low Stock Alerts</h3>
            <span className="badge-warning">{lowStockProducts.length} items</span>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-300 text-sm">✓ All stock levels are healthy</div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.category_color || '#ccc' }} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.sku} · {p.category_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${p.quantity_on_hand === 0 ? 'text-danger' : 'text-accent-dark'}`}>{p.quantity_on_hand}</div>
                    <div className="text-xs text-gray-400">Min: {p.reorder_level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent movements */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Recent Stock Movements</h3>
          {recentMovements.length === 0 ? (
            <div className="py-8 text-center text-gray-300 text-sm">No recent movements</div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map(m => {
                const badge = getMovementTypeBadge(m.movement_type);
                return (
                  <div key={m.id || Math.random()} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={badge.class}>{badge.label}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{m.product_name}</div>
                        <div className="text-xs text-gray-400">{m.sku} · {m.user_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${m.movement_type === 'stock_in' ? 'text-secondary' : 'text-danger'}`}>
                        {m.movement_type === 'stock_in' ? '+' : '-'}{m.quantity}
                      </div>
                      <div className="text-xs text-gray-400">{formatDateTime(m.movement_date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
