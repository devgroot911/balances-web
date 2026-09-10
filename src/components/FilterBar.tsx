import React, { useMemo } from 'react';
import {
  Filter,
  RotateCcw,
  Tag,
  Briefcase,
  Layers,
  BookOpen,
  X,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { BudgetRecord, MonthMeta, MonthlyFilterState } from '../types';
import { REPORT_CATEGORIES, getRecordCategory } from '../data/categories';
import { SlicerDropdown, SlicerOption } from './SlicerDropdown';
import { formatCurrency } from '../utils/formatters';

interface FilterBarProps {
  records: BudgetRecord[];
  monthMeta: MonthMeta;
  filters: MonthlyFilterState;
  onUpdateFilters: (newFilters: Partial<MonthlyFilterState>) => void;
  onClearAll: () => void;
  filteredCount: number;
  filteredTotal: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  records,
  monthMeta,
  filters,
  onUpdateFilters,
  onClearAll,
  filteredCount,
  filteredTotal,
}) => {
  const monthKey = monthMeta.key;

  // 1. Prepare options for Activity Code Slicer
  const activityOptions: SlicerOption[] = useMemo(() => {
    const map = new Map<string, { count: number; amount: number; desc: string }>();

    for (const r of records) {
      const code = r.activityCode || 'Unassigned';
      const val = Number((r as any)[monthKey]) || 0;
      const existing = map.get(code);
      if (existing) {
        existing.count += 1;
        existing.amount += val;
      } else {
        map.set(code, {
          count: 1,
          amount: val,
          desc: r.description ? r.description.slice(0, 45) : '',
        });
      }
    }

    return Array.from(map.entries())
      .map(([code, data]) => ({
        id: code,
        label: code,
        sublabel: data.desc,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [records, monthKey]);

  // 2. Prepare options for BL (Budget Line) Slicer
  const blOptions: SlicerOption[] = useMemo(() => {
    const map = new Map<string, { count: number; amount: number; desc: string }>();

    for (const r of records) {
      const bl = r.bl || 'Unassigned';
      const val = Number((r as any)[monthKey]) || 0;
      const existing = map.get(bl);
      if (existing) {
        existing.count += 1;
        existing.amount += val;
      } else {
        map.set(bl, {
          count: 1,
          amount: val,
          desc: r.description ? r.description.slice(0, 45) : '',
        });
      }
    }

    return Array.from(map.entries())
      .map(([bl, data]) => ({
        id: bl,
        label: bl,
        sublabel: data.desc,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [records, monthKey]);

  // 3. Prepare options for Category Slicer
  const categoryOptions: SlicerOption[] = useMemo(() => {
    const map = new Map<string, { count: number; amount: number; name: string }>();

    // Seed with defined categories
    for (const cat of REPORT_CATEGORIES) {
      map.set(cat.key, { count: 0, amount: 0, name: cat.name });
    }
    map.set('other', { count: 0, amount: 0, name: 'Other Operations' });

    for (const r of records) {
      const catName = getRecordCategory(r);
      const catDef = REPORT_CATEGORIES.find((c) => c.name === catName);
      const catKey = catDef ? catDef.key : 'other';
      const val = Number((r as any)[monthKey]) || 0;

      const item = map.get(catKey);
      if (item) {
        item.count += 1;
        item.amount += val;
      }
    }

    return Array.from(map.entries())
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({
        id: key,
        label: data.name,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [records, monthKey]);

  // 4. Prepare options for G/L Account Slicer
  const glOptions: SlicerOption[] = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();

    for (const r of records) {
      const gl = r.glAccount || 'Unassigned';
      const val = Number((r as any)[monthKey]) || 0;
      const existing = map.get(gl);
      if (existing) {
        existing.count += 1;
        existing.amount += val;
      } else {
        map.set(gl, { count: 1, amount: val });
      }
    }

    return Array.from(map.entries())
      .map(([gl, data]) => ({
        id: gl,
        label: gl,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [records, monthKey]);

  // Total active filter count
  const activeFiltersCount =
    filters.activityCodes.length +
    filters.bls.length +
    filters.categories.length +
    filters.glAccounts.length +
    filters.descriptions.length +
    (filters.nonZeroOnly || filters.amountFilter.nonZeroOnly ? 1 : 0) +
    (filters.amountFilter.zeroOnly ? 1 : 0) +
    (filters.amountFilter.minAmount !== null || filters.amountFilter.maxAmount !== null ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-3 sm:p-3.5 shadow-sm space-y-2.5">
      {/* Top row: Slicers & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Slicers / Filters:</span>
          </div>

          {/* Activity Code Slicer */}
          <SlicerDropdown
            id="activity-code"
            title="Activity Code"
            icon={<Tag className="w-3.5 h-3.5 text-blue-400" />}
            options={activityOptions}
            selectedIds={filters.activityCodes}
            onChange={(selectedIds) => onUpdateFilters({ activityCodes: selectedIds })}
            placeholderSearch="Search activity codes..."
          />

          {/* BL Slicer */}
          <SlicerDropdown
            id="bl"
            title="Budget Line (BL)"
            icon={<Briefcase className="w-3.5 h-3.5 text-amber-400" />}
            options={blOptions}
            selectedIds={filters.bls}
            onChange={(selectedIds) => onUpdateFilters({ bls: selectedIds })}
            placeholderSearch="Search budget lines..."
          />

          {/* Category Slicer */}
          <SlicerDropdown
            id="category"
            title="Operational Category"
            icon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
            options={categoryOptions}
            selectedIds={filters.categories}
            onChange={(selectedIds) => onUpdateFilters({ categories: selectedIds })}
            placeholderSearch="Search categories..."
          />

          {/* G/L Account Slicer */}
          <SlicerDropdown
            id="gl-account"
            title="G/L Account"
            icon={<BookOpen className="w-3.5 h-3.5 text-purple-400" />}
            options={glOptions}
            selectedIds={filters.glAccounts}
            onChange={(selectedIds) => onUpdateFilters({ glAccounts: selectedIds })}
            placeholderSearch="Search G/L accounts..."
          />

          {/* Non-Zero Only Toggle */}
          <button
            type="button"
            id="btn-filter-nonzero"
            onClick={() => onUpdateFilters({ nonZeroOnly: !filters.nonZeroOnly })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
              filters.nonZeroOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
            title="Only display accounts with non-zero balances in this month"
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                filters.nonZeroOnly ? 'text-emerald-400' : 'text-slate-500'
              }`}
            />
            <span>Non-Zero Balances Only</span>
          </button>
        </div>

        {/* Right Info & Reset */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-normal">
              Filtered Result
            </span>
            <span className="text-xs font-semibold text-white">
              {filteredCount} / {records.length} lines •{' '}
              <strong className="text-amber-400 font-mono">
                LKR {formatCurrency(filteredTotal)}
              </strong>
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              id="btn-clear-all-filters"
              onClick={onClearAll}
              className="px-2.5 py-1.5 rounded text-xs font-medium bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all active filters and selections"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mr-1">
            <Filter className="w-3 h-3 text-amber-400" />
            <span>Active selections:</span>
          </span>

          {/* Activity Code chips */}
          {filters.activityCodes.map((code) => (
            <span
              key={`chip-act-${code}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950 text-blue-200 border border-blue-800 text-[11px]"
            >
              <span className="text-blue-400 font-normal">Activity:</span>
              <strong className="font-mono">{code}</strong>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    activityCodes: filters.activityCodes.filter((c) => c !== code),
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* BL chips */}
          {filters.bls.map((bl) => (
            <span
              key={`chip-bl-${bl}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-800 text-[11px]"
            >
              <span className="text-amber-400 font-normal">BL:</span>
              <strong className="font-mono">{bl}</strong>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    bls: filters.bls.filter((b) => b !== bl),
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Category chips */}
          {filters.categories.map((catKey) => {
            const catDef = REPORT_CATEGORIES.find((c) => c.key === catKey);
            const name = catDef ? catDef.name : catKey === 'other' ? 'Other' : catKey;
            return (
              <span
                key={`chip-cat-${catKey}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-800 text-[11px]"
              >
                <span className="text-emerald-400 font-normal">Category:</span>
                <strong>{name}</strong>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      categories: filters.categories.filter((c) => c !== catKey),
                    })
                  }
                  className="ml-0.5 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {/* GL chips */}
          {filters.glAccounts.map((gl) => (
            <span
              key={`chip-gl-${gl}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800 text-[11px]"
            >
              <span className="text-purple-400 font-normal">GL:</span>
              <strong className="font-mono">{gl}</strong>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    glAccounts: filters.glAccounts.filter((g) => g !== gl),
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Description chips */}
          {filters.descriptions.map((desc) => (
            <span
              key={`chip-desc-${desc}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-950 text-teal-200 border border-teal-800 text-[11px]"
            >
              <span className="text-teal-400 font-normal">Desc:</span>
              <strong className="truncate max-w-[120px]">{desc}</strong>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    descriptions: filters.descriptions.filter((d) => d !== desc),
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Amount filter chips */}
          {(filters.amountFilter.nonZeroOnly || filters.nonZeroOnly) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-800 text-[11px]">
              <span>Non-Zero (&gt; 0)</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    nonZeroOnly: false,
                    amountFilter: { ...filters.amountFilter, nonZeroOnly: false },
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.amountFilter.zeroOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
              <span>Zero Only (= 0)</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    amountFilter: { ...filters.amountFilter, zeroOnly: false },
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.amountFilter.minAmount !== null || filters.amountFilter.maxAmount !== null) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-800 text-[11px]">
              <span>
                Amount:{' '}
                {filters.amountFilter.minAmount !== null ? `≥ ${filters.amountFilter.minAmount}` : ''}{' '}
                {filters.amountFilter.maxAmount !== null ? `≤ ${filters.amountFilter.maxAmount}` : ''}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    amountFilter: { ...filters.amountFilter, minAmount: null, maxAmount: null },
                  })
                }
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Clear all button in chip row */}
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-slate-400 hover:text-amber-400 underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
