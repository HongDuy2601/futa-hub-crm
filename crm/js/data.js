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

const ACTIVITY_TYPES = {
  call:    { icon: '📞', label: 'Gọi điện' },
  sms:     { icon: '💬', label: 'Nhắn tin' },
  email:   { icon: '📧', label: 'Email' },
  meeting: { icon: '🤝', label: 'Gặp mặt' },
  viewing: { icon: '🏠', label: 'Dẫn xem nhà' },
  note:    { icon: '📝', label: 'Ghi chú' },
  stage:   { icon: '🔄', label: 'Đổi trạng thái' }
};

/* ----------- SEED: SALES STAFF ----------- */
const SEED_SALES = [
  { id: 'S001', name: 'Phạm Hồng Duy',    code: 'PHD', team: 'KD-01', email: 'duy.phamhong@futaland.vn', phone: '0908 123 456' },
  { id: 'S002', name: 'Nguyễn Minh Anh',  code: 'NMA', team: 'KD-01', email: 'anh.nguyen@futaland.vn',    phone: '0909 234 567' },
  { id: 'S003', name: 'Trần Quốc Bảo',    code: 'TQB', team: 'KD-02', email: 'bao.tran@futaland.vn',     phone: '0907 345 678' },
  { id: 'S004', name: 'Lê Thị Cẩm Tú',    code: 'LCT', team: 'KD-02', email: 'tu.le@futaland.vn',        phone: '0906 456 789' },
  { id: 'S005', name: 'Võ Hoàng Sơn',     code: 'VHS', team: 'KD-03', email: 'son.vo@futaland.vn',       phone: '0905 567 890' }
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
    const salesId = SEED_SALES[Math.floor(seedRandom(s + 5) * SEED_SALES.length)].id;
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

    const leadObj = {
      id: 'L' + (1000 + i),
      code: 'L' + String(i + 1).padStart(5, '0'),
      name: fullName,
      phone: phone,
      email: `${ln.toLowerCase()}.${fn.toLowerCase()}${i}@gmail.com`.replace(/[đĐ]/g, 'd'),
      source: source,
      status: status,
      assignedTo: salesId,
      rating: rating,
      interest: {
        projectId: project ? project.id : null,
        projectName: project ? project.name : '',
        budget: budget,
        bedrooms: 1 + Math.floor(seedRandom(s + 10) * 3) + 1
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

  return SEED_SALES.map((s, i) => ({
    id: 'TG' + (1000 + i),
    salesId: s.id,
    period: 'month',
    month: month,
    year: year,
    revenueTarget: [15000, 12000, 10000, 18000, 8000][i], // triệu VND
    dealTarget: [5, 4, 3, 6, 2][i],
    leadTarget: [20, 18, 15, 25, 10][i]
  }));
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
