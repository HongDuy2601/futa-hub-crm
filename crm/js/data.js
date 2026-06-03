/* ============================================================
 * FUTA HUB CRM - DATA LAYER
 * Schemas + seed data demo
 * ============================================================ */

/* ----------- CONSTANTS ----------- */
const LEAD_STATUS = {
  new:          { label: 'Mới',         color: 'new',        order: 1 },
  contacted:    { label: 'Đã liên hệ',  color: 'contacted',  order: 2 },
  interested:   { label: 'Quan tâm',    color: 'interested', order: 3 },
  viewing:      { label: 'Đã xem nhà',  color: 'viewing',    order: 4 },
  negotiating:  { label: 'Đàm phán',    color: 'negotiating',order: 5 },
  'closed-won': { label: 'Chốt thành công', color: 'won',    order: 6 },
  'closed-lost':{ label: 'Không thành công', color: 'lost',  order: 7 }
};

const DEAL_STAGES = [
  { key: 'new',         label: 'Mới',           color: '#3b82f6' },
  { key: 'viewed',      label: 'Đã xem',        color: '#8b5cf6' },
  { key: 'negotiating', label: 'Đàm phán',      color: '#f59e0b' },
  { key: 'deposit',     label: 'Đặt cọc',       color: '#ec4899' },
  { key: 'contract',    label: 'Ký HĐ',         color: '#10b981' },
  { key: 'completed',   label: 'Hoàn tất',      color: '#16a34a' },
  { key: 'cancelled',   label: 'Hủy',           color: '#6b7280' }
];

const LEAD_SOURCES = {
  facebook: { label: 'Facebook Ads',  icon: '📘' },
  zalo:     { label: 'Zalo OA',       icon: '💬' },
  hotline:  { label: 'Hotline',       icon: '📞' },
  website:  { label: 'Website',       icon: '🌐' },
  referral: { label: 'Giới thiệu',    icon: '🤝' },
  event:    { label: 'Sự kiện',       icon: '🎪' }
};

/* ----------- LOẠI KHÁCH HÀNG: cá nhân / doanh nghiệp ----------- */
const CUSTOMER_TYPES = {
  individual: { label: 'Cá nhân',    icon: '👤', color: '#3b82f6' },
  business:   { label: 'Doanh nghiệp', icon: '🏢', color: '#9333ea' }
};

const BUSINESS_INDUSTRIES = [
  { key: 'real_estate', label: 'Bất động sản' },
  { key: 'manufacturing', label: 'Sản xuất' },
  { key: 'commerce', label: 'Thương mại - Bán lẻ' },
  { key: 'service', label: 'Dịch vụ' },
  { key: 'construction', label: 'Xây dựng' },
  { key: 'finance', label: 'Tài chính - Ngân hàng' },
  { key: 'tech', label: 'Công nghệ - IT' },
  { key: 'education', label: 'Giáo dục' },
  { key: 'healthcare', label: 'Y tế' },
  { key: 'logistics', label: 'Logistics - Vận tải' },
  { key: 'food', label: 'F&B - Thực phẩm' },
  { key: 'tourism', label: 'Du lịch - Khách sạn' },
  { key: 'other', label: 'Khác' }
];

const BUSINESS_SIZES = [
  { key: 'micro',  label: 'Siêu nhỏ (<10 NV)',   employees: 5 },
  { key: 'small',  label: 'Nhỏ (10-50 NV)',       employees: 30 },
  { key: 'medium', label: 'Vừa (50-200 NV)',      employees: 100 },
  { key: 'large',  label: 'Lớn (200+ NV)',        employees: 500 }
];

const ACTIVITY_TYPES = {
  call:    { icon: '📞', label: 'Gọi điện' },
  sms:     { icon: '💬', label: 'Nhắn tin' },
  email:   { icon: '📧', label: 'Email' },
  meeting: { icon: '🤝', label: 'Gặp mặt' },
  viewing: { icon: '🏠', label: 'Dẫn xem nhà' },
  note:    { icon: '📝', label: 'Ghi chú' },
  stage:   { icon: '🔄', label: 'Đổi trạng thái' }
};

/* ============================================================
 * SEED: ORGANIZATIONS (CĐT + các sàn) + ROLES + TEAMS + ASSIGNMENTS
 * ============================================================ */
