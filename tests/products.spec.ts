import { expect,test } from '@playwright/test'
test('A cũ và một row lỗi: list/detail vẫn chạy, không sửa bản gốc khi GET hoặc thêm bản mới',async({page})=>{
  const old={type:'NORMAL',line:'PROPERTY',currency:'VND',id:'old-basic',number:'Q-2026-000041',createdAt:'2026-01-01T00:00:00Z',status:'CREATED',customer:{name:'Khách hàng A gốc',phone:'',email:''},asset:{name:'Kho cũ',address:'Địa chỉ mô phỏng',sumInsured:1000000000},period:{startDate:'2026-01-01',endDate:'2027-01-01'},premium:{days:365,annualRate:.001,taxRate:.1,net:1000000,tax:100000,total:1100000,installmentAmount:1100000}}
  const bad={id:'broken',product:'UNKNOWN'}
  const original=JSON.stringify({version:1,quotations:[old,bad]})
  await page.addInitScript(raw=>localStorage.setItem('quotation-product.demo.v1',raw),original)
  await page.goto('/quotations');await expect(page.locator('table')).toContainText('Khách hàng A gốc');await expect(page.getByRole('status')).toContainText('1 bản chào không đọc được')
  expect(await page.evaluate(()=>localStorage.getItem('quotation-product.demo.v1'))).toBe(original)
  await page.getByRole('link',{name:old.number,exact:true}).click();await expect(page.locator('main')).toContainText('Tài sản cơ bản · v1');await expect(page.locator('[aria-labelledby="premium-heading"]')).toContainText('1.100.000')
  expect(await page.evaluate(()=>localStorage.getItem('quotation-product.demo.v1'))).toBe(original)
  await page.getByRole('link',{name:'Về danh sách',exact:true}).click();await page.getByRole('link',{name:'Tạo bản chào',exact:true}).click();await page.getByRole('link',{name:'Tạo bản chào Tài sản cơ bản',exact:true}).click();await page.getByRole('button',{name:'Điền dữ liệu mẫu'}).click();await page.getByRole('button',{name:'Tính phí',exact:true}).click();await page.getByRole('button',{name:'Lưu bản chào',exact:true}).click();await expect(page.getByText('Đã lưu bản chào thành công.')).toBeVisible()
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('quotation-product.demo.v1')!))
  expect(stored.quotations.slice(0,2)).toEqual([old,bad]);expect(stored.quotations).toHaveLength(3)
})
