import { getPropertyProduct, productTerms } from '../quotation/products'
import {
  calculatePremium,
  isRecord,
  parseQuotation,
  parseQuotationInput,
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
    schemaVersion:2,
    productSnapshot:productTerms(getPropertyProduct(input.product,input.productVersion)),
    id: `demo-seed-${index + 1}`,
    number: `Q-${now.getFullYear()}-${String(index + 1).padStart(6, '0')}`,
    createdAt: new Date(now.getTime() - (2 - index) * 3_600_000).toISOString(),
    status: 'CREATED',
    premium: calculatePremium(input.asset.sumInsured, input.period.startDate, input.period.endDate, input.product),
  }))
}

function persist(quotations: unknown[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, quotations }))
  } catch {
    throw new Error(
      'Không lưu được dữ liệu demo trên trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ rồi thử lại.',
    )
  }
}

function readEnvelope(): unknown[] {
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
  return stored.quotations
}

export function readQuotationReport(): { quotations:Quotation[]; skipped:number } {
  const raw = readEnvelope()
  const parsed = raw.map(value => parseQuotation(value))
  return { quotations:parsed.filter((value): value is Quotation => value !== null), skipped:parsed.filter(value => value === null).length }
}
export function readQuotations(): Quotation[] { return readQuotationReport().quotations }

export function createQuotation(input: QuotationInput): Quotation {
  // Validate again at the mock boundary, independent of UI selection or client totals.
  const parsed = parseQuotationInput(input)
  if (!parsed.success) throw new Error(parsed.message)
  input = parsed.data
  const raw = readEnvelope()
  const now = new Date(), year = now.getFullYear()
  const sequence = raw.reduce<number>((max, item) => {
    if (!isRecord(item) || typeof item.number !== 'string' || !new RegExp('^Q-' + year + '-[0-9]+$').test(item.number)) return max
    return Math.max(max, Number(item.number.split('-')[2]))
  }, 0) + 1
  const quotation: Quotation = {
    ...input, schemaVersion:2,
    productSnapshot:productTerms(getPropertyProduct(input.product,input.productVersion)),
    id:crypto.randomUUID(), number:'Q-' + year + '-' + String(sequence).padStart(6,'0'),
    createdAt:now.toISOString(), status:'CREATED',
    premium:calculatePremium(input.asset.sumInsured,input.period.startDate,input.period.endDate,input.product),
  }
  // Preserve malformed rows too. A read never migrates or rewrites old records.
  persist([...raw,quotation])
  return quotation
}
