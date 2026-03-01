'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { RefreshCw, CalendarClock, AlertTriangle, CheckCircle2, Search, ArrowRight, BrainCircuit } from 'lucide-react';
import { cn } from '@/components/Sidebar';

// Mock data for initial render
const mockSyncLogs = [
  { id: '1', syncType: 'ORDER_IMPORT', status: 'SUCCESS', recordsProcessed: 12, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', syncType: 'STATUS_UPDATE', status: 'SUCCESS', recordsProcessed: 45, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', syncType: 'ORDER_IMPORT', status: 'FAILED', errorMessage: 'Connection timeout', recordsProcessed: 0, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const mockVariances = [
  { id: 'v1', orderNumber: 'WO-2026-041', product: 'Industrial Lubricant XL', plannedStart: '08:00 AM', actualStart: '09:15 AM', variance: '+75 min', status: 'DELAYED' },
  { id: 'v2', orderNumber: 'WO-2026-042', product: 'Coolant Premium', plannedStart: '10:00 AM', actualStart: '10:05 AM', variance: '+5 min', status: 'ON_TRACK' },
  { id: 'v3', orderNumber: 'WO-2026-043', product: 'Hydraulic Fluid', plannedStart: '01:00 PM', actualStart: 'Pending', variance: 'N/A', status: 'PENDING' },
];

export default function ErpBridgePage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [syncLogs, setSyncLogs] = useState(mockSyncLogs);
  const [variances, setVariances] = useState(mockVariances);
  const [analyzingBatch, setAnalyzingBatch] = useState<string | null>(null);
  const [rootCauses, setRootCauses] = useState<Record<string, string>>({});

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newLog = {
        id: Date.now().toString(),
        syncType: 'ORDER_IMPORT',
        status: 'SUCCESS',
        recordsProcessed: Math.floor(Math.random() * 20) + 1,
        createdAt: new Date().toISOString()
      };
      
      setSyncLogs([newLog, ...syncLogs].slice(0, 5));
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdjustSchedule = async () => {
    setIsAdjusting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update mock data to show adjustment
      setVariances(prev => prev.map(v => {
        if (v.status === 'PENDING') {
          return { ...v, plannedStart: '02:15 PM', variance: 'Adjusted (+75m)' };
        }
        return v;
      }));
      
      alert('Schedule auto-adjusted successfully based on current delays.');
    } catch (error) {
      console.error('Adjustment failed', error);
    } finally {
      setIsAdjusting(false);
    }
  };

  const analyzeRootCause = async (orderId: string) => {
    setAnalyzingBatch(orderId);
    try {
      // Simulate Gemini API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockCauses = [
        "Vibration anomaly detected on Mixer 2 at 08:30 AM led to a 45-minute unplanned downtime for inspection.",
        "Operator reported material shortage at 08:45 AM, delaying the start of the mixing phase.",
        "Temperature sensor calibration issue caused a 30-minute hold during the heating cycle."
      ];
      
      setRootCauses(prev => ({
        ...prev,
        [orderId]: mockCauses[Math.floor(Math.random() * mockCauses.length)]
      }));
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setAnalyzingBatch(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ERP Execution Gap Bridge</h1>
          <p className="text-slate-500">Synchronize SAP/Oracle plans with shopfloor reality</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAdjustSchedule}
            disabled={isAdjusting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
          >
            <CalendarClock size={18} className={isAdjusting ? "animate-pulse" : ""} />
            {isAdjusting ? 'Adjusting...' : 'Auto-Adjust Schedule'}
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? 'Syncing...' : 'Sync with ERP'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sync Status & Logs */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">ERP Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Connected to SAP S/4HANA</h3>
                  <p className="text-sm text-slate-500">Last sync: {new Date(syncLogs[0].createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recent Sync Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          log.status === 'SUCCESS' ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        <span className="text-sm font-bold text-slate-700">{log.syncType}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-900">{log.recordsProcessed}</span>
                      <p className="text-xs text-slate-500">records</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Variance Reporting & Root Cause */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Execution Variance Report</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <Search size={14} />
                <span>Today&apos;s Shift</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Order / Product</th>
                      <th className="px-4 py-3 font-medium">Planned Start</th>
                      <th className="px-4 py-3 font-medium">Actual Start</th>
                      <th className="px-4 py-3 font-medium">Variance</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variances.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{v.orderNumber}</div>
                          <div className="text-xs text-slate-500">{v.product}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{v.plannedStart}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{v.actualStart}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            v.variance.includes('+') && !v.variance.includes('Adjusted') ? "bg-red-100 text-red-700" : 
                            v.variance.includes('Adjusted') ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {v.variance}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            v.status === 'DELAYED' ? "text-red-600" :
                            v.status === 'ON_TRACK' ? "text-emerald-600" :
                            "text-slate-500"
                          )}>
                            {v.status === 'DELAYED' && <AlertTriangle size={14} />}
                            {v.status === 'ON_TRACK' && <CheckCircle2 size={14} />}
                            {v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {v.status === 'DELAYED' && (
                            <button 
                              onClick={() => analyzeRootCause(v.id)}
                              disabled={analyzingBatch === v.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {analyzingBatch === v.id ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <BrainCircuit size={14} />
                              )}
                              Root Cause
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Root Cause Analysis Results */}
          {Object.keys(rootCauses).length > 0 && (
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                  <BrainCircuit size={18} className="text-indigo-600" />
                  AI Root Cause Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(rootCauses).map(([id, cause]) => {
                  const variance = variances.find(v => v.id === id);
                  return (
                    <div key={id} className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-900">{variance?.orderNumber}</span>
                        <ArrowRight size={14} className="text-slate-400" />
                        <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          {variance?.variance} Delay
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {cause}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
