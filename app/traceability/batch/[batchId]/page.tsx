import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Package, ArrowDown, ArrowRight, CheckCircle2, XCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default async function BatchTraceabilityPage({ params }: { params: { batchId: string } }) {
  // Try to find the batch by batchNumber or ID
  const batch = await prisma.batch.findFirst({
    where: {
      OR: [
        { id: params.batchId },
        { batchNumber: params.batchId }
      ]
    },
    include: {
      workOrder: {
        include: { line: true }
      },
      consumedLots: {
        include: { materialLot: true }
      },
      producedLots: {
        include: { materialLot: true }
      },
      signatures: {
        include: { user: true }
      }
    }
  });

  if (!batch) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Batch Not Found</h1>
        <p className="text-slate-500 mt-2">Could not find batch with ID or number: {params.batchId}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Genealogy Tree</h1>
          <p className="text-slate-500">Full traceability for Batch #{batch.batchNumber}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <Download size={18} />
            Export Batch Record (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Genealogy Tree */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Package size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">Batch #{batch.batchNumber}</CardTitle>
                  <p className="text-sm text-slate-500">
                    {batch.workOrder.line.name} • {batch.startTime ? new Date(batch.startTime).toLocaleString() : 'Not started'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Raw Materials Consumed */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ArrowDown size={16} className="text-slate-400" />
                  Raw Materials Consumed
                </h3>
                <div className="pl-6 border-l-2 border-slate-200 space-y-4">
                  {batch.consumedLots.map((consumption) => (
                    <div key={consumption.id} className="relative">
                      <div className="absolute -left-[29px] top-3 w-6 border-t-2 border-slate-200" />
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{consumption.materialLot.materialName}</span>
                            <Link href={`/traceability/recall/${consumption.materialLot.lotNumber}`} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                              Lot {consumption.materialLot.lotNumber}
                            </Link>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {consumption.materialLot.expiryDate && (
                              <span className={cn(
                                new Date(consumption.materialLot.expiryDate) < new Date() ? "text-red-600 font-medium" : ""
                              )}>
                                Expiry: {new Date(consumption.materialLot.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-900">{consumption.quantityUsed} {consumption.unit}</span>
                          <p className="text-xs text-slate-500">used</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {batch.consumedLots.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No materials recorded.</p>
                  )}
                </div>
              </div>

              {/* Produced Items */}
              <div className="space-y-4 mt-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight size={16} className="text-slate-400" />
                  Produced
                </h3>
                <div className="pl-6 border-l-2 border-slate-200 space-y-4">
                  {batch.producedLots.map((production) => (
                    <div key={production.id} className="relative">
                      <div className="absolute -left-[29px] top-3 w-6 border-t-2 border-slate-200" />
                      <div className={cn(
                        "bg-white border rounded-lg p-3 shadow-sm flex items-center justify-between",
                        production.isWaste ? "border-red-200 bg-red-50/30" : "border-emerald-200 bg-emerald-50/30"
                      )}>
                        <div className="flex items-center gap-3">
                          {production.isWaste ? (
                            <XCircle size={20} className="text-red-500" />
                          ) : (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {production.isWaste ? 'Waste' : 'Product'}
                              </span>
                              <Link href={`/traceability/product/${production.materialLot.lotNumber}`} className="text-xs font-mono bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                                Lot {production.materialLot.lotNumber}
                              </Link>
                            </div>
                            {production.isWaste && production.wasteReason && (
                              <p className="text-xs text-red-600 mt-1">Reason: {production.wasteReason}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-900">{production.quantity} {production.unit}</span>
                          <p className="text-xs text-slate-500">{production.isWaste ? 'discarded' : 'released'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {batch.producedLots.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No production recorded.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Signatures */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Product</p>
                <p className="text-sm font-medium text-slate-900">{batch.workOrder.product}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  batch.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                  batch.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                  batch.status === 'HOLD' ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-700"
                )}>
                  {batch.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Start Time</p>
                  <p className="text-sm font-medium text-slate-900">
                    {batch.startTime ? new Date(batch.startTime).toLocaleTimeString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">End Time</p>
                  <p className="text-sm font-medium text-slate-900">
                    {batch.endTime ? new Date(batch.endTime).toLocaleTimeString() : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Electronic Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {batch.signatures.map((sig) => (
                <div key={sig.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {sig.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sig.user.name}</p>
                    <p className="text-xs text-slate-500">{sig.role} • {sig.meaning}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(sig.signedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {batch.signatures.length === 0 && (
                <p className="text-sm text-slate-500 italic">No signatures recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
