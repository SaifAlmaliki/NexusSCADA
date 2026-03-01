'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export type RecipeParameters = {
  targetTemp?: number;
  agitatorSpeed?: number;
  reactionTime?: number;
  coolingRate?: number;
};


type Props = {
  recipe: { id: string; name: string; version: number; parameters?: RecipeParameters | null };
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function EditParametersModal({ recipe, isOpen, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<RecipeParameters>({});

  useEffect(() => {
    if (recipe?.parameters && typeof recipe.parameters === 'object') {
      setParams({ ...(recipe.parameters as RecipeParameters) });
    } else {
      setParams({});
    }
  }, [recipe?.id, recipe?.parameters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && (typeof v !== 'string' || v !== ''))
    ) as RecipeParameters;
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters: cleaned })
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert('Failed to save parameters');
      }
    } catch {
      alert('Failed to save parameters');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Edit Parameters — {recipe.name} v{recipe.version}.0
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 85"
              className="w-full border border-slate-300 rounded-lg p-2"
              value={params.targetTemp ?? ''}
              onChange={e => setParams({ ...params, targetTemp: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agitator Speed (RPM)</label>
            <input
              type="number"
              placeholder="e.g. 150"
              className="w-full border border-slate-300 rounded-lg p-2"
              value={params.agitatorSpeed ?? ''}
              onChange={e => setParams({ ...params, agitatorSpeed: e.target.value === '' ? undefined : parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reaction Time (min)</label>
            <input
              type="number"
              placeholder="e.g. 120"
              className="w-full border border-slate-300 rounded-lg p-2"
              value={params.reactionTime ?? ''}
              onChange={e => setParams({ ...params, reactionTime: e.target.value === '' ? undefined : parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cooling Rate (°C/min)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 2.5"
              className="w-full border border-slate-300 rounded-lg p-2"
              value={params.coolingRate ?? ''}
              onChange={e => setParams({ ...params, coolingRate: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Parameters'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
