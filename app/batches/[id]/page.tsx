'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Package, RefreshCw, Play, Pause, Square, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/components/Sidebar';
import Link from 'next/link';
import { BatchStatusBadge } from '@/components/BatchStatusBadge';
import { GenealogyTree } from '@/components/GenealogyTree';

export default function BatchDetailsPage({ params }: { params: { id: string } }) {
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBatch();
  }, [params.id]);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/batches/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (newState: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/batches/${params.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      if (res.ok) {
        fetchBatch();
      } else {
        alert('Failed to update batch state');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto">Loading batch details...</div>;
  if (!batch) return <div className="p-6 max-w-7xl mx-auto">Batch not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Batch {batch.batchNumber}
          </h1>
          <p className="text-slate-500">
            Order: <Link href={`/orders/${batch.workOrderId}`} className="text-indigo-600 hover:underline">{batch.workOrder.orderNumber}</Link>
          </p>
        </div>
        <div className="flex gap-2">
          {batch.state === 'IDLE' && (
            <button 
              onClick={() => handleStateChange('SETUP')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              <Play size={18} /> Setup
            </button>
          )}
          {batch.state === 'SETUP' && (
            <button 
              onClick={() => handleStateChange('RUNNING')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
            >
              <Play size={18} /> Start Run
            </button>
          )}
          {batch.state === 'RUNNING' && (
            <>
              <button 
                onClick={() => handleStateChange('HOLD')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition-colors disabled:opacity-50"
              >
                <Pause size={18} /> Hold
              </button>
              <button 
                onClick={() => handleStateChange('COMPLETE')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={18} /> Complete
              </button>
            </>
          )}
          {batch.state === 'HOLD' && (
            <button 
              onClick={() => handleStateChange('RUNNING')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
            >
              <Play size={18} /> Resume
            </button>
          )}
          {(batch.state !== 'COMPLETE' && batch.state !== 'ABORT') && (
            <button 
              onClick={() => handleStateChange('ABORT')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
            >
              <Square size={18} /> Abort
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">State</p>
                <BatchStatusBadge state={batch.state} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Product</p>
                <p className="text-sm font-bold text-slate-900">{batch.workOrder.product}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Target Qty</p>
                  <p className="text-sm font-medium text-slate-900">{batch.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Actual Qty</p>
                  <p className="text-sm font-medium text-slate-900">{batch.actualQuantity || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Line</p>
                <p className="text-sm font-medium text-slate-900">{batch.workOrder.line.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Created At</p>
                <p className="text-sm font-medium text-slate-900">{new Date(batch.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">External Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {batch.externalBatchId ? (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">External Batch ID</p>
                    <p className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block">{batch.externalBatchId}</p>
                  </div>
                  {batch.externalMapping && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">External State</p>
                        <BatchStatusBadge state={batch.externalMapping.externalState} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Last Sync</p>
                        <p className="text-sm font-medium text-slate-900">
                          {batch.externalMapping.lastSyncAt ? new Date(batch.externalMapping.lastSyncAt).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      {batch.externalMapping.syncError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-700">{batch.externalMapping.syncError}</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 italic">Not synced to any external system.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Batch Genealogy</CardTitle>
            </CardHeader>
            <CardContent>
              <GenealogyTree batch={batch} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