const SEED_ORGS = [
  { id: 'ORG-FUTA',      name: 'FUTA Land',                     type: 'developer',    parentId: null,        contact: '1900 6067' },
  { id: 'ORG-FUTA-SALE', name: 'Sàn FUTA Sale (nội bộ)',         type: 'inhouse',      parentId: 'ORG-FUTA',  contact: 'sale@futaland.vn' },
  { id: 'ORG-DIST-A',    name: 'ABC Land (Phân phối F1)',         type: 'distributor',  parentId: null,        contact: 'sales@abcland.vn' },
  { id: 'ORG-DIST-B',    name: 'Đại Phát Realty (Phân phối F1)',  type: 'distributor',  parentId: null,        contact: 'info@daiphat.vn' },
  { id: 'ORG-DIST-C',    name: 'Tân Hoàng Realty (Phân phối F2)', type: 'distributor',  parentId: null,        contact: 'cs@tanhoang.vn' }
];

const ORG_TYPES = {
  developer:    { label: 'Chủ đầu tư', icon: '🏛', color: '#1B5E20' },
  inhouse:      { label: 'Sàn nội bộ CĐT', icon: '🏢', color: '#1B5E20' },
  distributor:  { label: 'Sàn phân phối', icon: '🤝', color: '#2563eb' }
};

// 6 vai trò, level cao = quyền lớn hơn
const ROLES = [
  { id: 'admin',    name: 'Admin CĐT',            level: 100, scope: 'all',          icon: '👑', color: '#C8102E', desc: 'Toàn quyền, xem-sửa tất cả' },
  { id: 'cdt_pm',   name: 'QL Dự án CĐT',         level: 80,  scope: 'project',      icon: '🏛', color: '#9333ea', desc: 'Xem mọi sàn ở dự án được giao, duyệt quỹ căn' },
  { id: 'gd_san',   name: 'Giám đốc sàn',         level: 70,  scope: 'org',          icon: '👔', color: '#1B5E20', desc: 'Quản lý toàn bộ sàn của mình' },
  { id: 'gdkd',     name: 'GĐ Kinh doanh / Trưởng nhóm', level: 50, scope: 'team',   icon: '🧑‍💼', color: '#2563eb', desc: 'Quản lý 1-2 team trong sàn' },
  { id: 'tvv',      name: 'Tư vấn viên',          level: 30,  scope: 'self',         icon: '👤', color: '#6b7280', desc: 'Chỉ thấy KH/deal của mình' },
  { id: 'readonly', name: 'Chỉ xem (lãnh đạo/kế toán)', level: 10, scope: 'all_readonly', icon: '👁', color: '#9ca3af', desc: 'Xem toàn bộ, không sửa' }
];

const SEED_TEAMS = [
  // Sàn nội bộ FUTA
  { id: 'TEAM-FUTA-01', orgId: 'ORG-FUTA-SALE', name: 'KD-01 (Quận 2)',         leaderSalesId: null },
  { id: 'TEAM-FUTA-02', orgId: 'ORG-FUTA-SALE', name: 'KD-02 (Bình Thạnh)',     leaderSalesId: null },
  { id: 'TEAM-FUTA-03', orgId: 'ORG-FUTA-SALE', name: 'KD-03 (Q.7)',            leaderSalesId: null },
  // Sàn ABC Land
  { id: 'TEAM-A-01',    orgId: 'ORG-DIST-A',    name: 'ABC Team Bắc',           leaderSalesId: null },
  { id: 'TEAM-A-02',    orgId: 'ORG-DIST-A',    name: 'ABC Team Nam',           leaderSalesId: null },
  // Sàn Đại Phát
  { id: 'TEAM-B-01',    orgId: 'ORG-DIST-B',    name: 'Đại Phát Team 1',        leaderSalesId: null },
  // Sàn Tân Hoàng
  { id: 'TEAM-C-01',    orgId: 'ORG-DIST-C',    name: 'Tân Hoàng Team Chính',   leaderSalesId: null }
];

