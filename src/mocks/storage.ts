import {
  calculatePremium,
  isRecord,
  parseQuotation,
  validateAndBuildInput,
} from '../quotation/rules'
import type { Quotation, QuotationInput } from '../quotation/types'
import { sampleDraft } from '../quotation/types'

export const STORAGE_KEY = 'quotation-product.demo.v1'

function makeSeed(): Quotation[] {
  const parsed = validateAndBuildInput(sampleDraft())
  if (!parsed.success) throw new Error('Không khởi tạo được dữ liệu mẫu.')
  const first = parsed.data
  const second: QuotationInput = {
    ...first,
    customer: { name: 'Công ty TNHH Lam Trúc Demo', phone: '', email: 'vanphong@lamtruc.example' },
    asset: {
      name: 'Văn phòng Lam Trúc',
      address: '16 đường Mây Xanh, phường Bình Yên, thành phố Minh Sơn (giả lập)',
      sumInsured: 2_500_000_000,
    },
  }
  const now = new Date()
  return [first, second].map((input, index) => ({
    ...input,
    id: `demo-seed-${index + 1}`,
    number: `Q-${now.getFullYear()}-${String(index + 1).padStart(6, '0')}`,
    createdAt: new Date(now.getTime() - (2 - index) * 3_600_000).toISOString(),
    status: 'CREATED',
    premium: calculatePremium(input.asset.sumInsured, input.period.startDate, input.period.endDate),
  }))
}

function persist(quotations: Quotation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, quotations }))
  } catch {
    throw new Error(
      'Không lưu được dữ liệu demo trên trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ rồi thử lại.',
    )
  }
}

export function readQuotations(): Quotation[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    throw new Error('Trình duyệt đang chặn lưu trữ dữ liệu demo.')
  }
  // Only an absent key is a first run. A persisted empty list stays empty.
  if (raw === null) {
    const seeds = makeSeed()
    persist(seeds)
    return seeds
  }
  let stored: unknown
  try {
    stored = JSON.parse(raw)
  } catch {
    throw new Error('Dữ liệu demo đã lưu không đọc được. Dữ liệu cũ được giữ nguyên.')
  }
  if (!isRecord(stored) || stored.version !== 1 || !Array.isArray(stored.quotations))
    throw new Error('Dữ liệu demo không đúng phiên bản. Dữ liệu cũ được giữ nguyên.')
  const quotations = stored.quotations.map((value: unknown) => parseQuotation(value))
  if (quotations.some((quotation) => quotation === null))
    throw new Error('Có bản chào đã lưu không hợp lệ. Dữ liệu cũ được giữ nguyên.')
  return quotations.filter((quotation): quotation is Quotation => quotation !== null)
}

export function createQuotation(input: QuotationInput): Quotation {
  // A single synchronous read/write prevents overlapping submissions in this tab.
  const quotations = readQuotations()
  const now = new Date()
  const year = now.getFullYear()
  const sequence =
    quotations.reduce(
      (max, quotation) =>
        quotation.number.startsWith(`Q-${year}-`)
          ? Math.max(max, Number(quotation.number.split('-')[2]))
          : max,
      0,
    ) + 1
  const quotation: Quotation = {
    ...input,
    id: crypto.randomUUID(),
    number: `Q-${year}-${String(sequence).padStart(6, '0')}`,
    createdAt: now.toISOString(),
    status: 'CREATED',
    premium: calculatePremium(input.asset.sumInsured, input.period.startDate, input.period.endDate),
  }
  persist([...quotations, quotation])
  return quotation
}
