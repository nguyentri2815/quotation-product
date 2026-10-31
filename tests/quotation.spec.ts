import { expect, test } from '@playwright/test'

test('luồng danh sách → tạo → tính lại → lưu → chi tiết → reload → mở lại', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Bản chào bảo hiểm', exact: true })).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page.screenshot({ path: 'test-results/list-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Tạo bản chào', exact: true }).click()
  await page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeDisabled()
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(page.getByText('1.100.000', { exact: false }).first()).toBeVisible()
  await page.getByLabel('Số tiền bảo hiểm', { exact: false }).fill('2000000000')
  await expect(page.getByText('Cần tính lại phí', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeDisabled()
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await page.getByLabel('Tên khách hàng', { exact: false }).fill('Công ty Ánh Mai Demo')
  await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeEnabled()
  await page.getByLabel('Ngày kết thúc').fill('2026-01-01')
  await expect(page.getByText('Cần tính lại phí', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await page.getByLabel('Tên khách hàng', { exact: false }).fill('Công ty Ánh Mai Demo')
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/create-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(page.getByRole('button', { name: 'Đang lưu' })).toBeDisabled()
  await expect(page.getByText('Đã lưu bản chào thành công.')).toBeVisible()
  const number = await page.getByRole('heading', { level: 1 }).innerText()
  expect(number).toMatch(/^Q-\d{4}-000003$/)
  const savedUrl = page.url()
  await expect(page.getByText('Bản chào chưa phải hợp đồng bảo hiểm.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: number })).toBeVisible()
  await expect(page.getByText('Công ty Ánh Mai Demo', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/detail-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Về danh sách' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(3)
  await page.getByRole('link', { name: number }).click()
  await expect(page).toHaveURL(savedUrl)
  await expect(page.getByRole('heading', { name: number })).toBeVisible()
  expect(runtimeErrors).toEqual([])
})

test('lỗi gắn với trường và xác nhận bỏ dữ liệu qua Hủy, Back, reload', async ({ page }) => {
  await page.goto('/quotations')
  await page.getByRole('link', { name: 'Tạo bản chào', exact: true }).click()
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(page.getByText('Vui lòng nhập tên khách hàng.')).toBeVisible()
  await expect(page.getByLabel('Tên khách hàng', { exact: false })).toBeFocused()
  await page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await page.getByLabel('Điện thoại', { exact: false }).fill('123abc')
  await page.getByLabel('Email', { exact: false }).fill('khong-dung')
  await page.getByLabel('Số tiền bảo hiểm', { exact: false }).fill('999999')
  await page.getByLabel('Ngày bắt đầu').fill('2026-01-01')
  await page.getByLabel('Ngày kết thúc').fill('2027-01-02')
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(page.getByText('Điện thoại cần có 10–11 chữ số.')).toBeVisible()
  await expect(page.getByText('Email chưa đúng định dạng', { exact: false })).toBeVisible()
  await expect(page.getByText('Nhập số nguyên từ 1.000.000 đến 100.000.000.000 VND.')).toBeVisible()
  await expect(page.getByText('Thời hạn bảo hiểm tối đa 365 ngày.')).toBeVisible()
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục nhập' }).click()
  await expect(page.getByLabel('Điện thoại', { exact: false })).toHaveValue('123abc')
  await page.goBack()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục nhập' }).click()
  const unload = page.waitForEvent('dialog')
  await page.evaluate(() => {
    setTimeout(() => window.location.reload(), 0)
  })
  const confirmation = await unload
  expect(confirmation.type()).toBe('beforeunload')
  await confirmation.dismiss()
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  await page.getByRole('button', { name: 'Bỏ dữ liệu', exact: true }).click()
  await expect(page).toHaveURL(/\/quotations$/)
})

test('lưu thất bại giữ biểu mẫu và cho thử lại; danh sách rỗng không tự seed', async ({ page }) => {
  await page.goto('/quotations/new')
  await page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await page.evaluate(() => {
    const originalSet = Storage.prototype.setItem
    let failNext = true
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value: function (this: Storage, key: string, value: string) {
        if (failNext) {
          failNext = false
          throw new DOMException('Quota exceeded', 'QuotaExceededError')
        }
        return originalSet.call(this, key, value)
      },
    })
  })
  await page.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(page.getByRole('alert')).toContainText('Không lưu được dữ liệu demo')
  await expect(page.getByLabel('Tên khách hàng', { exact: false })).toHaveValue(
    'Công ty TNHH Mộc An Demo',
  )
  await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeEnabled()
  await page.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(page.getByText('Đã lưu bản chào thành công.')).toBeVisible()
  await page.evaluate(() =>
    localStorage.setItem(
      'quotation-product.demo.v1',
      JSON.stringify({ version: 1, quotations: [] }),
    ),
  )
  await page.goto('/quotations')
  await expect(page.getByText('Chưa có bản chào nào')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Chưa có bản chào nào')).toBeVisible()
  await page.goto('/quotations/khong-ton-tai')
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy bản chào')
})

test('màn hình nhỏ dùng được và không tràn ngang trang', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/quotations/new')
  await page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeEnabled()
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }))
  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/create-mobile.png', fullPage: true })
})
