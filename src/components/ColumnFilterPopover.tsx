import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, CheckSquare, Square, MinusSquare, Check, Filter } from 'lucide-react';
import { formatCompactNumber, formatCurrency } from '../utils/formatters';

export interface ColumnFilterItem {
  id: string;
  label: string;
  sublabel?: string;
  count: number;
  amount?: number;
}

interface ColumnFilterPopoverProps {
  columnTitle: string;
  items: ColumnFilterItem[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  currencyPrefix?: string;
  showAmount?: boolean;
}

export const ColumnFilterPopover: React.FC<ColumnFilterPopoverProps> = ({
  columnTitle,
  items,
  selectedValues,
  onChange,
  currencyPrefix = 'LKR',
  showAmount = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const isFiltered = selectedValues.length > 0;
  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedValues.includes(item.id));
  const isPartiallySelected =
    filteredItems.some((item) => selectedValues.includes(item.id)) && !isAllSelected;

  const handleToggleItem = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  // Quick isolate: filter to only this 1 record!
  const handleSelectOnly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([id]);
    setIsOpen(false);
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect currently filtered
      const filteredIds = new Set(filteredItems.map((i) => i.id));
      onChange(selectedValues.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all currently filtered
      const newSet = new Set(selectedValues);
      filteredItems.forEach((i) => newSet.add(i.id));
      onChange(Array.from(newSet));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef} onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button in Table Header */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
          isFiltered
            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title={isFiltered ? `Filtered: ${selectedValues.length} selected` : `Filter by ${columnTitle}`}
      >
        <Filter className="w-3 h-3" />
        {isFiltered && (
          <span className="text-[9px] px-1 bg-slate-950 text-amber-300 rounded font-mono font-bold leading-none py-0.5">
            {selectedValues.length}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-72 sm:w-80 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden text-slate-200">
          {/* Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Filter: {columnTitle}</span>
              </span>
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                >
                  Clear ({selectedValues.length})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${columnTitle.toLowerCase()}...`}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 pr-7"
                autoFocus
                onClick={(e) => e.stopPropagation()}
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
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
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
                <span>(Select All • {filteredItems.length})</span>
              </button>

              <span className="text-[10px] text-slate-400">
                {selectedValues.length} of {items.length}
              </span>
            </div>
          </div>

          {/* List of items */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 p-1">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No matching values found
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedValues.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800/80 cursor-pointer select-none text-xs transition-colors ${
                      isSelected ? 'bg-amber-500/15 text-white font-medium' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400 cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[11px]">
                          {item.label}
                        </div>
                        {item.sublabel && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* "Only" button on hover for 1-click single isolation */}
                      <button
                        type="button"
                        onClick={(e) => handleSelectOnly(item.id, e)}
                        className="hidden group-hover:inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/40 cursor-pointer"
                        title={`Filter ONLY to this record: ${item.label}`}
                      >
                        Only
                      </button>

                      <div className="text-right">
                        {showAmount && item.amount !== undefined && (
                          <div className="text-[11px] font-mono text-slate-200">
                            {currencyPrefix} {formatCompactNumber(item.amount)}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400">
                          {item.count} {item.count === 1 ? 'row' : 'rows'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Select 1 or multiple
            </span>
            <div className="flex items-center gap-2">
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