// Mỗi sàn được CĐT giao bán dự án nào (project assignments)
// FUTA-SALE bán tất cả. Sàn ngoài chỉ bán dự án được giao.
const SEED_PROJECT_ASSIGNMENTS = [
  { orgId: 'ORG-FUTA-SALE', projectId: 'futa-sky-garden' },
  { orgId: 'ORG-FUTA-SALE', projectId: 'futa-riverside' },
  { orgId: 'ORG-DIST-A',    projectId: 'futa-sky-garden' },   // ABC Land chỉ bán Sky Garden
  { orgId: 'ORG-DIST-B',    projectId: 'futa-sky-garden' },   // Đại Phát bán Sky Garden
  { orgId: 'ORG-DIST-B',    projectId: 'futa-riverside' },    // và Riverside
  { orgId: 'ORG-DIST-C',    projectId: 'futa-riverside' }     // Tân Hoàng chỉ bán Riverside
];

/* ----------- SEED: SALES STAFF (mở rộng có orgId/teamId/roleId) ----------- */
const SEED_SALES = [
  // Admin CĐT
  { id: 'S000', name: 'Trần Đại Nhân',     code: 'TDN', orgId: 'ORG-FUTA',      teamId: null,            roleId: 'admin',    email: 'admin@futaland.vn',       phone: '0900 000 001', team: 'CĐT' },
  // QL Dự án CĐT
  { id: 'S010', name: 'Nguyễn Thị Lan',    code: 'NTL', orgId: 'ORG-FUTA',      teamId: null,            roleId: 'cdt_pm',   email: 'lan.nguyen@futaland.vn',  phone: '0900 000 002', team: 'CĐT' },
  // Sàn FUTA nội bộ
  { id: 'S001', name: 'Phạm Hồng Duy',     code: 'PHD', orgId: 'ORG-FUTA-SALE', teamId: 'TEAM-FUTA-01',  roleId: 'gd_san',   email: 'duy.phamhong@futaland.vn',phone: '0908 123 456', team: 'KD-01' },
  { id: 'S002', name: 'Nguyễn Minh Anh',   code: 'NMA', orgId: 'ORG-FUTA-SALE', teamId: 'TEAM-FUTA-01',  roleId: 'gdkd',     email: 'anh.nguyen@futaland.vn',  phone: '0909 234 567', team: 'KD-01' },
  { id: 'S003', name: 'Trần Quốc Bảo',     code: 'TQB', orgId: 'ORG-FUTA-SALE', teamId: 'TEAM-FUTA-02',  roleId: 'gdkd',     email: 'bao.tran@futaland.vn',    phone: '0907 345 678', team: 'KD-02' },
  { id: 'S004', name: 'Lê Thị Cẩm Tú',     code: 'LCT', orgId: 'ORG-FUTA-SALE', teamId: 'TEAM-FUTA-02',  roleId: 'tvv',      email: 'tu.le@futaland.vn',       phone: '0906 456 789', team: 'KD-02' },
  { id: 'S005', name: 'Võ Hoàng Sơn',      code: 'VHS', orgId: 'ORG-FUTA-SALE', teamId: 'TEAM-FUTA-03',  roleId: 'tvv',      email: 'son.vo@futaland.vn',      phone: '0905 567 890', team: 'KD-03' },
  // Sàn ABC Land
  { id: 'S100', name: 'Đặng Văn Khoa',     code: 'DVK', orgId: 'ORG-DIST-A',    teamId: 'TEAM-A-01',     roleId: 'gd_san',   email: 'khoa@abcland.vn',         phone: '0911 100 001', team: 'ABC-Bắc' },
  { id: 'S101', name: 'Hoàng Bích Trâm',   code: 'HBT', orgId: 'ORG-DIST-A',    teamId: 'TEAM-A-01',     roleId: 'tvv',      email: 'tram@abcland.vn',         phone: '0911 100 002', team: 'ABC-Bắc' },
  { id: 'S102', name: 'Vũ Trọng Tín',      code: 'VTT', orgId: 'ORG-DIST-A',    teamId: 'TEAM-A-02',     roleId: 'gdkd',     email: 'tin@abcland.vn',          phone: '0911 100 003', team: 'ABC-Nam' },
  // Sàn Đại Phát
  { id: 'S200', name: 'Bùi Quang Vinh',    code: 'BQV', orgId: 'ORG-DIST-B',    teamId: 'TEAM-B-01',     roleId: 'gd_san',   email: 'vinh@daiphat.vn',         phone: '0912 200 001', team: 'ĐP-1' },
  { id: 'S201', name: 'Ngô Thị Phương',    code: 'NTP', orgId: 'ORG-DIST-B',    teamId: 'TEAM-B-01',     roleId: 'tvv',      email: 'phuong@daiphat.vn',       phone: '0912 200 002', team: 'ĐP-1' },
  // Sàn Tân Hoàng
  { id: 'S300', name: 'Đỗ Hữu Phước',      code: 'DHP', orgId: 'ORG-DIST-C',    teamId: 'TEAM-C-01',     roleId: 'gd_san',   email: 'phuoc@tanhoang.vn',       phone: '0913 300 001', team: 'TH-Chính' },
  { id: 'S301', name: 'Lý Hoàng My',       code: 'LHM', orgId: 'ORG-DIST-C',    teamId: 'TEAM-C-01',     roleId: 'tvv',      email: 'my@tanhoang.vn',          phone: '0913 300 002', team: 'TH-Chính' },
  // Kế toán xem
  { id: 'S900', name: 'Trịnh Minh Tâm',    code: 'TMT', orgId: 'ORG-FUTA',      teamId: null,            roleId: 'readonly', email: 'ketoan@futaland.vn',      phone: '0900 900 001', team: 'Kế toán' }
];

