// --- User Types ---
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  metodo_auth?: string;
  fecha_registro?: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
}

// --- Category Types ---
export interface CategoryRecord {
  id: string | number;
  user_id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  budget?: number | string | null;
}

export interface CategoryDTO {
  id: string;
  userId: string | null;
  name: string;
  type: string;
  color: string;
  icon: string;
  budget?: number | null;
  count?: number;
}

export interface CreateCategoryDTO {
  name: string;
  type?: string;
  color: string;
  icon?: string;
  budget?: number | null;
}

export interface UpdateCategoryDTO {
  name?: string;
  type?: string;
  color?: string;
  icon?: string;
  budget?: number | null;
}

// --- Card Types ---
export interface CardRecord {
  id: string | number;
  user_id: string;
  alias?: string | null;
  banco: string;
  type: string;
  last_4: string;
  color: string;
  linked_google: boolean;
  cut_day: number | null;
  pay_day: number | null;
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
  last_4?: string;
  bankname?: string;
  color?: string;
  linkedGoogle?: boolean;
  linked_google?: boolean;
  cutDay?: number | null;
  cut_day?: number | null;
  payDay?: number | null;
  pay_day?: number | null;
}

export interface UpdateCardDTO {
  alias?: string | null;
  banco?: string;
  bankname?: string;
  type?: string;
  last4?: string;
  last_4?: string;
  color?: string;
  linkedGoogle?: boolean;
  linked_google?: boolean;
  cutDay?: number | null;
  cut_day?: number | null;
  payDay?: number | null;
  pay_day?: number | null;
}

// --- Service Types ---
export interface ServiceRecord {
  id: string | number;
  user_id: string;
  category_id: string | number | null;
  name: string;
  amount: number | string;
  due_date: string | Date | null;
  state: string;
  pay_day: number | null;
  category_name?: string | null;
}

export interface ServiceDTO {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  amount: number;
  dueDate: string | null;
  state: string;
  payDay: number | null;
  categoryName?: string | null;
}

export interface CreateServiceDTO {
  name: string;
  amount: number;
  categoryId?: string | number | null;
  category_id?: string | number | null;
  dueDate?: string | null;
  due_date?: string | null;
  state?: string;
  payDay?: number | null;
  pay_day?: number | null;
}

export interface UpdateServiceDTO {
  name?: string;
  amount?: number;
  categoryId?: string | number | null;
  category_id?: string | number | null;
  dueDate?: string | null;
  due_date?: string | null;
  state?: string;
  payDay?: number | null;
  pay_day?: number | null;
}

// --- Transaction Types ---
export interface TransactionRecord {
  id: string | number;
  category_id: string | number | null;
  user_id: string;
  card_id: string | number | null;
  type: string;
  amount: number | string;
  date: string | Date;
  note: string | null;
  origin: string;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  card_banco?: string | null;
  card_last_4?: string | null;
}

export interface TransactionDTO {
  id: string;
  userId: string;
  categoryId: string | null;
  cardId: string | null;
  type: string;
  amount: number;
  date: string;
  note: string | null;
  origin: string;
  categoryName?: string | null;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  cardBanco?: string | null;
  cardLast4?: string | null;
}

export interface CreateTransactionDTO {
  amount: number;
  type?: string;
  categoryId?: string | number | null;
  category_id?: string | number | null;
  cardId?: string | number | null;
  card_id?: string | number | null;
  note?: string | null;
  title?: string;
  origin?: string;
  date?: string;
  isAuto?: boolean;
}

export interface UpdateTransactionDTO {
  amount?: number;
  type?: string;
  categoryId?: string | number | null;
  category_id?: string | number | null;
  cardId?: string | number | null;
  card_id?: string | number | null;
  note?: string | null;
  title?: string;
  origin?: string;
  date?: string;
  isAuto?: boolean;
}

export interface GooglePayTransactionDTO {
  amount: number;
  cardLast4: string;
  merchant?: string | null;
  note?: string | null;
  date?: string | null;
}

// --- Summary Types ---
export interface CategoryBreakdownDTO {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budget?: number | null;
  totalAmount: number;
  percentage: number;
}

export interface MonthlySummaryDTO {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryBreakdown: CategoryBreakdownDTO[];
}

// --- Response Envelopes ---
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

// --- Hono App Environment ---
export type AppEnv = {
  Variables: {
    userId: string;
  };
};
