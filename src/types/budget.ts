import type { PaymentType } from './vendors'

export interface BudgetCategory {
  id: string
  budgetId: string
  name: string
  allocatedAmount: number
}

export interface CreateBudgetCategoryPayload {
  name: string
  allocatedAmount: number
}

export interface UpdateBudgetCategoryPayload {
  name?: string
  allocatedAmount?: number
}

export interface UpdateBudgetPayload {
  totalAmount?: number
}

export interface BudgetCategorySummary {
  id: string
  name: string
  allocatedAmount: number
  actualAmount: number
  committedAmount: number
}

export interface BudgetPaymentSummary {
  id: string
  vendorId: string
  vendorName: string
  paymentType: PaymentType
  amount: number
  dueDate: string
  isOverdue: boolean
}

export interface BudgetSummary {
  totalAmount: number
  totalPaid: number
  totalCommitted: number
  totalRemaining: number
  remainingAfterCommitments: number
  categories: BudgetCategorySummary[]
  upcomingPayments: BudgetPaymentSummary[]
  overduePayments: BudgetPaymentSummary[]
}

export interface BurndownPoint {
  date: string
  planned: number
  // null for dates past today - the actual line stops at the present rather
  // than flat-lining into the future.
  actual: number | null
}

// One scheduled payment on the same axis as the curves - what the step is,
// and who it's to.
export interface BurndownEvent {
  id: string
  date: string
  amount: number
  vendorName: string
  paymentType: 'DEPOSIT' | 'INSTALLMENT' | 'FINAL'
  status: 'PENDING' | 'PAID'
  isOverdue: boolean
}

export interface BudgetBurndown {
  totalAmount: number
  weddingDate: string
  today: string
  // Spend recorded by marking a vendor PAID without any itemized payment, so
  // it has no date to sit on. Both curves open already reduced by it.
  undatedPaid: number
  points: BurndownPoint[]
  events: BurndownEvent[]
}