/* ----------- SEED: LEADS ----------- */
const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MID_NAMES   = ['Văn', 'Thị', 'Minh', 'Hữu', 'Hồng', 'Quốc', 'Thành', 'Kim', 'Phương', 'Tuấn'];
const LAST_NAMES  = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phong', 'Giang', 'Hà', 'Khoa', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quang', 'Sơn', 'Trang', 'Uyên', 'Vy', 'Yến'];

function seedRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}
function pickFrom(arr, seed) { return arr[Math.floor(seedRandom(seed) * arr.length)]; }
function randomPhone(seed) {
  const prefixes = ['090', '093', '070', '079', '081', '082', '083', '084', '085', '088', '089'];
  const p = prefixes[Math.floor(seedRandom(seed) * prefixes.length)];
  const rest = Math.floor(seedRandom(seed + 1) * 9000000 + 1000000);
  return p + rest.toString();
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function generateSeedLeads(count = 42) {
  const leads = [];
  const statuses = Object.keys(LEAD_STATUS);
  const sources = Object.keys(LEAD_SOURCES);
  const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];

  for (let i = 0; i < count; i++) {
    const s = i * 7 + 11;
    const fn = pickFrom(FIRST_NAMES, s);
    const mn = pickFrom(MID_NAMES, s + 1);
    const ln = pickFrom(LAST_NAMES, s + 2);
    const fullName = `${fn} ${mn} ${ln}`;
    const phone = randomPhone(s);
    const status = pickFrom(statuses, s + 3);
    const source = pickFrom(sources, s + 4);
    // Chỉ gán cho TVV/GDKD (không admin/readonly/CĐT PM)
    const assignableSales = SEED_SALES.filter(x => ['tvv', 'gdkd', 'gd_san'].includes(x.roleId));
    const salesId = assignableSales[Math.floor(seedRandom(s + 5) * assignableSales.length)].id;
    const project = projects[Math.floor(seedRandom(s + 6) * projects.length)] || null;
    const rating = Math.min(5, Math.max(1, Math.round(seedRandom(s + 7) * 5)));
    const budget = Math.round(2000 + seedRandom(s + 8) * 18000); // tỷ VND

    const activities = [];
    const numActs = Math.floor(seedRandom(s + 9) * 4) + 1;
    for (let k = 0; k < numActs; k++) {
      const types = Object.keys(ACTIVITY_TYPES).filter(t => t !== 'stage');
      activities.push({
        id: 'A' + (s + k * 13),
        type: pickFrom(types, s + k + 100),
        at: daysAgo(numActs - k + Math.floor(seedRandom(s + k) * 5)),
        by: salesId,
        content: pickFrom([
          'KH quan tâm dự án, hỏi giá và tiến độ.',
          'Đã gửi brochure qua Zalo. KH hẹn xem thực địa.',
          'KH chốt sẽ qua showroom cuối tuần.',
          'Đã gọi tư vấn 15 phút. KH muốn so sánh với dự án khác.',
          'Gửi PDF mặt bằng + bảng giá. Chờ phản hồi.',
          'KH yêu cầu báo giá chi tiết kèm chính sách ưu đãi.'
        ], s + k + 200)
      });
    }

    // ~30% là KH doanh nghiệp
    const isBusiness = seedRandom(s + 50) > 0.7;
    const customerType = isBusiness ? 'business' : 'individual';
    const business = isBusiness ? generateBusiness(s + 60) : null;
    // Tên hiển thị: DN dùng tên công ty + người đại diện ở field riêng
    const displayName = isBusiness ? business.companyName : fullName;
    // KH DN ngân sách cao hơn (gấp 2-5 lần) vì mua nhiều căn/làm văn phòng
    const finalBudget = isBusiness ? budget * (2 + Math.floor(seedRandom(s + 70) * 3)) : budget;

    const leadObj = {
      id: 'L' + (1000 + i),
      code: 'L' + String(i + 1).padStart(5, '0'),
      name: displayName,
      contactName: isBusiness ? fullName : null,    // người đại diện (chỉ cho DN)
      customerType: customerType,
      business: business,
      phone: phone,
      email: `${ln.toLowerCase()}.${fn.toLowerCase()}${i}@gmail.com`.replace(/[đĐ]/g, 'd'),
      source: source,
      status: status,
      assignedTo: salesId,
      rating: rating,
      interest: {
        projectId: project ? project.id : null,
        projectName: project ? project.name : '',
        budget: finalBudget,
        bedrooms: 1 + Math.floor(seedRandom(s + 10) * 3) + 1,
        unitCount: isBusiness ? (2 + Math.floor(seedRandom(s + 71) * 8)) : 1  // DN có thể mua nhiều căn
      },
      extended: generateCustomerExtended({ name: fullName }, s + 200),
      activities: activities,
      createdAt: daysAgo(Math.floor(seedRandom(s + 11) * 30)),
      updatedAt: activities.length > 0 ? activities[activities.length - 1].at : daysAgo(0)
    };
    leads.push(leadObj);
  }
  return leads;
}

