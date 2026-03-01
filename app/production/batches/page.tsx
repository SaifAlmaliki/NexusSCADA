'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/Card';
import { Search, Filter, Eye, Activity, GitMerge, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const mockBatches = [
  { 
    id: 'B-1042', orderId: 'ORD-992', reactor: 'R-101', state: 'running', start: '2023-10-25 08:00', end: '-', operator: 'Jane Doe', quality: 'pending',
    genealogy: {
      consumed: [
        { id: 'MAT-101', name: 'Polymer Base Alpha', qty: 2500, unit: 'L', lot: 'LOT-A102' },
        { id: 'MAT-201', name: 'Catalyst Powder', qty: 50, unit: 'kg', lot: 'LOT-C099' }
      ],
      produced: [
        { id: 'PRD-001', name: 'Intermediate Resin', qty: 2540, unit: 'L', lot: 'LOT-B1042' }
      ]
    }
  },
  { 
    id: 'B-1043', orderId: 'ORD-993', reactor: 'R-102', state: 'setup', start: '2023-10-25 10:15', end: '-', operator: 'John Smith', quality: 'pending',
    genealogy: { consumed: [], produced: [] }
  },
  { 
    id: 'B-1044', orderId: 'ORD-994', reactor: 'R-201', state: 'hold', start: '2023-10-26 09:30', end: '-', operator: 'Alice Jones', quality: 'pending',
    genealogy: {
      consumed: [{ id: 'MAT-102', name: 'Solvent X', qty: 1000, unit: 'L', lot: 'LOT-S44' }],
      produced: []
    }
  },
  { 
    id: 'B-1041', orderId: 'ORD-991', reactor: 'R-101', state: 'completed', start: '2023-10-24 06:00', end: '2023-10-24 12:00', operator: 'Jane Doe', quality: 'pass',
    genealogy: {
      consumed: [
        { id: 'MAT-101', name: 'Polymer Base Alpha', qty: 3000, unit: 'L', lot: 'LOT-A101' },
        { id: 'MAT-202', name: 'Additive Y', qty: 15, unit: 'kg', lot: 'LOT-Y012' }
      ],
      produced: [
        { id: 'PRD-002', name: 'Finished Resin D', qty: 3010, unit: 'L', lot: 'LOT-B1041' }
      ]
    }
  },
];

export default function BatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<typeof mockBatches[0] | null>(null);

  const filteredBatches = mockBatches.filter(b => 
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.reactor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Production Batches</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor active batches and track material genealogy.</p>
        </div>
      </div>

      <div className={cn("grid gap-6 transition-all", selectedBatch ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1")}>
        <Card className={cn(selectedBatch ? "xl:col-span-2" : "")}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search batches, orders, or reactors..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={16} className="mr-2" />
                Filter
              </button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Batch ID</th>
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Reactor</th>
                  <th className="px-6 py-3 font-medium">State</th>
                  <th className="px-6 py-3 font-medium">Start Time</th>
                  <th className="px-6 py-3 font-medium">Quality</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => (
                    <tr 
                      key={batch.id} 
                      onClick={() => setSelectedBatch(batch)}
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors",
                        selectedBatch?.id === batch.id ? "bg-teal-50/50" : ""
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{batch.id}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <Link href={`/production/orders?search=${batch.orderId}`} className="hover:text-teal-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {batch.orderId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{batch.reactor}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          batch.state === 'running' ? "bg-blue-100 text-blue-700" :
                          batch.state === 'setup' ? "bg-amber-100 text-amber-700" :
                          batch.state === 'completed' ? "bg-emerald-100 text-emerald-700" :
                          batch.state === 'hold' ? "bg-slate-200 text-slate-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {batch.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{batch.start}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          batch.quality === 'pass' ? "bg-emerald-100 text-emerald-700" :
                          batch.quality === 'fail' ? "bg-rose-100 text-rose-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {batch.quality}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/scada/trends?batchId=${batch.id}`} onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="View Trends">
                            <Activity size={16} />
                          </Link>
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-8 w-8 text-slate-300 mb-3" />
                        <p className="text-base font-medium text-slate-900">No batches found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedBatch && (
          <Card className="h-fit sticky top-6">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedBatch.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500 font-mono">{selectedBatch.reactor}</span>
                  <span className="text-slate-300">•</span>
                  <span className={cn(
                    "text-xs font-medium capitalize",
                    selectedBatch.state === 'running' ? "text-blue-600" : 
                    selectedBatch.state === 'completed' ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {selectedBatch.state}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <Clock size={16} className="mr-2 text-blue-500" />
                  Execution Timeline
                </h4>
                <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <p className="text-xs text-slate-500">{selectedBatch.start}</p>
                    <p className="text-sm font-medium text-slate-800">Batch Setup Started</p>
                  </div>
                  <div className="relative">
                    <div className={cn("absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white", selectedBatch.state !== 'setup' ? "bg-emerald-500" : "bg-slate-300")} />
                    <p className="text-xs text-slate-500">Operator: {selectedBatch.operator}</p>
                    <p className="text-sm font-medium text-slate-800">Processing</p>
                  </div>
                  <div className="relative">
                    <div className={cn("absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white", selectedBatch.state === 'completed' ? "bg-emerald-500" : "bg-slate-300")} />
                    <p className="text-xs text-slate-500">{selectedBatch.end}</p>
                    <p className="text-sm font-medium text-slate-800">Batch Completed</p>
                  </div>
                </div>
              </div>

              {/* Genealogy */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <GitMerge size={16} className="mr-2 text-purple-500" />
                  Material Genealogy
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Consumed Materials</h5>
                    {selectedBatch.genealogy.consumed.length > 0 ? (
                      <div className="space-y-2">
                        {selectedBatch.genealogy.consumed.map((mat, idx) => (
                          <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                            <div className="flex justify-between font-medium text-slate-800">
                              <span>{mat.name}</span>
                              <span className="font-mono">{mat.qty} {mat.unit}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                              <span>ID: {mat.id}</span>
                              <span>Lot: {mat.lot}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No materials consumed yet.</p>
                    )}
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Produced Materials</h5>
                    {selectedBatch.genealogy.produced.length > 0 ? (
                      <div className="space-y-2">
                        {selectedBatch.genealogy.produced.map((mat, idx) => (
                          <div key={idx} className="bg-emerald-50/50 p-2 rounded border border-emerald-100 text-sm">
                            <div className="flex justify-between font-medium text-emerald-900">
                              <span>{mat.name}</span>
                              <span className="font-mono">{mat.qty} {mat.unit}</span>
                            </div>
                            <div className="flex justify-between text-xs text-emerald-600/70 mt-1">
                              <span>ID: {mat.id}</span>
                              <span>Lot: {mat.lot}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No materials produced yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
