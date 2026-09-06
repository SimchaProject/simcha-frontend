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
