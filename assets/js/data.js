/* ============================================================
 * FUTA LAND - SA BÀN SỐ - DỮ LIỆU DỰ ÁN
 * ============================================================
 * 📌 ĐÂY LÀ FILE DUY NHẤT CẦN CHỈNH KHI THAY DỮ LIỆU THẬT
 *
 * Cấu trúc:
 *   - PROJECTS: danh sách tất cả dự án
 *   - Mỗi dự án có type: "apartment" (chung cư) hoặc "villa" (biệt thự)
 *   - Status: "available" (còn) | "reserved" (giữ chỗ) | "sold" (đã bán)
 *   - Giá tính theo TRIỆU VNĐ (ví dụ: 3500 = 3,5 tỷ)
 * ============================================================ */

const PROJECTS = [
  // ============================================================
  // DỰ ÁN 1: CHUNG CƯ - FUTA SKY GARDEN
  // ============================================================
  {
    id: "futa-sky-garden",
    name: "FUTA Sky Garden",
    type: "apartment",
    tagline: "Đỉnh cao sống xanh giữa lòng thành phố",
    address: "Số 1 Đại lộ Đông Tây, Quận 2, TP. HCM",
    developer: "FUTA Land",
    handover: "Quý 4/2026",
    description: "Tổ hợp căn hộ cao cấp 20 tầng với view sông Sài Gòn, đầy đủ tiện ích nội khu: hồ bơi tràn bờ, gym, spa, trường mầm non.",
    amenities: ["Hồ bơi tràn bờ", "Gym 500m²", "Spa & Sauna", "Trường mầm non", "Khu BBQ", "Sky bar tầng 20", "Bãi xe ngầm"],
    coverImage: "assets/img/cover-apartment.svg",
    totalFloors: 20,
    floors: generateApartmentFloors(20)
  },

  // ============================================================
  // DỰ ÁN 2: COMPOUND BIỆT THỰ - FUTA RIVERSIDE VILLAS
  // ============================================================
  {
    id: "futa-riverside",
    name: "FUTA Riverside Villas",
    type: "villa",
    tagline: "Sống chuẩn thượng lưu bên dòng sông xanh",
    address: "Đảo Kim Cương, Quận 2, TP. HCM",
    developer: "FUTA Land",
    handover: "Quý 2/2027",
    description: "Khu compound biệt thự đơn lập & nhà phố sang trọng với 16 căn, mặt tiền sông, an ninh 24/7, hồ bơi và sân tennis nội khu.",
    amenities: ["Sông bao quanh", "Hồ bơi cộng đồng", "Sân tennis", "Công viên trung tâm", "Cổng an ninh 24/7", "Bến du thuyền"],
    coverImage: "assets/img/cover-villa.svg",
    villas: generateVillas()
  }
];

// ============================================================
// HÀM TẠO DỮ LIỆU CHUNG CƯ (20 tầng, 8 căn/tầng)
// Có thể xoá hàm này và viết thẳng dữ liệu thật
// ============================================================
function generateApartmentFloors(totalFloors) {
  const floors = [];
  const unitTypes = [
    { code: "A", area: 65, bedrooms: 2, bathrooms: 2, direction: "Đông Nam", view: "Hồ bơi" },
    { code: "B", area: 85, bedrooms: 2, bathrooms: 2, direction: "Đông",     view: "Sông Sài Gòn" },
    { code: "C", area: 95, bedrooms: 3, bathrooms: 2, direction: "Tây Nam",  view: "Nội khu" },
    { code: "D", area: 110, bedrooms: 3, bathrooms: 3, direction: "Tây",     view: "Thành phố" },
    { code: "E", area: 75, bedrooms: 2, bathrooms: 2, direction: "Đông Bắc", view: "Hồ bơi" },
    { code: "F", area: 90, bedrooms: 3, bathrooms: 2, direction: "Bắc",      view: "Công viên" },
    { code: "G", area: 105, bedrooms: 3, bathrooms: 2, direction: "Tây Bắc", view: "Sông Sài Gòn" },
    { code: "H", area: 130, bedrooms: 4, bathrooms: 3, direction: "Nam",     view: "Sông Sài Gòn" }
  ];

  for (let f = 1; f <= totalFloors; f++) {
    const units = unitTypes.map((u, idx) => {
      // Giá tăng dần theo tầng (+30 triệu/tầng cao hơn)
      const basePrice = (u.area * 45) + (f - 1) * 30;
      // Random trạng thái: 60% còn, 15% giữ chỗ, 25% đã bán
      const rand = pseudoRandom(f * 100 + idx);
      let status = "available";
      if (rand > 0.75) status = "sold";
      else if (rand > 0.60) status = "reserved";

      return {
        id: `${u.code}-${f.toString().padStart(2,'0')}${(idx+1).toString().padStart(2,'0')}`,
        code: `${u.code}.${f}.${idx+1}`,
        area: u.area,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        direction: u.direction,
        view: u.view,
        balcony: u.area > 80,
        price: Math.round(basePrice),
        status: status,
        floor: f,
        position: idx,
        image: null
      };
    });
    floors.push({ floorNumber: f, units });
  }
  return floors;
}

