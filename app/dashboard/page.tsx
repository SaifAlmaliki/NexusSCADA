'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Activity, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { cn } from '@/components/Sidebar';

const kpiData = [
  { title: 'Running Batches', value: '12', trend: '+2', trendUp: true, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
  { title: 'Completed Today', value: '45', trend: '+15%', trendUp: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { title: 'Active Alarms', value: '3', trend: '-2', trendUp: false, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
  { title: 'OEE %', value: '87.4%', trend: '+1.2%', trendUp: true, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-100' },
];

const activeBatches = [
  { id: 'B-1042', order: 'ORD-992', reactor: 'R-101', status: 'running', start: '08:00 AM', eta: '14:30 PM' },
  { id: 'B-1043', order: 'ORD-993', reactor: 'R-102', status: 'setup', start: '10:15 AM', eta: '16:00 PM' },
  { id: 'B-1044', order: 'ORD-994', reactor: 'R-201', status: 'hold', start: '09:30 AM', eta: 'Unknown' },
  { id: 'B-1045', order: 'ORD-995', reactor: 'R-202', status: 'running', start: '07:45 AM', eta: '13:15 PM' },
];

const activeAlarms = [
  { id: 1, priority: 'critical', tag: 'R101_TEMP_HI', unit: 'Reactor 101', time: '10:42 AM' },
  { id: 2, priority: 'high', tag: 'PUMP_2A_FAIL', unit: 'Pump Station 2', time: '10:35 AM' },
  { id: 3, priority: 'medium', tag: 'LVL_LOW_T10', unit: 'Tank 10', time: '09:15 AM' },
];

const trendData = [
  { time: '10:00', temp: 85 },
  { time: '10:10', temp: 86 },
  { time: '10:20', temp: 88 },
  { time: '10:30', temp: 92 },
  { time: '10:40', temp: 95 },
  { time: '10:50', temp: 94 },
  { time: '11:00', temp: 90 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Plant Overview</h1>
        <div className="text-sm text-slate-500">Last updated: Just now</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{kpi.value}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", kpi.bg)}>
                  <kpi.icon className={cn("h-6 w-6", kpi.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {kpi.trendUp ? (
                  <ArrowUpRight className={cn("h-4 w-4 mr-1", kpi.title === 'Active Alarms' ? 'text-rose-500' : 'text-emerald-500')} />
                ) : (
                  <ArrowDownRight className={cn("h-4 w-4 mr-1", kpi.title === 'Active Alarms' ? 'text-emerald-500' : 'text-rose-500')} />
                )}
                <span className={cn("font-medium", 
                  kpi.title === 'Active Alarms' 
                    ? (kpi.trendUp ? 'text-rose-600' : 'text-emerald-600')
                    : (kpi.trendUp ? 'text-emerald-600' : 'text-rose-600')
                )}>
                  {kpi.trend}
                </span>
                <span className="text-slate-500 ml-2">vs last shift</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Batches */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Batches</CardTitle>
            <Link href="/production/batches" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              View all
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Batch ID</th>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Reactor</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Start Time</th>
                  <th className="px-6 py-3 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {activeBatches.map((batch) => (
                  <tr key={batch.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{batch.id}</td>
                    <td className="px-6 py-4 text-slate-600">{batch.order}</td>
                    <td className="px-6 py-4 text-slate-600">{batch.reactor}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        batch.status === 'running' ? "bg-blue-100 text-blue-700" :
                        batch.status === 'setup' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {batch.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{batch.start}</td>
                    <td className="px-6 py-4 text-slate-600">{batch.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Active Alarms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Alarms</CardTitle>
            <Link href="/scada/alarms" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              View all
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {activeAlarms.map((alarm) => (
              <div key={alarm.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      alarm.priority === 'critical' ? 'bg-rose-500 animate-pulse' :
                      alarm.priority === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{alarm.tag}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alarm.unit}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{alarm.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trends Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Reactor 101 Temperature Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#0d9488" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
