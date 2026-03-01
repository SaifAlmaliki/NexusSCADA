'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Search, Filter, Plus, MoreHorizontal, Play, Edit, Eye, XCircle } from 'lucide-react';
import { cn } from '@/components/Sidebar';

const mockOrders = [
  { id: 'ORD-992', recipe: 'Polymer A - v2', start: '2023-10-25 08:00', end: '2023-10-25 14:30', status: 'running', quantity: 5000 },
  { id: 'ORD-993', recipe: 'Solvent Mix B', start: '2023-10-25 10:15', end: '2023-10-25 16:00', status: 'running', quantity: 2500 },
  { id: 'ORD-994', recipe: 'Catalyst C', start: '2023-10-26 09:30', end: '2023-10-26 18:00', status: 'planned', quantity: 1000 },
  { id: 'ORD-995', recipe: 'Polymer A - v2', start: '2023-10-27 07:45', end: '2023-10-27 13:15', status: 'planned', quantity: 5000 },
  { id: 'ORD-991', recipe: 'Resin D', start: '2023-10-24 06:00', end: '2023-10-24 12:00', status: 'completed', quantity: 3000 },
];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = mockOrders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.recipe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Production Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track production orders across all units.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Plus size={18} className="mr-2" />
          Create Order
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search orders or recipes..." 
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
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Recipe</th>
                <th className="px-6 py-3 font-medium">Planned Start</th>
                <th className="px-6 py-3 font-medium">Planned End</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Quantity (kg)</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                    <td className="px-6 py-4 text-slate-600">{order.recipe}</td>
                    <td className="px-6 py-4 text-slate-600">{order.start}</td>
                    <td className="px-6 py-4 text-slate-600">{order.end}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                        order.status === 'running' ? "bg-blue-100 text-blue-700" :
                        order.status === 'planned' ? "bg-slate-100 text-slate-700" :
                        order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{order.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'planned' && (
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Start Order">
                            <Play size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        {order.status === 'planned' && (
                          <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                        )}
                        {order.status === 'planned' && (
                          <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Cancel">
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">No orders found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing 1 to {filteredOrders.length} of {filteredOrders.length} entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
