'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

export function BatchIntegrationForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rest',
    baseUrl: '',
    authToken: '',
    pollingInterval: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/batch-integration/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Configuration saved successfully');
        window.location.reload();
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Integration Type</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="rest">REST API</option>
              <option value="opcua">OPC-UA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
            <input 
              type="url" 
              required
              className="w-full border border-slate-300 rounded-lg p-2"
              placeholder="https://api.external-mes.com"
              value={formData.baseUrl}
              onChange={e => setFormData({...formData, baseUrl: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Auth Token</label>
            <input 
              type="password" 
              required
              className="w-full border border-slate-300 rounded-lg p-2"
              placeholder="Bearer token or API key"
              value={formData.authToken}
              onChange={e => setFormData({...formData, authToken: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Polling Interval (seconds)</label>
            <input 
              type="number" 
              min="10"
              required
              className="w-full border border-slate-300 rounded-lg p-2"
              value={formData.pollingInterval}
              onChange={e => setFormData({...formData, pollingInterval: parseInt(e.target.value)})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
