import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Package, ArrowRight, CheckCircle2, AlertTriangle, Search, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default async function ForwardTraceabilityPage({ params }: { params: { lotNumber: string } }) {
  const lot = await prisma.materialLot.findUnique({
    where: { lotNumber: params.lotNumber },
    include: {
      producedBy: {
        include: {
          batch: {
            include: { workOrder: { include: { line: true } } }
          }
        }
      },
      consumedIn: {
        include: {
          batch: {
            include: {
              workOrder: { include: { line: true } },
              producedLots: {
                include: { materialLot: true }
              }
            }
          }
        }
      }
    }
  });

  if (!lot) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Lot Not Found</h1>
        <p className="text-slate-500 mt-2">Could not find material lot with number: {params.lotNumber}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forward Traceability</h1>
          <p className="text-slate-500">Where was Lot {lot.lotNumber} used?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lot Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  lot.type === 'FINISHED_GOOD' ? "bg-emerald-100 text-emerald-600" :
                  lot.type === 'RAW_MATERIAL' ? "bg-indigo-100 text-indigo-600" :
                  "bg-amber-100 text-amber-600"
                )}>
                  <Package size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">{lot.materialName}</CardTitle>
                  <p className="text-sm font-mono text-slate-500">Lot {lot.lotNumber}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Type</p>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {lot.type.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    lot.status === 'RELEASED' ? "bg-emerald-100 text-emerald-700" :
                    lot.status === 'QUARANTINED' ? "bg-amber-100 text-amber-700" :
                    lot.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-700"
                  )}>
                    {lot.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Quantity</p>
                  <p className="text-sm font-medium text-slate-900">{lot.quantity} {lot.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Expiry Date</p>
                  <p className={cn(
                    "text-sm font-medium",
                    lot.expiryDate && new Date(lot.expiryDate) < new Date() ? "text-red-600" : "text-slate-900"
                  )}>
                    {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Tree */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Usage History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {lot.consumedIn.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">Not Used Yet</h3>
                  <p className="text-sm text-slate-500 mt-1">This lot has not been consumed in any batches.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {lot.consumedIn.map((consumption) => (
                    <div key={consumption.id} className="relative pl-8">
                      <div className="absolute left-[11px] top-4 bottom-[-24px] w-0.5 bg-slate-200 last:hidden" />
                      <div className="absolute left-0 top-4 w-6 h-6 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center z-10">
                        <ArrowRight size={12} className="text-indigo-600" />
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Factory size={16} className="text-slate-400" />
                            <Link href={`/traceability/batch/${consumption.batch.batchNumber}`} className="font-bold text-indigo-600 hover:underline">
                              Batch #{consumption.batch.batchNumber}
                            </Link>
                            <span className="text-xs text-slate-500">({consumption.batch.workOrder.line.name})</span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">Used: {consumption.quantityUsed} {consumption.unit}</span>
                        </div>
                        
                        {/* What did this batch produce? */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Resulting Products</p>
                          <div className="space-y-2">
                            {consumption.batch.producedLots.map(prod => (
                              <div key={prod.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                <div className="flex items-center gap-2">
                                  {prod.isWaste ? <AlertTriangle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                  <span className="text-sm font-medium text-slate-900">{prod.materialLot.materialName}</span>
                                  <Link href={`/traceability/product/${prod.materialLot.lotNumber}`} className="text-xs font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                                    Lot {prod.materialLot.lotNumber}
                                  </Link>
                                </div>
                                <span className="text-sm text-slate-600">{prod.quantity} {prod.unit}</span>
                              </div>
                            ))}
                            {consumption.batch.producedLots.length === 0 && (
                              <p className="text-sm text-slate-500 italic">Batch in progress or no products recorded.</p>
                            )}
                          </div>
                        </div>
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
