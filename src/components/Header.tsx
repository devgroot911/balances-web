import React from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  FilterX,
  Database,
  Calendar,
} from 'lucide-react';
import { DataSourceInfo, FilterState } from '../types';

interface HeaderProps {
  dataSource: DataSourceInfo;
  onOpenSync: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  budgetBalancePercentage: number | null;
  activeTab: string;
  totalRecords: number;
}

export const Header: React.FC<HeaderProps> = ({
  dataSource,
  onOpenSync,
  onResetFilters,
  hasActiveFilters,
  budgetBalancePercentage,
  activeTab,
  totalRecords,
}) => {
  const downloadSample = () => {
    const link = document.createElement('a');
    link.href = '/sample_data.xlsx';
    link.download = 'Budget_Balance_Template.xlsx';
    link.click();
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-inner">
            <span className="tracking-tighter">P</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                Budget Balance Report
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Power BI Web
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Financial Overview & Account Lines</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{totalRecords} Lines Loaded</span>
            </p>
          </div>
        </div>

        {/* Center / Data Source Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium text-slate-200">Source:</span>
          <span className="truncate max-w-[220px] text-slate-400" title={dataSource.url || dataSource.name}>
            {dataSource.name}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 text-[11px]">Synced {dataSource.lastUpdated}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div
            className="hidden sm:block px-2.5 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-right"
            title="Remaining balance divided by cumulative Budget sheet allocation"
          >
            <span className="block text-[10px] uppercase tracking-wider text-emerald-300/80">
              Budget Balance
            </span>
            <span className="block text-sm font-bold font-mono text-emerald-300">
              {budgetBalancePercentage === null ? '—' : `${budgetBalancePercentage.toFixed(1)}%`}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              id="btn-reset-filters"
              className="px-2.5 py-1.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear active chart and table cross-filters"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          )}

          <button
            onClick={onOpenSync}
            id="btn-open-sync"
            className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Data</span>
          </button>

          <button
            onClick={downloadSample}
            id="btn-download-sample"
            className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download current master Excel template"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>
    </header>
  );
};
