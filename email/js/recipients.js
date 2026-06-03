/* ============================================================
 * RECIPIENTS — quản lý danh sách người nhận
 * Hỗ trợ: import CSV/Excel (SheetJS), nhập tay, đồng bộ Supabase CRM
 * ============================================================ */
const Recipients = (() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const RESERVED_FIELDS = new Set(['email', 'ten', 'name', 'du_an', 'project', 'sdt', 'phone', '_id', '_selected']);

  let list = []; // { id, email, ten, du_an, sdt, custom: {...}, _selected }

  const init = () => {
    list = Storage.getRecipients();
    list.forEach(r => { if (r._selected === undefined) r._selected = true; });
  };

  const persist = () => Storage.setRecipients(list);

  const all = () => list;
  const selected = () => list.filter(r => r._selected && isValidEmail(r.email));

  const isValidEmail = (e) => typeof e === 'string' && EMAIL_RE.test(e.trim());

  const normalize = (raw) => {
    const r = { custom: {} };
    for (const [k, v] of Object.entries(raw)) {
      const key = String(k).trim().toLowerCase().replace(/\s+/g, '_');
      const val = v == null ? '' : String(v).trim();
      if (!val) continue;
      if (key === 'email' || key === 'e-mail' || key === 'mail') r.email = val.toLowerCase();
      else if (key === 'ten' || key === 'name' || key === 'họ_tên' || key === 'ho_ten' || key === 'fullname') r.ten = val;
      else if (key === 'du_an' || key === 'project' || key === 'dự_án') r.du_an = val;
      else if (key === 'sdt' || key === 'phone' || key === 'số_điện_thoại' || key === 'so_dien_thoai' || key === 'mobile') r.sdt = val;
      else r.custom[key] = val;
    }
    r.id = 'r_' + Math.random().toString(36).slice(2, 10);
    r._selected = true;
    r.email = r.email || '';
    r.ten = r.ten || '';
    r.du_an = r.du_an || '';
    r.sdt = r.sdt || '';
    return r;
  };

  const add = (raw) => {
    const r = normalize(raw);
    if (!r.email) return { ok: false, reason: 'Email trống' };
    const exists = list.find(x => x.email.toLowerCase() === r.email.toLowerCase());
    if (exists) {
      Object.assign(exists, { ...r, id: exists.id, _selected: exists._selected });
      persist();
      return { ok: true, updated: true };
    }
    list.push(r);
    persist();
    return { ok: true };
  };

  const remove = (id) => {
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) { list.splice(idx, 1); persist(); }
  };

  const toggleSelect = (id, val) => {
    const r = list.find(x => x.id === id);
    if (r) { r._selected = !!val; persist(); }
  };

  const selectAll = (val) => {
    list.forEach(r => r._selected = !!val);
    persist();
  };

  const clear = () => { list = []; persist(); };

  /* ============= Variable map cho template ============= */
  const getVariableKeys = () => {
    const keys = new Set(['email', 'ten', 'du_an', 'sdt']);
    list.forEach(r => Object.keys(r.custom || {}).forEach(k => keys.add(k)));
    return Array.from(keys);
  };

  const variableMapFor = (r) => {
    const map = {
      email: r.email || '',
      ten: r.ten || '',
      name: r.ten || '',
      du_an: r.du_an || '',
      project: r.du_an || '',
      sdt: r.sdt || '',
      phone: r.sdt || '',
    };
    Object.assign(map, r.custom || {});
    return map;
  };

  /* ============= Import CSV/Excel via SheetJS ============= */
  const importFile = async (file) => {
    if (!file) return { added: 0, updated: 0, skipped: 0 };
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    let added = 0, updated = 0, skipped = 0;
    rows.forEach(row => {
      const res = add(row);
      if (!res.ok) skipped++;
      else if (res.updated) updated++;
      else added++;
    });
    return { added, updated, skipped };
  };

  /* ============= Supabase CRM sync ============= */
  const syncFromCrm = async () => {
    const cfg = Storage.getCrmConfig();
    if (!cfg.url || !cfg.key) throw new Error('Chưa cấu hình Supabase. Vào Cài đặt → CRM.');
    if (!window.supabase || !window.supabase.createClient) throw new Error('Supabase SDK chưa load.');
    const client = window.supabase.createClient(cfg.url, cfg.key);
    const { data, error } = await client.from(cfg.table || 'leads').select('*').limit(500);
    if (error) throw new Error(error.message);
    let added = 0, updated = 0;
    (data || []).forEach(row => {
      const norm = {
        email: row.email || row.mail || '',
        ten: row.name || row.full_name || row.ten || '',
        du_an: row.project || row.du_an || row.interested_project || '',
        sdt: row.phone || row.sdt || row.mobile || '',
      };
      Object.entries(row).forEach(([k, v]) => {
        if (!RESERVED_FIELDS.has(k) && v != null && String(v).trim()) norm[k] = v;
      });
      const res = add(norm);
      if (res.ok) { res.updated ? updated++ : added++; }
    });
    return { added, updated, total: (data || []).length };
  };

  /* ============= CSV sample for download ============= */
  const buildSampleCsv = () => {
    const rows = [
      ['email', 'ten', 'du_an', 'sdt', 'ngay_hen', 'gia_uu_dai'],
      ['khach1@example.com', 'Nguyễn Văn A', 'FUTA Riverside', '0901234567', '15/06/2026', '2.1 tỷ'],
      ['khach2@example.com', 'Trần Thị B', 'FUTA Plaza', '0907654321', '20/06/2026', '3.5 tỷ'],
    ];
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  return {
    init, all, selected, add, remove, toggleSelect, selectAll, clear,
    getVariableKeys, variableMapFor, importFile, syncFromCrm,
    isValidEmail, buildSampleCsv,
  };
})();
