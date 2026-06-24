import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export type AnalysisLevel = 'national' | 'region' | 'district';

interface Entity {
  id: number;
  name: string;
}

interface EntitySelectorProps {
  level: AnalysisLevel;
  setLevel: (level: AnalysisLevel) => void;
  availableEntities: Entity[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}

export default function EntitySelector({
  level,
  setLevel,
  availableEntities,
  selectedIds,
  setSelectedIds
}: EntitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleEntity = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeEntity = (id: number) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const selectedEntities = availableEntities.filter(e => selectedIds.includes(e.id));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-end gap-6">
        
        {/* Level Selector */}
        <div className="flex-1 max-w-xs relative z-20">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Level of Analysis</label>
          <div className="relative">
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as AnalysisLevel);
                setSelectedIds([]);
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-lg py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
            >
              <option value="national">National (Ghana)</option>
              <option value="region">Regional</option>
              <option value="district">District</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* Multi-Select Dropdown */}
        {level !== 'national' && (
          <div className="flex-[2] relative z-20">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-slate-700">
                  Select Entities to Compare (Max 4)
                </label>
                <span className="text-[11px] text-slate-500 mt-0.5">Select up to 4 items for clear visual comparison.</span>
              </div>
              <div className="flex gap-3">

                {selectedIds.length > 0 && (
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div 
              className="min-h-[46px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-wrap gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all shadow-sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedEntities.length === 0 && (
                <span className="text-slate-400 p-1.5 px-3 text-sm">Select {level}s to compare...</span>
              )}
              {selectedEntities.map(entity => (
                <span 
                  key={entity.id} 
                  className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-800 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {entity.name}
                  <button 
                    onClick={() => removeEntity(entity.id)}
                    className="hover:text-brand-900 focus:outline-none bg-brand-200/50 hover:bg-brand-300 rounded p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            {isOpen && (
              <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-auto">
                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <p className="text-xs text-slate-500 font-medium px-2">AVAILABLE ENTITIES</p>
                </div>
                {level === 'region' && (
                  <div
                    onClick={() => {
                      if (selectedIds.length === availableEntities.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(availableEntities.map(e => e.id));
                      }
                    }}
                    className="px-4 py-3 flex items-center justify-between cursor-pointer border-b border-slate-100 hover:bg-brand-50 transition-colors text-brand-600 font-semibold bg-white"
                  >
                    <span>{selectedIds.length === availableEntities.length ? 'Deselect All' : 'Select All'}</span>
                    {selectedIds.length === availableEntities.length && <Check size={18} className="text-brand-600" />}
                  </div>
                )}
                {availableEntities.map(entity => {
                  const maxSelections = 4;
                  const isSelected = selectedIds.includes(entity.id);
                  const isDisabled = !isSelected && selectedIds.length >= maxSelections;
                  
                  return (
                    <div
                      key={entity.id}
                      onClick={() => !isDisabled && toggleEntity(entity.id)}
                      className={`px-4 py-3 flex items-center justify-between cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors
                        ${isSelected ? 'bg-brand-50 text-brand-800 font-medium' : 'text-slate-700'}
                        ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      <span>{entity.name}</span>
                      {isSelected && <Check size={18} className="text-brand-600" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