/* ----------- SEED: thông tin doanh nghiệp ----------- */
function generateBusiness(seed) {
  const companyPrefixes = ['Công ty TNHH', 'Công ty CP', 'Tập đoàn', 'Công ty TNHH MTV'];
  const companyCores = ['Phú Mỹ', 'Đại Phát', 'Tân Hoàng Long', 'Minh Khôi', 'An Phú', 'Hoàng Gia', 'Thiên Phú', 'Vạn Phát', 'Bình An', 'Nam Long', 'Sài Gòn Land', 'Việt Nam Holdings', 'Trung Nguyên', 'Đông Dương'];
  const companySuffixes = ['', 'Group', 'Holdings', 'Việt Nam', 'Trading', 'Invest'];
  const purposes = ['Mua văn phòng', 'Đầu tư cho thuê', 'Mua sỉ làm nhà ở cho nhân viên', 'Mua làm tài sản công ty', 'Mua để xây dựng dự án phụ', 'Đầu tư dài hạn'];

  const prefix = pickFrom(companyPrefixes, seed);
  const core = pickFrom(companyCores, seed + 1);
  const suffix = pickFrom(companySuffixes, seed + 2);
  const companyName = `${prefix} ${core}${suffix ? ' ' + suffix : ''}`;

  const ind = BUSINESS_INDUSTRIES[Math.floor(seedRandom(seed + 3) * BUSINESS_INDUSTRIES.length)];
  const size = BUSINESS_SIZES[Math.floor(seedRandom(seed + 4) * BUSINESS_SIZES.length)];
  // Mã số thuế 10 hoặc 13 số
  const taxCode = '0' + Math.floor(seedRandom(seed + 5) * 900000000 + 100000000) +
                  (seedRandom(seed + 6) > 0.5 ? '-' + String(Math.floor(seedRandom(seed + 7) * 999)).padStart(3, '0') : '');
  // Vốn điều lệ (tỷ): siêu nhỏ 1-5, nhỏ 5-30, vừa 30-200, lớn 200-1000
  const capRange = { micro: [1, 5], small: [5, 30], medium: [30, 200], large: [200, 1000] }[size.key];
  const capital = Math.round(capRange[0] + seedRandom(seed + 8) * (capRange[1] - capRange[0])) * 1000; // triệu VND
  const year = 2000 + Math.floor(seedRandom(seed + 9) * 25);

  return {
    companyName,
    taxCode,
    industry: ind.key,
    industryLabel: ind.label,
    size: size.key,
    sizeLabel: size.label,
    employees: size.employees,
    capital,           // triệu VND
    foundedYear: year,
    headquarters: pickFrom(['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai', 'Cần Thơ'], seed + 10) + ', Việt Nam',
    purpose: pickFrom(purposes, seed + 11),
    website: 'www.' + core.toLowerCase().replace(/\s+/g, '') + '.vn',
    creditLimit: Math.round(capital * 0.1) // hạn mức công nợ ~10% vốn
  };
}

