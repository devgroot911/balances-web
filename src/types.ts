export interface BudgetRecord {
  id: string;
  glAccount: string;
  bl: string;
  activityCode: string;
  description: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

export type MonthKey =
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'
  | 'september'
  | 'october'
  | 'november'
  | 'december';

export interface MonthMeta {
  key: MonthKey;
  label: string;
  shortName: string;
  columnTitle: string;
  chartTitlePrefix: string;
}

export interface CategorySummary {
  name: string;
  key: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

export interface FilterState {
  activityCode: string | null;
  bl: string | null;
  searchQuery: string;
}

export interface MonthlyFilterState {
  activityCodes: string[];
  bls: string[];
  glAccounts: string[];
  descriptions: string[];
  categories: string[];
  amountFilter: {
    nonZeroOnly: boolean;
    zeroOnly: boolean;
    minAmount: number | null;
    maxAmount: number | null;
  };
  nonZeroOnly: boolean;
  searchQuery: string;
}

export type TabMode = 'summary' | MonthKey;

export interface DataSourceInfo {
  type: 'master' | 'sharepoint' | 'googlesheets' | 'upload';
  name: string;
  url?: string;
  lastUpdated: string;
  rowCount: number;
}
