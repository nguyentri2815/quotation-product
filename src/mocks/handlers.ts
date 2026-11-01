import { delay, http, HttpResponse } from 'msw'
import { parseQuotationInput } from '../quotation/rules'
import { createQuotation, readQuotations, readQuotationReport } from './storage'

function storageError(error: unknown) {
  return HttpResponse.json(
    { message: error instanceof Error ? error.message : 'Không truy cập được dữ liệu demo.' },
    { status: 500 },
  )
}

export const handlers = [
  http.get('/api/quotations', async () => {
    await delay(550)
    try {
      const report = readQuotationReport()
      return HttpResponse.json(report.quotations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), { headers:{ 'X-Quotation-Skipped':String(report.skipped) } })
    } catch (error) {
      return storageError(error)
    }
  }),
  http.get('/api/quotations/:id', async ({ params }) => {
    await delay(500)
    try {
      const quotation = readQuotations().find((item) => item.id === params.id)
      return quotation
        ? HttpResponse.json(quotation)
        : HttpResponse.json(
            { message: 'Không tìm thấy bản chào trong trình duyệt này.' },
            { status: 404 },
          )
    } catch (error) {
      return storageError(error)
    }
  }),
  http.post('/api/quotations', async ({ request }) => {
    await delay(650)
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json(
        { message: 'Nội dung gửi lên phải là JSON hợp lệ.' },
        { status: 400 },
      )
    }
    const result = parseQuotationInput(body)
    if (!result.success)
      return HttpResponse.json({ message: result.message, errors: result.errors }, { status: 422 })
    // Recalculate from validated business input, ignoring any client premium.
    try {
      return HttpResponse.json(createQuotation(result.data), { status: 201 })
    } catch (error) {
      return storageError(error)
    }
  }),
]
