'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  File, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Loader2,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/components/Sidebar';

type Site = {
  id: string;
  name: string;
};

type Document = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
};

export default function DocumentsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchDocuments(selectedSite);
    } else {
      setDocuments([]);
    }
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites');
      if (res.ok) {
        const data = await res.json();
        setSites(data);
        if (data.length > 0) {
          setSelectedSite(data[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error);
      setLoading(false);
    }
  };

  const fetchDocuments = async (siteId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSite) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', selectedSite);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchDocuments(selectedSite);
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== id));
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Document Management</h1>
          <p className="text-sm text-slate-500 mt-1">Shared storage for site-specific documentation</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm"
          >
            <option value="" disabled>Select a site...</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedSite || uploading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Document
            </button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FolderOpen className="w-5 h-5 mr-2 text-indigo-500" />
            {sites.find(s => s.id === selectedSite)?.name || 'Select a site'} Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !selectedSite ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FolderOpen className="w-12 h-12 mb-4 text-slate-300" />
              <p>Please select a site to view documents.</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FileText className="w-12 h-12 mb-4 text-slate-300" />
              <p>No documents found for this site.</p>
              <p className="text-sm mt-2">Upload a document to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="group relative flex flex-col bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="mt-1 flex items-center text-xs text-slate-500 space-x-2">
                      <span>{formatSize(doc.size)}</span>
                      <span>•</span>
                      <span className="truncate">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500">
                    <span className="truncate">Uploaded by {doc.uploadedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
