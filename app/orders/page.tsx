import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ClipboardList, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/components/Sidebar';
import { CreateOrderModal } from '@/components/CreateOrderModal';

export default async function OrdersPage() {
  const orders = await prisma.workOrder.findMany({
    include: {
      line: true,
      batches: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Orders</h1>
          <p className="text-slate-500">Manage and dispatch MES orders</p>
        </div>
        <div className="flex gap-3">
          <CreateOrderModal />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Order Number</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Line</th>
                  <th className="px-4 py-3 font-medium">Target Qty</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Batches</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{order.product}</td>
                    <td className="px-4 py-3 text-slate-600">{order.line.name}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{order.targetQty}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                        order.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                        order.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                        order.status === 'PAUSED' ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.batches.length}</td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-medium transition-colors"
                      >
                        Details
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                      No orders found.
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
