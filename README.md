# Quotation Product · Bản chào tài sản

Ứng dụng tiếng Việt cho người lập bản chào: **chọn sản phẩm → nhập dữ liệu → tính phí → lưu → xem lại**. Cả Tài sản cơ bản (A) và Tài sản mở rộng (B) đều hoàn chỉnh qua mock API. Normal / Tài sản / một khách hàng / một tài sản / VND / một kỳ thanh toán. Môi trường: Dữ liệu mô phỏng.

## Bản review hiện hành

Mở [Chọn sản phẩm](http://localhost:3180/products). A: Điền mẫu → Tính phí → **1.100.000 VND** →Lưu →reload. B: giữ mẫu365 ngày để thấy lỗi; đặt Ngày kết thúc = Ngày bắt đầu +180 ngày lịch →thuần739.726, thuế73.973, tổng**813.699 VND** →Lưu →mở lại. B1 triệu lỗi đúng trường tiền. Đổi sản phẩm mở panel: hủy giữ dữ liệu/phí, xác nhận mới đổi; giữ draft, không ép hợp lệ và bỏ phí cũ. Giới hạn cạnh trường, thông tin bổ sung qua Chi tiết sản phẩm.

Đây là quy tắc mô phỏng phục vụ học tập, không phải biểu phí bảo hiểm thực tế. A: 1 triệu–100 tỷ, 1–365 ngày, 0,1% năm; B: 10 triệu–50 tỷ, 1–180 ngày, 0,15% năm; thuế10%. Catalog là nguồn của gợi ý, validation và công thức. Receipt phí tạm giữ mã/phiên bản/tiền/hai ngày; guard lưu chỉ nhận phí còn khớp. Input có code/version; mock tự tra rule/tính lại, bỏ qua tên/rate/tổng client gửi. Record lưu snapshot biểu phí và kết quả đã áp dụng; GET không báo giá lại theo catalog hiện tại.

`quotation/products.ts` chứa catalog/version và điều khoản A gốc; `quotation/records.ts` đọc snapshot lịch sử/adapter legacy; `SelectProduct` chọn trước form; CreateQuotation sở hữu draft/phí; ProductInformation trình bày ngữ cảnh/panel; PremiumSummary chỉ hiển thị. Nội dung học nằm ở [Workshop Chặng2](http://localhost:3181/?stage=2&version=4#checkpoint=s2-r4-00), [Hành trình phát triển](http://localhost:3181/?stage=2&version=4&screen=evolution#requirement=history) và [bàn giao hiện hành](../quotation-workshop/docs/CONTINUE-ON-OTHER-MACHINE.md). Product Chặng 2 được lưu trên main trong lượt bàn giao 01/11/2026; “Bản đồ của bước” là nhiệm vụ tiếp theo ở Workshop.

## Cài đặt và chạy

Yêu cầu Node.js >= 22.12.0; lượt bàn giao 01/11/2026 xác nhận **Node 24.18.0 / npm 11.16.0** và Chrome trên Windows. Phiên bản thư viện được giữ trong `package-lock.json`. Nhánh bàn giao: `main`.

```powershell
# Chạy từ thư mục cha bạn chọn trên máy mới; không cần đường dẫn Windows cũ.
git clone https://github.com/nguyentri2815/quotation-product.git
Set-Location .\quotation-product
npm.cmd ci
npm.cmd run dev -- --strictPort
```

Mở http://localhost:3180. `--strictPort` giữ đúng origin dữ liệu; nếu cổng bận, xử lý tiến trình chiếm cổng trước khi chạy lại. Product chạy độc lập, không cần Workshop, core-insurance-portal, Codebase Learning Workspace, file ngoài repo hay `.env`. Source, assets và MSW worker đã có trong Git; không cần sinh thêm khi cài bằng `npm ci`.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:browser
```

Kiểm thử trình duyệt dùng Chrome đã cài, chạy khi preview đang mở. Nếu dùng cổng khác, đặt `$env:PREVIEW_URL = 'http://localhost:3182'` trước khi chạy. Mỗi ca dùng browser context riêng, không sửa dữ liệu trong hồ sơ Chrome của bạn. Ảnh kiểm tra nằm trong `test-results/` (Git bỏ qua).

Để chạy bản build: `npm.cmd run preview`. MSW cũng được bật trong bản build vì đây là ứng dụng demo hoàn toàn, không có Backend thật.

## Thử nhanh

1. Chọn **Tạo bản chào** và **Điền dữ liệu mẫu**.
2. Chọn **Tính phí**: 1 tỷ VND, 365 ngày → tổng phí 1.100.000 VND.
3. Đổi số tiền hoặc thời hạn: kết quả mất hiệu lực và nút lưu bị khóa. Chọn **Tính phí** lại.
4. Chọn **Lưu bản chào**; chờ response rồi xem chi tiết.
5. Reload trang chi tiết, về danh sách và mở lại bản chào vừa tạo.

Để thử lỗi, nhập điện thoại `123abc`, email sai hoặc thời hạn quá 365 ngày. Chọn **Hủy** khi đã nhập dữ liệu để kiểm tra xác nhận bỏ dữ liệu.

## Công thức demo

Đây là quy tắc bài thực hành, không phải biểu phí bảo hiểm thực tế.

- Số ngày = ngày kết thúc − ngày bắt đầu, theo ngày lịch; giới hạn A/B lấy từ catalog.
- Phí trước thuế = `Math.round(số tiền bảo hiểm × product.annualRate × số ngày / 365)`.
- Thuế = `Math.round(phí trước thuế × product.taxRate)`.
- Tổng phí = phí trước thuế + thuế; một kỳ thanh toán bằng tổng phí.

Ví dụ: 1.000.000.000 VND, 365 ngày → phí 1.000.000 + thuế 100.000 = **1.100.000 VND**. Ngày được đổi thành mốc UTC nửa đêm chỉ để trừ ngày, tránh sai lệch múi giờ/DST. Không chặn ngày bắt đầu trong quá khứ.

## Cấu trúc chính

| Vị trí                                        | Trách nhiệm                                               |
| --------------------------------------------- | --------------------------------------------------------- |
| `src/pages/`                                  | Danh sách, tạo mới, chi tiết; React state của biểu mẫu    |
| `src/components/`                             | Phần hiển thị dùng chung và CSS Modules                   |
| `src/quotation/types.ts`                      | Kiểu nghiệp vụ, biểu mẫu, dữ liệu mẫu                     |
| `src/quotation/rules.ts`                      | Validation, ngày lịch, tính phí và kiểm tra dữ liệu ngoài |
| `src/api/quotations.ts`                       | Fetch API, timeout, kiểm tra response và lỗi API          |
| `src/mocks/handlers.ts`                       | GET danh sách, GET chi tiết, POST tạo; delay 500–650 ms   |
| `src/mocks/storage.ts`                        | localStorage, seed một lần, định danh và số bản chào      |
| `src/App.tsx`                                 | Layout và ba route bằng React Router                      |
| `src/main.tsx`                                | Chờ MSW sẵn sàng rồi khởi động React                      |
| `src/**/*.test.ts`, `tests/quotation.spec.ts` | Kiểm tra nghiệp vụ, mock API và luồng Chrome              |

POST chỉ gửi dữ liệu nghiệp vụ. Mock API validate và tự tính lại phí, bỏ qua kết quả phí client gửi. Component không truy cập localStorage. Kết quả phí bị xóa khi số tiền hoặc một trong hai ngày thay đổi; sửa thông tin khách hàng hoặc mô tả không buộc tính lại.

## Dữ liệu và giới hạn preview

Hai bản chào hư cấu được seed khi khóa `quotation-product.demo.v1` chưa tồn tại. Danh sách đã lưu rỗng không được seed lại. Dữ liệu lỗi không bị âm thầm thay thế. Chưa có thao tác xóa bản chào trên giao diện.

Dữ liệu chỉ ở trình duyệt và origin đang dùng (gồm hostname, port); không đồng bộ thiết bị hoặc bảo đảm giao dịch giữa nhiều tab. Xóa dữ liệu trình duyệt sẽ mất dữ liệu demo. Dùng `localhost` để Service Worker hoạt động. API lỗi giữ biểu mẫu và cho thử lại; timeout không được coi là lưu thành công. Khi chưa xác nhận được response, kiểm tra danh sách trước khi gửi lại.

Route chi tiết `/quotations/:id` hỗ trợ reload trên Vite. Nếu tự phục vụ `dist/` bằng máy chủ khác, cần fallback route SPA về `index.html`. `public/mockServiceWorker.js` được tạo bằng `npx.cmd msw init public --save`; không sửa tay file này.

Chưa có đăng nhập, lưu nháp hoặc chỉnh sửa sau lưu. Dữ liệu A cũ đúng shape được adapter hẹp đọc trong bộ nhớ; record sai bị bỏ khỏi phần hiển thị và báo số lượng, không bị xóa hay seed lại. JSON/envelope không đọc được vẫn báo lỗi, giữ byte gốc. Phòng thực hành nằm ở repo `../quotation-workshop`, preview http://localhost:3181; snapshot lịch sử và dữ liệu hai ứng dụng tách biệt.

## Chuyển máy và tiếp tục review

Git lưu source, không lưu localStorage hoặc form đang gõ. [Xuất/import riêng dữ liệu Product](docs/BROWSER-DATA-TRANSFER.md) trên đúng browser profile và origin `http://localhost:3180` trước khi chuyển máy. Backup đặt ngoài hai repo; không commit dữ liệu trình duyệt.

Clone [quotation-workshop](https://github.com/nguyentri2815/quotation-workshop) cạnh repo này nếu muốn chạy kiểm tra đối chiếu sản phẩm của Workshop. Product không dùng repo bên cạnh ở runtime. Chạy Workshop từ terminal riêng bằng `npm.cmd ci`, `npm.cmd run dev -- --strictPort` (port 3181).

- [Cây phụ thuộc bước 3.4](http://localhost:3181/#journey=2&step=3&sub=3&tab=build&buildView=dependencies&dependencyNode=props).
- [Cây phụ thuộc bước 3.5](http://localhost:3181/#journey=2&step=3&sub=4&tab=build&buildView=dependencies&dependencyNode=calculate).

Product hiện có đầy đủ luồng A/B và tương thích A gốc. [Preview2](../quotation-workshop/docs/CHANG-2-PREVIEW-2.md) là biên bản lịch sử của snapshot cũ; giới hạn khóa lưu B chỉ áp dụng mốc đó. [Workshop hiện hành revision 4](../quotation-workshop/docs/CHANG-2-REVISION-4.md) và [cặp phiên bản, kiểm tra, cách tiếp tục](../quotation-workshop/docs/CONTINUE-ON-OTHER-MACHINE.md). Chưa triển khai Chặng 3.


## Quy trình Product và Workshop

Từ 01/11/2026: triển khai Product của chặng trước → người dùng review và đồng ý Product → ghim source thực tế (commit nền, working tree và hash) → mới thiết kế checkpoint, bài học, mapping và Chạy thử trong Workshop. Khi thiết kế Product đổi, rà mọi bài học bị tác động, không chỉ checkpoint cuối. Test đạt/báo cáo hoàn thành không có nghĩa người dùng đã duyệt Product.

Trong lượt điều chỉnh Chặng2 hiện tại, dùng Product hiện hành làm đích theo yêu cầu người dùng, không mở rộng nghiệp vụ. [Quy trình chi tiết](../quotation-workshop/docs/PRODUCT-WORKSHOP-WORKFLOW.md) · [Revision3 và bản ghim](../quotation-workshop/docs/CHANG-2-REVISION-3.md).
