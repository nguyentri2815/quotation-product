import { getPropertyProduct } from './products'
import type { PropertyProductCode } from './products'
import type { CalculatedPremium, ProductInput, FieldErrors, Premium, QuotationDraft, ValidationResult } from './types'

export const MIN_SUM_INSURED = getPropertyProduct('BASIC_PROPERTY').minSumInsured
export const MAX_SUM_INSURED = getPropertyProduct('BASIC_PROPERTY').maxSumInsured

function calendarDay(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const time = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) return null
  return time / 86_400_000
}

export function calendarDays(start: string, end: string): number | null {
  const first = calendarDay(start)
  const last = calendarDay(end)
  return first === null || last === null ? null : last - first
}

export function validateDraft(draft: QuotationDraft, productCode: PropertyProductCode = 'BASIC_PROPERTY'): FieldErrors {
  const product = getPropertyProduct(productCode)
  const errors: FieldErrors = {}
  if (!draft.customerName.trim()) errors.customerName = 'Vui lòng nhập tên khách hàng.'
  else if (draft.customerName.trim().length > 150)
    errors.customerName = 'Tên khách hàng tối đa 150 ký tự.'
  if (draft.phone.trim() && !/^\d{10,11}$/.test(draft.phone.trim()))
    errors.phone = 'Điện thoại cần có 10–11 chữ số.'
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
    errors.email = 'Email chưa đúng định dạng, ví dụ ten@example.com.'
  if (!draft.assetName.trim()) errors.assetName = 'Vui lòng nhập tên hoặc mô tả tài sản.'
  else if (draft.assetName.trim().length > 200)
    errors.assetName = 'Tên/mô tả tài sản tối đa 200 ký tự.'
  if (!draft.address.trim()) errors.address = 'Vui lòng nhập địa chỉ tài sản.'
  else if (draft.address.trim().length > 300) errors.address = 'Địa chỉ tài sản tối đa 300 ký tự.'
  const sum = Number(draft.sumInsured)
  if (
    !/^\d+$/.test(draft.sumInsured) ||
    !Number.isSafeInteger(sum) ||
    sum < product.minSumInsured ||
    sum > product.maxSumInsured
  ) {
    errors.sumInsured = `Nhập số nguyên từ ${product.minSumInsured.toLocaleString('vi-VN')} đến ${product.maxSumInsured.toLocaleString('vi-VN')} VND.`
  }
  if (calendarDay(draft.startDate) === null) errors.startDate = 'Vui lòng chọn ngày bắt đầu hợp lệ.'
  if (calendarDay(draft.endDate) === null) errors.endDate = 'Vui lòng chọn ngày kết thúc hợp lệ.'
  const days = calendarDays(draft.startDate, draft.endDate)
  if (days !== null && days < product.minDays) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.'
  else if (days !== null && days > product.maxDays) errors.endDate = `Thời hạn bảo hiểm tối đa ${product.maxDays} ngày.`
  return errors
}

export function validateAndBuildInput(draft: QuotationDraft): ValidationResult
export function validateAndBuildInput(draft: QuotationDraft, productCode: PropertyProductCode): ValidationResult<ProductInput>
export function validateAndBuildInput(draft: QuotationDraft, productCode: PropertyProductCode = 'BASIC_PROPERTY'): ValidationResult<ProductInput> {
  const product = getPropertyProduct(productCode)
  const errors = validateDraft(draft, product.code)
  if (Object.keys(errors).length)
    return { success: false, message: 'Vui lòng kiểm tra các trường được đánh dấu.', errors }
  return {
    success: true,
    data: {
      type: 'NORMAL',
      line: 'PROPERTY',
      product: product.code,
      productVersion: product.version,
      currency: 'VND',
      customer: {
        name: draft.customerName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
      },
      asset: {
        name: draft.assetName.trim(),
        address: draft.address.trim(),
        sumInsured: Number(draft.sumInsured),
      },
      period: { startDate: draft.startDate, endDate: draft.endDate },
    },
  }
}

export function calculatePremium(sumInsured: number, startDate: string, endDate: string, productCode: PropertyProductCode = 'BASIC_PROPERTY'): Premium {
  const product = getPropertyProduct(productCode)
  const days = calendarDays(startDate, endDate)
  if (
    !Number.isSafeInteger(sumInsured) ||
    sumInsured < product.minSumInsured ||
    sumInsured > product.maxSumInsured ||
    days === null ||
    days < product.minDays ||
    days > product.maxDays
  ) {
    throw new RangeError('Số tiền bảo hiểm hoặc thời hạn không hợp lệ.')
  }
  const net = Math.round((sumInsured * product.annualRate * days) / 365)
  const tax = Math.round(net * product.taxRate)
  return {
    days,
    annualRate: product.annualRate,
    taxRate: product.taxRate,
    net,
    tax,
    total: net + tax,
    installmentAmount: net + tax,
  }
}

export function pricingInputsChanged(previous: QuotationDraft, next: QuotationDraft): boolean {
  return (
    previous.sumInsured !== next.sumInsured ||
    previous.startDate !== next.startDate ||
    previous.endDate !== next.endDate
  )
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseQuotationInput(value: unknown): ValidationResult {
  const malformed = {
    success: false,
    message: 'Dữ liệu bản chào không đúng cấu trúc được hỗ trợ.',
    errors: {},
  } as const
  if (
    !isRecord(value) ||
    value.type !== 'NORMAL' ||
    value.line !== 'PROPERTY' ||
    !['BASIC_PROPERTY','EXTENDED_PROPERTY'].includes(String(value.product)) ||
    value.productVersion !== 1 ||
    value.currency !== 'VND'
  )
    return malformed
  const { customer, asset, period } = value
  if (!isRecord(customer) || !isRecord(asset) || !isRecord(period)) return malformed
  if (
    typeof customer.name !== 'string' ||
    typeof customer.phone !== 'string' ||
    typeof customer.email !== 'string' ||
    typeof asset.name !== 'string' ||
    typeof asset.address !== 'string' ||
    typeof asset.sumInsured !== 'number' ||
    typeof period.startDate !== 'string' ||
    typeof period.endDate !== 'string'
  )
    return malformed
  return validateAndBuildInput({
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email,
    assetName: asset.name,
    address: asset.address,
    sumInsured: String(asset.sumInsured),
    startDate: period.startDate,
    endDate: period.endDate,
  }, value.product as PropertyProductCode)
}

export { parseQuotation } from './records'

// Pricing receipt belongs to the current draft; the saved record has its own terms snapshot.
export function calculateDraftPremium(draft: QuotationDraft, productCode: PropertyProductCode): CalculatedPremium {
  const product = getPropertyProduct(productCode)
  return {
    ...calculatePremium(Number(draft.sumInsured), draft.startDate, draft.endDate, product.code),
    productCode: product.code, productVersion: product.version, productName: product.name,
    inputs: { sumInsured: draft.sumInsured, startDate: draft.startDate, endDate: draft.endDate },
  }
}

export function premiumMatchesDraft(premium: CalculatedPremium | null, draft: QuotationDraft, productCode: PropertyProductCode): boolean {
  const product = getPropertyProduct(productCode)
  return Boolean(premium && premium.productCode === product.code && premium.productVersion === product.version && !pricingInputsChanged({ ...draft, ...premium.inputs }, draft))
}
