import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  Link,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Share2,
  RotateCcw,
} from 'lucide-react';
import { BudgetRecord, DataSourceInfo } from '../types';
import { fetchSpreadsheetRows, parseExcelData, parseCSVData } from '../utils/excelParser';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSource: DataSourceInfo;
  onDataLoaded: (rows: BudgetRecord[], sourceInfo: DataSourceInfo) => void;
  onResetToSample: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  currentSource,
  onDataLoaded,
  onResetToSample,
}) => {
  const [activeTab, setActiveTab] = useState<'sharepoint' | 'googlesheets' | 'upload'>('googlesheets');
  const [sharePointUrl, setSharePointUrl] = useState(
    'https://soscv-my.sharepoint.com/:x:/g/personal/gayan_rathnayake_soscvsrilanka_org/IQAVEppF2Jj2Spwa_PHVq7pxAf5gbDn2hmaAeYtPjEoIsZQ?e=zeTg9Y'
  );
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1FPhFbVBHksaqiIllJhhkD6ay_rN8XY0vPPg3TRP1tZQ/edit?gid=0#gid=0'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncUrl = async (url: string, type: 'sharepoint' | 'googlesheets') => {
    if (!url.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid link.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (window.location.protocol === 'file:') {
        const rows = await fetchSpreadsheetRows(url.trim());
        if (rows.length === 0) throw new Error('No valid rows found in the spreadsheet.');

        onDataLoaded(rows, {
          type,
          name: type === 'sharepoint' ? 'SharePoint Master Sheet' : 'Google Sheets Sync',
          url: url.trim(),
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rowCount: rows.length,
        });
        setStatusMessage({
          type: 'success',
          text: `Successfully synced ${rows.length} account lines from ${type === 'sharepoint' ? 'SharePoint' : 'Google Sheets'}!`,
        });
        setTimeout(() => onClose(), 1200);
        return;
      }

      // First try calling our backend sync proxy
      const response = await fetch('/api/sync-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.rows)) {
        onDataLoaded(data.rows, {
          type,
          name: type === 'sharepoint' ? 'SharePoint Master Sheet' : 'Google Sheets Sync',
          url,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rowCount: data.rows.length,
        });

        setStatusMessage({
          type: 'success',
          text: `Successfully synced ${data.rows.length} account lines from ${type === 'sharepoint' ? 'SharePoint' : 'Google Sheets'}!`,
        });

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(data.error || 'Failed to sync data from the URL.');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not fetch or parse spreadsheet from link. Make sure the file has view permissions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const fileName = file.name;
      const isCsv = fileName.toLowerCase().endsWith('.csv');

      if (isCsv) {
        const text = await file.text();
        const records = parseCSVData(text);
        if (records.length === 0) throw new Error('No valid rows found in CSV.');
        onDataLoaded(records, {
          type: 'upload',
          name: fileName,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rowCount: records.length,
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const records = parseExcelData(arrayBuffer);
        if (records.length === 0) throw new Error('No valid rows found in Excel.');
        onDataLoaded(records, {
          type: 'upload',
          name: fileName,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rowCount: records.length,
        });
      }

      setStatusMessage({
        type: 'success',
        text: `Loaded ${file.name} successfully!`,
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to parse the uploaded file.',
      });
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Data Source & Sync Options</h2>
              <p className="text-xs text-slate-400">
                Connect live SharePoint / Excel link, Google Sheet, or upload file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('sharepoint')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sharepoint'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>SharePoint / OneDrive</span>
          </button>
          <button
            onClick={() => setActiveTab('googlesheets')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'googlesheets'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Active status banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-md text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-700/60 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">{statusMessage.text}</div>
            </div>
          )}

          {activeTab === 'sharepoint' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  SharePoint / OneDrive Excel Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={sharePointUrl}
                    onChange={(e) => setSharePointUrl(e.target.value)}
                    placeholder="https://soscv-my.sharepoint.com/:x:/g/personal/..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-8"
                  />
                  <Link className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Master template URL pre-filled. You can also paste any updated shared Excel link.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSyncUrl(sharePointUrl, 'sharepoint')}
                  disabled={isLoading}
                  id="btn-sync-sharepoint"
                  className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting and Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync from SharePoint Master Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'googlesheets' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Google Sheet Shareable or Published Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-8"
                  />
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Make sure access is set to "Anyone with the link can view". We automatically fetch the sheet as an export.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSyncUrl(googleSheetUrl, 'googlesheets')}
                  disabled={isLoading || !googleSheetUrl.trim()}
                  id="btn-sync-googlesheets"
                  className="w-full py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing Google Sheet...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync from Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label
                htmlFor="file-upload-input"
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-slate-950/40 hover:bg-slate-950 transition-all text-center"
              >
                <div className="p-3 rounded-full bg-slate-800 text-blue-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-blue-400 hover:underline">
                    Click to browse
                  </span>
                  <span className="text-xs text-slate-400"> or drag and drop your spreadsheet</span>
                </div>
                <p className="text-[11px] text-slate-500">Supports .xlsx, .xls, and .csv files</p>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Current Source:</span>
            <span className="text-slate-300 font-medium">{currentSource.name}</span>
          </div>

          <button
            onClick={() => {
              onResetToSample();
              setStatusMessage({ type: 'success', text: 'Reset to master sample sheet.' });
              setTimeout(onClose, 800);
            }}
            id="btn-reset-sample"
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Master Sample</span>
          </button>
        </div>
      </div>
    </div>
  );
};
