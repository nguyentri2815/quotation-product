# Chuyển dữ liệu trình duyệt sang máy mới

Source Git không chứa dữ liệu profile thật. Phiên bàn giao không truy cập được đúng browser profile của người học, nên **chưa tạo backup dữ liệu trình duyệt thật**. Các ca QA dùng context mới, không thay thế backup này. Hiện hai ứng dụng chưa có export/import trên UI; dùng đoạn Console hữu hạn bên dưới, không cần cài thêm phần mềm.

## Dữ liệu được chuyển

| Origin | Key được phép |
| --- | --- |
| http://localhost:3180 | quotation-product.demo.v1: bản chào đã lưu của Product |
| http://localhost:3181 | quotation-workshop.guide.v1: tiến độ/ghi chú cũ; quotation-workshop.behaviors.v2: tiến độ/ghi chú hiện tại; quotation-workshop.layout.v1: độ rộng preview |
| http://localhost:3181 | quotation-workshop.practice.v1; quotation-workshop.reference.v1; quotation-workshop.checkpoint.&lt;id&gt;.v1: bản chào demo riêng từng chế độ/mốc |

Chỉ đọc/ghi giá trị của các key này trên origin hiện tại. Không xuất toàn bộ localStorage, không xóa key khác. IndexedDB, cookie, Service Worker/cache không cần chuyển. Form đang nhập/chưa lưu, phí chỉ ở React state, lỗi thử một lần và history của tab không nằm trong backup. Lưu bản chào cần giữ trước khi xuất; bookmark URL hiện tại để giữ file/symbol/sub-step đang đọc. Source bài học trong src/practice được Git bảo toàn riêng.

## Xuất trên máy cũ

1. Dùng **đúng profile trình duyệt** đang học; mở http://localhost:3180 rồi http://localhost:3181, thao tác riêng từng origin.
2. Mở DevTools → Console, chọn context trang chính (top), không chọn iframe hoặc tab ứng dụng khác. Đọc rồi chạy đoạn dưới. Nếu trình duyệt chặn paste, làm theo hướng dẫn chính trình duyệt sau khi kiểm tra nội dung.
3. Trình duyệt tải JSON có tên theo ứng dụng + timestamp. Chọn Save As hoặc chuyển file tải về vào thư mục ngoài hai repo, ví dụ `D:\NGUYENTRI\quotation-learning-project-transfer\`. Không ghi đè backup cũ; mỗi lần xuất tạo timestamp mới. Không đưa JSON chứa dữ liệu thật vào Git.

```javascript
(() => {
  const configs = {
    'http://localhost:3180': { app: 'quotation-product', allowed: key => key === 'quotation-product.demo.v1' },
    'http://localhost:3181': {
      app: 'quotation-workshop',
      allowed: key => ['quotation-workshop.guide.v1', 'quotation-workshop.behaviors.v2', 'quotation-workshop.layout.v1', 'quotation-workshop.practice.v1', 'quotation-workshop.reference.v1'].includes(key) || /^quotation-workshop\.checkpoint\.[a-z0-9-]+\.v1$/.test(key),
    },
  }
  const config = configs[location.origin]
  if (!config) throw new Error('Wrong origin: open localhost:3180 or localhost:3181.')
  const entries = Object.fromEntries(Object.keys(localStorage).filter(config.allowed).map(key => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null))
  const exportedAt = new Date().toISOString()
  const backup = { version: 1, app: config.app, origin: location.origin, exportedAt, entries }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${config.app}-storage-${exportedAt.replace(/[:.]/g, '-')}.json`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
  console.info(`Exported ${Object.keys(entries).length} app keys from ${location.origin}; values are not printed.`)
})()
```

Nếu báo 0 key, kiểm tra lại profile và origin; không coi đây là backup tiến độ đã có. localhost và 127.0.0.1 khác origin. Nếu đã học ở hostname/port khác, dùng đúng origin cũ và sửa **đúng một mục origin tương ứng** trong configs của cả hai đoạn code; không mở rộng sang ứng dụng khác. Ghi lại origin đó và dùng lại trên máy mới.

## Import trên máy mới

Chạy hai ứng dụng theo README, dùng đúng hostname và port như backup. Sao chép backup vào thư mục ngoài repo trên máy mới. Trước khi import, đóng các tab khác của cùng ứng dụng để chúng không ghi đè tiến độ; nếu máy mới đã có dữ liệu cần giữ, xuất riêng nó trước. Mỗi lần chạy đoạn dưới chỉ chọn **một file backup đúng ứng dụng/origin**. Đoạn code xác minh toàn bộ key trước khi ghi; hỏi xác nhận nếu có key hiện hữu khác giá trị, không merge hay xóa dữ liệu ngoài danh sách.

```javascript
void (async () => {
  const configs = {
    'http://localhost:3180': { app: 'quotation-product', allowed: key => key === 'quotation-product.demo.v1' },
    'http://localhost:3181': {
      app: 'quotation-workshop',
      allowed: key => ['quotation-workshop.guide.v1', 'quotation-workshop.behaviors.v2', 'quotation-workshop.layout.v1', 'quotation-workshop.practice.v1', 'quotation-workshop.reference.v1'].includes(key) || /^quotation-workshop\.checkpoint\.[a-z0-9-]+\.v1$/.test(key),
    },
  }
  const config = configs[location.origin]
  if (!config) throw new Error('Wrong origin: open localhost:3180 or localhost:3181.')
  const file = await new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
  if (!file) return
  const backup = JSON.parse(await file.text())
  if (backup?.version !== 1 || backup.app !== config.app || backup.origin !== location.origin || !backup.entries || typeof backup.entries !== 'object' || Array.isArray(backup.entries)) throw new Error('Wrong backup format, app or origin; nothing imported.')
  const entries = Object.entries(backup.entries)
  if (entries.some(([key, value]) => !config.allowed(key) || typeof value !== 'string')) throw new Error('Unexpected key/value; nothing imported.')
  const conflicts = entries.filter(([key, value]) => localStorage.getItem(key) !== null && localStorage.getItem(key) !== value)
  if (conflicts.length && !confirm(`Replace ${conflicts.length} existing keys of ${config.app}? Export current data first.`)) return
  let written = 0
  try {
    for (const [key, value] of entries) { localStorage.setItem(key, value); written++ }
  } catch (error) {
    throw new Error(`Storage write failed after ${written}/${entries.length} keys. Keep the backup and retry after resolving browser storage access/quota. ${String(error)}`)
  }
  console.info(`Imported ${written} app keys into ${location.origin}. Reload this tab now.`)
})().catch(error => console.error(error.message))
```

Reload trang sau khi import. Workshop: kiểm tra dấu tự xác nhận, ghi chú và đúng chế độ/checkpoint chứa bản chào; dữ liệu không tự gộp giữa các mốc. Product: mở danh sách rồi bản chào đã lưu. Import chỉ chuyển localStorage, không tự đánh dấu hoàn thành hoặc chỉnh source. Giữ bản backup gốc cho tới khi kiểm tra xong trên máy mới.
