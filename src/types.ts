export type TransactionCategory = 'Necessidade' | 'Desejo' | 'Sonho' | 'Salário' | 'Extra';

export type TransactionType = 'Entrada' | 'Saída';

export type TransactionStatus = 'pago' | 'pendente';

export type PaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Boleto';

export const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto'];

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  goalId?: string; // Link to specific dream goal
  installmentId?: string;    // Vínculo entre parcelas da mesma compra
  installmentIndex?: number; // Número da parcela (1, 2, 3...)
  installmentTotal?: number; // Total de parcelas
  installmentInterval?: number; // Intervalo entre parcelas, em meses (padrão 1)
  status?: TransactionStatus; // 'pago' (conta no saldo) | 'pendente' (previsto)
  dueDate?: string;           // Vencimento previsto da parcela (YYYY-MM-DD)
  paidDate?: string | null;   // Data de efetivação (null quando pendente)
  recurringId?: string;       // Vínculo com o template recorrente que gerou este lançamento
  paymentMethod?: PaymentMethod; // Forma de pagamento (Dinheiro, Pix, Cartão...)
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  autoCreated?: boolean; // true se a meta foi gerada por um parcelamento de Sonho
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

export interface RecurringTemplate {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  dueDay: number;   // dia do vencimento (1-31)
  active: boolean;
  paymentMethod?: PaymentMethod; // Forma de pagamento padrão da recorrência
}

export const CATEGORY_LIMITS = {
  Necessidade: 0.5,
  Desejo: 0.3,
  Sonho: 0.2,
};
