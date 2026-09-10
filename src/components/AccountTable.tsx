import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Download,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { BudgetRecord, MonthMeta, MonthlyFilterState } from '../types';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import { ColumnFilterPopover, ColumnFilterItem } from './ColumnFilterPopover';
import { AmountFilterPopover } from './AmountFilterPopover';

interface AccountTableProps {
  allRecords: BudgetRecord[]; // all raw records to build complete filter options
  records: BudgetRecord[]; // currently filtered records for display
  monthMeta: MonthMeta;
  filters: MonthlyFilterState;
  onUpdateFilters: (newFilters: Partial<MonthlyFilterState>) => void;
  onToggleActivityCode: (code: string) => void;
  onToggleBL: (bl: string) => void;
  onIsolateBL: (bl: string, isMulti?: boolean) => void;
  onIsolateActivityCode: (code: string, isMulti?: boolean) => void;
  onClearActivityFilter: () => void;
  onClearBLFilter: () => void;
  onClearAllFilters?: () => void;
  isFullScreen?: boolean;
}

type SortField = 'bl' | 'activityCode' | 'amount' | 'description' | 'glAccount';
type SortOrder = 'asc' | 'desc';

export const AccountTable: React.FC<AccountTableProps> = ({
  allRecords,
  records,
  monthMeta,
  filters,
  onUpdateFilters,
  onToggleActivityCode,
  onToggleBL,
  onIsolateBL,
  onIsolateActivityCode,
  onClearActivityFilter,
  onClearBLFilter,
  onClearAllFilters,
  isFullScreen = false,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState<number>(isFullScreen ? 25 : 50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const monthKey = monthMeta.key;

  // 1. Build Unique Items for BL Column Filter
  const blFilterItems = useMemo<ColumnFilterItem[]>(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const r of allRecords) {
      const bl = r.bl || 'Unassigned';
      const val = Number((r as any)[monthKey]) || 0;
      const cur = map.get(bl) || { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += val;
      map.set(bl, cur);
    }
    return Array.from(map.entries())
      .map(([bl, data]) => ({
        id: bl,
        label: bl,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allRecords, monthKey]);

  // 2. Build Unique Items for Activity Code Column Filter
  const activityFilterItems = useMemo<ColumnFilterItem[]>(() => {
    const map = new Map<string, { count: number; amount: number; desc: string }>();
    for (const r of allRecords) {
      const code = r.activityCode || '0';
      const val = Number((r as any)[monthKey]) || 0;
      const cur = map.get(code) || { count: 0, amount: 0, desc: r.description || '' };
      cur.count += 1;
      cur.amount += val;
      map.set(code, cur);
    }
    return Array.from(map.entries())
      .map(([code, data]) => ({
        id: code,
        label: code,
        sublabel: data.desc.slice(0, 45),
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allRecords, monthKey]);

  // 3. Build Unique Items for Description Column Filter
  const descriptionFilterItems = useMemo<ColumnFilterItem[]>(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const r of allRecords) {
      const desc = r.description?.trim() || '(No Description)';
      const val = Number((r as any)[monthKey]) || 0;
      const cur = map.get(desc) || { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += val;
      map.set(desc, cur);
    }
    return Array.from(map.entries())
      .map(([desc, data]) => ({
        id: desc,
        label: desc,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allRecords, monthKey]);

  // 4. Build Unique Items for G/L Account Column Filter
  const glFilterItems = useMemo<ColumnFilterItem[]>(() => {
    const map = new Map<string, { count: number; amount: number; desc: string }>();
    for (const r of allRecords) {
      const gl = r.glAccount || 'Unassigned';
      const val = Number((r as any)[monthKey]) || 0;
      const cur = map.get(gl) || { count: 0, amount: 0, desc: r.description || '' };
      cur.count += 1;
      cur.amount += val;
      map.set(gl, cur);
    }
    return Array.from(map.entries())
      .map(([gl, data]) => ({
        id: gl,
        label: gl,
        sublabel: data.desc.slice(0, 40),
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allRecords, monthKey]);

  // Apply local table search query if entered
  const searchedRecords = useMemo(() => {
    if (!localSearch.trim()) return records;
    const q = localSearch.toLowerCase();
    return records.filter(
      (r) =>
        r.bl.toLowerCase().includes(q) ||
        r.activityCode.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.glAccount.toLowerCase().includes(q)
    );
  }, [records, localSearch]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...searchedRecords].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'amount') {
        valA = Number((a as any)[monthKey]) || 0;
        valB = Number((b as any)[monthKey]) || 0;
      } else if (sortField === 'bl') {
        valA = a.bl;
        valB = b.bl;
      } else if (sortField === 'activityCode') {
        valA = a.activityCode;
        valB = b.activityCode;
      } else if (sortField === 'glAccount') {
        valA = a.glAccount;
        valB = b.glAccount;
      } else {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchedRecords, sortField, sortOrder, monthKey]);

  // Total amount of currently filtered records
  const totalAmount = useMemo(() => {
    return searchedRecords.reduce((acc, r) => acc + (Number((r as any)[monthKey]) || 0), 0);
  }, [searchedRecords, monthKey]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    if (pageSize >= 1000) return sortedRecords;
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'amount' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Export current table view as CSV
  const exportCSV = () => {
    const headers = ['BL', 'Activity Code', 'Description', monthMeta.columnTitle, 'G/L Account'];
    const rows = sortedRecords.map((r) => [
      `"${r.bl}"`,
      `"${r.activityCode}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      Number((r as any)[monthKey]) || 0,
      `"${r.glAccount}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Budget_${monthMeta.label}_Accounts.csv`;
    link.click();
  };

  const hasAnyFilterActive =
    filters.activityCodes.length > 0 ||
    filters.bls.length > 0 ||
    filters.glAccounts.length > 0 ||
    filters.descriptions.length > 0 ||
    filters.categories.length > 0 ||
    filters.amountFilter.nonZeroOnly ||
    filters.amountFilter.zeroOnly ||
    filters.amountFilter.minAmount !== null ||
    filters.amountFilter.maxAmount !== null ||
    Boolean(localSearch);

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-lg shadow-sm flex flex-col ${
        isFullScreen ? 'h-full min-h-0' : 'min-h-[500px]'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="p-3 border-b border-slate-800 space-y-2 shrink-0 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Account Lines</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({sortedRecords.length} of {allRecords.length})
              </span>
            </h3>

            {hasAnyFilterActive && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" />
                Filtered
              </span>
            )}
          </div>

          {/* Quick Search & Export */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Quick find in table..."
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 w-36 sm:w-44 pr-6"
              />
              {localSearch ? (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <Search className="w-3 h-3 text-slate-500 absolute right-2 top-2" />
              )}
            </div>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
              title="Export filtered records to CSV"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>Filters:</span>
            </span>

            {/* Selected BLs */}
            {filters.bls.map((bl) => (
              <span
                key={`bl-chip-${bl}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/80 text-[11px]"
              >
                <span>BL:</span>
                <strong className="font-mono text-white">{bl}</strong>
                <button
                  onClick={() => onToggleBL(bl)}
                  className="hover:text-white ml-0.5 p-0.5 rounded hover:bg-amber-800 cursor-pointer"
                  title="Remove BL filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Selected Activity Codes */}
            {filters.activityCodes.map((code) => (
              <span
                key={`act-chip-${code}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/80 text-[11px]"
              >
                <span>Activity:</span>
                <strong className="font-mono text-white">{code}</strong>
                <button
                  onClick={() => onToggleActivityCode(code)}
                  className="hover:text-white ml-0.5 p-0.5 rounded hover:bg-blue-800 cursor-pointer"
                  title="Remove Activity filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Selected G/L Accounts */}
            {filters.glAccounts.map((gl) => (
              <span
                key={`gl-chip-${gl}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/80 text-[11px]"
              >
                <span>GL:</span>
                <strong className="font-mono text-white">{gl}</strong>
                <button
                  onClick={() =>
                    onUpdateFilters({
                      glAccounts: filters.glAccounts.filter((g) => g !== gl),
                    })
                  }
                  className="hover:text-white ml-0.5 p-0.5 rounded hover:bg-purple-800 cursor-pointer"
                  title="Remove GL filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Selected Descriptions */}
            {filters.descriptions.map((desc) => (
              <span
                key={`desc-chip-${desc}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-900/60 text-teal-200 border border-teal-700/80 text-[11px]"
              >
                <span>Desc:</span>
                <span className="truncate max-w-[120px] text-white">{desc}</span>
                <button
                  onClick={() =>
                    onUpdateFilters({
                      descriptions: filters.descriptions.filter((d) => d !== desc),
                    })
                  }
                  className="hover:text-white ml-0.5 p-0.5 rounded hover:bg-teal-800 cursor-pointer"
                  title="Remove Description filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Amount Filter Indicator */}
            {(filters.amountFilter.nonZeroOnly ||
              filters.amountFilter.zeroOnly ||
              filters.amountFilter.minAmount !== null ||
              filters.amountFilter.maxAmount !== null) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/80 text-[11px]">
                <span>Amount:</span>
                <span className="text-white">
                  {filters.amountFilter.nonZeroOnly
                    ? '> 0'
                    : filters.amountFilter.zeroOnly
                    ? '= 0'
                    : `${filters.amountFilter.minAmount ? `≥${formatCompactNumber(filters.amountFilter.minAmount)}` : ''} ${filters.amountFilter.maxAmount ? `≤${formatCompactNumber(filters.amountFilter.maxAmount)}` : ''}`}
                </span>
                <button
                  onClick={() =>
                    onUpdateFilters({
                      amountFilter: {
                        nonZeroOnly: false,
                        zeroOnly: false,
                        minAmount: null,
                        maxAmount: null,
                      },
                    })
                  }
                  className="hover:text-white ml-0.5 p-0.5 rounded hover:bg-emerald-800 cursor-pointer"
                  title="Remove Amount filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {onClearAllFilters && (
              <button
                onClick={onClearAllFilters}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline ml-1 cursor-pointer font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Scrollable Table Container */}
      <div
        className={`flex-1 min-h-0 overflow-auto text-xs ${
          isFullScreen ? 'max-h-full' : 'max-h-[640px]'
        }`}
      >
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-950/95 text-slate-300 font-semibold sticky top-0 z-20 border-b border-slate-800 backdrop-blur-sm">
            <tr>
              {/* BL Column Header with Popover Filter + Sort */}
              <th className="py-2.5 px-3 border-r border-slate-800/80 select-none w-28 transition-colors">
                <div className="flex items-center justify-between gap-1">
                  <span
                    onClick={() => toggleSort('bl')}
                    className="flex items-center gap-1 cursor-pointer hover:text-white flex-1"
                    title="Sort by BL"
                  >
                    <span>BL</span>
                    {sortField === 'bl' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </span>
                  <ColumnFilterPopover
                    columnTitle="Budget Line (BL)"
                    items={blFilterItems}
                    selectedValues={filters.bls}
                    onChange={(newBLs) => onUpdateFilters({ bls: newBLs })}
                  />
                </div>
              </th>

              {/* Activity Code Column Header with Popover Filter + Sort */}
              <th className="py-2.5 px-3 border-r border-slate-800/80 select-none w-44 sm:w-48 transition-colors">
                <div className="flex items-center justify-between gap-1">
                  <span
                    onClick={() => toggleSort('activityCode')}
                    className="flex items-center gap-1 cursor-pointer hover:text-white flex-1"
                    title="Sort by Activity Code"
                  >
                    <span>Activity Code</span>
                    {sortField === 'activityCode' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </span>
                  <ColumnFilterPopover
                    columnTitle="Activity Code"
                    items={activityFilterItems}
                    selectedValues={filters.activityCodes}
                    onChange={(newCodes) => onUpdateFilters({ activityCodes: newCodes })}
                  />
                </div>
              </th>

              {/* Amount Column Header with Popover Filter + Sort */}
              <th className="py-2.5 px-3 border-r border-slate-800/80 select-none text-right w-36 sm:w-40 transition-colors">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    onClick={() => toggleSort('amount')}
                    className="flex items-center gap-1 cursor-pointer hover:text-white truncate"
                    title={`Sort by ${monthMeta.columnTitle}`}
                  >
                    <span>{monthMeta.columnTitle}</span>
                    {sortField === 'amount' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </span>
                  <AmountFilterPopover
                    columnTitle={monthMeta.columnTitle}
                    nonZeroOnly={filters.amountFilter.nonZeroOnly}
                    zeroOnly={filters.amountFilter.zeroOnly}
                    minAmount={filters.amountFilter.minAmount}
                    maxAmount={filters.amountFilter.maxAmount}
                    onChange={(amountFilter) => onUpdateFilters({ amountFilter })}
                  />
                </div>
              </th>

              {/* Description Column Header with Popover Filter + Sort */}
              <th className="py-2.5 px-3 border-r border-slate-800/80 select-none min-w-[180px] transition-colors">
                <div className="flex items-center justify-between gap-1">
                  <span
                    onClick={() => toggleSort('description')}
                    className="flex items-center gap-1 cursor-pointer hover:text-white flex-1"
                    title="Sort by Description"
                  >
                    <span>Description</span>
                    {sortField === 'description' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </span>
                  <ColumnFilterPopover
                    columnTitle="Description"
                    items={descriptionFilterItems}
                    selectedValues={filters.descriptions}
                    onChange={(newDescs) => onUpdateFilters({ descriptions: newDescs })}
                    showAmount={true}
                  />
                </div>
              </th>

              {/* G/L Account Column Header with Popover Filter + Sort */}
              <th className="py-2.5 px-3 select-none w-28 sm:w-32 transition-colors">
                <div className="flex items-center justify-between gap-1">
                  <span
                    onClick={() => toggleSort('glAccount')}
                    className="flex items-center gap-1 cursor-pointer hover:text-white flex-1"
                    title="Sort by G/L Account"
                  >
                    <span>G/L Acct</span>
                    {sortField === 'glAccount' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </span>
                  <ColumnFilterPopover
                    columnTitle="G/L Account"
                    items={glFilterItems}
                    selectedValues={filters.glAccounts}
                    onChange={(newGLs) => onUpdateFilters({ glAccounts: newGLs })}
                  />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-medium text-slate-400">
                      No matching account lines found
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Try clearing one or more column filters to expand results.
                    </p>
                    {hasAnyFilterActive && onClearAllFilters && (
                      <button
                        onClick={onClearAllFilters}
                        className="px-3 py-1 bg-amber-500 text-slate-950 rounded font-bold text-xs hover:bg-amber-400 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, idx) => {
                const amount = Number((r as any)[monthKey]) || 0;
                const isSelectedAct = filters.activityCodes.includes(r.activityCode);
                const isSelectedBL = filters.bls.includes(r.bl);
                const isSelectedGL = filters.glAccounts.includes(r.glAccount);

                return (
                  <tr
                    key={r.id || idx}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isSelectedAct || isSelectedBL || isSelectedGL
                        ? 'bg-amber-950/20'
                        : idx % 2 === 1
                        ? 'bg-slate-950/30'
                        : ''
                    }`}
                  >
                    {/* BL Cell - Click to isolate (or Ctrl-click to toggle) */}
                    <td className="py-2 px-3 border-r border-slate-800/60 font-mono text-slate-300 font-medium">
                      <button
                        onClick={(e) => onIsolateBL(r.bl, e.ctrlKey || e.metaKey)}
                        className={`hover:underline transition-colors cursor-pointer text-left px-1.5 py-0.5 rounded ${
                          isSelectedBL
                            ? 'text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30'
                            : 'hover:text-amber-400 text-slate-300'
                        }`}
                        title={`Click to filter ONLY records with BL: ${r.bl} (Ctrl+click to toggle)`}
                      >
                        {r.bl || '—'}
                      </button>
                    </td>

                    {/* Activity Code Cell - Click to isolate */}
                    <td className="py-2 px-3 border-r border-slate-800/60 font-mono text-slate-200">
                      <button
                        onClick={(e) => onIsolateActivityCode(r.activityCode, e.ctrlKey || e.metaKey)}
                        className={`hover:underline transition-colors cursor-pointer text-left truncate max-w-[170px] block px-1.5 py-0.5 rounded ${
                          isSelectedAct
                            ? 'text-blue-300 font-bold bg-blue-500/20 border border-blue-500/30'
                            : 'hover:text-blue-400 text-slate-200'
                        }`}
                        title={`Click to filter ONLY records with Activity Code: ${r.activityCode}`}
                      >
                        {r.activityCode || '0'}
                      </button>
                    </td>

                    {/* Amount Cell */}
                    <td className="py-2 px-3 border-r border-slate-800/60 text-right font-mono font-medium">
                      <span
                        className={
                          amount > 0
                            ? 'text-white'
                            : amount < 0
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }
                      >
                        {formatCurrency(amount)}
                      </span>
                    </td>

                    {/* Description Cell */}
                    <td className="py-2 px-3 border-r border-slate-800/60 text-slate-300">
                      <span className="line-clamp-1" title={r.description}>
                        {r.description || '—'}
                      </span>
                    </td>

                    {/* G/L Account Cell */}
                    <td className="py-2 px-3 font-mono text-slate-400">
                      <button
                        onClick={() => {
                          if (filters.glAccounts.length === 1 && filters.glAccounts[0] === r.glAccount) {
                            onUpdateFilters({ glAccounts: [] });
                          } else {
                            onUpdateFilters({ glAccounts: [r.glAccount] });
                          }
                        }}
                        className={`hover:underline cursor-pointer text-left px-1 py-0.5 rounded ${
                          isSelectedGL
                            ? 'text-purple-300 font-bold bg-purple-500/20'
                            : 'hover:text-purple-300 text-slate-400'
                        }`}
                        title={`Click to filter ONLY G/L Account: ${r.glAccount}`}
                      >
                        {r.glAccount || '—'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Table Summary Footer */}
          <tfoot className="bg-slate-950 font-semibold text-slate-200 sticky bottom-0 border-t border-slate-800 z-10">
            <tr>
              <td colSpan={2} className="py-2.5 px-3 border-r border-slate-800 text-slate-400 text-xs">
                Total for {sortedRecords.length} lines:
              </td>
              <td className="py-2.5 px-3 border-r border-slate-800 text-right font-mono text-amber-400 text-xs sm:text-sm font-bold">
                LKR {formatCurrency(totalAmount)}
              </td>
              <td colSpan={2} className="py-2.5 px-3 text-slate-500 text-[11px]">
                {sortedRecords.length === allRecords.length ? 'All records included' : 'Filtered subtotal'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={1000}>All</option>
          </select>

          <span className="text-slate-500 hidden sm:inline">|</span>

          <span className="text-slate-400">
            Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong> ({sortedRecords.length} records)
          </span>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
            title="First page"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300 font-medium"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300 font-medium"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300"
            title="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};
