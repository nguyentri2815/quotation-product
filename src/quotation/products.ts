// Learning demo only. These are not real insurance rules or tariffs.
export type PropertyProductCode = 'BASIC_PROPERTY' | 'EXTENDED_PROPERTY'

export interface PropertyProduct {
  code: PropertyProductCode
  version: 1
  name: string
  description: string
  minSumInsured: number
  maxSumInsured: number
  minDays: number
  maxDays: number
  annualRate: number
  taxRate: number
}

export const propertyProducts: readonly PropertyProduct[] = [
  {
    code: 'BASIC_PROPERTY', version: 1, name: 'Tài sản cơ bản',
    description: 'Lập bản chào cho nhà xưởng, kho hàng và tài sản kinh doanh.',
    minSumInsured: 1_000_000, maxSumInsured: 100_000_000_000,
    minDays: 1, maxDays: 365, annualRate: 0.001, taxRate: 0.1,
  },
  {
    code: 'EXTENDED_PROPERTY', version: 1, name: 'Tài sản mở rộng',
    description: 'Lập bản chào tài sản với thời hạn ngắn và mức phí riêng.',
    minSumInsured: 10_000_000, maxSumInsured: 50_000_000_000,
    minDays: 1, maxDays: 180, annualRate: 0.0015, taxRate: 0.1,
  },
]

export function getPropertyProduct(code: string, version = 1): PropertyProduct {
  const product = propertyProducts.find(item => item.code === code && item.version === version)
  if (!product) throw new RangeError(`Mã sản phẩm không được hỗ trợ: ${code}`)
  return product
}

export type ProductTerms = Omit<PropertyProduct, 'description'> & { dayBasis: 365; rounding: 'NET_THEN_TAX' }
export function productTerms(product: PropertyProduct): ProductTerms {
  const { description: _description, ...terms } = product
  return { ...terms, dayBasis:365, rounding:'NET_THEN_TAX' }
}
// The original published A/v1 terms are pinned for the narrow legacy adapter.
export const originalBasicTerms: Readonly<ProductTerms> = Object.freeze({
  code:'BASIC_PROPERTY',version:1,name:'Tài sản cơ bản',
  minSumInsured:1_000_000,maxSumInsured:100_000_000_000,minDays:1,maxDays:365,
  annualRate:0.001,taxRate:0.1,dayBasis:365,rounding:'NET_THEN_TAX',
})
