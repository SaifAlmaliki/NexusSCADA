'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Activity, AlertTriangle, CheckCircle2, Settings, Wrench, Clock, TrendingDown, Zap } from 'lucide-react';
import { cn } from '@/components/Sidebar';

// Mock data for predictive maintenance
const mockEquipment = [
  { id: 'EQ-001', name: 'Reactor 101', type: 'Reactor', healthScore: 92, mtbf: 4500, nextMaintenance: '2026-04-15', status: 'RUNNING' },
  { id: 'EQ-002', name: 'Mixer 201', type: 'Mixer', healthScore: 65, mtbf: 1200, nextMaintenance: '2026-03-05', status: 'WARNING' },
  { id: 'EQ-003', name: 'Conveyor A', type: 'Conveyor', healthScore: 42, mtbf: 300, nextMaintenance: '2026-03-01', status: 'CRITICAL' },
  { id: 'EQ-004', name: 'Cooling Tower', type: 'Cooling', healthScore: 98, mtbf: 8000, nextMaintenance: '2026-08-20', status: 'RUNNING' },
];

const mockAnomalies = [
  { id: 'AN-1', equipment: 'Conveyor A', type: 'VIBRATION', severity: 'CRITICAL', description: 'High frequency vibration detected on motor bearing.', time: '10 mins ago' },
  { id: 'AN-2', equipment: 'Mixer 201', type: 'TEMPERATURE', severity: 'HIGH', description: 'Motor casing temperature exceeded 85°C for 5 mins.', time: '2 hours ago' },
  { id: 'AN-3', equipment: 'Reactor 101', type: 'PRESSURE', severity: 'LOW', description: 'Slight pressure drop during phase 2.', time: '1 day ago' },
];

export default function PredictiveMaintenancePage() {
  const [equipment, setEquipment] = useState(mockEquipment);
  const [anomalies, setAnomalies] = useState(mockAnomalies);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    // Set initial time asynchronously to avoid synchronous setState warning
    const timeout = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Predictive Maintenance (ML)</h1>
        <p className="text-sm text-slate-500 mt-1">AI-driven anomaly detection and MTBF predictions to prevent unplanned downtime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Overall Plant Health</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">84%</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Activity className="text-emerald-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Anomalies</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">3</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="text-amber-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Predicted Failures (7d)</p>
                <p className="text-3xl font-bold text-red-600 mt-2">1</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg MTBF</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">3.5k <span className="text-sm font-normal">hrs</span></p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Equipment Health & MTBF Predictions</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Equipment</th>
                  <th className="px-4 py-3 font-medium">Health Score</th>
                  <th className="px-4 py-3 font-medium">MTBF (Predicted)</th>
                  <th className="px-4 py-3 font-medium">Next Maintenance</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{eq.name}</div>
                      <div className="text-xs text-slate-500">{eq.type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className={cn(
                              "h-2 rounded-full",
                              eq.healthScore > 80 ? "bg-emerald-500" :
                              eq.healthScore > 50 ? "bg-amber-500" : "bg-red-500"
                            )} 
                            style={{ width: `${eq.healthScore}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{eq.healthScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{eq.mtbf} hrs</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        new Date(eq.nextMaintenance) < new Date(now + 7 * 24 * 60 * 60 * 1000) 
                          ? "bg-red-100 text-red-700" 
                          : "bg-slate-100 text-slate-700"
                      )}>
                        {eq.nextMaintenance}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
                        <Wrench size={14} /> Schedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-amber-500" size={18} />
              ML Anomaly Detection
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800 text-sm">{anomaly.equipment}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    anomaly.severity === 'CRITICAL' ? "bg-red-100 text-red-700" :
                    anomaly.severity === 'HIGH' ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {anomaly.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{anomaly.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400">{anomaly.time}</span>
                  <button className="text-xs text-slate-500 hover:text-slate-800 underline">Investigate</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
