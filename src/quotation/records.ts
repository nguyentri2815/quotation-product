import { originalBasicTerms } from './products'
import type { ProductTerms } from './products'
import { calendarDays, isRecord } from './rules'
import type { Premium, Quotation } from './types'

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const integer = (value: unknown): value is number => finite(value) && Number.isSafeInteger(value) && value >= 0

/** Historical reads use the issued terms and stored premium, never the active catalog. */
export function parseQuotation(value: unknown): Quotation | null {
  if (!isRecord(value) || value.type !== 'NORMAL' || value.line !== 'PROPERTY' || value.currency !== 'VND') return null
  const { customer, asset, period, premium } = value
  if (!isRecord(customer) || !isRecord(asset) || !isRecord(period) || !isRecord(premium)) return null
  if (typeof customer.name !== 'string' || !customer.name.trim() || typeof customer.phone !== 'string' || typeof customer.email !== 'string' || typeof asset.name !== 'string' || !asset.name.trim() || typeof asset.address !== 'string' || !asset.address.trim() || !integer(asset.sumInsured) || typeof period.startDate !== 'string' || typeof period.endDate !== 'string') return null
  if (typeof value.id !== 'string' || !value.id || typeof value.number !== 'string' || !/^Q-\d{4}-\d{6,}$/.test(value.number) || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || value.status !== 'CREATED') return null
  const days = calendarDays(period.startDate, period.endDate)
  // Only original Normal/Property/VND A records lacking ALL new contract fields
  // qualify. Unknown product, partial metadata and explicit null never fall back.
  const legacy = !('schemaVersion' in value) && !('productVersion' in value) && !('productSnapshot' in value) && (!('product' in value) || value.product === 'BASIC_PROPERTY')
  let terms: ProductTerms
  if (legacy) terms = { ...originalBasicTerms }
  else {
    const snapshot = value.productSnapshot
    if (value.schemaVersion !== 2 || !isRecord(snapshot) || !['BASIC_PROPERTY','EXTENDED_PROPERTY'].includes(String(value.product)) || value.productVersion !== 1 || snapshot.code !== value.product || snapshot.version !== value.productVersion || typeof snapshot.name !== 'string' || !snapshot.name.trim() || snapshot.dayBasis !== 365 || snapshot.rounding !== 'NET_THEN_TAX') return null
    if (!integer(snapshot.minSumInsured) || !integer(snapshot.maxSumInsured) || snapshot.minSumInsured > snapshot.maxSumInsured || !integer(snapshot.minDays) || snapshot.minDays < 1 || !integer(snapshot.maxDays) || snapshot.maxDays < snapshot.minDays || !finite(snapshot.annualRate) || snapshot.annualRate <= 0 || snapshot.annualRate > 1 || !finite(snapshot.taxRate) || snapshot.taxRate < 0 || snapshot.taxRate > 1) return null
    terms = { code:value.product as ProductTerms['code'], version:1, name:snapshot.name, minSumInsured:snapshot.minSumInsured, maxSumInsured:snapshot.maxSumInsured, minDays:snapshot.minDays, maxDays:snapshot.maxDays, annualRate:snapshot.annualRate, taxRate:snapshot.taxRate, dayBasis:365, rounding:'NET_THEN_TAX' }
  }
  if (days === null || days < terms.minDays || days > terms.maxDays || asset.sumInsured < terms.minSumInsured || asset.sumInsured > terms.maxSumInsured || premium.days !== days || premium.annualRate !== terms.annualRate || premium.taxRate !== terms.taxRate) return null
  for (const key of ['net','tax','total','installmentAmount']) if (!integer(premium[key])) return null
  // Integrity checks against the issued snapshot; return the stored amounts.
  if (premium.net !== Math.round(asset.sumInsured * terms.annualRate * days / terms.dayBasis) || premium.tax !== Math.round(Number(premium.net) * terms.taxRate) || premium.total !== Number(premium.net) + Number(premium.tax) || premium.installmentAmount !== premium.total) return null
  return { schemaVersion:2, type:'NORMAL', line:'PROPERTY', product:terms.code, productVersion:terms.version, productSnapshot:terms, currency:'VND', customer:{name:customer.name,phone:customer.phone,email:customer.email}, asset:{name:asset.name,address:asset.address,sumInsured:asset.sumInsured}, period:{startDate:period.startDate,endDate:period.endDate}, id:value.id, number:value.number, createdAt:value.createdAt, status:'CREATED', premium:{ days, annualRate:premium.annualRate, taxRate:premium.taxRate, net:premium.net, tax:premium.tax, total:premium.total, installmentAmount:premium.installmentAmount } as Premium }
}
