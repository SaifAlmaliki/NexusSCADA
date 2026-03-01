'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, Zap, ShieldCheck, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/components/Sidebar';

const oeeData = [
  { name: 'Line 1', availability: 92, performance: 88, quality: 98, oee: 79.3 },
  { name: 'Line 2', availability: 85, performance: 90, quality: 95, oee: 72.6 },
  { name: 'Line 3', availability: 95, performance: 92, quality: 99, oee: 86.5 },
  { name: 'Line 4', availability: 78, performance: 85, quality: 92, oee: 60.9 },
];

const qualityEvents = [
  { id: 'INSP-1042', batch: 'B-1042', result: 'pass', issues: 'None', time: '10:45 AM' },
  { id: 'INSP-1041', batch: 'B-1041', result: 'pass', issues: 'None', time: '09:30 AM' },
  { id: 'INSP-1040', batch: 'B-1040', result: 'fail', issues: 'Viscosity out of spec', time: '08:15 AM' },
  { id: 'INSP-1039', batch: 'B-1039', result: 'pass', issues: 'Minor color deviation (accepted)', time: '07:00 AM' },
];

export default function OeePage() {
  const overallOEE = 74.8;
  const targetOEE = 80.0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quality & OEE</h1>
          <p className="text-sm text-slate-500 mt-1">Overall Equipment Effectiveness and Quality Control.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-500">Plant Target OEE:</div>
          <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-sm border border-slate-200">
            {targetOEE}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-medium">Overall OEE</h3>
              <TrendingUp className="text-teal-400" size={20} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{overallOEE}%</span>
              <span className="text-sm text-rose-400 font-medium mb-1">-5.2% vs target</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-teal-400 h-full rounded-full" style={{ width: `${overallOEE}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Availability</h3>
              <Target className="text-blue-500" size={20} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-800">87.5%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '87.5%' }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Performance</h3>
              <Zap className="text-amber-500" size={20} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-800">88.7%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '88.7%' }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Quality</h3>
              <ShieldCheck className="text-emerald-500" size={20} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-800">96.0%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>OEE by Line</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oeeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="oee" name="OEE %" radius={[4, 4, 0, 0]}>
                    {oeeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.oee >= targetOEE ? '#0d9488' : entry.oee >= 70 ? '#f59e0b' : '#e11d48'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quality Inspections</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Inspection ID</th>
                  <th className="px-6 py-3 font-medium">Batch</th>
                  <th className="px-6 py-3 font-medium">Result</th>
                  <th className="px-6 py-3 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {qualityEvents.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{event.id}</td>
                    <td className="px-6 py-4 text-slate-600">{event.batch}</td>
                    <td className="px-6 py-4">
                      {event.result === 'pass' ? (
                        <span className="inline-flex items-center text-emerald-600 font-medium">
                          <CheckCircle2 size={16} className="mr-1.5" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 font-medium">
                          <AlertCircle size={16} className="mr-1.5" /> Fail
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{event.issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
