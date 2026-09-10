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

export const REPORT_CATEGORIES: CategoryDef[] = [
  {
    key: 'salaries',
    name: 'Salaries',
    color: '#0284c7', // Sky blue
    description: 'FLC Mothers, Educators, Admin, Pension & Medical, Salary Increments',
    match: (r) => {
      const bl = r.bl || '';
      const desc = (r.description || '').toLowerCase();
      return (
        bl.startsWith('6') ||
        desc.includes('sal:') ||
        desc.includes('salary') ||
        desc.includes('pension') ||
        desc.includes('increment') ||
        desc.includes('educator')
      );
    },
  },
  {
    key: 'activities',
    name: 'Activities',
    color: '#3b82f6', // Bright blue
    description: 'Vocational Training, Special Classes, Tuition, Sports & Workshops',
    match: (r) => {
      const bl = r.bl || '';
      const desc = (r.description || '').toLowerCase();
      return (
        bl === '53400' ||
        desc.includes('act:') ||
        desc.includes('tuition') ||
        desc.includes('training') ||
        desc.includes('sports') ||
        desc.includes('vocaional')
      );
    },
  },
  {
    key: 'family_budget',
    name: 'Family Budget',
    color: '#6366f1', // Indigo
    description: 'Foodstuff, Clothing, School Uniforms & Books, Kinship care',
    match: (r) => {
      const bl = r.bl || '';
      const desc = (r.description || '').toLowerCase();
      return (
        bl.startsWith('52') ||
        desc.includes('foodstuff') ||
        desc.includes('fod:') ||
        desc.includes('scl:') ||
        desc.includes('clo:') ||
        desc.includes('scf:') ||
        desc.includes('clothing') ||
        desc.includes('uniform')
      );
    },
  },
  {
    key: 'public_services',
    name: 'Public & External Services',
    color: '#0d9488', // Teal
    description: 'Electricity & Water Bills, Security, Telecommunications',
    match: (r) => {
      const bl = r.bl || '';
      const desc = (r.description || '').toLowerCase();
      return (
        ['53500', '53700', '53100', '53200', '53300', '53900'].includes(bl) ||
        desc.includes('pub:') ||
        desc.includes('fes:') ||
        desc.includes('security') ||
        desc.includes('electricity') ||
        desc.includes('water')
      );
    },
  },
  {
    key: 'vehicles',
    name: 'Vehicles & Transportation',
    color: '#f59e0b', // Amber
    description: 'Vehicle Charges, Fuel, Maintenance, Motorcycle',
    match: (r) => {
      const bl = r.bl || '';
      const desc = (r.description || '').toLowerCase();
      return bl.startsWith('56') || desc.includes('veh:') || desc.includes('vehicle') || desc.includes('motor cycle');
    },
  },
  {
    key: 'maintenance',
    name: 'Maintanance',
    color: '#ec4899', // Pink / Rose
    description: 'Building Renovations, Service Level Contracts, IT Equipment, Grounds',
    match: (r) => {
      const bl = r.bl || '';
      const desc = (r.description || '').toLowerCase();
      return (
        bl.startsWith('51') ||
        desc.includes('bld:') ||
        desc.includes('s&l:') ||
        desc.includes('renovation') ||
        desc.includes('service level contracts') ||
        desc.includes('meraki') ||
        desc.includes('garbage bin')
      );
    },
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
