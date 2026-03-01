import { BatchIntegrationForm } from '@/components/BatchIntegrationForm';
import { SyncStatusTable } from '@/components/SyncStatusTable';
import { Settings, Server } from 'lucide-react';

export default function BatchIntegrationSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Server className="text-indigo-600" />
            Batch Integration Settings
          </h1>
          <p className="text-slate-500">Configure connections to external MES or ERP systems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <BatchIntegrationForm />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <SyncStatusTable />
        </div>
      </div>
    </div>
  );
}
