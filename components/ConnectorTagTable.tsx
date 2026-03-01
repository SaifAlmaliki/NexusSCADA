'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Plus, Search, Trash2 } from 'lucide-react';

type Tag = {
  id: string;
  sourceId: string;
  mqttTopic: string;
  name: string;
  dataType?: string;
  writable: boolean;
  unit?: string;
};

type Endpoint = {
  id: string;
  name: string;
  protocol: string;
  tags: Tag[];
};

export function ConnectorTagTable({
  endpoint,
  onRefresh,
  onDiscover,
}: {
  endpoint: Endpoint;
  onRefresh: () => void;
  onDiscover: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState({ sourceId: '', name: '', mqttTopic: '', dataType: '', writable: false, unit: '' });

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/connector/endpoints/${endpoint.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: newTag.sourceId,
          name: newTag.name,
          mqttTopic: newTag.mqttTopic || undefined,
          dataType: newTag.dataType || undefined,
          writable: newTag.writable,
          unit: newTag.unit || undefined,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewTag({ sourceId: '', name: '', mqttTopic: '', dataType: '', writable: false, unit: '' });
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add tag');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Delete this tag?')) return;
    try {
      const res = await fetch(`/api/connector/endpoints/${endpoint.id}/tags/${tagId}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const topicHint = endpoint.protocol === 'OPC_UA'
    ? 'e.g. ns=2;s=Temperature'
    : endpoint.protocol === 'MODBUS_TCP'
    ? 'e.g. 100:holding:1 (address:type:length)'
    : 'e.g. DB1,REAL0';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tags for {endpoint.name}</CardTitle>
        <div className="flex gap-2">
          <button
            onClick={onDiscover}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <Search size={16} />
            Discover
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={16} />
            Add Tag
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {endpoint.tags.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No tags configured. Add tags manually or use Discover to scan the PLC.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-medium text-slate-700">Name</th>
                  <th className="text-left py-2 font-medium text-slate-700">Source ID</th>
                  <th className="text-left py-2 font-medium text-slate-700">MQTT Topic</th>
                  <th className="text-left py-2 font-medium text-slate-700">Writable</th>
                  <th className="text-left py-2 font-medium text-slate-700">Unit</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {endpoint.tags.map((tag) => (
                  <tr key={tag.id} className="border-b border-slate-100">
                    <td className="py-2">{tag.name}</td>
                    <td className="py-2 font-mono text-xs">{tag.sourceId}</td>
                    <td className="py-2 font-mono text-xs truncate max-w-[200px]">{tag.mqttTopic}</td>
                    <td className="py-2">{tag.writable ? 'Yes' : 'No'}</td>
                    <td className="py-2">{tag.unit || '-'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && (
          <form onSubmit={handleAddTag} className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
            <h4 className="font-medium text-slate-800">Add Tag</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                  placeholder="e.g. Temperature"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Source ID</label>
                <input
                  type="text"
                  required
                  value={newTag.sourceId}
                  onChange={(e) => setNewTag({ ...newTag, sourceId: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm font-mono"
                  placeholder={topicHint}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">MQTT Topic (optional)</label>
                <input
                  type="text"
                  value={newTag.mqttTopic}
                  onChange={(e) => setNewTag({ ...newTag, mqttTopic: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm font-mono"
                  placeholder="plant/{site}/{equipment}/{tag}"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Unit (optional)</label>
                <input
                  type="text"
                  value={newTag.unit}
                  onChange={(e) => setNewTag({ ...newTag, unit: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                  placeholder="°C, bar, %"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newTag.writable}
                onChange={(e) => setNewTag({ ...newTag, writable: e.target.checked })}
              />
              <span className="text-sm">Writable</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm font-medium">
                Add
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-slate-600 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
