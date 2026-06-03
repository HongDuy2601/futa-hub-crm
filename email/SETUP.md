# FUTA Land — Email Marketing · Hướng dẫn cài đặt

App này gửi email cá nhân hóa hàng loạt qua **Google Apps Script** (chạy dưới tài khoản Google Workspace của bạn). 100% miễn phí, không cần server riêng.

## 1. Tổng quan kiến trúc

```
┌──────────────────────────┐   POST     ┌────────────────────────┐    MailApp     ┌──────────────────┐
│ email/index.html         │ ────────►  │ Apps Script Web App     │ ─────────────► │ Khách hàng       │
│ (chạy trong trình duyệt) │            │ (chạy dưới @futaland.vn)│                │ qua email        │
└──────────────────────────┘            └────────────────────────┘                └──────────────────┘
        ▲
        │ localStorage (offline) — danh sách, mẫu, lịch sử
        ▼
   máy bạn
```

- **Frontend** chạy 100% trong trình duyệt — không cần Node, không cần host.
- **Apps Script** đóng vai trò "cầu nối" gửi email qua Gmail Workspace.
- Quota mặc định: **~1.500 email/ngày/người** (Workspace) hoặc 100/ngày (Gmail cá nhân).

## 2. Deploy Apps Script (1 lần duy nhất)

### Bước 1 — Tạo project Apps Script
1. Mở https://script.google.com → bấm **"+ New project"**.
2. Đặt tên project: **"FUTA Email Sender"**.

### Bước 2 — Dán code
1. Xóa toàn bộ nội dung mặc định trong file `Code.gs`.
2. Mở file [`apps-script.gs`](apps-script.gs) trong repo này, copy toàn bộ.
3. Dán vào `Code.gs` trên Apps Script editor.
4. Bấm **💾 Save** (Ctrl/Cmd + S).

### Bước 3 — Deploy thành Web App
1. Bấm nút **Deploy** (góc trên phải) → **New deployment**.
2. Chọn type: **Web app**.
3. Cấu hình:
   - **Description**: `v1`
   - **Execute as**: **Me** — email gửi đi sẽ từ tài khoản này.
   - **Who has access**: **Anyone** *(yêu cầu để frontend gọi được; xem mục Bảo mật bên dưới)*.
4. Bấm **Deploy**.
5. Google sẽ hỏi cấp quyền lần đầu:
   - Chọn tài khoản → **Advanced** → **Go to FUTA Email Sender (unsafe)** *(an toàn vì đây là code của bạn)* → **Allow**.
6. Copy **"Web app URL"** dạng `https://script.google.com/macros/s/AKfy.../exec`.

### Bước 4 — Dán URL vào app
1. Mở app: `email/index.html` trong trình duyệt.
2. Vào **Cài đặt**.
3. Dán URL vào ô **"Apps Script Web App URL"**.
4. Điền **Tên hiển thị người gửi** (vd: *Phạm Hồng Duy - FUTA Land*).
5. Điền **Email gửi thử** (email của bạn để test).
6. Bấm **💾 Lưu** → **🔌 Test kết nối** — nếu thấy "✓ Kết nối OK" là xong.

## 3. Sử dụng

### Thêm người nhận
- **Cách 1 — CSV/Excel**: Vào tab **Người nhận** → bấm **📂 Import CSV/Excel**.
  - File cần có ít nhất cột `email`.
  - Các cột khác (`ten`, `du_an`, `sdt`, hoặc bất cứ cột tùy chỉnh nào) sẽ tự động thành biến template.
  - Bấm **⬇ Tải file mẫu CSV** để xem cấu trúc chuẩn.
- **Cách 2 — Nhập tay**: bấm **+ Thêm tay**.
- **Cách 3 — Đồng bộ CRM Supabase**: nếu đã cấu hình Supabase (Cài đặt → CRM), bấm **🔄 Đồng bộ CRM**.

