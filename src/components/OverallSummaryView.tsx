import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BudgetRecord, TabMode } from '../types';
import { REPORT_CATEGORIES } from '../data/categories';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import { TrendingUp, DollarSign, Tag, ArrowRight, BarChart3, Layers } from 'lucide-react';

interface OverallSummaryViewProps {
  records: BudgetRecord[];
  onNavigateToMonth: (month: TabMode) => void;
}

export const OverallSummaryView: React.FC<OverallSummaryViewProps> = ({
  records,
  onNavigateToMonth,
}) => {
  const [showAll12Months, setShowAll12Months] = useState(false);

  // Month labels matching Power BI
  const primaryMonths = [
    { key: 'january', label: 'Sum of January', short: 'Jan', color: '#00aaff' },
    { key: 'february', label: 'Sum of Accumulated tillFebruary', short: 'Feb', color: '#0f4c81' },
    { key: 'march', label: 'Sum of Accumulated tillMarch', short: 'Mar', color: '#ea580c' },
    { key: 'april', label: 'Sum of Accumulated tillApril', short: 'Apr', color: '#581c87' },
    { key: 'may', label: 'Sum of Accumulated tillMay', short: 'May', color: '#db2777' },
  ];

  const extendedMonths = [
    ...primaryMonths,
    { key: 'june', label: 'Sum of Accumulated tillJune', short: 'Jun', color: '#059669' },
    { key: 'july', label: 'Sum of Accumulated tillJuly', short: 'Jul', color: '#2563eb' },
    { key: 'august', label: 'Sum of Accumulated tillAugust', short: 'Aug', color: '#7c3aed' },
    { key: 'september', label: 'Sum of Accumulated tillSeptember', short: 'Sep', color: '#c026d3' },
    { key: 'october', label: 'Sum of Accumulated tillOctober', short: 'Oct', color: '#d97706' },
    { key: 'november', label: 'Sum of Accumulated tillNovember', short: 'Nov', color: '#4f46e5' },
    { key: 'december', label: 'Sum of Accumulated tillDecember', short: 'Dec', color: '#0891b2' },
  ];

  const activeMonths = showAll12Months ? extendedMonths : primaryMonths;

  // Compute category totals
  const categoryData = useMemo(() => {
    return REPORT_CATEGORIES.map((cat) => {
      const catRows = records.filter(cat.match);
      
      const monthSums = activeMonths.map((m) => {
        const sum = catRows.reduce((acc, r) => acc + (Number((r as any)[m.key]) || 0), 0);
        return {
          monthKey: m.key,
          label: m.label,
          short: m.short,
          value: sum,
          color: m.color,
        };
      });

      const totalMay = catRows.reduce((acc, r) => acc + (Number(r.may) || 0), 0);
      const totalJuly = catRows.reduce((acc, r) => acc + (Number(r.july) || 0), 0);

      return {
        ...cat,
        rowCount: catRows.length,
        monthSums,
        totalMay,
        totalJuly,
      };
    });
  }, [records, activeMonths]);

  // Overall KPIs
  const overallKPIs = useMemo(() => {
    const totalJan = records.reduce((acc, r) => acc + (Number(r.january) || 0), 0);
    const totalMay = records.reduce((acc, r) => acc + (Number(r.may) || 0), 0);
    const totalJuly = records.reduce((acc, r) => acc + (Number(r.july) || 0), 0);
    const uniqueBLs = new Set(records.map((r) => r.bl).filter(Boolean)).size;
    const uniqueActs = new Set(records.map((r) => r.activityCode).filter(Boolean)).size;

    return {
      totalJan,
      totalMay,
      totalJuly,
      uniqueBLs,
      uniqueActs,
    };
  }, [records]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner & KPIs */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Page 2 of Power BI Report
              </span>
              <span className="text-xs text-slate-400">• Overall Category Summary</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Financial Summary by Key Operational Categories
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulated balance comparison across organizational budget lines
            </p>
          </div>

          {/* Month toggle */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
            <button
              onClick={() => setShowAll12Months(false)}
              className={`px-2.5 py-1 rounded transition-colors ${
                !showAll12Months
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Power BI View (Jan - May)
            </button>
            <button
              onClick={() => setShowAll12Months(true)}
              className={`px-2.5 py-1 rounded transition-colors ${
                showAll12Months
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 12 Months
            </button>
          </div>
        </div>

        {/* 4 Scorecard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Sum of January
            </span>
            <span className="text-lg sm:text-xl font-bold text-white block mt-0.5">
              LKR {formatCurrency(overallKPIs.totalJan)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Initial month balance ({formatCompactNumber(overallKPIs.totalJan)})
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Sum Accumulated till May
            </span>
            <span className="text-lg sm:text-xl font-bold text-sky-400 block mt-0.5">
              LKR {formatCurrency(overallKPIs.totalMay)}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              Power BI export milestone
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Sum Accumulated till July
            </span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 block mt-0.5">
              LKR {formatCurrency(overallKPIs.totalJuly)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Peak recorded period ({formatCompactNumber(overallKPIs.totalJuly)})
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Budget Lines & Activities
            </span>
            <span className="text-lg sm:text-xl font-bold text-amber-400 block mt-0.5">
              {overallKPIs.uniqueBLs} BLs / {overallKPIs.uniqueActs} Acts
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Across {records.length} total account entries
            </span>
          </div>
        </div>
      </div>

      {/* Grid of the 6 Power BI Category Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryData.map((category) => {
          return (
            <div
              key={category.key}
              id={`card-category-${category.key}`}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
            >
              {/* Category Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {category.rowCount} lines
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                  {category.description}
                </p>

                <p className="text-[10px] text-slate-500 leading-tight border-b border-slate-800/80 pb-2 mb-3">
                  Sum of January, Sum of Accumulated tillFebruary, Sum of Accumulated tillMarch, Sum of
                  Accumulated tillApril and Sum of Accumulated tillMay
                </p>
              </div>

              {/* Chart Container */}
              <div className="h-[210px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={category.monthSums}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="short"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#475569' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => formatCompactNumber(val)}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2.5 rounded shadow-xl text-xs">
                              <p className="font-semibold text-slate-200">{data.label}</p>
                              <p className="text-amber-400 font-mono font-bold mt-1">
                                LKR {formatCurrency(data.value)}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Category: {category.name}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {category.monthSums.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Footer Quick Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs mt-2">
                <div className="text-[11px] text-slate-400">
                  <span>Till May: </span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {formatCompactNumber(category.totalMay)}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToMonth('january')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View Monthly Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Legend Matching Power BI Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold text-slate-300">Power BI Color Legend:</span>
        <div className="flex flex-wrap items-center gap-4">
          {primaryMonths.map((m) => (
            <div key={m.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-[11px] text-slate-300">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
