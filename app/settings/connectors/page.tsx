'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ConnectorEndpointForm } from '@/components/ConnectorEndpointForm';
import { ConnectorTagTable } from '@/components/ConnectorTagTable';
import { DiscoveryModal } from '@/components/DiscoveryModal';
import { BridgeConfigForm } from '@/components/BridgeConfigForm';
import { EnergyMeterConfig } from '@/components/EnergyMeterConfig';
import { Plug, Plus, Search, Server, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Endpoint = {
  id: string;
  name: string;
  protocol: string;
  enabled: boolean;
  siteId: string;
  site?: { name: string };
  area?: { name: string };
  line?: { name: string };
  equipment?: { name: string };
  config: Record<string, unknown>;
  pollingInterval: number;
  tags: Array<{
    id: string;
    sourceId: string;
    mqttTopic: string;
    name: string;
    dataType?: string;
    writable: boolean;
    unit?: string;
  }>;
};

export default function ConnectorsSettingsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'tags' | 'bridges' | 'energy'>('endpoints');
  const [showEndpointForm, setShowEndpointForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEndpoints = async () => {
    try {
      const res = await fetch('/api/connector/endpoints');
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
        if (!selectedEndpoint && data.length > 0) {
          setSelectedEndpoint(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleEndpointSaved = () => {
    setShowEndpointForm(false);
    setEditingEndpoint(null);
    fetchEndpoints();
  };

  const handleTagAdded = () => {
    fetchEndpoints();
    if (selectedEndpoint) {
      const updated = endpoints.find((e) => e.id === selectedEndpoint.id);
      if (updated) setSelectedEndpoint(updated);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Plug className="text-teal-600" />
            Industrial Connectors
          </h1>
          <p className="text-slate-500">Configure OPC UA, Modbus, and S7 PLC connections and tag mappings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDiscovery(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            <Search size={18} />
            Discover Tags
          </button>
          <button
            onClick={() => {
              setEditingEndpoint(null);
              setShowEndpointForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            Add Endpoint
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-sm text-slate-500">Loading...</div>
              ) : endpoints.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">No endpoints configured</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {endpoints.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-slate-50 transition-colors',
                        selectedEndpoint?.id === ep.id && 'bg-teal-50 border-l-2 border-teal-600'
                      )}
                    >
                      <Server size={16} className="text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{ep.name}</div>
                        <div className="text-xs text-slate-500">{ep.protocol}</div>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 rotate-[-90deg]" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex gap-2 border-b border-slate-200">
            {(['endpoints', 'tags', 'bridges', 'energy'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {tab === 'energy' ? 'Energy meters' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'endpoints' && selectedEndpoint && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedEndpoint.name}</CardTitle>
                <button
                  onClick={() => {
                    setEditingEndpoint(selectedEndpoint);
                    setShowEndpointForm(true);
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Protocol</span>
                    <div className="font-medium">{selectedEndpoint.protocol}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Site</span>
                    <div className="font-medium">{selectedEndpoint.site?.name || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Equipment</span>
                    <div className="font-medium">{selectedEndpoint.equipment?.name || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Polling</span>
                    <div className="font-medium">{selectedEndpoint.pollingInterval}ms</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Config</span>
                  <pre className="mt-1 p-3 bg-slate-50 rounded-lg text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedEndpoint.config, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'tags' && selectedEndpoint && (
            <ConnectorTagTable
              endpoint={selectedEndpoint}
              onRefresh={handleTagAdded}
              onDiscover={() => setShowDiscovery(true)}
            />
          )}

          {activeTab === 'bridges' && (
            <BridgeConfigForm />
          )}

          {activeTab === 'energy' && (
            <EnergyMeterConfig />
          )}
        </div>
      </div>

      {showEndpointForm && (
        <ConnectorEndpointForm
          endpoint={editingEndpoint}
          onSaved={handleEndpointSaved}
          onCancel={() => {
            setShowEndpointForm(false);
            setEditingEndpoint(null);
          }}
        />
      )}

      {showDiscovery && (
        <DiscoveryModal
          onClose={() => setShowDiscovery(false)}
          onTagsAdded={handleTagAdded}
          endpointId={selectedEndpoint?.id}
        />
      )}
    </div>
  );
}
