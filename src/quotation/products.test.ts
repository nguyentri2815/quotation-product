import { describe, expect, it } from 'vitest'
import { getPropertyProduct, propertyProducts } from './products'
import { calculateDraftPremium, calculatePremium, parseQuotationInput, premiumMatchesDraft, validateAndBuildInput, validateDraft } from './rules'
import { sampleDraft } from './types'

const startDate = '2024-02-01'
const end = (days: number) => new Date(Date.parse(startDate + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10)
describe.each(propertyProducts)('$code · quy tắc demo', product => {
  const draft = { ...sampleDraft(), startDate, endDate: end(product.maxDays) }
  it('chấp nhận cả hai biên tiền/ngày, từ chối ngoài biên và định dạng sai', () => {
    for (const sumInsured of [product.minSumInsured, product.maxSumInsured]) for (const days of [product.minDays, product.maxDays]) {
      expect(validateDraft({ ...draft, sumInsured: String(sumInsured), endDate: end(days) }, product.code)).toEqual({})
      expect(calculatePremium(sumInsured, startDate, end(days), product.code).days).toBe(days)
    }
    for (const sumInsured of [String(product.minSumInsured - 1), String(product.maxSumInsured + 1), '1e9', '10.5', '-1', '', '9007199254740993']) {
      expect(validateDraft({ ...draft, sumInsured }, product.code).sumInsured).toContain(product.minSumInsured.toLocaleString('vi-VN'))
      if (!Number.isSafeInteger(Number(sumInsured)) || Number(sumInsured) < product.minSumInsured || Number(sumInsured) > product.maxSumInsured)
        expect(() => calculatePremium(Number(sumInsured), startDate, end(1), product.code)).toThrow()
    }
    for (const days of [-1, 0, product.maxDays + 1]) {
      expect(validateDraft({ ...draft, endDate: end(days) }, product.code).endDate).toBeTruthy()
      expect(() => calculatePremium(1e9, startDate, end(days), product.code)).toThrow()
    }
  })
  it('giữ validation chung, ngày lịch và dữ liệu chuẩn hóa đúng sản phẩm', () => {
    expect(validateDraft({ ...draft, customerName: ' ', email: 'sai@', startDate: '2026-02-30', endDate: 'invalid' }, product.code)).toMatchObject({ customerName: expect.any(String), email: expect.any(String), startDate: expect.any(String), endDate: expect.any(String) })
    expect(validateAndBuildInput(draft, product.code)).toMatchObject({ success: true, data: { product: product.code } })
  })
  it('gắn phí với sản phẩm/phiên bản/tiền/ngày nhưng không với tên khách hàng', () => {
    const premium = calculateDraftPremium(draft, product.code)
    expect(premiumMatchesDraft(premium, draft, product.code)).toBe(true)
    expect(premiumMatchesDraft(premium, { ...draft, customerName: 'Tên khác' }, product.code)).toBe(true)
    for (const changes of [{ sumInsured: '2000000000' }, { startDate: end(1) }, { endDate: end(2) }]) expect(premiumMatchesDraft(premium, { ...draft, ...changes }, product.code)).toBe(false)
    expect(premiumMatchesDraft({ ...premium, productVersion: 2 }, draft, product.code)).toBe(false)
    expect(premiumMatchesDraft(premium, draft, product.code === 'BASIC_PROPERTY' ? 'EXTENDED_PROPERTY' : 'BASIC_PROPERTY')).toBe(false)
  })
})
it('mẫu A/B và thứ tự làm tròn phí thuần → thuế → tổng', () => {
  expect(calculatePremium(1e9, startDate, end(365), 'BASIC_PROPERTY')).toMatchObject({ net: 1000000, tax: 100000, total: 1100000 })
  expect(calculatePremium(1e9, startDate, end(180), 'EXTENDED_PROPERTY')).toMatchObject({ net: 739726, tax: 73973, total: 813699 })
  expect(calculatePremium(10005200, startDate, end(1), 'EXTENDED_PROPERTY')).toMatchObject({ net: 41, tax: 4, total: 45 })
})
it('không fallback mã lạ thành A; API/parser vẫn chỉ hỗ trợ A', () => {
  expect(() => getPropertyProduct('UNKNOWN')).toThrow(RangeError)
  // A runtime boundary must reject invalid codes, including calls bypassing TypeScript.
  expect(() => validateDraft(sampleDraft(), 'UNKNOWN' as never)).toThrow(RangeError)
  expect(() => calculatePremium(1e9, startDate, end(1), 'UNKNOWN' as never)).toThrow(RangeError)
  const b = validateAndBuildInput({ ...sampleDraft(), startDate, endDate: end(180) }, 'EXTENDED_PROPERTY')
  expect(b.success).toBe(true)
  if (b.success) expect(parseQuotationInput(b.data).success).toBe(true)
})
