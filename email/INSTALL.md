# FUTA Email — Cài đặt làm App Desktop

App này là **native desktop app** (qua Electron), không phải web. Sau khi cài, có icon trên Dock/Desktop, mở 1 click như mọi app khác.

## Có cần internet không?

| Việc bạn làm trong app | Cần mạng? |
|---|---|
| Mở app, soạn email, lưu mẫu, xem trước cá nhân hóa | ❌ Không |
| Import CSV/Excel danh sách khách hàng | ❌ Không |
| **Gửi email thật** | ✅ **Có** (gọi Google Apps Script) |
| Đồng bộ CRM Supabase | ✅ Có |

→ App offline 80% thời gian, **chỉ cần internet đúng lúc bấm nút "Gửi"**.

---

## A. Cài đặt nhanh (khuyến nghị)

### Mac (Apple Silicon / Intel)

**Cách 1 — Dùng bản đã build sẵn** (nếu có file `.dmg` từ người khác):
1. Mở file `FUTA Email-1.0.0-arm64.dmg` → kéo icon vào Applications.
2. Lần đầu mở: **chuột phải → Open** → bấm "Open" trong popup *(vì chưa code-sign Apple)*.
3. Xong. Lần sau mở từ Launchpad/Spotlight bình thường.

**Cách 2 — Tự build từ source code:**
```bash
cd "/Users/phamhongduy/Desktop/Project FUTA Land/email"
npm install              # 1 lần
npm run build:mac        # tạo dist/FUTA Email-1.0.0-arm64.dmg
open dist/                # mở folder kết quả
```
File `.dmg` xuất hiện trong `dist/` — kéo vào Applications.

### Windows

```bash
cd email
npm install
npm run build:win        # tạo dist/FUTA Email Setup 1.0.0.exe
```
Chạy file `.exe` để cài, có shortcut Desktop tự động.

### Linux

```bash
cd email
npm install
npm run build            # tạo .AppImage và .deb
```

---

## B. Chạy chế độ dev (không cần build, mở thử ngay)

Dùng khi đang phát triển hoặc test nhanh:

```bash
cd email
npm install              # 1 lần duy nhất
npm start                # mở native app, có DevTools
```

App mở ngay trong cửa sổ native, không phải tab trình duyệt.

---

## C. Build .app không đóng gói DMG (nhanh hơn)

Nếu chỉ muốn file `.app` test, không cần installer:

```bash
cd email
npm run pack             # build vào dist/mac-arm64/FUTA Email.app
open "dist/mac-arm64/FUTA Email.app"
```

---

## D. Cấu trúc file Electron

```
email/
├── package.json         # deps + cấu hình electron-builder
├── main.js              # Electron main process (cửa sổ, menu)
├── preload.js           # security bridge
├── build-assets/
│   ├── icon.png         # 750x750 logo FUTA Land
│   └── icon.icns        # icon Mac đã convert
├── index.html           # giao diện app (giống bản web)
├── css/, js/            # giống bản web
├── apps-script.gs       # code dán lên script.google.com
└── dist/                # output build (gitignored)
```

---

## E. Gửi cho đồng nghiệp dùng

Sau khi build:
- **Mac**: gửi file `dist/FUTA Email-1.0.0-arm64.dmg` (cho M1/M2/M3) hoặc `-x64.dmg` (cho Intel).
- **Windows**: gửi `dist/FUTA Email Setup 1.0.0.exe`.

Họ không cần cài Node, không cần đụng terminal — chỉ cần kéo thả/double-click.

⚠️ **Lưu ý code-signing**: chưa có chứng chỉ Apple Developer ($99/năm) nên Mac sẽ cảnh báo "unidentified developer" lần đầu mở. Hướng dẫn họ: **chuột phải → Open → Open**. Sau lần đầu, mở bình thường.

---

## F. Sau khi cài xong, làm gì tiếp?

1. Mở app **FUTA Email** từ Launchpad/Start Menu.
2. Vào tab **Hướng dẫn** (trên menu) → làm theo các bước deploy Google Apps Script (1 lần duy nhất).
3. Vào **Cài đặt** → dán URL Apps Script + email gửi thử.
4. Vào **Người nhận** → import CSV danh sách khách.
5. Vào **Soạn & Gửi** → viết email với `{{ten}}`, `{{du_an}}`, ... → bấm gửi.

---

## G. Troubleshooting

| Triệu chứng | Cách xử lý |
|---|---|
| **Mac báo "FUTA Email is damaged"** | Mở Terminal: `xattr -cr "/Applications/FUTA Email.app"` |
| **Mac báo "unidentified developer"** | Chuột phải → Open → Open trong popup. Lần đầu thôi. |
| **Build lỗi: `Apple Silicon` warnings** | Không ảnh hưởng, là warning thiếu chứng chỉ code-sign. App vẫn chạy bình thường. |
| **`npm install` lâu** | Bình thường lần đầu — Electron ~250MB, mất ~30-60 giây. |
| **App không mở email được** | Vào Cài đặt → kiểm tra Apps Script URL + bấm Test kết nối. |
