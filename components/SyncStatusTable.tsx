'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/components/Sidebar';

export function SyncStatusTable() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/batch-integration/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/batch-integration/sync', { method: 'POST' });
      if (res.ok) {
        alert('Sync completed successfully');
        fetchConfigs();
      } else {
        alert('Sync failed');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div>Loading sync status...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Integration Status</CardTitle>
        <button 
          onClick={handleManualSync}
          disabled={syncing || configs.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? 'Syncing...' : 'Manual Sync'}
        </button>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No integration configurations found.</p>
        ) : (
          <div className="space-y-4">
            {configs.map(config => (
              <div key={config.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{config.site?.name || 'Unknown Site'}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded font-medium uppercase">{config.type}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{config.baseUrl}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Last sync: {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <span className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                    config.syncStatus === 'healthy' ? "bg-emerald-100 text-emerald-700" :
                    config.syncStatus === 'error' ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {config.syncStatus === 'healthy' && <CheckCircle2 size={14} />}
                    {config.syncStatus === 'error' && <AlertTriangle size={14} />}
                    {config.syncStatus || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
