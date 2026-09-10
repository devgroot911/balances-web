import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from 'recharts';
import { BudgetRecord, MonthMeta, MonthlyFilterState } from '../types';
import { AccountTable } from './AccountTable';
import { FilterBar } from './FilterBar';
import {
  REPORT_CATEGORIES,
  getRecordCategory,
  isIncomeRecord,
  isRecordInCategory,
} from '../data/categories';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import {
  BarChart3,
  Filter,
  RotateCcw,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Columns,
  BookOpen,
  ArrowUpDown,
  Tag,
  Briefcase,
  CheckCircle2,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

interface MonthlyReportViewProps {
  records: BudgetRecord[];
  monthMeta: MonthMeta;
  filters: MonthlyFilterState;
  onUpdateFilters: (newFilters: Partial<MonthlyFilterState>) => void;
  onToggleActivityCode: (code: string) => void;
  onToggleBL: (bl: string) => void;
  onToggleCategory: (categoryKey: string) => void;
  onToggleGL: (gl: string) => void;
  onClearActivityFilter: () => void;
  onClearBLFilter: () => void;
  onClearAllFilters: () => void;
}

type ViewMode = 'split' | 'visuals' | 'table';

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  records,
  monthMeta,
  filters,
  onUpdateFilters,
  onToggleActivityCode,
  onToggleBL,
  onToggleCategory,
  onToggleGL,
  onClearActivityFilter,
  onClearBLFilter,
  onClearAllFilters,
}) => {
  const monthKey = monthMeta.key;
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chart local controls
  const [activitySortOrder, setActivitySortOrder] = useState<'desc' | 'asc' | 'code'>('desc');
  const [activityTopN, setActivityTopN] = useState<number>(25);
  const [blSortOrder, setBlSortOrder] = useState<'desc' | 'asc' | 'code'>('desc');
  const [blTopN, setBlTopN] = useState<number>(18);

  const reportRecords = useMemo(
    () => (filters.excludeIncomeCategories ? records.filter((r) => !isIncomeRecord(r)) : records),
    [records, filters.excludeIncomeCategories],
  );

  // Keyboard shortcut: Escape exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Isolate BL when clicking a specific bar in BL chart (e.g. 53400)
  const handleIsolateBL = (bl: string, isMulti = false) => {
    if (isMulti) {
      onToggleBL(bl);
    } else {
      // If bl is already the sole active filter, toggle off / reset to all
      if (filters.bls.length === 1 && filters.bls[0] === bl) {
        onUpdateFilters({ bls: [] });
      } else {
        // Auto show ONLY the records related to this BL!
        onUpdateFilters({ bls: [bl] });
      }
    }
  };

  // Isolate Activity Code when clicking a specific bar in Activity Code chart
  const handleIsolateActivityCode = (code: string, isMulti = false) => {
    if (isMulti) {
      onToggleActivityCode(code);
    } else {
      if (filters.activityCodes.length === 1 && filters.activityCodes[0] === code) {
        onUpdateFilters({ activityCodes: [] });
      } else {
        // Auto show ONLY records related to this Activity Code!
        onUpdateFilters({ activityCodes: [code] });
      }
    }
  };

  // 1. Filter records for the table based on ALL active filters
  const filteredRecords = useMemo(() => {
    return reportRecords.filter((r) => {
      // Activity Code filter
      if (filters.activityCodes.length > 0 && !filters.activityCodes.includes(r.activityCode)) {
        return false;
      }
      // BL filter
      if (filters.bls.length > 0 && !filters.bls.includes(r.bl)) {
        return false;
      }
      // GL Account filter
      if (filters.glAccounts.length > 0 && !filters.glAccounts.includes(r.glAccount)) {
        return false;
      }
      // Description filter
      if (
        filters.descriptions &&
        filters.descriptions.length > 0 &&
        !filters.descriptions.includes(r.description?.trim() || '(No Description)')
      ) {
        return false;
      }
      // Category filter
      if (filters.categories.length > 0) {
        const matchesAnyCat = filters.categories.some((catKey) => isRecordInCategory(r, catKey));
        if (!matchesAnyCat) return false;
      }
      // Amount Filter logic
      const val = Number((r as any)[monthKey]) || 0;
      if (filters.nonZeroOnly || filters.amountFilter?.nonZeroOnly) {
        if (Math.abs(val) < 0.001) return false;
      }
      if (filters.amountFilter?.zeroOnly) {
        if (Math.abs(val) > 0.001) return false;
      }
      if (filters.amountFilter?.minAmount !== null && filters.amountFilter?.minAmount !== undefined) {
        if (val < filters.amountFilter.minAmount) return false;
      }
      if (filters.amountFilter?.maxAmount !== null && filters.amountFilter?.maxAmount !== undefined) {
        if (val > filters.amountFilter.maxAmount) return false;
      }
      // Search query
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matches =
          r.bl.toLowerCase().includes(q) ||
          r.activityCode.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.glAccount.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [reportRecords, filters, monthKey]);

  // Grand total for the month (unfiltered)
  const monthGrandTotal = useMemo(() => {
    return reportRecords.reduce((acc, r) => acc + (Number((r as any)[monthKey]) || 0), 0);
  }, [reportRecords, monthKey]);

  // Filtered total for the month
  const filteredGrandTotal = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (Number((r as any)[monthKey]) || 0), 0);
  }, [filteredRecords, monthKey]);

  const filteredPercent = monthGrandTotal > 0 ? (filteredGrandTotal / monthGrandTotal) * 100 : 0;

  // 2. Chart Data: Sum of [Month] by Activity Code
  // Cross-filtered by BL, GL, Category, Amount filters (not by activityCodes itself so other bars can be clicked)
  const activityChartData = useMemo(() => {
    let base = reportRecords;
    if (filters.bls.length > 0) {
      base = base.filter((r) => filters.bls.includes(r.bl));
    }
    if (filters.categories.length > 0) {
      base = base.filter((r) => filters.categories.some((catKey) => isRecordInCategory(r, catKey)));
    }
    if (filters.glAccounts.length > 0) {
      base = base.filter((r) => filters.glAccounts.includes(r.glAccount));
    }
    if (filters.descriptions.length > 0) {
      base = base.filter((r) => filters.descriptions.includes(r.description?.trim() || ''));
    }
    if (filters.nonZeroOnly || filters.amountFilter?.nonZeroOnly) {
      base = base.filter((r) => Math.abs(Number((r as any)[monthKey]) || 0) > 0.001);
    }

    const agg: Record<string, { activityCode: string; amount: number; count: number; desc: string }> = {};

    for (const r of base) {
      const code = r.activityCode || '0';
      const val = Number((r as any)[monthKey]) || 0;
      if (!agg[code]) {
        agg[code] = {
          activityCode: code,
          amount: 0,
          count: 0,
          desc: r.description ? r.description.slice(0, 45) : '',
        };
      }
      agg[code].amount += val;
      agg[code].count += 1;
    }

    let list = Object.values(agg).filter((item) => Math.abs(item.amount) > 0.001);

    if (activitySortOrder === 'desc') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (activitySortOrder === 'asc') {
      list.sort((a, b) => a.amount - b.amount);
    } else {
      list.sort((a, b) => a.activityCode.localeCompare(b.activityCode));
    }

    return activityTopN >= 500 ? list : list.slice(0, activityTopN);
  }, [
    reportRecords,
    monthKey,
    filters.bls,
    filters.categories,
    filters.glAccounts,
    filters.descriptions,
    filters.excludeIncomeCategories,
    filters.nonZeroOnly,
    filters.amountFilter?.nonZeroOnly,
    activitySortOrder,
    activityTopN,
  ]);

  // 3. Chart Data: Sum of [Month] by BL
  // Cross-filtered by Activity Code, GL, Category, Amount filters (not by bls itself so all BL bars remain visible)
  const blChartData = useMemo(() => {
    let base = reportRecords;
    if (filters.activityCodes.length > 0) {
      base = base.filter((r) => filters.activityCodes.includes(r.activityCode));
    }
    if (filters.categories.length > 0) {
      base = base.filter((r) => filters.categories.some((catKey) => isRecordInCategory(r, catKey)));
    }
    if (filters.glAccounts.length > 0) {
      base = base.filter((r) => filters.glAccounts.includes(r.glAccount));
    }
    if (filters.descriptions.length > 0) {
      base = base.filter((r) => filters.descriptions.includes(r.description?.trim() || ''));
    }
    if (filters.nonZeroOnly || filters.amountFilter?.nonZeroOnly) {
      base = base.filter((r) => Math.abs(Number((r as any)[monthKey]) || 0) > 0.001);
    }

    const agg: Record<string, { bl: string; amount: number; count: number; desc: string }> = {};

    for (const r of base) {
      const bl = r.bl || 'Unassigned';
      const val = Number((r as any)[monthKey]) || 0;
      if (!agg[bl]) {
        agg[bl] = {
          bl,
          amount: 0,
          count: 0,
          desc: r.description ? r.description.slice(0, 45) : '',
        };
      }
      agg[bl].amount += val;
      agg[bl].count += 1;
    }

    let list = Object.values(agg).filter((item) => Math.abs(item.amount) > 0.001);

    if (blSortOrder === 'desc') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (blSortOrder === 'asc') {
      list.sort((a, b) => a.amount - b.amount);
    } else {
      list.sort((a, b) => a.bl.localeCompare(b.bl));
    }

    return blTopN >= 500 ? list : list.slice(0, blTopN);
  }, [
    reportRecords,
    monthKey,
    filters.activityCodes,
    filters.categories,
    filters.glAccounts,
    filters.descriptions,
    filters.excludeIncomeCategories,
    filters.nonZeroOnly,
    filters.amountFilter?.nonZeroOnly,
    blSortOrder,
    blTopN,
  ]);

  // 4. Chart Data: Operational Category Distribution
  const categoryChartData = useMemo(() => {
    let base = reportRecords;
    if (filters.activityCodes.length > 0) {
      base = base.filter((r) => filters.activityCodes.includes(r.activityCode));
    }
    if (filters.bls.length > 0) {
      base = base.filter((r) => filters.bls.includes(r.bl));
    }

    const map = new Map<string, { key: string; name: string; amount: number; count: number; color: string }>();
    for (const cat of REPORT_CATEGORIES) {
      map.set(cat.key, { key: cat.key, name: cat.name, amount: 0, count: 0, color: cat.color });
    }
    map.set('other', { key: 'other', name: 'Other Operations', amount: 0, count: 0, color: '#64748b' });

    for (const r of base) {
      const catName = getRecordCategory(r);
      const catDef = REPORT_CATEGORIES.find((c) => c.name === catName);
      const catKey = catDef ? catDef.key : 'other';
      const val = Number((r as any)[monthKey]) || 0;

      const item = map.get(catKey);
      if (item) {
        item.amount += val;
        item.count += 1;
      }
    }

    return Array.from(map.values())
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [reportRecords, monthKey, filters.activityCodes, filters.bls]);

  // Custom tooltips
  const CustomActivityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded shadow-xl text-xs space-y-1 max-w-xs z-50">
          <div className="font-mono text-blue-400 font-bold flex items-center justify-between gap-2">
            <span>Activity: {d.activityCode}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {d.count} {d.count === 1 ? 'line' : 'lines'}
            </span>
          </div>
          {d.desc && <div className="text-[11px] text-slate-300 italic">{d.desc}</div>}
          <div className="text-amber-400 font-mono font-bold pt-1 border-t border-slate-800">
            {monthMeta.columnTitle}: LKR {formatCurrency(d.amount)}
          </div>
          <div className="text-[9px] text-slate-400 pt-0.5">
            Click to isolate table records to this activity code
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBLTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded shadow-xl text-xs space-y-1 max-w-xs z-50">
          <div className="font-mono text-amber-400 font-bold flex items-center justify-between gap-2">
            <span>BL: {d.bl}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {d.count} {d.count === 1 ? 'line' : 'lines'}
            </span>
          </div>
          {d.desc && <div className="text-[11px] text-slate-300 italic">{d.desc}</div>}
          <div className="text-amber-300 font-mono font-bold pt-1 border-t border-slate-800">
            {monthMeta.columnTitle}: LKR {formatCurrency(d.amount)}
          </div>
          <div className="text-[9px] text-amber-400/80 pt-0.5">
            Click bar to auto show ONLY records for BL {d.bl}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasAnyFilter =
    filters.activityCodes.length > 0 ||
    filters.bls.length > 0 ||
    filters.glAccounts.length > 0 ||
    filters.descriptions.length > 0 ||
    filters.categories.length > 0 ||
    filters.excludeIncomeCategories ||
    filters.nonZeroOnly ||
    filters.amountFilter.nonZeroOnly ||
    filters.amountFilter.zeroOnly ||
    filters.amountFilter.minAmount !== null ||
    filters.amountFilter.maxAmount !== null;

  // Render the Activity Code Chart Block
  const renderActivityCodeChart = (isCompact = false) => (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-sm flex flex-col ${
        isCompact ? 'h-full min-h-0' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-800 shrink-0">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>{monthMeta.chartTitlePrefix} by Activity Code</span>
          </h3>
          <p className="text-[10px] text-slate-400">
            Click bar to auto-show only that activity code ({activityChartData.length} items)
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {filters.activityCodes.length > 0 && (
            <button
              onClick={onClearActivityFilter}
              className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-medium hover:bg-blue-900 cursor-pointer"
            >
              Clear ({filters.activityCodes.length})
            </button>
          )}

          <select
            value={activityTopN}
            onChange={(e) => setActivityTopN(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value={15}>Top 15</option>
            <option value={25}>Top 25</option>
            <option value={500}>All</option>
          </select>

          <button
            onClick={() =>
              setActivitySortOrder((prev) =>
                prev === 'desc' ? 'asc' : prev === 'asc' ? 'code' : 'desc'
              )
            }
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title={`Sort: ${activitySortOrder}`}
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className={`${isCompact ? 'flex-1 min-h-0' : 'h-60 sm:h-64'} w-full`}>
        {activityChartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No activity data available for the active filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityChartData} margin={{ top: 8, right: 10, left: -12, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="activityCode"
                tick={({ x, y, payload }) => {
                  const isSelected = filters.activityCodes.includes(payload.value);
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={12}
                        textAnchor="end"
                        transform="rotate(-45)"
                        fill={isSelected ? '#f59e0b' : '#94a3b8'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fontSize={9}
                        className="cursor-pointer hover:underline"
                        onClick={() => handleIsolateActivityCode(payload.value)}
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
                interval={0}
                height={40}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                tickFormatter={(v) => formatCompactNumber(v)}
              />
              <Tooltip content={<CustomActivityTooltip />} />
              <Bar
                dataKey="amount"
                name="Balance (LKR)"
                radius={[3, 3, 0, 0]}
                cursor="pointer"
                onClick={(data: any, index: any, event: any) => {
                  const payload = data?.activePayload?.[0]?.payload || data?.payload || data;
                  const code = payload?.activityCode || (index !== undefined && activityChartData[index]?.activityCode);
                  if (code) {
                    handleIsolateActivityCode(code, event?.ctrlKey || event?.metaKey);
                  }
                }}
              >
                {activityChartData.map((entry) => {
                  const isSelected = filters.activityCodes.includes(entry.activityCode);
                  const hasSelection = filters.activityCodes.length > 0;
                  const isDimmed = hasSelection && !isSelected;

                  return (
                    <Cell
                      key={`cell-act-${entry.activityCode}`}
                      fill={isSelected ? '#f59e0b' : '#00b0f0'}
                      fillOpacity={isDimmed ? 0.25 : 1}
                      stroke={isSelected ? '#fbbf24' : 'transparent'}
                      strokeWidth={isSelected ? 2 : 0}
                      cursor="pointer"
                      onClick={(e: any) =>
                        handleIsolateActivityCode(entry.activityCode, e?.ctrlKey || e?.metaKey)
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  // Render the BL Chart Block
  const renderBLChart = (isCompact = false) => {
    const blLabelWidth = Math.min(
      150,
      Math.max(82, ...blChartData.map((entry) => `${entry.bl}`.length * 7 + 18)),
    );
    const blChartHeight = Math.max(240, blChartData.length * 24 + 20);

    return (
      <div
        className={`bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-sm flex flex-col ${
          isCompact ? 'h-full min-h-0' : ''
        }`}
      >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-800 shrink-0">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>{monthMeta.chartTitlePrefix} by BL</span>
          </h3>
          <p className="text-[10px] text-slate-400">
            Click any bar (e.g. 53400) to auto-show only its records
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {filters.bls.length > 0 && (
            <button
              onClick={onClearBLFilter}
              className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-medium hover:bg-amber-900 cursor-pointer"
            >
              Clear ({filters.bls.length})
            </button>
          )}

          <select
            value={blTopN}
            onChange={(e) => setBlTopN(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value={10}>Top 10</option>
            <option value={18}>Top 18</option>
            <option value={500}>All</option>
          </select>

          <button
            onClick={() =>
              setBlSortOrder((prev) =>
                prev === 'desc' ? 'asc' : prev === 'asc' ? 'code' : 'desc'
              )
            }
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title={`Sort: ${blSortOrder}`}
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className={`${isCompact ? 'flex-1 min-h-0' : 'h-60 sm:h-64'} w-full overflow-y-auto`}>
        {blChartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No budget line data available for the active filters
          </div>
        ) : (
          <div style={{ height: blChartHeight, minWidth: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={blChartData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 5, bottom: 5 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                tickFormatter={(v) => formatCompactNumber(v)}
              />
                <YAxis
                  dataKey="bl"
                  type="category"
                  interval={0}
                  tick={({ x, y, payload }) => {
                    const isSelected = filters.bls.includes(payload.value);
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={3.5}
                        textAnchor="end"
                        fill={isSelected ? '#f59e0b' : '#94a3b8'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fontSize={10}
                        fontFamily="monospace"
                        className="cursor-pointer hover:underline"
                        onClick={() => handleIsolateBL(payload.value)}
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                  width={blLabelWidth}
                />
              <Tooltip content={<CustomBLTooltip />} />
              <Bar
                dataKey="amount"
                name="Balance (LKR)"
                radius={[0, 3, 3, 0]}
                cursor="pointer"
                onClick={(data: any, index: any, event: any) => {
                  const payload = data?.activePayload?.[0]?.payload || data?.payload || data;
                  const bl = payload?.bl || (index !== undefined && blChartData[index]?.bl);
                  if (bl) {
                    handleIsolateBL(bl, event?.ctrlKey || event?.metaKey);
                  }
                }}
              >
                {blChartData.map((entry) => {
                  const isSelected = filters.bls.includes(entry.bl);
                  const hasSelection = filters.bls.length > 0;
                  const isDimmed = hasSelection && !isSelected;

                  return (
                    <Cell
                      key={`cell-bl-${entry.bl}`}
                      fill={isSelected ? '#f59e0b' : '#00b0f0'}
                      fillOpacity={isDimmed ? 0.25 : 1}
                      stroke={isSelected ? '#fbbf24' : 'transparent'}
                      strokeWidth={isSelected ? 2 : 0}
                      cursor="pointer"
                      onClick={(e: any) => handleIsolateBL(entry.bl, e?.ctrlKey || e?.metaKey)}
                    />
                  );
                })}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Month Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-base font-mono">
            {monthMeta.label.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {monthMeta.label} Balances
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• Dedicated Monthly Report</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {monthMeta.columnTitle}
            </h2>
          </div>
        </div>

        {/* Right metrics & Layout Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Total & Filtered Total */}
          <div className="flex items-center gap-4 border-r border-slate-800 pr-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Month Grand Total
              </span>
              <span className="text-sm sm:text-base font-bold text-white font-mono">
                LKR {formatCompactNumber(monthGrandTotal)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block">
                Filtered Total ({filteredPercent.toFixed(1)}%)
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-400 font-mono">
                LKR {formatCurrency(filteredGrandTotal)}
              </span>
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
            title="Open Fullscreen mode: Table and both charts adjusted to fit screen without scrolling"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen View</span>
          </button>

          {/* Layout Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Report Layout (Table on left, Charts on right)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Report Layout</span>
            </button>

            <button
              onClick={() => setViewMode('visuals')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'visuals'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Charts Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Charts Grid</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table Only"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Slicers & Multi-Selection Filter Bar */}
      <FilterBar
        records={reportRecords}
        monthMeta={monthMeta}
        filters={filters}
        onUpdateFilters={onUpdateFilters}
        onClearAll={onClearAllFilters}
        filteredCount={filteredRecords.length}
        filteredTotal={filteredGrandTotal}
      />

      {/* 3. Main Content Views */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Accounts Table */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <AccountTable
              allRecords={reportRecords}
              records={filteredRecords}
              monthMeta={monthMeta}
              filters={filters}
              onUpdateFilters={onUpdateFilters}
              onToggleActivityCode={onToggleActivityCode}
              onToggleBL={onToggleBL}
              onIsolateBL={handleIsolateBL}
              onIsolateActivityCode={handleIsolateActivityCode}
              onClearActivityFilter={onClearActivityFilter}
              onClearBLFilter={onClearBLFilter}
              onClearAllFilters={onClearAllFilters}
            />
          </div>

          {/* Right Column: Visual Charts as in Power BI report */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            {renderActivityCodeChart(false)}
            {renderBLChart(false)}
          </div>
        </div>
      )}

      {viewMode === 'visuals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderActivityCodeChart(false)}
          {renderBLChart(false)}

          {/* Operational Category Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Operational Expense Categories</span>
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {categoryChartData.map((item) => (
                <div
                  key={item.key}
                  onClick={() => onToggleCategory(item.key)}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    filters.categories.includes(item.key)
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{item.name}</span>
                    <span className="font-mono text-amber-400">
                      LKR {formatCompactNumber(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <AccountTable
          allRecords={reportRecords}
          records={filteredRecords}
          monthMeta={monthMeta}
          filters={filters}
          onUpdateFilters={onUpdateFilters}
          onToggleActivityCode={onToggleActivityCode}
          onToggleBL={onToggleBL}
          onIsolateBL={handleIsolateBL}
          onIsolateActivityCode={handleIsolateActivityCode}
          onClearActivityFilter={onClearActivityFilter}
          onClearBLFilter={onClearBLFilter}
          onClearAllFilters={onClearAllFilters}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. FULLSCREEN MODE MODAL: TABLE + 2 CHARTS FITTED WITHOUT SCROLL */}
      {/* ========================================================================= */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen w-screen overflow-hidden p-2.5 sm:p-3.5">
          {/* Top Header Toolbar */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {monthMeta.label}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {monthMeta.columnTitle} • Power BI Live Dashboard
              </h2>
              <span className="text-xs text-slate-400 hidden lg:inline">
                (Table &amp; Visuals fitted to screen — no page scroll)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Filtered stats */}
              <div className="flex items-center gap-3 text-xs pr-2 border-r border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Filtered Total
                  </span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    LKR {formatCurrency(filteredGrandTotal)}
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Lines
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {filteredRecords.length} / {reportRecords.length}
                  </span>
                </div>
              </div>

              {hasAnyFilter && (
                <button
                  onClick={onClearAllFilters}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              )}

              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-colors"
                title="Exit Fullscreen Mode (Press Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
                <span className="text-[10px] font-normal opacity-75 hidden sm:inline">(Esc)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Body: Split Grid without page scroll */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2.5 overflow-hidden">
            {/* Left Side: Account Lines Table (fits 100% height, internal scroll only) */}
            <div className="lg:col-span-6 xl:col-span-6 h-full flex flex-col min-h-0 overflow-hidden">
              <AccountTable
                allRecords={reportRecords}
                records={filteredRecords}
                monthMeta={monthMeta}
                filters={filters}
                onUpdateFilters={onUpdateFilters}
                onToggleActivityCode={onToggleActivityCode}
                onToggleBL={onToggleBL}
                onIsolateBL={handleIsolateBL}
                onIsolateActivityCode={handleIsolateActivityCode}
                onClearActivityFilter={onClearActivityFilter}
                onClearBLFilter={onClearBLFilter}
                onClearAllFilters={onClearAllFilters}
                isFullScreen={true}
              />
            </div>

            {/* Right Side: Two Charts Stacked (each flex-1 min-h-0) */}
            <div className="lg:col-span-6 xl:col-span-6 h-full flex flex-col min-h-0 gap-2.5 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                {renderActivityCodeChart(true)}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {renderBLChart(true)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
