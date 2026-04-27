export type TransactionCategory = 'Necessidade' | 'Desejo' | 'Sonho' | 'Salário' | 'Extra';

export type TransactionType = 'Entrada' | 'Saída';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  goalId?: string; // Link to specific dream goal
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  byCategory: {
    Necessidade: number;
    Desejo: number;
    Sonho: number;
  };
}

export const CATEGORY_LIMITS = {
  Necessidade: 0.5,
  Desejo: 0.3,
  Sonho: 0.2,
};
