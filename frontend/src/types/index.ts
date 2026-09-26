export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  type: string;
  color: string;
  icon: string;
  count?: number;
}

export interface Card {
  id: string;
  userId: string;
  banco: string;
  alias?: string | null;
  type: 'debito' | 'credito' | string;
  last4: string;
  color: string;
  linkedGoogle: boolean;
  cutDay: number | null;
  payDay: number | null;
}

export interface CardDTO {
  id: string;
  userId: string;
  alias?: string | null;
  banco: string;
  type: string;
  last4: string;
  color: string;
  linkedGoogle: boolean;
  cutDay: number | null;
  payDay: number | null;
}

export interface CreateCardDTO {
  alias?: string | null;
  banco: string;
  type?: string;
  last4?: string;
  color?: string;
  linkedGoogle?: boolean;
  cutDay?: number | null;
  payDay?: number | null;
}

export interface UpdateCardDTO {
  alias?: string | null;
  banco?: string;
  type?: string;
  last4?: string;
  color?: string;
  linkedGoogle?: boolean;
  cutDay?: number | null;
  payDay?: number | null;
}

export interface Service {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  amount: number;
  dueDate: string | null;
  state: 'pendiente' | 'pagado' | 'vencido' | string;
  payDay: number | null;
  categoryName?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string | null;
  cardId: string | null;
  type: 'gasto' | 'ingreso' | string;
  amount: number;
  date: string;
  note: string | null;
  origin: 'manual' | 'automático_google_pay' | string;
  categoryName?: string | null;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  cardBanco?: string | null;
  cardLast4?: string | null;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalAmount: number;
  percentage: number;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface GooglePayTransactionDTO {
  amount: number;
  cardLast4: string;
  merchant?: string | null;
  note?: string | null;
  date?: string | null;
}
