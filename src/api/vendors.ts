import { http, BASE_URL } from './http'
import type {
  CreateVendorPayload,
  CreateVendorPaymentPayload,
  UpdateVendorPayload,
  UpdateVendorPaymentPayload,
  Vendor,
  VendorPayment,
} from '../types/vendors'

export const vendorsApi = {
  list: (weddingId: string) => http.get<Vendor[]>(`/weddings/${weddingId}/vendors`),
  create: (weddingId: string, payload: CreateVendorPayload) =>
    http.post<Vendor>(`/weddings/${weddingId}/vendors`, payload),
  update: (weddingId: string, vendorId: string, payload: UpdateVendorPayload) =>
    http.patch<Vendor>(`/weddings/${weddingId}/vendors/${vendorId}`, payload),
  remove: (weddingId: string, vendorId: string) =>
    http.del<void>(`/weddings/${weddingId}/vendors/${vendorId}`),
  uploadContract: (weddingId: string, vendorId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.postForm<Vendor>(`/weddings/${weddingId}/vendors/${vendorId}/contract`, form)
  },
  // Not fetched via http.get - the response is a binary file, not JSON. A
  // plain top-level navigation (link click / window.open) still sends the
  // auth cookie since it's same-site, even though the API runs on a
  // different port/origin than the frontend dev server.
  contractUrl: (weddingId: string, vendorId: string) =>
    `${BASE_URL}/weddings/${weddingId}/vendors/${vendorId}/contract`,

  listPayments: (weddingId: string, vendorId: string) =>
    http.get<VendorPayment[]>(`/weddings/${weddingId}/vendors/${vendorId}/payments`),
  createPayment: (weddingId: string, vendorId: string, payload: CreateVendorPaymentPayload) =>
    http.post<VendorPayment>(`/weddings/${weddingId}/vendors/${vendorId}/payments`, payload),
  updatePayment: (
    weddingId: string,
    vendorId: string,
    paymentId: string,
    payload: UpdateVendorPaymentPayload,
  ) =>
    http.patch<VendorPayment>(
      `/weddings/${weddingId}/vendors/${vendorId}/payments/${paymentId}`,
      payload,
    ),
  removePayment: (weddingId: string, vendorId: string, paymentId: string) =>
    http.del<void>(`/weddings/${weddingId}/vendors/${vendorId}/payments/${paymentId}`),
  uploadReceipt: (weddingId: string, vendorId: string, paymentId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.postForm<VendorPayment>(
      `/weddings/${weddingId}/vendors/${vendorId}/payments/${paymentId}/receipt`,
      form,
    )
  },
  receiptUrl: (weddingId: string, vendorId: string, paymentId: string) =>
    `${BASE_URL}/weddings/${weddingId}/vendors/${vendorId}/payments/${paymentId}/receipt`,
}
