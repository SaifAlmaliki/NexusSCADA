'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Droplets, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockTanks = [
  { id: 'T-101', name: 'Raw Material Tank A', material: 'Polymer Base', level: 85, capacity: 10000, unit: 'L', min: 20, max: 90, status: 'normal' },
  { id: 'T-102', name: 'Raw Material Tank B', material: 'Solvent X', level: 15, capacity: 5000, unit: 'L', min: 20, max: 90, status: 'low' },
  { id: 'T-201', name: 'Product Storage 1', material: 'Finished Resin', level: 92, capacity: 20000, unit: 'L', min: 10, max: 90, status: 'high' },
  { id: 'T-202', name: 'Product Storage 2', material: 'Finished Resin', level: 45, capacity: 20000, unit: 'L', min: 10, max: 90, status: 'normal' },
  { id: 'S-101', name: 'Silo 1', material: 'Catalyst Powder', level: 60, capacity: 5000, unit: 'kg', min: 15, max: 95, status: 'normal' },
  { id: 'S-102', name: 'Silo 2', material: 'Additive Y', level: 8, capacity: 2000, unit: 'kg', min: 10, max: 90, status: 'low' },
];

export default function TanksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tanks & Silos</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time inventory levels for bulk storage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockTanks.map((tank) => (
          <Card key={tank.id} className={cn(
            "border-t-4 transition-all hover:shadow-md",
            tank.status === 'low' ? "border-t-rose-500" :
            tank.status === 'high' ? "border-t-amber-500" :
            "border-t-teal-500"
          )}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{tank.name}</CardTitle>
                  <p className="text-xs text-slate-500 font-mono mt-1">{tank.id}</p>
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  tank.status === 'low' ? "bg-rose-50 text-rose-600" :
                  tank.status === 'high' ? "bg-amber-50 text-amber-600" :
                  "bg-teal-50 text-teal-600"
                )}>
                  <Droplets size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700">{tank.material}</p>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-3xl font-bold text-slate-900">{tank.level}%</span>
                  <span className="text-sm text-slate-500 mb-1">
                    {((tank.level / 100) * tank.capacity).toLocaleString()} / {tank.capacity.toLocaleString()} {tank.unit}
                  </span>
                </div>
              </div>

              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div 
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full transition-all duration-1000",
                    tank.status === 'low' ? "bg-rose-500" :
                    tank.status === 'high' ? "bg-amber-500" :
                    "bg-teal-500"
                  )}
                  style={{ width: `${tank.level}%` }}
                />
                {/* Min/Max markers */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: `${tank.min}%` }} title={`Min: ${tank.min}%`} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: `${tank.max}%` }} title={`Max: ${tank.max}%`} />
              </div>

              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              {tank.status !== 'normal' && (
                <div className={cn(
                  "mt-4 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md",
                  tank.status === 'low' ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                )}>
                  <AlertTriangle size={16} />
                  {tank.status === 'low' ? 'Level below minimum threshold' : 'Level approaching maximum capacity'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
