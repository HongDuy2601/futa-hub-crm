# 🚀 Hướng dẫn cho nhiều người test FUTA Hub CRM (data dùng chung)

Mục tiêu: có **link public** để ai cũng vào được + **mọi người thấy chung 1 data** (A thêm khách → B thấy).
Tất cả **miễn phí 100%**. Tổng thời gian setup ~20 phút.

---

## BƯỚC 1 — Tạo database miễn phí trên Supabase (~7 phút)

1. Vào https://supabase.com → **Start your project** → đăng nhập bằng GitHub/Google (free).
2. **New project**:
   - Name: `futa-crm`
   - Database Password: đặt 1 mật khẩu (lưu lại)
   - Region: **Southeast Asia (Singapore)** (gần VN nhất)
   - Bấm **Create new project** → chờ ~2 phút.
3. Vào **SQL Editor** (menu trái) → **New query** → dán đoạn SQL dưới đây → **Run**:

```sql
create table if not exists futa_sync (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  primary key (collection, id)
);

alter table futa_sync enable row level security;
create policy "allow all (demo)" on futa_sync
  for all using (true) with check (true);
```

4. Vào **Project Settings → API**, copy 2 thứ:
   - **Project URL** (dạng `https://xxxx.supabase.co`)
   - **anon public** key (chuỗi dài `eyJ...`)

> ⚠️ Bảo mật: chính sách RLS ở trên là "ai cũng đọc/ghi được" — **chỉ dùng cho test nội bộ**. Test xong nên xoá project hoặc siết lại RLS. Anon key là khóa công khai, an toàn để nhúng vào web.

---

## BƯỚC 2 — Nhúng key vào app (~2 phút)

Mở file `crm/js/config.js`, điền 2 giá trị vừa copy:

```js
window.FUTA_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",   // ← Project URL của bạn
  supabaseKey: "eyJhbGciOiJIUzI1NiIs..."     // ← anon public key
};
```

Lưu lại. Nhờ vậy **mọi tester tự động kết nối** mà không ai phải nhập tay.

---

## BƯỚC 3 — Đưa app lên link public (chọn 1 cách)

### Cách A — Netlify Drop (nhanh nhất, không cần tài khoản)
1. Vào https://app.netlify.com/drop
2. Kéo–thả **cả thư mục `Project FUTA Land`** (thư mục gốc, chứa cả `crm/`, `assets/`, `documents/`) vào ô.
3. Đợi ~30 giây → được link dạng `https://ten-ngau-nhien.netlify.app`
4. Link cho tester: `https://ten-ngau-nhien.netlify.app/crm/index.html`

> Phải kéo thư mục GỐC (không chỉ riêng `crm/`) vì CRM dùng chung logo + dữ liệu căn ở `assets/`.

### Cách B — GitHub Pages (link ổn định, lâu dài)
```bash
cd "/Users/phamhongduy/Desktop/Project FUTA Land"
git init && git add -A && git commit -m "FUTA Hub CRM"
# Tạo repo trên github.com (vd: futa-hub), rồi:
git remote add origin https://github.com/<user>/futa-hub.git
git branch -M main && git push -u origin main
```
Trên GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
Sau ~1 phút có link: `https://<user>.github.io/futa-hub/crm/index.html`

---

## BƯỚC 4 — Nạp dữ liệu demo dùng chung (1 lần, ~1 phút)

1. Mở link CRM (người đầu tiên).
2. Vào **Cài đặt** → card **☁️ Đồng bộ Supabase**:
   - Kiểm tra trạng thái hiện **● Đã kết nối Supabase** (xanh).
   - Bấm **🌱 Seed demo lên cloud** → đẩy 42 khách + deal + task mẫu lên DB chung.
3. Xong! Bây giờ mọi tester mở link đều thấy **cùng một bộ data**.

---

## BƯỚC 5 — Mời người test

- Gửi link `.../crm/index.html` cho mọi người (mở bằng Chrome/Safari trên máy tính hoặc điện thoại).
- Mỗi người bấm nút **↻** ở góc dưới-trái để **chọn tên mình** (Phạm Hồng Duy, Nguyễn Minh Anh...) → để biết ai tạo/sửa gì.
- A thêm/sửa khách → khoảng **20 giây** sau B sẽ tự thấy (app tự refresh). Bấm reload để thấy ngay.
- Trên điện thoại: mở link → menu trình duyệt → **Thêm vào màn hình chính** để dùng như app (PWA).

---

## Câu hỏi thường gặp

**Hết dung lượng không?** Supabase free: 500MB DB + 5GB băng thông/tháng — thừa cho hàng nghìn khách test.

**Có mất data khi tắt máy?** Không. Data nằm trên Supabase (cloud), không phụ thuộc máy ai.

**Muốn xoá hết làm lại?** Vào Supabase → Table Editor → `futa_sync` → xoá rows; rồi Seed lại từ app.

**Không có mạng thì sao?** App vẫn chạy offline bằng dữ liệu đã tải; có mạng lại sẽ tự đồng bộ.

**AI chatbot/scoring có cần mạng?** Lead scoring + hỏi đáp data CRM chạy offline. Chatbot trả lời tự do thì vào Cài đặt → AI bật Ollama (local free) hoặc Gemini (free key) — tùy chọn.
