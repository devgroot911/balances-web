import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';

interface AmountFilterPopoverProps {
  columnTitle: string;
  nonZeroOnly: boolean;
  zeroOnly: boolean;
  minAmount: number | null;
  maxAmount: number | null;
  onChange: (filter: {
    nonZeroOnly: boolean;
    zeroOnly: boolean;
    minAmount: number | null;
    maxAmount: number | null;
  }) => void;
}

export const AmountFilterPopover: React.FC<AmountFilterPopoverProps> = ({
  columnTitle,
  nonZeroOnly,
  zeroOnly,
  minAmount,
  maxAmount,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempMin, setTempMin] = useState<string>(minAmount !== null ? String(minAmount) : '');
  const [tempMax, setTempMax] = useState<string>(maxAmount !== null ? String(maxAmount) : '');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempMin(minAmount !== null ? String(minAmount) : '');
    setTempMax(maxAmount !== null ? String(maxAmount) : '');
  }, [minAmount, maxAmount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
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

  const isFiltered = nonZeroOnly || zeroOnly || minAmount !== null || maxAmount !== null;

  const handleApply = () => {
    const parsedMin = tempMin.trim() ? parseFloat(tempMin) : null;
    const parsedMax = tempMax.trim() ? parseFloat(tempMax) : null;
    onChange({
      nonZeroOnly,
      zeroOnly,
      minAmount: isNaN(parsedMin as number) ? null : parsedMin,
      maxAmount: isNaN(parsedMax as number) ? null : parsedMax,
    });
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempMin('');
    setTempMax('');
    onChange({
      nonZeroOnly: false,
      zeroOnly: false,
      minAmount: null,
      maxAmount: null,
    });
  };

  const handleQuickPreset = (preset: 'nonZero' | 'zero' | 'over1M' | 'over500K' | 'under100K') => {
    if (preset === 'nonZero') {
      onChange({
        nonZeroOnly: !nonZeroOnly,
        zeroOnly: false,
        minAmount: null,
        maxAmount: null,
      });
    } else if (preset === 'zero') {
      onChange({
        nonZeroOnly: false,
        zeroOnly: !zeroOnly,
        minAmount: null,
        maxAmount: null,
      });
    } else if (preset === 'over1M') {
      setTempMin('1000000');
      setTempMax('');
      onChange({
        nonZeroOnly: false,
        zeroOnly: false,
        minAmount: 1000000,
        maxAmount: null,
      });
    } else if (preset === 'over500K') {
      setTempMin('500000');
      setTempMax('');
      onChange({
        nonZeroOnly: false,
        zeroOnly: false,
        minAmount: 500000,
        maxAmount: null,
      });
    } else if (preset === 'under100K') {
      setTempMin('1');
      setTempMax('100000');
      onChange({
        nonZeroOnly: false,
        zeroOnly: false,
        minAmount: 1,
        maxAmount: 100000,
      });
    }
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef} onClick={(e) => e.stopPropagation()}>
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
        title={isFiltered ? 'Amount filter active' : `Filter ${columnTitle}`}
      >
        <Filter className="w-3 h-3" />
        {isFiltered && (
          <span className="text-[9px] px-1 bg-slate-950 text-amber-300 rounded font-mono font-bold leading-none py-0.5">
            Active
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-72 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden text-slate-200 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
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
                Clear
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickPreset('nonZero')}
                className={`px-2 py-1.5 rounded text-left border cursor-pointer transition-colors ${
                  nonZeroOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Non-Zero Only (&gt; 0)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('zero')}
                className={`px-2 py-1.5 rounded text-left border cursor-pointer transition-colors ${
                  zeroOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Zero Only (= 0)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('over1M')}
                className={`px-2 py-1.5 rounded text-left border cursor-pointer transition-colors ${
                  minAmount === 1000000
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                &ge; LKR 1,000,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('over500K')}
                className={`px-2 py-1.5 rounded text-left border cursor-pointer transition-colors ${
                  minAmount === 500000
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                &ge; LKR 500,000
              </button>
            </div>
          </div>

          {/* Custom Min / Max range */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Custom Amount Range (LKR)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Min Amount</label>
                <input
                  type="number"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  placeholder="Min LKR"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Max Amount</label>
                <input
                  type="number"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  placeholder="Max LKR"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            {isFiltered && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-white cursor-pointer text-[11px]"
              >
                Reset
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
