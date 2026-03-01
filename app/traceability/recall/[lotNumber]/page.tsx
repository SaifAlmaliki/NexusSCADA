'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { AlertTriangle, ShieldAlert, ArrowRight, Package, Factory, CheckCircle2 } from 'lucide-react';
import { cn } from '@/components/Sidebar';
import Link from 'next/link';

export default function RecallPage({ params }: { params: { lotNumber: string } }) {
  const [isQuarantining, setIsQuarantining] = useState(false);
  const [quarantineSuccess, setQuarantineSuccess] = useState(false);
  const [lotData, setLotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data for the lot and its downstream products
    const fetchTraceability = async () => {
      try {
        const res = await fetch(`/api/traceability/recall/${params.lotNumber}`);
        if (res.ok) {
          const data = await res.json();
          setLotData(data);
        }
      } catch (error) {
        console.error('Failed to fetch traceability data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTraceability();
  }, [params.lotNumber]);

  const handleQuarantine = async () => {
    setIsQuarantining(true);
    try {
      // API call to quarantine all downstream lots
      const res = await fetch(`/api/traceability/recall/${params.lotNumber}/quarantine`, {
        method: 'POST',
      });
      
      if (res.ok) {
        setQuarantineSuccess(true);
        // Refresh data to show updated statuses
        const updatedRes = await fetch(`/api/traceability/recall/${params.lotNumber}`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setLotData(data);
        }
      }
    } catch (error) {
      console.error('Failed to quarantine', error);
    } finally {
      setIsQuarantining(false);
    }
  };

  if (loading) {
    return <div className="p-6 max-w-7xl mx-auto">Loading recall data...</div>;
  }

  if (!lotData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Lot Not Found</h1>
        <p className="text-slate-500 mt-2">Could not find material lot with number: {params.lotNumber}</p>
      </div>
    );
  }

  const downstreamLots = lotData.downstreamLots || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            Backward Traceability & Recall
          </h1>
          <p className="text-slate-500">Impact analysis for Lot {params.lotNumber}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleQuarantine}
            disabled={isQuarantining || quarantineSuccess || downstreamLots.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
          >
            {isQuarantining ? (
              <span className="animate-pulse">Quarantining...</span>
            ) : quarantineSuccess ? (
              <>
                <CheckCircle2 size={18} />
                Quarantined
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                Quarantine All Downstream
              </>
            )}
          </button>
        </div>
      </div>

      {quarantineSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 mt-0.5" />
          <div>
            <h3 className="font-bold">Quarantine Successful</h3>
            <p className="text-sm mt-1">All {downstreamLots.length} downstream lots have been successfully quarantined and flagged in the system.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Lot Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-900">Source Lot</CardTitle>
                  <p className="text-sm font-mono text-red-700">Lot {lotData.lotNumber}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-red-500 mb-1">Material</p>
                <p className="text-sm font-bold text-red-900">{lotData.materialName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-red-500 mb-1">Status</p>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    lotData.status === 'RELEASED' ? "bg-emerald-100 text-emerald-700" :
                    lotData.status === 'QUARANTINED' ? "bg-amber-100 text-amber-700" :
                    lotData.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-700"
                  )}>
                    {lotData.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-red-500 mb-1">Supplier</p>
                  <p className="text-sm font-medium text-red-900">{lotData.supplier || 'Internal'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Impacted Downstream Lots */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Impacted Downstream Products</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {downstreamLots.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No Downstream Impact</h3>
                  <p className="text-sm text-slate-500 mt-1">This lot has not been used to produce any other materials.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {downstreamLots.map((downstream: any) => (
                    <div key={downstream.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          downstream.status === 'QUARANTINED' ? "bg-amber-100 text-amber-600" :
                          downstream.status === 'REJECTED' ? "bg-red-100 text-red-600" :
                          "bg-emerald-100 text-emerald-600"
                        )}>
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{downstream.materialName}</span>
                            <Link href={`/traceability/product/${downstream.lotNumber}`} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                              Lot {downstream.lotNumber}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Factory size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Produced in Batch #{downstream.producedInBatch}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium uppercase tracking-wider",
                          downstream.status === 'QUARANTINED' ? "bg-amber-100 text-amber-700" :
                          downstream.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {downstream.status}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">{downstream.quantity} {downstream.unit}</p>
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