// ============================================================
// HÀM TẠO DỮ LIỆU BIỆT THỰ (16 căn, polygon trên map)
// ============================================================
function generateVillas() {
  // Layout 16 căn: 2 hàng x 8 căn, có khu vực hồ bơi trung tâm
  const villas = [];
  const villaTypes = [
    { type: "Biệt thự đơn lập",  area: 280, landArea: 450, bedrooms: 5, basePrice: 18000 },
    { type: "Biệt thự song lập", area: 220, landArea: 320, bedrooms: 4, basePrice: 14000 },
    { type: "Nhà phố",           area: 180, landArea: 200, bedrooms: 4, basePrice: 9500 },
    { type: "Nhà phố shophouse", area: 200, landArea: 220, bedrooms: 4, basePrice: 12000 }
  ];
  const directions = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Tây Nam", "Đông Bắc", "Tây Bắc"];

  // Hàng trên - 8 căn
  for (let i = 0; i < 8; i++) {
    const typeIdx = i % villaTypes.length;
    const t = villaTypes[typeIdx];
    const x = 8 + i * 11;     // %
    const y = 18;             // %
    const w = 9;
    const h = 22;
    const rand = pseudoRandom(i + 1);
    let status = "available";
    if (rand > 0.75) status = "sold";
    else if (rand > 0.60) status = "reserved";

    villas.push({
      id: `V-N${(i+1).toString().padStart(2,'0')}`,
      code: `Khu Bắc - Lô ${i+1}`,
      type: t.type,
      area: t.area,
      landArea: t.landArea,
      bedrooms: t.bedrooms,
      bathrooms: t.bedrooms - 1,
      direction: directions[i % directions.length],
      price: t.basePrice + Math.round(pseudoRandom(i*7) * 2000),
      status: status,
      polygon: `${x},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`,
      image: null
    });
  }

  // Hàng dưới - 8 căn
  for (let i = 0; i < 8; i++) {
    const typeIdx = (i + 2) % villaTypes.length;
    const t = villaTypes[typeIdx];
    const x = 8 + i * 11;
    const y = 62;
    const w = 9;
    const h = 22;
    const rand = pseudoRandom(i + 100);
    let status = "available";
    if (rand > 0.75) status = "sold";
    else if (rand > 0.60) status = "reserved";

    villas.push({
      id: `V-S${(i+1).toString().padStart(2,'0')}`,
      code: `Khu Nam - Lô ${i+1}`,
      type: t.type,
      area: t.area,
      landArea: t.landArea,
      bedrooms: t.bedrooms,
      bathrooms: t.bedrooms - 1,
      direction: directions[(i+4) % directions.length],
      price: t.basePrice + Math.round(pseudoRandom(i*13 + 5) * 2000),
      status: status,
      polygon: `${x},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`,
      image: null
    });
  }

  return villas;
}

// Pseudo-random ổn định (không dùng Math.random để dữ liệu nhất quán)
function pseudoRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// ============================================================
// HÀM TIỆN ÍCH - dùng chung
// ============================================================
const STATUS_LABEL = {
  available: "Còn trống",
  reserved:  "Đã giữ chỗ",
  sold:      "Đã bán"
};

const STATUS_COLOR = {
  available: "#16a34a",  // xanh lá
  reserved:  "#eab308",  // vàng
  sold:      "#dc2626"   // đỏ
};

function getProject(id) {
  return PROJECTS.find(p => p.id === id);
}

function formatPrice(triệu) {
  if (triệu >= 1000) {
    return (triệu / 1000).toFixed(2).replace(/\.?0+$/, "") + " tỷ";
  }
  return triệu + " triệu";
}

function formatPriceDetail(triệu) {
  const billion = Math.floor(triệu / 1000);
  const million = triệu % 1000;
  if (billion === 0) return `${million} triệu VNĐ`;
  if (million === 0) return `${billion} tỷ VNĐ`;
  return `${billion} tỷ ${million} triệu VNĐ`;
}
