'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Save, Globe, Bell, Link as LinkIcon, Shield, Server, Mail, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'plants' | 'integrations' | 'notifications'>('general');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure global application settings and integrations.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Save size={18} className="mr-2" />
          Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-64 h-fit flex-shrink-0">
          <div className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'general' ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Globe size={18} className="mr-3" /> General
            </button>
            <button
              onClick={() => setActiveTab('plants')}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'plants' ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Server size={18} className="mr-3" /> Plants & Units
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'integrations' ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <LinkIcon size={18} className="mr-3" /> Integrations
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'notifications' ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Bell size={18} className="mr-3" /> Notifications
            </button>
          </div>
        </Card>

        <div className="flex-1">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Application Name</label>
                    <input type="text" defaultValue="Nexus SCADA" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Timezone</label>
                    <select defaultValue="UTC" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                      <option value="CET">CET (Central European Time)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data Retention (Historian)</label>
                    <select defaultValue="90" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">1 Year</option>
                      <option value="1825">5 Years</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Theme Preference</label>
                    <select defaultValue="system" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
                    <Shield size={16} className="mr-2 text-slate-500" /> Security Policies
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">Require 2FA for Admin roles</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">Enforce strong passwords (min 12 chars, symbols)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">Auto-logout after 15 minutes of inactivity</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>External Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">Grafana Dashboard</h4>
                      <p className="text-sm text-slate-500">Embed external Grafana panels into the SCADA views.</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Connected</div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500">Grafana URL</label>
                      <input type="text" defaultValue="https://grafana.nexus-corp.internal" className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">API Key</label>
                      <input type="password" defaultValue="************************" className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">ERP System (SAP)</h4>
                      <p className="text-sm text-slate-500">Sync production orders and inventory levels.</p>
                    </div>
                    <div className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">Disconnected</div>
                  </div>
                  <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
                    Configure Connection
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Mail className="text-slate-400 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-medium text-slate-800">Email Alerts</h4>
                        <p className="text-sm text-slate-500 mt-1">Send critical alarms and daily reports via email.</p>
                        <div className="mt-3">
                          <input type="text" defaultValue="smtp.nexus-corp.internal:587" className="w-full sm:w-64 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="SMTP Server" />
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Smartphone className="text-slate-400 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-medium text-slate-800">SMS / PagerDuty</h4>
                        <p className="text-sm text-slate-500 mt-1">Send SMS for critical priority alarms only.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'plants' && (
            <Card>
              <CardHeader>
                <CardTitle>Plants & Units Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">Manage physical locations and production units.</p>
                <div className="space-y-3">
                  {['Plant Alpha (NY)', 'Plant Beta (TX)', 'Plant Gamma (CA)'].map(plant => (
                    <div key={plant} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-800">{plant}</span>
                      <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">Edit Units</button>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                    + Add New Plant
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
