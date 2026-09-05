export type VendorStatus = 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'PAID'

export interface Vendor {
  id: string
  weddingId: string
  name: string
  category: string
  contactInfo: string | null
  status: VendorStatus
  totalContractAmount: number | null
  budgetCategoryId: string | null
  hasContract: boolean
  contractFileName: string | null
}

export interface CreateVendorPayload {
  name: string
  category: string
  contactInfo?: string
  totalContractAmount?: number
  budgetCategoryId?: string | null
}

export interface UpdateVendorPayload {
  name?: string
  category?: string
  contactInfo?: string
  status?: VendorStatus
  totalContractAmount?: number
  budgetCategoryId?: string | null
}

export type PaymentType = 'DEPOSIT' | 'INSTALLMENT' | 'FINAL'
export type PaymentStatus = 'PENDING' | 'PAID'

export interface VendorPayment {
  id: string
  vendorId: string
  paymentType: PaymentType
  amount: number
  dueDate: string | null
  paidDate: string | null
  status: PaymentStatus
  isOverdue: boolean
  hasReceipt: boolean
  receiptFileName: string | null
}

export interface CreateVendorPaymentPayload {
  paymentType: PaymentType
  amount: number
  dueDate?: string
  status?: PaymentStatus
  paidDate?: string
}

export interface UpdateVendorPaymentPayload {
  paymentType?: PaymentType
  amount?: number
  dueDate?: string
  status?: PaymentStatus
  paidDate?: string
}
