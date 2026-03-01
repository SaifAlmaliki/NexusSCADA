'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateRecipeModal({ onCreated }: { onCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    productType: 'Resin',
    version: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsOpen(false);
        setFormData({ name: '', productType: 'Resin', version: 1 });
        onCreated?.();
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create recipe');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
      >
        <Plus size={18} className="mr-2" />
        Create Recipe
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Recipe</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Recipe Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2"
                  placeholder="e.g. Polymer A"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.productType}
                  onChange={e => setFormData({ ...formData, productType: e.target.value })}
                >
                  <option value="Resin">Resin</option>
                  <option value="Solvent">Solvent</option>
                  <option value="Catalyst">Catalyst</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.version}
                  onChange={e => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
