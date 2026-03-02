'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateOrderModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const router = useRouter();
  const [formData, setFormData] = useState({
    product: '',
    targetQty: 100,
    recipeId: '',
  });

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const res = await fetch('/api/recipes');
        if (res.ok) {
          const data = await res.json();
          setRecipes(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadRecipes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        product: formData.product,
        targetQty: formData.targetQty,
      };

      if (formData.recipeId) {
        payload.recipeId = formData.recipeId;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
      >
        <Plus size={18} />
        New Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Production Order</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2"
                  placeholder="e.g. Premium Widget"
                  value={formData.product}
                  onChange={e => setFormData({...formData, product: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Recipe (optional)</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  value={formData.recipeId}
                  onChange={e => {
                    const recipeId = e.target.value;
                    const selected = recipes.find(r => r.id === recipeId);
                    setFormData(prev => ({
                      ...prev,
                      recipeId,
                      product: prev.product || selected?.productType || prev.product,
                      targetQty: prev.targetQty || selected?.defaultBatchSize || prev.targetQty,
                    }));
                  }}
                >
                  <option value="">Select recipe...</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.productType})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.targetQty}
                  onChange={e => setFormData({...formData, targetQty: parseInt(e.target.value)})}
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