### Soạn email cá nhân hóa
- Vào **Soạn & Gửi**.
- Sau khi có người nhận, **các chip biến** (vd: `{{ten}}`, `{{du_an}}`, `{{sdt}}`...) hiện ngay phía trên ô nội dung — click để chèn nhanh.
- Tiêu đề và nội dung đều dùng được biến. Ví dụ:
  ```
  Tiêu đề: Chào {{ten}}, ưu đãi mới cho dự án {{du_an}}
  Nội dung:
  Kính gửi anh/chị {{ten}},

  FUTA Land xin gửi thông tin ưu đãi {{gia_uu_dai}} cho dự án {{du_an}} mà anh/chị đã quan tâm...
  ```
- **Xem trước** bên phải đổi theo từng người nhận → kiểm tra cá nhân hóa OK chưa.
- **🧪 Gửi thử cho chính tôi** — gửi 1 email tới email test trước khi gửi đồng loạt.
- **✉ Gửi cho N người** — chạy thật.

### Mẫu email tái sử dụng
- Bấm **💾 Lưu mẫu** sau khi soạn, đặt tên.
- Lần sau chọn lại từ dropdown trong card "Mẫu email".

## 4. Bảo mật

**Cảnh báo**: Apps Script deploy với "Who has access: Anyone" → URL của bạn cho phép bất kỳ ai có URL đó gọi và gửi email **dưới danh nghĩa tài khoản của bạn**.

**Không chia sẻ URL Apps Script công khai.** Coi nó như mật khẩu.

Để tăng bảo mật, có thể thêm shared secret:
1. Mở `apps-script.gs` trên script.google.com.
2. Sửa `const SHARED_SECRET = '';` thành chuỗi ngẫu nhiên dài.
3. Deploy lại (Manage deployments → ✏ edit → New version → Deploy).
4. Bổ sung vào payload frontend — *cần sửa `sender.js` để thêm field `secret` vào POST body.*

## 5. Giới hạn & Khuyến nghị

| Mục | Workspace | Gmail cá nhân |
|---|---|---|
| Email/ngày | ~1.500 | ~100 |
| Người nhận / email | 100 | 100 |
| Email/giây | ~1 | ~0.5 |

- App đặt mặc định **throttle 500ms** giữa các email — đủ an toàn cho cả 2 loại tài khoản.
- Nếu gửi nhiều > 500 email/ngày, theo dõi response — script trả `quotaRemaining`.
- **Không spam**. Email lạnh tới khách hàng không opt-in có thể khiến domain bị Gmail flag.

## 6. Khắc phục sự cố

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| **CORS error** | Script chưa deploy "Anyone" — kiểm tra "Who has access" trong Manage deployments. |
| **403 / quyền bị từ chối** | Lần đầu chưa Authorize. Mở script trên `script.google.com`, chạy thử hàm `doGet` để Google hỏi cấp quyền. |
| **"Service invoked too many times"** | Vượt quota Gmail (1.500/ngày hoặc 100/ngày). Đợi 24h hoặc dùng tài khoản khác. |
| **Email vào spam của KH** | Tránh dùng quá nhiều link, viết hoa, ký tự lạ. Thêm chữ ký rõ ràng. Đảm bảo SPF/DKIM của domain đã chuẩn. |
| **Test kết nối báo "Failed to fetch"** | URL sai, hoặc thiếu `/exec` ở cuối. Copy lại URL từ Manage deployments. |

## 7. Cấu trúc file

```
email/
├── index.html         # Shell SPA, hash-routing
├── css/style.css      # Brand FUTA: xanh #1B5E20 + đỏ #C8102E
├── js/
│   ├── storage.js     # Wrapper localStorage
│   ├── recipients.js  # Quản lý danh sách (CSV/manual/Supabase)
│   ├── template.js    # Render {{var}}, CRUD mẫu
│   ├── sender.js      # Gửi batch → Apps Script
│   └── app.js         # Router + view + bindings
├── apps-script.gs     # Code dán lên script.google.com
└── SETUP.md           # File này
```
