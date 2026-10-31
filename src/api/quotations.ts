import { isRecord, parseQuotation } from '../quotation/rules'
import type { FieldErrors, Quotation, QuotationInput } from '../quotation/types'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: FieldErrors = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request(path: string, options?: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(path, { ...options, signal: AbortSignal.timeout(12_000) })
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    ) {
      throw new ApiError(
        'Yêu cầu quá thời gian chờ. Chưa xác nhận lưu thành công; vui lòng kiểm tra danh sách trước khi thử lại.',
        0,
      )
    }
    throw new ApiError(
      'Không kết nối được API. Dữ liệu bạn nhập vẫn được giữ, vui lòng thử lại.',
      0,
    )
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError('API trả về dữ liệu không đọc được. Vui lòng thử lại.', response.status)
  }
  if (!response.ok) {
    const message =
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : 'Chưa thực hiện được yêu cầu. Vui lòng thử lại.'
    const errors: FieldErrors = {}
    if (isRecord(body) && isRecord(body.errors)) {
      for (const key of [
        'customerName',
        'phone',
        'email',
        'assetName',
        'address',
        'sumInsured',
        'startDate',
        'endDate',
      ] as const) {
        if (typeof body.errors[key] === 'string') errors[key] = body.errors[key]
      }
    }
    throw new ApiError(message, response.status, errors)
  }
  return body
}

function requireQuotation(value: unknown): Quotation {
  const quotation = parseQuotation(value)
  if (!quotation) throw new ApiError('Dữ liệu bản chào trả về không hợp lệ.', 502)
  return quotation
}

export const quotationsApi = {
  async list(): Promise<Quotation[]> {
    const body = await request('/api/quotations')
    if (!Array.isArray(body)) throw new ApiError('Danh sách trả về không hợp lệ.', 502)
    return body.map(requireQuotation)
  },
  async get(id: string): Promise<Quotation> {
    return requireQuotation(await request(`/api/quotations/${encodeURIComponent(id)}`))
  },
  async create(input: QuotationInput): Promise<Quotation> {
    return requireQuotation(
      await request('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    )
  },
}
