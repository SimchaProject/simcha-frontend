import { http } from './http'
import type {
  BudgetCategory,
  BudgetSummary,
  CreateBudgetCategoryPayload,
  UpdateBudgetCategoryPayload,
  UpdateBudgetPayload,
} from '../types/budget'

export const budgetApi = {
  getSummary: (weddingId: string) => http.get<BudgetSummary>(`/weddings/${weddingId}/budget/summary`),
  listCategories: (weddingId: string) =>
    http.get<BudgetCategory[]>(`/weddings/${weddingId}/budget/categories`),
  updateBudget: (weddingId: string, payload: UpdateBudgetPayload) =>
    http.patch<void>(`/weddings/${weddingId}/budget`, payload),
  createCategory: (weddingId: string, payload: CreateBudgetCategoryPayload) =>
    http.post<BudgetCategory>(`/weddings/${weddingId}/budget/categories`, payload),
  updateCategory: (weddingId: string, categoryId: string, payload: UpdateBudgetCategoryPayload) =>
    http.patch<BudgetCategory>(`/weddings/${weddingId}/budget/categories/${categoryId}`, payload),
  removeCategory: (weddingId: string, categoryId: string) =>
    http.del<void>(`/weddings/${weddingId}/budget/categories/${categoryId}`),
}
