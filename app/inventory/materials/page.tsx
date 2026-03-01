'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/Card';
import { Search, Filter, Plus, Edit, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockMaterials = [
  { id: 'MAT-101', name: 'Polymer Base Alpha', stock: 8500, unit: 'L', location: 'Tank T-101', reorderPoint: 2000, status: 'normal' },
  { id: 'MAT-102', name: 'Solvent X', stock: 1500, unit: 'L', location: 'Tank T-102', reorderPoint: 2000, status: 'low' },
  { id: 'MAT-201', name: 'Catalyst Powder', stock: 3000, unit: 'kg', location: 'Silo S-101', reorderPoint: 1000, status: 'normal' },
  { id: 'MAT-202', name: 'Additive Y', stock: 160, unit: 'kg', location: 'Silo S-102', reorderPoint: 500, status: 'critical' },
  { id: 'MAT-301', name: 'Packaging Film', stock: 12000, unit: 'm', location: 'Warehouse A', reorderPoint: 5000, status: 'normal' },
];

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = mockMaterials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Raw Materials</h1>
          <p className="text-sm text-slate-500 mt-1">Manage inventory levels, locations, and reorder points.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Plus size={18} className="mr-2" />
          Add Material
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search materials, IDs, or locations..." 
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
                <th className="px-6 py-3 font-medium">Material ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Current Stock</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Reorder Point</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material) => (
                  <tr key={material.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 font-mono">{material.id}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{material.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-mono font-bold",
                        material.status === 'critical' ? "text-rose-600" :
                        material.status === 'low' ? "text-amber-600" :
                        "text-slate-900"
                      )}>
                        {material.stock.toLocaleString()} {material.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{material.location}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{material.reorderPoint.toLocaleString()} {material.unit}</td>
                    <td className="px-6 py-4">
                      {material.status === 'normal' ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
                          <CheckCircle2 size={14} className="mr-1" /> Healthy
                        </span>
                      ) : material.status === 'low' ? (
                        <span className="inline-flex items-center text-amber-600 text-xs font-medium">
                          <AlertTriangle size={14} className="mr-1" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 text-xs font-medium animate-pulse">
                          <AlertTriangle size={14} className="mr-1" /> Critical
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
                          <Edit size={16} />
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
                      <p className="text-base font-medium text-slate-900">No materials found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing 1 to {filteredMaterials.length} of {filteredMaterials.length} entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
