import { describe, expect, it } from 'vitest'
import {
  calculatePremium,
  calendarDays,
  parseQuotationInput,
  pricingInputsChanged,
  validateDraft,
} from './rules'
import { sampleDraft } from './types'

describe('Quy tắc bản chào Chặng 1', () => {
  it('tính đúng ví dụ 1 tỷ, 365 ngày và một kỳ thanh toán', () => {
    expect(calculatePremium(1_000_000_000, '2026-01-01', '2027-01-01')).toEqual({
      days: 365,
      annualRate: 0.001,
      taxRate: 0.1,
      net: 1_000_000,
      tax: 100_000,
      total: 1_100_000,
      installmentAmount: 1_100_000,
    })
  })
  it('làm tròn phí trước thuế trước khi tính và làm tròn thuế', () => {
    expect(calculatePremium(1_005_200, '2026-01-01', '2026-01-03')).toMatchObject({
      days: 2,
      net: 6,
      tax: 1,
      total: 7,
    })
  })
  it('tính ngày lịch đúng qua năm nhuận và các mốc đổi giờ mùa hè', () => {
    expect(calendarDays('2024-02-28', '2024-03-01')).toBe(2)
    expect(calendarDays('2026-03-07', '2026-03-09')).toBe(2)
    expect(calendarDays('2026-10-31', '2026-11-02')).toBe(2)
    expect(calendarDays('2026-02-30', '2026-03-03')).toBeNull()
  })
  it('chấp nhận đúng hai biên số tiền và ngày bắt đầu trong quá khứ', () => {
    for (const sumInsured of ['1000000', '100000000000']) {
      expect(
        validateDraft({
          ...sampleDraft(),
          sumInsured,
          startDate: '2020-01-01',
          endDate: '2020-12-31',
        }),
      ).toEqual({})
    }
  })
  it.each(['999999', '100000000001', '1000000.5', '1e9', '-1000000', '', 'Infinity'])(
    'từ chối số tiền sai: %s',
    (sumInsured) => {
      expect(validateDraft({ ...sampleDraft(), sumInsured }).sumInsured).toBeTruthy()
    },
  )
  it('bắt buộc ngày hợp lệ, sau ngày bắt đầu và tối đa 365 ngày', () => {
    expect(validateDraft({ ...sampleDraft(), startDate: '', endDate: '' })).toMatchObject({
      startDate: expect.any(String),
      endDate: expect.any(String),
    })
    for (const endDate of ['2026-01-01', '2025-12-31', '2027-01-02'])
      expect(
        validateDraft({ ...sampleDraft(), startDate: '2026-01-01', endDate }).endDate,
      ).toBeTruthy()
    expect(() => calculatePremium(1_000_000, '2026-01-01', '2027-01-02')).toThrow(RangeError)
  })
  it('kiểm tra độ dài, số điện thoại, email; cho phép liên hệ để trống', () => {
    const draft = sampleDraft()
    expect(
      validateDraft({
        ...draft,
        customerName: 'x'.repeat(151),
        assetName: 'x'.repeat(201),
        address: 'x'.repeat(301),
        phone: '+84901234567',
        email: 'sai@',
      }),
    ).toMatchObject({
      customerName: expect.any(String),
      assetName: expect.any(String),
      address: expect.any(String),
      phone: expect.any(String),
      email: expect.any(String),
    })
    expect(validateDraft({ ...draft, phone: '', email: '' })).toEqual({})
    expect(validateDraft({ ...draft, phone: '01234567890' }).phone).toBeUndefined()
    expect(
      validateDraft({ ...draft, customerName: '  ', assetName: ' ', address: '' }),
    ).toMatchObject({
      customerName: expect.any(String),
      assetName: expect.any(String),
      address: expect.any(String),
    })
  })
  it('chỉ những đầu vào phí làm mất hiệu lực kết quả', () => {
    const draft = { ...sampleDraft(), startDate:'2026-01-01', endDate:'2027-01-01' }
    for (const update of [
      { sumInsured: '2000000000' },
      { startDate: '2026-11-01' },
      { endDate: '2027-11-01' },
    ])
      expect(pricingInputsChanged(draft, { ...draft, ...update })).toBe(true)
    expect(
      pricingInputsChanged(draft, {
        ...draft,
        customerName: 'Tên khác',
        phone: '',
        email: '',
        assetName: 'Kho khác',
        address: 'Địa chỉ khác',
      }),
    ).toBe(false)
  })
  it('kiểm tra cấu trúc dữ liệu bên ngoài bằng unknown', () => {
    expect(parseQuotationInput(null).success).toBe(false)
    expect(parseQuotationInput({ currency: 'USD', customer: {} }).success).toBe(false)
  })
})
