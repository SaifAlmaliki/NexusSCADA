import { Package, ArrowDown, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function GenealogyTree({ batch }: { batch: any }) {
  return (
    <div className="space-y-8">
      {/* Raw Materials Consumed */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ArrowDown size={16} className="text-slate-400" />
          Inputs (Consumed)
        </h3>
        <div className="pl-6 border-l-2 border-slate-200 space-y-4">
          {batch.consumedLots?.map((consumption: any) => (
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
                </div>
                <div className="text-right">
                  <span className="font-medium text-slate-900">{consumption.quantityUsed} {consumption.unit}</span>
                </div>
              </div>
            </div>
          ))}
          {(!batch.consumedLots || batch.consumedLots.length === 0) && (
            <p className="text-sm text-slate-500 italic">No inputs recorded.</p>
          )}
        </div>
      </div>

      {/* Produced Items */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ArrowRight size={16} className="text-slate-400" />
          Outputs (Produced)
        </h3>
        <div className="pl-6 border-l-2 border-slate-200 space-y-4">
          {batch.producedLots?.map((production: any) => (
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
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium text-slate-900">{production.quantity} {production.unit}</span>
                </div>
              </div>
            </div>
          ))}
          {(!batch.producedLots || batch.producedLots.length === 0) && (
            <p className="text-sm text-slate-500 italic">No outputs recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
