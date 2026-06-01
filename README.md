# 🏢 FUTA Land - Sa Bàn Số (Digital Showroom MVP)

Ứng dụng trình chiếu dự án bất động sản cho FUTA Land - hoạt động **100% offline**, mở bằng trình duyệt là dùng được ngay.

---

## 🚀 Cách chạy ngay

**Cách 1 - Mở trực tiếp (đơn giản nhất):**
1. Double-click file `index.html`
2. Trình duyệt sẽ tự mở app

**Cách 2 - Chạy local server (khuyến nghị cho production):**
```bash
# Mở terminal tại thư mục dự án
python3 -m http.server 8080
# Sau đó mở: http://localhost:8080
```

---

## ✨ Tính năng MVP hiện có

- ✅ Trang chủ chọn loại dự án (Chung cư / Biệt thự)
- ✅ **Sa bàn chung cư**: chọn tầng → click căn hộ → xem chi tiết
- ✅ **Sa bàn biệt thự**: bird-view khu compound, click căn xem chi tiết
- ✅ Bộ lọc: trạng thái, giá, diện tích, hướng
- ✅ So sánh nhiều căn cùng lúc
- ✅ Xuất báo giá PDF (qua chức năng in của trình duyệt)
- ✅ Status badge theo màu: 🟢 Còn / 🟡 Giữ chỗ / 🔴 Đã bán
- ✅ Hoạt động hoàn toàn offline

### 🎬 Tính năng ảo hoá (Virtual Viewer) - tab trong modal chi tiết

| Mode | Mô tả | Yêu cầu |
|---|---|---|
| 📐 **Mặt bằng 2D** | SVG mặt bằng tự sinh theo số phòng | Offline |
| 🏗️ **Mặt bằng 3D** | Three.js extruded từ data, xoay 360° | Offline |
| 🌐 **Tour 360°** | Pannellum viewer - kéo xoay, zoom, hotspot | Offline (cần ảnh 360°) |
| 🚶 **Đi bộ 3D** | First-person Three.js scene, WASD desktop / joystick mobile | Offline |
| 🎨 **AI Nội thất** | Stable Diffusion XL qua HuggingFace API, 6 phong cách | **Cần Internet** |

**Thay ảnh 360° thật vào:**
- Chụp ảnh equirectangular (tỉ lệ 2:1) bằng camera 360° hoặc app Google Street View
- Bỏ vào `assets/img/`
- Trong `data.js`, thêm field `image360: "assets/img/ten-anh.jpg"` vào mỗi căn

**AI Nội thất hoạt động:**
- Dùng API miễn phí của HuggingFace (`stabilityai/stable-diffusion-xl-base-1.0`)
- Lần đầu cần ~20s để model load (cold start)
- Không cần API key cho usage cơ bản
- Có rate limit - nếu lỗi nhiều, đăng ký token free tại huggingface.co

---

## 📁 Cấu trúc dự án

```
Project FUTA Land/
├── index.html              ← Trang chủ
├── apartment.html          ← Sa bàn chung cư
├── villa.html              ← Sa bàn biệt thự
├── assets/
│   ├── css/style.css       ← Toàn bộ style
│   └── js/
│       ├── data.js         ← 📌 DỮ LIỆU - chỉnh ở đây để thay dự án
│       ├── shared.js       ← Logic chung (filter, compare, modal)
│       ├── apartment.js    ← Logic sa bàn chung cư
│       └── villa.js        ← Logic sa bàn biệt thự
└── README.md
```

---

## 📝 Cách thay dữ liệu thật vào

Mở file `assets/js/data.js` - đây là nơi duy nhất cần chỉnh để thay dự án thật vào.

### Cấu trúc 1 dự án chung cư:
```js
{
  id: "vinhomes-thu-duc",
  name: "Vinhomes Thủ Đức",
  type: "apartment",
  address: "Phường Long Bình, TP. Thủ Đức",
  totalFloors: 25,
  floors: [
    {
      floorNumber: 1,
      units: [
        {
          id: "A-101",
          area: 75,           // m2
          bedrooms: 2,
          bathrooms: 2,
          direction: "Đông Nam",
          view: "Hồ bơi",
          price: 3500,        // triệu VNĐ
          status: "available", // available | reserved | sold
          image: "assets/img/unit-a101.jpg" // hoặc để trống
        },
        // ...
      ]
    }
  ]
}
```

### Cấu trúc 1 dự án biệt thự:
```js
{
  id: "futa-riverside",
  name: "FUTA Riverside Villas",
  type: "villa",
  villas: [
    {
      id: "V-01",
      type: "Biệt thự đơn lập",
      area: 250,
      landArea: 400,
      bedrooms: 4,
      direction: "Đông",
      price: 12500,
      status: "available",
      // Polygon vẽ trên map (tọa độ %)
      polygon: "10,20 30,20 30,40 10,40"
    }
  ]
}
```

---

## 🖼️ Thay hình ảnh

Tạo thư mục `assets/img/` và copy hình vào. Cập nhật đường dẫn trong `data.js`.

Nếu không có hình, app sẽ hiển thị placeholder mặc định.

---

## 📤 Xuất báo giá PDF

1. Mở chi tiết 1 căn hoặc bảng so sánh
2. Nhấn nút **"In / Xuất PDF"**
3. Chọn **"Save as PDF"** trong cửa sổ in

---

## 🛠️ Lộ trình nâng cấp (Giai đoạn 2-3)

- [ ] Ảnh 360° (Pannellum)
- [ ] Video flycam
- [ ] Đóng gói thành app desktop (Tauri)
- [ ] Sync giá realtime (Supabase free)
- [ ] AI tư vấn (Gemini API)
- [ ] QR code chia sẻ từng căn

---

## 📞 Liên hệ phát triển

Đây là MVP demo. Để triển khai thật cần:
- Hình ảnh thật của dự án (sơ đồ tổng thể, mặt bằng từng căn)
- Bảng giá chính thức từ phòng kinh doanh
- Branding chính thức của FUTA Land

---

**© 2026 FUTA Land - Sa Bàn Số v0.1 MVP**
