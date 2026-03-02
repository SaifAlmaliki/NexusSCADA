'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ClipboardList, Play, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BatchStatusBadge } from '@/components/BatchStatusBadge';

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [batchPlan, setBatchPlan] = useState<{ quantity: number }[]>([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders`);
      if (res.ok) {
        const orders = await res.json();
        const found = orders.find((o: any) => o.id === id);
        setOrder(found);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openDispatchModal = () => {
    if (!order) return;
    const defaultSize = order.recipe?.defaultBatchSize || order.targetQty;
    const fullBatches = Math.floor(order.targetQty / defaultSize);
    const remainder = order.targetQty % defaultSize;
    const plan: { quantity: number }[] = [];
    for (let i = 0; i < fullBatches; i += 1) {
      plan.push({ quantity: defaultSize });
    }
    if (remainder > 0) {
      plan.push({ quantity: remainder });
    }
    if (!plan.length) {
      plan.push({ quantity: order.targetQty });
    }
    setBatchPlan(plan);
    setPlanError(null);
    setShowDispatchModal(true);
  };

  const totalPlannedQty = batchPlan.reduce((sum, b) => sum + (b.quantity || 0), 0);

  const handleDispatch = async () => {
    if (!order) return;

    if (!batchPlan.length || totalPlannedQty <= 0) {
      setPlanError('Please define at least one batch with quantity');
      return;
    }

    if (totalPlannedQty > order.targetQty) {
      setPlanError('Total planned quantity exceeds order target quantity');
      return;
    }

    setDispatching(true);
    try {
      const res = await fetch(`/api/orders/${id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches: batchPlan }),
      });
      if (res.ok) {
        setShowDispatchModal(false);
        await fetchOrder();
      } else {
        const errorBody = await res.json().catch(() => null);
        setPlanError(errorBody?.error || 'Failed to dispatch order');
      }
    } catch (error) {
      console.error(error);
      setPlanError('Failed to dispatch order');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto">Loading order details...</div>;
  if (!order) return <div className="p-6 max-w-7xl mx-auto">Order not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" />
            Order {order.orderNumber}
          </h1>
          <p className="text-slate-500">Manage order execution and batches</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={openDispatchModal}
            disabled={dispatching || order.status === 'COMPLETED'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
          >
            {dispatching ? (
              <span className="animate-pulse">Dispatching...</span>
            ) : (
              <>
                <Play size={18} />
                Dispatch Batch
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Product</p>
                <p className="text-sm font-bold text-slate-900">{order.product}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Target Qty</p>
                  <p className="text-sm font-medium text-slate-900">{order.targetQty}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Actual Qty</p>
                  <p className="text-sm font-medium text-slate-900">{order.actualQty}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                  order.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                  order.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                  order.status === 'PAUSED' ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-700"
                )}>
                  {order.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Line</p>
                <p className="text-sm font-medium text-slate-900">{order.line.name}</p>
              </div>
              {order.recipe && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Recipe</p>
                  <p className="text-sm font-medium text-slate-900">
                    {order.recipe.name} ({order.recipe.productType})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showDispatchModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Plan Batches</h2>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-slate-600">
                  Target quantity: <span className="font-semibold">{order.targetQty}</span> units. Planned
                  total: <span className="font-semibold">{totalPlannedQty}</span> units.
                </p>
                {planError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                    {planError}
                  </p>
                )}
                <div className="space-y-2">
                  {batchPlan.map((batch, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-slate-500">Batch {index + 1}</span>
                      <input
                        type="number"
                        min={1}
                        className="w-24 border border-slate-300 rounded-lg px-2 py-1 text-sm"
                        value={batch.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          setBatchPlan((prev) =>
                            prev.map((b, i) => (i === index ? { ...b, quantity: value } : b)),
                          );
                        }}
                      />
                      <span className="text-xs text-slate-500">units</span>
                      <button
                        className="ml-auto text-xs text-slate-400 hover:text-red-600"
                        onClick={() =>
                          setBatchPlan((prev) => prev.filter((_, i) => i !== index))
                        }
                        disabled={batchPlan.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="mt-2 text-xs text-indigo-600 hover:underline"
                    onClick={() => setBatchPlan((prev) => [...prev, { quantity: 1 }])}
                  >
                    + Add batch
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                  disabled={dispatching}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {dispatching ? 'Dispatching...' : 'Dispatch Batches'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Associated Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {order.batches.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No Batches Yet</h3>
                  <p className="text-sm text-slate-500 mt-1">Dispatch this order to create the first batch.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.batches.map((batch: any) => (
                    <div key={batch.id} className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{batch.batchNumber}</span>
                          <BatchStatusBadge state={batch.state} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Created: {new Date(batch.createdAt).toLocaleString()}
                        </p>
                        {batch.externalBatchId && (
                          <p className="text-xs font-mono text-indigo-600 mt-1">
                            EXT ID: {batch.externalBatchId}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Link 
                          href={`/batches/${batch.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium transition-colors"
                        >
                          View Batch
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