/* ----------- SEED: DEALS ----------- */
function generateSeedDeals(leads) {
  if (typeof PROJECTS === 'undefined') return [];
  const allUnits = [];
  PROJECTS.forEach(p => {
    if (p.type === 'apartment') {
      p.floors.forEach(f => f.units.forEach(u => allUnits.push({ ...u, projectId: p.id, projectName: p.name, type: 'apartment' })));
    } else {
      p.villas.forEach(v => allUnits.push({ ...v, projectId: p.id, projectName: p.name, type: 'villa' }));
    }
  });

  const deals = [];
  const activeLeads = leads.filter(l =>
    ['interested', 'viewing', 'negotiating', 'closed-won'].includes(l.status)
  );

  const stages = DEAL_STAGES.map(s => s.key).filter(s => s !== 'cancelled');

  activeLeads.slice(0, 22).forEach((lead, i) => {
    const seed = i * 11 + 7;
    const unit = allUnits[Math.floor(seedRandom(seed) * allUnits.length)];
    if (!unit) return;
    const stage = pickFrom(stages, seed + 1);
    const commission = unit.price * 0.025; // 2.5% hoa hồng

    deals.push({
      id: 'D' + (1000 + i),
      code: 'D' + String(i + 1).padStart(5, '0'),
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      projectId: unit.projectId,
      projectName: unit.projectName,
      unitId: unit.id,
      unitCode: unit.code,
      unitType: unit.type,
      amount: unit.price,
      commission: Math.round(commission),
      stage: stage,
      salesId: lead.assignedTo,
      expectedCloseDate: daysAgo(-Math.floor(seedRandom(seed + 2) * 60 + 15)),
      createdAt: daysAgo(Math.floor(seedRandom(seed + 3) * 20)),
      updatedAt: daysAgo(Math.floor(seedRandom(seed + 4) * 5))
    });
  });

  return deals;
}

/* ----------- API: get all units from Digital Showroom ----------- */
function getAllUnits() {
  if (typeof PROJECTS === 'undefined') return [];
  const units = [];
  PROJECTS.forEach(p => {
    if (p.type === 'apartment') {
      p.floors.forEach(f => f.units.forEach(u => {
        units.push({
          ...u,
          projectId: p.id,
          projectName: p.name,
          type: 'apartment',
          handover: p.handover
        });
      }));
    } else {
      p.villas.forEach(v => {
        units.push({
          ...v,
          projectId: p.id,
          projectName: p.name,
          type: 'villa',
          handover: p.handover
        });
      });
    }
  });
  return units;
}

