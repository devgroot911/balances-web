import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { formatCompactNumber } from '../utils/formatters';

export interface SlicerOption {
  id: string;
  label: string;
  sublabel?: string;
  count: number;
  amount: number;
}

interface SlicerDropdownProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  options: SlicerOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  currencyPrefix?: string;
  placeholderSearch?: string;
}

export const SlicerDropdown: React.FC<SlicerDropdownProps> = ({
  id,
  title,
  icon,
  options,
  selectedIds,
  onChange,
  currencyPrefix = 'LKR',
  placeholderSearch = 'Search...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Selected count
  const selectedCount = selectedIds.length;
  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((opt) => selectedIds.includes(opt.id));
  const isPartiallySelected =
    filteredOptions.some((opt) => selectedIds.includes(opt.id)) && !isAllSelected;

  const handleToggleOption = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all currently filtered options
      const filteredIds = new Set(filteredOptions.map((o) => o.id));
      onChange(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all currently filtered options
      const newSet = new Set(selectedIds);
      filteredOptions.forEach((o) => newSet.add(o.id));
      onChange(Array.from(newSet));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={`slicer-btn-${id}`}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
          selectedCount > 0
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-white'
        }`}
      >
        {icon && <span className="text-slate-400">{icon}</span>}
        <span>{title}</span>
        {selectedCount > 0 ? (
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
            {selectedCount}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">({options.length})</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 ml-0.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={`slicer-panel-${id}`}
          className="absolute z-50 left-0 mt-1 w-72 sm:w-80 rounded-lg bg-slate-900 border border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-900/95 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {icon}
                <span>Filter by {title}</span>
              </span>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                >
                  Clear ({selectedCount})
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholderSearch}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 pr-7"
                autoFocus
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2" />
              )}
            </div>

            {/* Select All Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none text-[11px]"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                ) : isPartiallySelected ? (
                  <MinusSquare className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>(Select All {filteredOptions.length > 0 && `• ${filteredOptions.length}`})</span>
              </button>

              <span className="text-[10px] text-slate-400">
                {selectedCount} of {options.length} selected
              </span>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800/80 cursor-pointer select-none text-xs transition-colors ${
                      isSelected ? 'bg-amber-500/10 text-white' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleOption(option.id)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono font-medium text-[11px]">
                          {option.label}
                        </div>
                        {option.sublabel && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {option.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right stats: count & amount */}
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono font-medium text-slate-300">
                        {currencyPrefix} {formatCompactNumber(option.amount)}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {option.count} {option.count === 1 ? 'line' : 'lines'}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Multiple selections enabled
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
