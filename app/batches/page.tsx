import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Package, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BatchStatusBadge } from '@/components/BatchStatusBadge';

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    include: {
      workOrder: true,
      externalMapping: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Batches</h1>
          <p className="text-slate-500">Monitor batch execution and external sync status</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">All Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Batch Number</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">External ID</th>
                  <th className="px-4 py-3 font-medium">Sync Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{batch.batchNumber}</td>
                    <td className="px-4 py-3 text-indigo-600 hover:underline">
                      <Link href={`/orders/${batch.workOrderId}`}>{batch.workOrder.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{batch.workOrder.product}</td>
                    <td className="px-4 py-3">
                      <BatchStatusBadge state={batch.state} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {batch.externalBatchId || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {batch.externalMapping ? (
                        <span className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          batch.externalMapping.syncError ? "text-red-600" : "text-emerald-600"
                        )}>
                          {batch.externalMapping.syncError ? "Error" : "Synced"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not Synced</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/batches/${batch.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition-colors"
                      >
                        Details
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                      No batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