/* ----------- UTILITIES ----------- */
function formatVND(triệu) {
  if (triệu >= 1000) return (triệu / 1000).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
  return triệu + ' triệu';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return mins + ' phút trước';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' giờ trước';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + ' ngày trước';
  return formatDate(iso);
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ============================================================
 * EXTENDED: Tasks, Notifications, Sales Targets, Badges
 * ============================================================ */

const TASK_TYPES = {
  call:    { icon: '📞', label: 'Gọi điện',     color: '#3b82f6' },
  meeting: { icon: '🤝', label: 'Gặp mặt',      color: '#9333ea' },
  viewing: { icon: '🏠', label: 'Dẫn xem nhà',  color: '#16a34a' },
  followup:{ icon: '🔔', label: 'Follow up',    color: '#f59e0b' },
  contract:{ icon: '✍️', label: 'Ký hợp đồng', color: '#dc2626' },
  payment: { icon: '💳', label: 'Thu cọc/HĐ',  color: '#ec4899' },
  other:   { icon: '📌', label: 'Khác',         color: '#6b7280' }
};

const TASK_PRIORITY = {
  low:    { label: 'Thấp',  color: '#9ca3af' },
  medium: { label: 'Vừa',   color: '#3b82f6' },
  high:   { label: 'Cao',   color: '#f59e0b' },
  urgent: { label: 'Khẩn',  color: '#dc2626' }
};

const NOTIF_TYPES = {
  lead_new:        { icon: '👤', label: 'Lead mới',        color: '#3b82f6' },
  deal_stage:      { icon: '🎯', label: 'Deal đổi stage',  color: '#16a34a' },
  deal_won:        { icon: '🏆', label: 'Chốt deal',       color: '#16a34a' },
  task_due:        { icon: '⏰', label: 'Task đến hạn',    color: '#f59e0b' },
  task_overdue:    { icon: '🚨', label: 'Task quá hạn',    color: '#dc2626' },
  mention:         { icon: '💬', label: '@Nhắc tên',       color: '#9333ea' },
  inventory:       { icon: '🏘️', label: 'Quỹ căn',         color: '#0891b2' },
  target:          { icon: '🎖️', label: 'Target',         color: '#ca8a04' }
};

const BADGES = {
  none:    { name: 'Newbie',   icon: '🌱', color: '#9ca3af', min: 0 },
  bronze:  { name: 'Đồng',     icon: '🥉', color: '#92400e', min: 1 },
  silver:  { name: 'Bạc',      icon: '🥈', color: '#6b7280', min: 3 },
  gold:    { name: 'Vàng',     icon: '🥇', color: '#ca8a04', min: 5 },
  platinum:{ name: 'Bạch kim', icon: '💎', color: '#0891b2', min: 8 },
  diamond: { name: 'Kim cương',icon: '💠', color: '#7c3aed', min: 12 }
};

function badgeFor(wonCount) {
  let result = BADGES.none;
  Object.values(BADGES).forEach(b => { if (wonCount >= b.min) result = b; });
  return result;
}

/* ----------- SEED TASKS ----------- */
function generateSeedTasks(leads) {
  const tasks = [];
  const types = Object.keys(TASK_TYPES);
  const priorities = Object.keys(TASK_PRIORITY);
  const now = Date.now();
  const dayMs = 86400000;

  leads.slice(0, 28).forEach((lead, i) => {
    const seed = i * 13 + 17;
    const offsetDays = Math.floor(seedRandom(seed) * 14) - 4; // -4..+10
    const due = new Date(now + offsetDays * dayMs);
    due.setHours(8 + Math.floor(seedRandom(seed + 1) * 10), Math.floor(seedRandom(seed + 2) * 60), 0);
    const type = pickFrom(types, seed + 3);
    const priority = pickFrom(priorities, seed + 4);

    tasks.push({
      id: 'T' + (1000 + i),
      title: ({
        call: 'Gọi tư vấn ' + lead.name,
        meeting: 'Hẹn gặp ' + lead.name + ' tại showroom',
        viewing: 'Dẫn ' + lead.name + ' xem ' + (lead.interest.projectName || 'dự án'),
        followup: 'Follow up ' + lead.name,
        contract: 'Chuẩn bị HĐ ' + lead.name,
        payment: 'Thu cọc ' + lead.name,
        other: 'Cập nhật thông tin ' + lead.name
      })[type],
      type: type,
      priority: priority,
      leadId: lead.id,
      dealId: null,
      assignedTo: lead.assignedTo,
      dueAt: due.toISOString(),
      done: offsetDays < -2,
      note: '',
      createdAt: daysAgo(Math.floor(seedRandom(seed + 5) * 10)),
      updatedAt: daysAgo(0)
    });
  });
  return tasks;
}

/* ----------- SEED NOTIFICATIONS ----------- */
function generateSeedNotifications() {
  const items = [
    { type: 'task_overdue', title: '2 task của bạn đã quá hạn',  body: 'Gọi KH Đỗ Văn Phúc + Hẹn gặp Trần Quốc Bảo', age: 0.3 },
    { type: 'deal_stage',   title: 'Deal D00012 chuyển sang "Đặt cọc"', body: 'Khách Lê Thị Cẩm Tú đã đặt cọc căn G.12.7', age: 1 },
    { type: 'lead_new',     title: 'Lead mới từ Facebook',        body: 'Nguyễn Văn An quan tâm FUTA Sky Garden, ngân sách 5 tỷ', age: 2 },
    { type: 'mention',      title: 'Phạm Hồng Duy @nhắc bạn',    body: 'Trong ghi chú deal D00008: "Nhờ check lại chính sách CK cho KH này"', age: 3 },
    { type: 'target',       title: 'Bạn đã đạt 80% target tháng 6', body: 'Cần thêm 1 deal nữa để hoàn thành. Cố lên!', age: 4 },
    { type: 'deal_won',     title: '🎉 Chúc mừng! Bạn vừa chốt deal D00005', body: 'Doanh số: 4.2 tỷ · Hoa hồng: 105 triệu', age: 5 },
    { type: 'inventory',    title: '5 căn mới mở bán', body: 'FUTA Sky Garden phân khu B tầng 18-20 vừa mở bán', age: 6 },
    { type: 'task_due',     title: 'Task hôm nay: Dẫn xem nhà 14h', body: 'Khách Hoàng Minh Phong - căn G.4.7', age: 0.1 }
  ];

  return items.map((n, i) => ({
    id: 'N' + (1000 + i),
    type: n.type,
    title: n.title,
    body: n.body,
    leadId: null,
    dealId: null,
    read: i > 2, // 3 đầu chưa đọc
    createdAt: new Date(Date.now() - n.age * 86400000).toISOString()
  }));
}

/* ----------- SEED SALES TARGETS ----------- */
function generateSeedTargets() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  // Chỉ sinh target cho role làm sale (tvv/gdkd/gd_san), bỏ admin/readonly/cdt_pm
  const targetable = SEED_SALES.filter(s => ['tvv', 'gdkd', 'gd_san'].includes(s.roleId));
  // Mỗi role có mức target khác nhau
  const baseByRole = {
    gd_san: { rev: 25000, deal: 8,  lead: 30 },
    gdkd:   { rev: 15000, deal: 5,  lead: 22 },
    tvv:    { rev: 8000,  deal: 3,  lead: 15 }
  };
  return targetable.map((s, i) => {
    const base = baseByRole[s.roleId] || baseByRole.tvv;
    const variance = 0.85 + (Math.sin(i * 9) + 1) * 0.15; // 0.85..1.15
    return {
      id: 'TG' + (1000 + i),
      salesId: s.id,
      period: 'month',
      month: month,
      year: year,
      revenueTarget: Math.round(base.rev * variance),
      dealTarget: Math.round(base.deal * variance),
      leadTarget: Math.round(base.lead * variance)
    };
  });
}

