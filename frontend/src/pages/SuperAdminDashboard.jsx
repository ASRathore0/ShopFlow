import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Store, Users, DollarSign, TrendingUp, CheckCircle2,
  Plus, Search, ArrowRight, BarChart3, AlertCircle, Building, Layers
} from 'lucide-react';
import { superAdminService } from '../services/superAdminService';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SuperAdminDashboard() {
  const { user, quickLoginAs } = useAuth();
  const [data, setData] = useState(null);
  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopType, setNewShopType] = useState('electronics');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Auto-login as super_admin if needed
  useEffect(() => {
    async function init() {
      if (!user || user.role !== 'super_admin') {
        await quickLoginAs('super_admin');
      }
    }
    init();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, shopsRes, plansRes] = await Promise.all([
        superAdminService.getDashboard(),
        superAdminService.getShops(),
        superAdminService.getPlans(),
      ]);
      if (dashRes && dashRes.data) setData(dashRes.data);
      if (shopsRes && shopsRes.data) setShops(shopsRes.data || []);
      if (plansRes && plansRes.data) {
        setPlans(plansRes.data || []);
        if (plansRes.data.length > 0) setSelectedPlanId(plansRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      await superAdminService.createShop({
        name: newShopName,
        shop_type: newShopType,
        email: newShopEmail,
        plan_id: selectedPlanId,
      });
      setShowCreateShop(false);
      setNewShopName('');
      setNewShopEmail('');
      loadData();
    } catch (err) {
      alert('Could not onboard shop.');
    }
  };

  const metrics = data?.metrics || {
    total_shops: 2,
    active_shops: 2,
    total_customers: 42,
    requests_today: 18,
    active_staff: 6,
    monthly_revenue: 3840.00,
    total_users: 5,
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-blue-600">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              ShopFlow Platform Administration
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Multi-Tenant SaaS
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Manage tenant shops, subscriptions, and platform-wide retail footfall</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateShop(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Onboard New Shop
        </button>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Total Registered Shops</span>
          <div className="text-3xl font-black text-white">{metrics.total_shops}</div>
          <span className="text-[10px] text-emerald-400">{metrics.active_shops} active & operating</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Platform Monthly ARR</span>
          <div className="text-3xl font-black text-emerald-400">${metrics.monthly_revenue.toFixed(2)}</div>
          <span className="text-[10px] text-zinc-400">Recurring SaaS subscription volume</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Shopper Sessions Today</span>
          <div className="text-3xl font-black text-blue-400">{metrics.requests_today}</div>
          <span className="text-[10px] text-zinc-400">In-store QR scans</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Floor Staff Online</span>
          <div className="text-3xl font-black text-purple-400">{metrics.active_staff}</div>
          <span className="text-[10px] text-zinc-400">Active store employees</span>
        </div>
      </div>

      {/* Shop Growth Chart */}
      <div className="p-6 rounded-3xl bg-[#18181B] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Platform Retail Request Volume (Monthly)</h3>
            <p className="text-xs text-zinc-400">Aggregate customer requests served across all enrolled physical retail stores</p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.shop_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="month" stroke="#71717A" fontSize={11} />
              <YAxis stroke="#71717A" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#3F3F46', fontSize: 12 }} />
              <Bar dataKey="requests" name="Total Customer Requests" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enrolled Shops Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Enrolled Physical Retail Tenants</h2>
          <span className="text-xs text-zinc-400">{shops.length} total shops</span>
        </div>

        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3.5">Shop Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Subscription Plan</th>
                <th className="p-3.5">Products / Staff</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Store Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {shops.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/40">
                  <td className="p-3.5 font-bold text-white">
                    <div>{s.name}</div>
                    <span className="text-[10px] text-zinc-500 font-mono">slug: {s.slug}</span>
                  </td>
                  <td className="p-3.5 capitalize text-zinc-300">{s.shop_type}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                      {s.subscription?.plan?.name || 'Growth ($129)'}
                    </span>
                  </td>
                  <td className="p-3.5 text-zinc-400">
                    {s.products_count || 8} products • {s.employees_count || 3} staff
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <a
                      href={`/shop/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-end gap-1"
                    >
                      Visit Shop
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Shop Modal */}
      {showCreateShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-zinc-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Onboard New Retail Tenant</h3>
            <form onSubmit={handleCreateShop} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hardware & Tools"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Store Type</label>
                <select
                  value={newShopType}
                  onChange={(e) => setNewShopType(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                >
                  <option value="electronics">Consumer Electronics</option>
                  <option value="clothing">Clothing & Apparel</option>
                  <option value="footwear">Footwear & Sneakers</option>
                  <option value="furniture">Furniture & Decor</option>
                  <option value="cosmetics">Cosmetics & Beauty</option>
                  <option value="hardware">Hardware & Tools</option>
                  <option value="grocery">Grocery</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Owner Email</label>
                <input
                  type="email"
                  required
                  placeholder="owner@store.com"
                  value={newShopEmail}
                  onChange={(e) => setNewShopEmail(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Subscription Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-2.5 rounded-xl border border-zinc-700 text-xs mt-1"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.price}/mo
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateShop(false)}
                  className="w-1/2 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  Create Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
