import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getDistrictConnectivityList, getSupplyStatus, getAnalyticsCharts } from '../api/dashboard';
import { MapPin, Truck, Package, Clock, AlertTriangle, ShieldAlert, BarChart2, RefreshCw, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2F8F5B', '#D98A00', '#C6403A'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpis' | 'districts' | 'supply' | 'charts'>('kpis');

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  });

  const { data: districts, isLoading: loadingDistricts } = useQuery({
    queryKey: ['dashboard-districts'],
    queryFn: getDistrictConnectivityList,
  });

  const { data: supply, isLoading: loadingSupply } = useQuery({
    queryKey: ['dashboard-supply'],
    queryFn: getSupplyStatus,
  });

  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: getAnalyticsCharts,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 font-heading">Operational Command Dashboard</h1>
          <p className="text-sm text-ink-600">Real-time visibility across North Eastern Region districts and corridors</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-mist-100 text-ink-700 text-xs font-semibold rounded font-mono">
            Role: {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {summary?.emergencyMode && (
            <span className="px-3 py-1 bg-rust-600 text-white rounded-full text-xs font-bold animate-pulse">
              EMERGENCY MODE ACTIVE
            </span>
          )}
          <button
            onClick={() => refetchSummary()}
            className="p-2 border border-mist-200 rounded-xl hover:bg-mist-100 text-ink-600 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 KPI Bar */}
      {loadingSummary ? (
        <div className="text-center py-6 text-ink-600">Loading summary KPIs...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-river-600" /> Districts
            </div>
            <div className="text-xl font-bold text-ink-900">{summary?.totalDistricts || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-marigold-500" /> Degraded
            </div>
            <div className="text-xl font-bold text-marigold-600">{summary?.degradedOrInaccessibleDistricts || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-river-600" /> On Trip
            </div>
            <div className="text-xl font-bold text-ink-900">{summary?.activeVehicles || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-river-600" /> Shipments
            </div>
            <div className="text-xl font-bold text-ink-900">{summary?.activeShipments || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-marigold-500" /> Pending Rep
            </div>
            <div className="text-xl font-bold text-ink-900">{summary?.pendingFieldReports || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rust-600" /> Critical Alt
            </div>
            <div className="text-xl font-bold text-rust-600">{summary?.criticalAlerts || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <Box className="w-3.5 h-3.5 text-rust-600" /> Supply Gaps
            </div>
            <div className="text-xl font-bold text-rust-600">{summary?.supplyGaps || 0}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-mist-200 space-y-1">
            <div className="text-ink-400 text-xs font-semibold uppercase flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-river-600" /> Mode
            </div>
            <div className="text-sm font-bold text-river-600">{summary?.emergencyMode ? 'EMERGENCY' : 'NORMAL'}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-mist-200 gap-4">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-3 font-semibold text-sm transition ${
            activeTab === 'kpis' ? 'border-b-2 border-river-600 text-river-600' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          Analytics & Charts
        </button>
        <button
          onClick={() => setActiveTab('districts')}
          className={`pb-3 font-semibold text-sm transition ${
            activeTab === 'districts' ? 'border-b-2 border-river-600 text-river-600' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          District Connectivity
        </button>
        <button
          onClick={() => setActiveTab('supply')}
          className={`pb-3 font-semibold text-sm transition ${
            activeTab === 'supply' ? 'border-b-2 border-river-600 text-river-600' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          Essential Supply Gaps
        </button>
      </div>

      {/* Tab 1: Charts */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Road Segment Status Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-mist-200 space-y-3">
            <h3 className="font-bold text-sm text-ink-900">Road Corridor Status</h3>
            {loadingCharts ? (
              <div className="py-12 text-center text-xs text-ink-400">Loading chart...</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.roadStatusBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {charts?.roadStatusBreakdown?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Incidents by Type */}
          <div className="bg-white p-5 rounded-2xl border border-mist-200 space-y-3">
            <h3 className="font-bold text-sm text-ink-900">Incidents by Type</h3>
            {loadingCharts ? (
              <div className="py-12 text-center text-xs text-ink-400">Loading chart...</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.incidentsByType || []}>
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#14597A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Cargo Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-mist-200 space-y-3">
            <h3 className="font-bold text-sm text-ink-900">Cargo Category Shipments</h3>
            {loadingCharts ? (
              <div className="py-12 text-center text-xs text-ink-400">Loading chart...</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.cargoCategoryDistribution || []}>
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2F8F5B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: District Connectivity */}
      {activeTab === 'districts' && (
        <div className="bg-white rounded-2xl border border-mist-200 overflow-hidden">
          {loadingDistricts ? (
            <div className="p-8 text-center text-ink-600">Loading district connectivity...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-mist-50 border-b border-mist-200 text-ink-500 font-medium text-xs uppercase">
                    <th className="p-4">District</th>
                    <th className="p-4">State</th>
                    <th className="p-4">Connectivity Score</th>
                    <th className="p-4">Status Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-100">
                  {districts?.map((d) => (
                    <tr key={d.id} className="hover:bg-mist-50">
                      <td className="p-4 font-semibold text-ink-900">{d.name}</td>
                      <td className="p-4 text-ink-600">{d.state}</td>
                      <td className="p-4 font-mono font-bold text-ink-900">{d.connectivityScore} / 100</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          d.category === 'GOOD' ? 'bg-tea-100 text-tea-600' :
                          d.category === 'DEGRADED' ? 'bg-marigold-100 text-marigold-600' :
                          'bg-rust-100 text-rust-600'
                        }`}>
                          {d.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Supply Gaps */}
      {activeTab === 'supply' && (
        <div className="bg-white rounded-2xl border border-mist-200 overflow-hidden">
          {loadingSupply ? (
            <div className="p-8 text-center text-ink-600">Loading supply stock...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-mist-50 border-b border-mist-200 text-ink-500 font-medium text-xs uppercase">
                    <th className="p-4">District</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock Units</th>
                    <th className="p-4">Daily Demand</th>
                    <th className="p-4">Days of Cover</th>
                    <th className="p-4">Supply Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-100">
                  {supply?.map((s) => (
                    <tr key={s.id} className={s.isSupplyGap ? 'bg-rust-50/40' : 'hover:bg-mist-50'}>
                      <td className="p-4 font-semibold text-ink-900">{s.districtName} ({s.state})</td>
                      <td className="p-4 text-ink-600 font-mono text-xs">{s.category}</td>
                      <td className="p-4 text-ink-900">{s.stockUnits}</td>
                      <td className="p-4 text-ink-600">{s.dailyDemandUnits}</td>
                      <td className="p-4 font-bold font-mono text-ink-900">{s.daysOfCover} days</td>
                      <td className="p-4">
                        {s.isSupplyGap ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rust-600 text-white">
                            CRITICAL GAP (&lt; 3 days)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tea-100 text-tea-600">
                            ADEQUATE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
