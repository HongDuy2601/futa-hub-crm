/* ============================================================
 * FUTA HUB CRM - PERMISSIONS (Phân quyền soft)
 * 6 vai trò × 4 phạm vi (all, org, team, self) × phân quyền dự án
 *
 * Lưu ý: đây là PHÂN QUYỀN TẦNG UI cho test nội bộ. Bảo mật thật
 * cần Auth + Row Level Security trên Supabase (phase sau).
 * ============================================================ */

const Perm = (function () {

  /* ----------- Raw storage helpers — TRÁNH ĐỆ QUY ----------- *
   * Vì Storage.getX bị App wrap qua Perm.filterX, mọi nơi trong
   * Perm phải gọi raw để không tự đệ quy.
   * ------------------------------------------------------------ */
  function rawSales()  { return (Storage._raw && Storage._raw.getSales)  ? Storage._raw.getSales()  : Storage.getSales(); }
  function rawLeads()  { return (Storage._raw && Storage._raw.getLeads)  ? Storage._raw.getLeads()  : Storage.getLeads(); }
  function rawDeals()  { return (Storage._raw && Storage._raw.getDeals)  ? Storage._raw.getDeals()  : Storage.getDeals(); }

  /* ----------- Current user + role ----------- */
  function me() {
    return Storage.getCurrentUser();
  }

  function role() {
    const m = me();
    const r = ROLES.find(x => x.id === (m && m.roleId));
    return r || ROLES.find(x => x.id === 'tvv');
  }

  function isAdmin() { return role().id === 'admin'; }
  function isReadOnly() { return role().id === 'readonly'; }
  function isCDT() { return ['admin', 'cdt_pm'].includes(role().id); }

  /* ----------- Scope: ai được phép thấy data nào ----------- */
  // Trả về danh sách salesIds mà user hiện tại được phép thấy data của họ
  function visibleSalesIds() {
    const m = me();
    const r = role();
    const allSales = rawSales();   // ← RAW, không wrap

    if (r.scope === 'all' || r.scope === 'all_readonly') {
      return allSales.map(s => s.id); // admin + readonly thấy hết
    }
    if (r.scope === 'project') {
      // CĐT PM thấy mọi sale ở mọi org (vì là CĐT) — về sau filter theo dự án assign
      return allSales.map(s => s.id);
    }
    if (r.scope === 'org') {
      // GĐ sàn: thấy mọi sale trong org của mình
      return allSales.filter(s => s.orgId === m.orgId).map(s => s.id);
    }
    if (r.scope === 'team') {
      // GĐKD/Trưởng nhóm: thấy mọi sale trong team mình + chính mình
      const ids = allSales.filter(s => s.teamId === m.teamId).map(s => s.id);
      if (!ids.includes(m.id)) ids.push(m.id);
      return ids;
    }
    // 'self' — TVV chỉ thấy data mình
    return [m.id];
  }

  // Danh sách projectId user được xem
  function visibleProjectIds() {
    const m = me();
    const r = role();
    const all = (typeof PROJECTS !== 'undefined' ? PROJECTS : []).map(p => p.id);

    if (r.scope === 'all' || r.scope === 'all_readonly') return all;
    if (r.scope === 'project') {
      // CĐT PM: nếu có cấu hình assignedProjects trong user thì filter, không thì xem hết
      return (m.assignedProjects && m.assignedProjects.length) ? m.assignedProjects : all;
    }
    // Org/team/self: theo PROJECT_ASSIGNMENTS của org user thuộc về
    return Storage.getProjectsForOrg(m.orgId);
  }

  function visibleOrgIds() {
    const m = me();
    const r = role();
    const all = Storage.getOrgs().map(o => o.id);
    if (r.scope === 'all' || r.scope === 'all_readonly' || r.scope === 'project') return all;
    if (r.scope === 'org' || r.scope === 'team' || r.scope === 'self') return [m.orgId];
    return [];
  }

  /* ----------- FILTERS dùng trong list/dashboard ----------- */
  function filterLeads(leads) {
    const ids = new Set(visibleSalesIds());
    const projIds = new Set(visibleProjectIds());
    return leads.filter(l => {
      if (l.assignedTo && !ids.has(l.assignedTo)) return false;
      // Chỉ lọc theo dự án nếu lead có project cụ thể; lead chưa rõ dự án vẫn hiện
      if (l.interest && l.interest.projectId && !projIds.has(l.interest.projectId)) return false;
      return true;
    });
  }

  function filterDeals(deals) {
    const ids = new Set(visibleSalesIds());
    const projIds = new Set(visibleProjectIds());
    return deals.filter(d => {
      if (d.salesId && !ids.has(d.salesId)) return false;
      if (d.projectId && !projIds.has(d.projectId)) return false;
      return true;
    });
  }

  function filterTasks(tasks) {
    const ids = new Set(visibleSalesIds());
    return tasks.filter(t => !t.assignedTo || ids.has(t.assignedTo));
  }

  function filterSales(salesList) {
    const ids = new Set(visibleSalesIds());
    return salesList.filter(s => ids.has(s.id));
  }

  function filterUnits(units) {
    const projIds = new Set(visibleProjectIds());
    return units.filter(u => projIds.has(u.projectId));
  }

  function filterTargets(targets) {
    const ids = new Set(visibleSalesIds());
    return targets.filter(t => ids.has(t.salesId));
  }

  /* ----------- canView / canEdit ----------- */
  // Có thể xem trang này không?
  function canViewPage(pageId) {
    const r = role();
    // Readonly (lãnh đạo / kế toán xem) được xem hầu hết trang trừ Admin
    if (r.scope === 'all_readonly') {
      return !['admin', 'settings'].includes(pageId);
    }
    const minLevel = {
      dashboard: 10,
      leads: 30,
      pipeline: 30,
      tasks: 30,
      inventory: 30,
      targets: 30,
      reports: 50,        // GĐKD trở lên
      executive: 70,      // GĐ sàn trở lên
      admin: 100,         // chỉ Admin CĐT
      notifications: 10,
      settings: 70
    }[pageId];
    if (minLevel === undefined) return true;
    return r.level >= minLevel;
  }

  // Có thể sửa item này không? (ai tạo / được giao)
  function canEdit(item) {
    const r = role();
    if (r.scope === 'all_readonly') return false;
    if (r.scope === 'all' || r.scope === 'project' || r.scope === 'org') return true;
    if (r.scope === 'team') {
      const ids = new Set(visibleSalesIds());
      const key = item.salesId || item.assignedTo || item.assignedSalesId;
      return key ? ids.has(key) : true;
    }
    // self
    const myId = me().id;
    const key = item.salesId || item.assignedTo || item.assignedSalesId;
    return key ? key === myId : true;
  }

  /* ----------- Hiển thị label scope cho user switcher ----------- */
  function scopeLabel() {
    const r = role();
    const m = me();
    if (r.scope === 'all') return 'Toàn hệ thống';
    if (r.scope === 'all_readonly') return 'Xem toàn hệ thống';
    if (r.scope === 'project') {
      const list = visibleProjectIds().length;
      return `${list} dự án được giao`;
    }
    if (r.scope === 'org') {
      const o = Storage.getOrg(m.orgId);
      return 'Sàn ' + (o ? o.name : '?');
    }
    if (r.scope === 'team') {
      const t = Storage.getTeam(m.teamId);
      return 'Team ' + (t ? t.name : '?');
    }
    return 'Cá nhân';
  }

  function badge() {
    const r = role();
    return `<span class="role-badge" style="background:${r.color}22;color:${r.color}">${r.icon} ${r.name}</span>`;
  }

  return {
    me, role, isAdmin, isReadOnly, isCDT,
    visibleSalesIds, visibleProjectIds, visibleOrgIds,
    filterLeads, filterDeals, filterTasks, filterSales, filterUnits, filterTargets,
    canViewPage, canEdit,
    scopeLabel, badge
  };
})();
