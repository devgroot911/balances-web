import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { ReportTabBar } from './components/ReportTabBar';
import { OverallSummaryView } from './components/OverallSummaryView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SyncModal } from './components/SyncModal';
import { BudgetRecord, TabMode, DataSourceInfo, MonthlyFilterState } from './types';
import { MONTHS } from './utils/formatters';
import { fetchSpreadsheetRows } from './utils/excelParser';
import initialSampleData from './sampleRows.json';

const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_EXCEL_URL =
  'https://docs.google.com/spreadsheets/d/1FPhFbVBHksaqiIllJhhkD6ay_rN8XY0vPPg3TRP1tZQ/edit?gid=0#gid=0';

const initialFilterState: MonthlyFilterState = {
  activityCodes: [],
  bls: [],
  glAccounts: [],
  descriptions: [],
  categories: [],
  amountFilter: {
    nonZeroOnly: false,
    zeroOnly: false,
    minAmount: null,
    maxAmount: null,
  },
  nonZeroOnly: false,
  excludeIncomeCategories: false,
  searchQuery: '',
};

export default function App() {
  const [records, setRecords] = useState<BudgetRecord[]>(initialSampleData as BudgetRecord[]);
  const [activeTab, setActiveTab] = useState<TabMode>('summary');
  const [filters, setFilters] = useState<MonthlyFilterState>(initialFilterState);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [dataSource, setDataSource] = useState<DataSourceInfo>({
    type: 'googlesheets',
    name: 'Google Sheets Budget Source',
    url: DEFAULT_EXCEL_URL,
    lastUpdated: 'Live',
    rowCount: initialSampleData.length,
  });

  // When switching tabs, clear the filters for the new month view
  const handleSelectTab = (tab: TabMode) => {
    setActiveTab(tab);
    setFilters(initialFilterState);
  };

  const handleResetFilters = () => {
    setFilters(initialFilterState);
  };

  const handleUpdateFilters = (newFilters: Partial<MonthlyFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Toggle helpers for multi-selection
  const handleToggleActivityCode = (code: string) => {
    setFilters((prev) => ({
      ...prev,
      activityCodes: prev.activityCodes.includes(code)
        ? prev.activityCodes.filter((c) => c !== code)
        : [...prev.activityCodes, code],
    }));
  };

  const handleToggleBL = (bl: string) => {
    setFilters((prev) => ({
      ...prev,
      bls: prev.bls.includes(bl)
        ? prev.bls.filter((b) => b !== bl)
        : [...prev.bls, bl],
    }));
  };

  const handleToggleCategory = (catKey: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(catKey)
        ? prev.categories.filter((c) => c !== catKey)
        : [...prev.categories, catKey],
    }));
  };

  const handleToggleGL = (gl: string) => {
    setFilters((prev) => ({
      ...prev,
      glAccounts: prev.glAccounts.includes(gl)
        ? prev.glAccounts.filter((g) => g !== gl)
        : [...prev.glAccounts, gl],
    }));
  };

  const handleDataLoaded = (newRows: BudgetRecord[], sourceInfo: DataSourceInfo) => {
    setRecords(newRows);
    setDataSource(sourceInfo);
    handleResetFilters();
  };

  const handleResetToSample = () => {
    setRecords(initialSampleData as BudgetRecord[]);
    setDataSource({
      type: 'master',
      name: 'Sample Data',
      lastUpdated: 'Reset to Sample',
      rowCount: initialSampleData.length,
    });
    handleResetFilters();
  };

  useEffect(() => {
    const configuredExcelUrl =
      new URLSearchParams(window.location.search).get('excel') || DEFAULT_EXCEL_URL;

    let isCancelled = false;

    const syncConfiguredWorkbook = async () => {
      try {
        const workbookUrl = new URL(configuredExcelUrl, window.location.href).toString();
        let rows: BudgetRecord[];

        if (window.location.protocol === 'file:') {
          rows = await fetchSpreadsheetRows(workbookUrl);
        } else {
          const response = await fetch('/api/sync-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: workbookUrl }),
          });
          const data = await response.json();
          if (!response.ok || !data.success || !Array.isArray(data.rows)) {
            throw new Error(data.error || 'Automatic workbook sync failed.');
          }
          rows = data.rows;
        }

        if (!isCancelled && rows.length > 0) {
          handleDataLoaded(rows, {
            type: 'googlesheets',
            name: 'Google Sheets Budget Source',
            url: workbookUrl,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rowCount: rows.length,
          });
        }
      } catch (error) {
        console.warn('Automatic Excel sync skipped:', error);
      }
    };

    syncConfiguredWorkbook();
    const intervalId = window.setInterval(syncConfiguredWorkbook, AUTO_SYNC_INTERVAL_MS);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  // Find month metadata if in monthly view
  const currentMonthMeta = useMemo(() => {
    if (activeTab === 'summary') return null;
    return MONTHS.find((m) => m.key === activeTab) || MONTHS[0];
  }, [activeTab]);

  const hasActiveFilters =
    filters.activityCodes.length > 0 ||
    filters.bls.length > 0 ||
    filters.glAccounts.length > 0 ||
    filters.descriptions.length > 0 ||
    filters.categories.length > 0 ||
    filters.nonZeroOnly ||
    filters.amountFilter.nonZeroOnly ||
    filters.amountFilter.zeroOnly ||
    filters.amountFilter.minAmount !== null ||
    filters.amountFilter.maxAmount !== null ||
    filters.excludeIncomeCategories ||
    Boolean(filters.searchQuery);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Application Header */}
      <Header
        dataSource={dataSource}
        onOpenSync={() => setIsSyncOpen(true)}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        activeTab={activeTab}
        totalRecords={records.length}
      />
      {/* Power BI Report Page Navigation Tabs */}
      <ReportTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        excludeIncomeCategories={filters.excludeIncomeCategories}
        onToggleExcludeIncome={() =>
          handleUpdateFilters({ excludeIncomeCategories: !filters.excludeIncomeCategories })
        }
      />

      {/* Main Report Body */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <OverallSummaryView
                records={records}
                excludeIncomeCategories={filters.excludeIncomeCategories}
                onNavigateToMonth={(month) => handleSelectTab(month)}
              />
            </motion.div>
          ) : currentMonthMeta ? (
            <motion.div
              key={currentMonthMeta.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <MonthlyReportView
                records={records}
                monthMeta={currentMonthMeta}
                filters={filters}
                onUpdateFilters={handleUpdateFilters}
                onToggleActivityCode={handleToggleActivityCode}
                onToggleBL={handleToggleBL}
                onToggleCategory={handleToggleCategory}
                onToggleGL={handleToggleGL}
                onClearActivityFilter={() => handleUpdateFilters({ activityCodes: [] })}
                onClearBLFilter={() => handleUpdateFilters({ bls: [] })}
                onClearAllFilters={handleResetFilters}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Sync & Data Sources Modal */}
      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        currentSource={dataSource}
        onDataLoaded={handleDataLoaded}
        onResetToSample={handleResetToSample}
      />
    </div>
  );
}
