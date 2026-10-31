import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import { createQuotation, readQuotations, STORAGE_KEY } from './storage'
import { isRecord, validateAndBuildInput } from '../quotation/rules'
import { sampleDraft } from '../quotation/types'

const server = setupServer(...handlers)
let memory: Map<string, string>

beforeEach(() => {
  memory = new Map()
  vi.stubGlobal('location', new URL('http://localhost/'))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  })
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  server.close()
  vi.unstubAllGlobals()
})

describe('Mock API và lưu trữ demo', () => {
  it('seed đúng một lần và giữ danh sách đã lưu rỗng', () => {
    expect(readQuotations()).toHaveLength(2)
    expect(readQuotations()).toHaveLength(2)
    memory.set(STORAGE_KEY, JSON.stringify({ version: 1, quotations: [] }))
    expect(readQuotations()).toEqual([])
  })
  it('không thay thế dữ liệu lỗi bằng seed', () => {
    memory.set(STORAGE_KEY, '{loi')
    expect(readQuotations).toThrow('Dữ liệu demo đã lưu không đọc được')
    expect(memory.get(STORAGE_KEY)).toBe('{loi')
  })
  it('tạo ID riêng ổn định và tăng số bản chào', () => {
    const input = validateAndBuildInput(sampleDraft())
    if (!input.success) throw new Error('Dữ liệu kiểm tra không hợp lệ')
    const first = createQuotation(input.data)
    const second = createQuotation(input.data)
    expect(first.id).not.toBe(second.id)
    expect(first.number).toMatch(/-000003$/)
    expect(second.number).toMatch(/-000004$/)
    expect(readQuotations().find((quotation) => quotation.id === first.id)).toEqual(first)
  })
  it('POST tính lại phí, bỏ qua phí client gửi và GET trả lại cùng bản chào', async () => {
    const input = validateAndBuildInput(sampleDraft())
    if (!input.success) throw new Error('Dữ liệu kiểm tra không hợp lệ')
    const response = await fetch('http://localhost/api/quotations', {
      method: 'POST',
      body: JSON.stringify({ ...input.data, premium: { total: 1 } }),
    })
    expect(response.status).toBe(201)
    const body: unknown = await response.json()
    expect(body).toMatchObject({ premium: { total: 1_100_000, net: 1_000_000, tax: 100_000 } })
    if (!isRecord(body) || typeof body.id !== 'string') throw new Error('Thiếu định danh')
    const saved = await fetch(`http://localhost/api/quotations/${body.id}`)
    expect(await saved.json()).toEqual(body)
    expect((await fetch('http://localhost/api/quotations/not-found')).status).toBe(404)
  })
  it('POST từ chối nghiệp vụ sai và báo lỗi lưu trữ, không tạo thành công giả', async () => {
    const input = validateAndBuildInput(sampleDraft())
    if (!input.success) throw new Error('Dữ liệu kiểm tra không hợp lệ')
    const invalid = await fetch('http://localhost/api/quotations', {
      method: 'POST',
      body: JSON.stringify({ ...input.data, asset: { ...input.data.asset, sumInsured: 1 } }),
    })
    expect(invalid.status).toBe(422)
    expect(memory.size).toBe(0)
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded')
      },
    })
    const failed = await fetch('http://localhost/api/quotations', {
      method: 'POST',
      body: JSON.stringify(input.data),
    })
    expect(failed.status).toBe(500)
  })
})
