import { BudgetRecord } from '../types';

export interface CategoryDef {
  key: string;
  name: string;
  color: string;
  description: string;
  match: (record: BudgetRecord) => boolean;
}

export function isIncomeRecord(record: BudgetRecord): boolean {
  const budgetLine = Number(String(record.bl || '').replace(/,/g, '').trim());
  return Number.isFinite(budgetLine) && budgetLine >= 30000 && budgetLine <= 40000;
}

function isBLInRange(record: BudgetRecord, minimum: number, maximum: number): boolean {
  const budgetLine = Number(String(record.bl || '').replace(/,/g, '').trim());
  return Number.isFinite(budgetLine) && budgetLine >= minimum && budgetLine <= maximum;
}

export const REPORT_CATEGORIES: CategoryDef[] = [
  {
    key: 'salaries',
    name: 'Salaries',
    color: '#0284c7', // Sky blue
    description: 'FLC Mothers, Educators, Admin, Pension & Medical, Salary Increments',
    match: (r) => isBLInRange(r, 60000, 70000),
  },
  {
    key: 'activities',
    name: 'Activities',
    color: '#3b82f6', // Bright blue
    description: 'Vocational Training, Special Classes, Tuition, Sports & Workshops',
    match: (r) => isBLInRange(r, 53000, 53400),
  },
  {
    key: 'family_budget',
    name: 'Family Budget',
    color: '#6366f1', // Indigo
    description: 'Foodstuff, Clothing, School Uniforms & Books, Kinship care',
    match: (r) => isBLInRange(r, 52000, 52999),
  },
  {
    key: 'public_services',
    name: 'Public & External Services',
    color: '#0d9488', // Teal
    description: 'Electricity & Water Bills, Security, Telecommunications',
    match: (r) => isBLInRange(r, 53400, 53900),
  },
  {
    key: 'vehicles',
    name: 'Vehicles & Transportation',
    color: '#f59e0b', // Amber
    description: 'Vehicle Charges, Fuel, Maintenance, Motorcycle',
    match: (r) => isBLInRange(r, 56000, 57000),
  },
  {
    key: 'maintenance',
    name: 'Maintanance',
    color: '#ec4899', // Pink / Rose
    description: 'Building Renovations, Service Level Contracts, IT Equipment, Grounds',
    match: (r) => isBLInRange(r, 51000, 51999),
  },
];

/**
 * Assigns a record to its matching category
 */
export function getRecordCategory(record: BudgetRecord): string {
  for (const cat of REPORT_CATEGORIES) {
    if (cat.match(record)) {
      return cat.name;
    }
  }
  return 'Other Operations';
}

export function isRecordInCategory(record: BudgetRecord, categoryKey: string): boolean {
  if (categoryKey === 'other') {
    return !REPORT_CATEGORIES.some((cat) => cat.match(record));
  }
  const cat = REPORT_CATEGORIES.find((c) => c.key === categoryKey);
  return cat ? cat.match(record) : false;
}
