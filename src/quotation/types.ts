export interface QuotationInput {
  type: 'NORMAL'
  line: 'PROPERTY'
  product: 'BASIC_PROPERTY'
  currency: 'VND'
  customer: { name: string; phone: string; email: string }
  asset: { name: string; address: string; sumInsured: number }
  period: { startDate: string; endDate: string }
}

export interface Premium {
  days: number
  annualRate: number
  taxRate: number
  net: number
  tax: number
  total: number
  installmentAmount: number
}

export interface Quotation extends QuotationInput {
  id: string
  number: string
  createdAt: string
  status: 'CREATED'
  premium: Premium
}

export interface QuotationDraft {
  customerName: string
  phone: string
  email: string
  assetName: string
  address: string
  sumInsured: string
  startDate: string
  endDate: string
}

export type FieldErrors = Partial<Record<keyof QuotationDraft, string>>
export type ValidationResult =
  | { success: true; data: QuotationInput }
  | { success: false; message: string; errors: FieldErrors }

export const emptyDraft: QuotationDraft = {
  customerName: '',
  phone: '',
  email: '',
  assetName: '',
  address: '',
  sumInsured: '',
  startDate: '',
  endDate: '',
}

export function sampleDraft(): QuotationDraft {
  // Date-only values; UTC is used only for calendar arithmetic.
  const now = new Date()
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const endDate = new Date(Date.parse(`${startDate}T00:00:00Z`) + 365 * 86_400_000)
    .toISOString()
    .slice(0, 10)
  return {
    customerName: 'Công ty TNHH Mộc An Demo',
    phone: '0901234567',
    email: 'lienhe@mocan.example',
    assetName: 'Kho hàng Mộc An',
    address: '28 đường Hoa Nắng, phường An Hòa, thành phố Minh Sơn (giả lập)',
    sumInsured: '1000000000',
    startDate,
    endDate,
  }
}
