'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/Card';
import { Search, Filter, Edit, Eye, Archive, CheckCircle2, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateRecipeModal } from '@/components/CreateRecipeModal';
import { EditParametersModal, type RecipeParameters } from '@/components/EditParametersModal';

type Recipe = {
  id: string;
  name: string;
  version: number;
  productType: string;
  status: string;
  updatedAt: string;
  parameters?: RecipeParameters | null;
};


export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editParamsOpen, setEditParamsOpen] = useState(false);

  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
        if (data.length === 0) {
          await fetch('/api/recipes/seed', { method: 'POST' });
          const retry = await fetch('/api/recipes');
          if (retry.ok) setRecipes(await retry.json());
        }
        return data;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    return [];
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recipe Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage production recipes, versions, and parameters.</p>
        </div>
        <CreateRecipeModal onCreated={fetchRecipes} />
      </div>

      <div className={cn("grid gap-6 transition-all", selectedRecipe ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1")}>
        <Card className={cn(selectedRecipe ? "lg:col-span-2" : "")}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search recipes or product types..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={16} className="mr-2" />
                Filter
              </button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Recipe Name</th>
                  <th className="px-6 py-3 font-medium">Version</th>
                  <th className="px-6 py-3 font-medium">Product Type</th>
                  <th className="px-6 py-3 font-medium">Last Modified</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Loading recipes...
                    </td>
                  </tr>
                ) : filteredRecipes.length > 0 ? (
                  filteredRecipes.map((recipe) => (
                    <tr 
                      key={recipe.id} 
                      onClick={() => setSelectedRecipe(recipe)}
                      role="button"
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors",
                        selectedRecipe?.id === recipe.id ? "bg-teal-50/50" : ""
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{recipe.name}</td>
                      <td className="px-6 py-4 text-slate-600">v{recipe.version}.0</td>
                      <td className="px-6 py-4 text-slate-600">{recipe.productType}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(recipe.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          recipe.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {recipe.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="View Details" onClick={() => setSelectedRecipe(recipe)}>
                            <Eye size={16} />
                          </button>
                          {recipe.status === 'active' && (
                            <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit" onClick={() => { setSelectedRecipe(recipe); setEditParamsOpen(true); }}>
                              <Edit size={16} />
                            </button>
                          )}
                          {recipe.status === 'active' && (
                            <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Archive">
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-8 w-8 text-slate-300 mb-3" />
                        <p className="text-base font-medium text-slate-900">No recipes found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedRecipe && (
          <Card className="h-fit sticky top-6">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedRecipe.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500 font-mono">v{selectedRecipe.version}.0</span>
                  <span className="text-slate-300">•</span>
                  <span className={cn(
                    "text-xs font-medium",
                    selectedRecipe.status === 'active' ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {selectedRecipe.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <CheckCircle2 size={16} className="mr-2 text-teal-500" />
                  Key Parameters
                </h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                  {selectedRecipe.parameters && Object.keys(selectedRecipe.parameters).length > 0 ? (
                    <>
                      {selectedRecipe.parameters.targetTemp != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Target Temp</span>
                          <span className="font-medium text-slate-900 font-mono">{selectedRecipe.parameters.targetTemp} °C</span>
                        </div>
                      )}
                      {selectedRecipe.parameters.agitatorSpeed != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Agitator Speed</span>
                          <span className="font-medium text-slate-900 font-mono">{selectedRecipe.parameters.agitatorSpeed} RPM</span>
                        </div>
                      )}
                      {selectedRecipe.parameters.reactionTime != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Reaction Time</span>
                          <span className="font-medium text-slate-900 font-mono">{selectedRecipe.parameters.reactionTime} min</span>
                        </div>
                      )}
                      {selectedRecipe.parameters.coolingRate != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Cooling Rate</span>
                          <span className="font-medium text-slate-900 font-mono">{selectedRecipe.parameters.coolingRate} °C/min</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No parameters configured. Click Edit Parameters to set them.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <History size={16} className="mr-2 text-blue-500" />
                  Version History
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm p-2 bg-blue-50/50 rounded border border-blue-100">
                    <div>
                      <span className="font-medium text-blue-900">v{selectedRecipe.version}.0</span>
                      <span className="text-blue-600/70 ml-2 text-xs">Current</span>
                    </div>
                    <span className="text-blue-700/70 text-xs">{formatDate(selectedRecipe.updatedAt)}</span>
                  </div>
                  {selectedRecipe.version > 1 && (
                    <div className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded border border-transparent cursor-pointer transition-colors">
                      <span className="font-medium text-slate-600">v{selectedRecipe.version - 1}.0</span>
                      <span className="text-slate-400 text-xs">Previous</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditParamsOpen(true)}
                  disabled={selectedRecipe.status !== 'active'}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Edit Parameters
                </button>
              </div>
            </div>
          </Card>
        )}

        {selectedRecipe && (
          <EditParametersModal
            recipe={selectedRecipe}
            isOpen={editParamsOpen}
            onClose={() => setEditParamsOpen(false)}
            onSaved={async () => {
            const updated = await fetchRecipes();
            if (selectedRecipe) {
              const found = updated.find((r: Recipe) => r.id === selectedRecipe.id);
              if (found) setSelectedRecipe(found);
            }
          }}
          />
        )}
      </div>
    </div>
  );
}