/* ----------- SEED CUSTOMER EXTENDED (Customer 360) ----------- */
function generateCustomerExtended(lead, seed) {
  const occupations = ['Doanh nhân', 'Bác sĩ', 'Kỹ sư phần mềm', 'Giảng viên', 'Giám đốc kinh doanh', 'Luật sư', 'Kế toán trưởng', 'Nhân viên IT', 'Quản lý sản xuất'];
  const incomes = [50, 80, 120, 150, 200, 250, 300, 500];
  const banks = ['Vietcombank', 'BIDV', 'Techcombank', 'VPBank', 'ACB', 'MB Bank'];
  const family = [
    { spouse: 'Đã có gia đình', children: 1 },
    { spouse: 'Đã có gia đình', children: 2 },
    { spouse: 'Độc thân', children: 0 },
    { spouse: 'Đã có gia đình', children: 3 }
  ];

  const fam = pickFrom(family, seed + 1);
  return {
    occupation: pickFrom(occupations, seed),
    company: 'Công ty ' + pickFrom(['ABC', 'XYZ', 'Phú Mỹ', 'Đại Phát', 'Tân Hoàng', 'Minh Khôi'], seed + 5),
    monthlyIncome: pickFrom(incomes, seed + 2),
    address: pickFrom(['Q1', 'Q3', 'Q7', 'Q.Bình Thạnh', 'Q.Phú Nhuận', 'TP.Thủ Đức'], seed + 3) + ', TP. HCM',
    cccd: '0' + Math.floor(seedRandom(seed + 7) * 900000000 + 100000000),
    spouse: fam.spouse,
    children: fam.children,
    purchaseHistory: seedRandom(seed + 8) > 0.7 ? 1 : 0, // 30% đã từng mua BĐS
    needFinancing: seedRandom(seed + 9) > 0.5,
    preferredBank: pickFrom(banks, seed + 4),
    purpose: pickFrom(['Để ở', 'Đầu tư cho thuê', 'Đầu tư lướt sóng', 'Mua cho con cái'], seed + 6),
    preferredDirection: pickFrom(['Đông Nam', 'Đông', 'Đông Bắc', 'Nam', 'Tây Nam'], seed + 10),
    referrer: seedRandom(seed + 11) > 0.7 ? 'Anh Tuấn (KH cũ)' : '',
    internalNotes: ''
  };
}
