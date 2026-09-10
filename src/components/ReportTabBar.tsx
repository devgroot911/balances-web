import React from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Layers } from 'lucide-react';
import { TabMode, MonthKey } from '../types';
import { MONTHS } from '../utils/formatters';

interface ReportTabBarProps {
  activeTab: TabMode;
  onSelectTab: (tab: TabMode) => void;
  excludeIncomeCategories: boolean;
  onToggleExcludeIncome: () => void;
}

export const ReportTabBar: React.FC<ReportTabBarProps> = ({
  activeTab,
  onSelectTab,
  excludeIncomeCategories,
  onToggleExcludeIncome,
}) => {
  const tabs: { key: TabMode; label: string; pageNumber: number; isSummary?: boolean }[] = [
    { key: 'summary', label: 'Overall Summary', pageNumber: 1, isSummary: true },
    ...MONTHS.map((m, idx) => ({
      key: m.key as TabMode,
      label: m.label,
      pageNumber: idx + 2,
    })),
  ];

  const currentIndex = tabs.findIndex((t) => t.key === activeTab);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectTab(tabs[currentIndex - 1].key);
    }
  };

  const handleNext = () => {
    if (currentIndex < tabs.length - 1) {
      onSelectTab(tabs[currentIndex + 1].key);
    }
  };

  return (
    <nav aria-label="Report Pages" className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs overflow-x-auto select-none shadow-sm">
      {/* Tab list */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => onSelectTab(tab.key)}
              className={`px-3 py-1.5 rounded-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer relative ${
                isActive
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.isSummary ? (
                <LayoutDashboard className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              ) : (
                <Calendar className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              )}
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center gap-2 pl-4 shrink-0 text-slate-400 border-l border-slate-800">
        <button
          type="button"
          onClick={onToggleExcludeIncome}
          id="btn-exclude-income"
          className={`px-2.5 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            excludeIncomeCategories
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white'
          }`}
          title="Exclude income categories with BL numbers from 30000 to 40000"
        >
          <Layers className={`w-3.5 h-3.5 ${excludeIncomeCategories ? 'text-rose-400' : 'text-slate-500'}`} />
          <span>Exclude Income BLs</span>
        </button>
        <span className="text-[11px] font-mono hidden md:inline">
          Page {currentIndex + 1} of {tabs.length}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            id="btn-prev-page"
            className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === tabs.length - 1}
            id="btn-next-page"
            className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
