'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/Card';
import { Search, Filter, Plus, Edit, Eye, Archive, CheckCircle2, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockRecipes = [
  { id: 'RCP-001', name: 'Polymer A', version: 2, productType: 'Resin', lastModified: '2023-10-20', status: 'active' },
  { id: 'RCP-002', name: 'Solvent Mix B', version: 1, productType: 'Solvent', lastModified: '2023-09-15', status: 'active' },
  { id: 'RCP-003', name: 'Catalyst C', version: 4, productType: 'Catalyst', lastModified: '2023-10-25', status: 'active' },
  { id: 'RCP-004', name: 'Polymer A', version: 1, productType: 'Resin', lastModified: '2023-01-10', status: 'archived' },
  { id: 'RCP-005', name: 'Resin D', version: 3, productType: 'Resin', lastModified: '2023-08-05', status: 'active' },
];

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<typeof mockRecipes[0] | null>(null);

  const filteredRecipes = mockRecipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recipe Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage production recipes, versions, and parameters.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Plus size={18} className="mr-2" />
          Create Recipe
        </button>
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
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map((recipe) => (
                    <tr 
                      key={recipe.id} 
                      onClick={() => setSelectedRecipe(recipe)}
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors",
                        selectedRecipe?.id === recipe.id ? "bg-teal-50/50" : ""
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{recipe.name}</td>
                      <td className="px-6 py-4 text-slate-600">v{recipe.version}.0</td>
                      <td className="px-6 py-4 text-slate-600">{recipe.productType}</td>
                      <td className="px-6 py-4 text-slate-600">{recipe.lastModified}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          recipe.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {recipe.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="View Details">
                            <Eye size={16} />
                          </button>
                          {recipe.status === 'active' && (
                            <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
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
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Target Temp</span>
                    <span className="font-medium text-slate-900 font-mono">85.0 °C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Agitator Speed</span>
                    <span className="font-medium text-slate-900 font-mono">150 RPM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Reaction Time</span>
                    <span className="font-medium text-slate-900 font-mono">120 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cooling Rate</span>
                    <span className="font-medium text-slate-900 font-mono">2.5 °C/min</span>
                  </div>
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
                    <span className="text-blue-700/70 text-xs">{selectedRecipe.lastModified}</span>
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
                <button className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Edit Parameters
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
