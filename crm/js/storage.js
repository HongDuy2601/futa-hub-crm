/* ============================================================
 * FUTA HUB CRM - STORAGE LAYER
 * LocalStorage now; Supabase sync hook ready for Phase 2
 * ============================================================ */

const Storage = (function () {
  const KEYS = {
    leads:    'futa_crm_leads',
    deals:    'futa_crm_deals',
    sales:    'futa_crm_sales',
    inv:      'futa_crm_inventory_overrides',
    me:       'futa_crm_current_user',
    init:     'futa_crm_initialized',
    tasks:    'futa_crm_tasks',
    notifs:   'futa_crm_notifications',
    targets:  'futa_crm_targets',
    settings: 'futa_crm_settings',
    views:    'futa_crm_saved_views',
    orgs:     'futa_crm_organizations',
    teams:    'futa_crm_teams',
    assigns:  'futa_crm_project_assignments'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Storage read error', key, e);
      return fallback;
    }
  }
  function write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      onChange();
    } catch (e) {
      console.warn('Storage write error', key, e);
    }
  }

  /* ----------- Sync hook (Phase 2: Supabase) ----------- */
  const listeners = [];
  function onChange() {
    listeners.forEach(fn => { try { fn(); } catch (e) {} });
  }
  function subscribe(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }

  /* ----------- INIT seed ----------- */
  function initSeedIfNeeded() {
    if (read(KEYS.init, false)) return;
    const leads = generateSeedLeads(42);
    const deals = generateSeedDeals(leads);
    const tasks = generateSeedTasks(leads);
    const notifs = generateSeedNotifications();
    const targets = generateSeedTargets();
    write(KEYS.leads, leads);
    write(KEYS.deals, deals);
    write(KEYS.sales, SEED_SALES);
    write(KEYS.orgs, SEED_ORGS);
    write(KEYS.teams, SEED_TEAMS);
    write(KEYS.assigns, SEED_PROJECT_ASSIGNMENTS);
    write(KEYS.tasks, tasks);
    write(KEYS.notifs, notifs);
    write(KEYS.targets, targets);
    // Mặc định login bằng admin để demo
    write(KEYS.me, SEED_SALES.find(s => s.roleId === 'admin') || SEED_SALES[0]);
    const existingSettings = read(KEYS.settings, {});
    write(KEYS.settings, Object.assign({
      companyName: 'FUTA Land',
      address: '1 Đại lộ Đông Tây, Quận 2, TP.HCM',
      hotline: '1900 6067',
      commissionRate: 2.5,
      reservationDays: 7,
      smsTemplates: [
        { id: 'sms1', name: 'Cảm ơn quan tâm', content: 'Cảm ơn anh/chị đã quan tâm đến dự án {project}. Em là {sale_name} từ FUTA Land. Em xin gửi thông tin chi tiết qua Zalo {phone} ạ.' },
        { id: 'sms2', name: 'Mời xem thực địa', content: 'Anh/chị {customer}, em mời anh/chị tham gia chương trình tham quan dự án {project} vào {date} ạ. Có xe đưa đón.' },
        { id: 'sms3', name: 'Nhắc thanh toán', content: 'Anh/chị {customer}, em xin nhắc lịch thanh toán đợt {phase} cho căn {unit} là {date}. Mong anh/chị thu xếp ạ.' }
      ]
    }, existingSettings));
    write(KEYS.init, true);
  }

  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    initSeedIfNeeded();
  }

  /* ----------- LEADS ----------- */
  function getLeads() { return read(KEYS.leads, []); }
  function saveLead(lead) {
    const list = getLeads();
    const idx = list.findIndex(l => l.id === lead.id);
    lead.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = lead;
    else { lead.id = lead.id || uid('L'); lead.createdAt = new Date().toISOString(); list.unshift(lead); }
    write(KEYS.leads, list);
    return lead;
  }
  function deleteLead(id) {
    const list = getLeads().filter(l => l.id !== id);
    write(KEYS.leads, list);
  }
  function getLead(id) { return getLeads().find(l => l.id === id); }

  function addActivity(leadId, activity) {
    const lead = getLead(leadId);
    if (!lead) return null;
    lead.activities = lead.activities || [];
    activity.id = activity.id || uid('A');
    activity.at = activity.at || new Date().toISOString();
    lead.activities.push(activity);
    saveLead(lead);
    return activity;
  }

  /* ----------- DEALS ----------- */
  function getDeals() { return read(KEYS.deals, []); }
  function saveDeal(deal) {
    const list = getDeals();
    const idx = list.findIndex(d => d.id === deal.id);
    deal.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = deal;
    else { deal.id = deal.id || uid('D'); deal.createdAt = new Date().toISOString(); list.unshift(deal); }
    write(KEYS.deals, list);
    return deal;
  }
  function deleteDeal(id) {
    const list = getDeals().filter(d => d.id !== id);
    write(KEYS.deals, list);
  }
  function getDeal(id) { return getDeals().find(d => d.id === id); }

  /* ----------- SALES ----------- */
  function getSales() { return read(KEYS.sales, SEED_SALES); }
  function getSale(id) { return getSales().find(s => s.id === id); }
  function getCurrentUser() { return read(KEYS.me, SEED_SALES[0]); }
  function setCurrentUser(u) { write(KEYS.me, u); }

  /* ----------- INVENTORY OVERRIDES -----------
   * Quỹ căn gốc đến từ PROJECTS (Sa bàn số).
   * CRM lock/unlock căn → ghi override vào storage, không sửa file gốc.
   */
  function getInventoryOverrides() { return read(KEYS.inv, {}); }
  function lockUnit(unitId, dealId, salesId) {
    const o = getInventoryOverrides();
    o[unitId] = { status: 'reserved', dealId, salesId, lockedAt: new Date().toISOString() };
    write(KEYS.inv, o);
  }
  function sellUnit(unitId, dealId, salesId) {
    const o = getInventoryOverrides();
    o[unitId] = { status: 'sold', dealId, salesId, soldAt: new Date().toISOString() };
    write(KEYS.inv, o);
  }
  function releaseUnit(unitId) {
    const o = getInventoryOverrides();
    delete o[unitId];
    write(KEYS.inv, o);
  }

  function getUnitStatus(unitId, defaultStatus) {
    const o = getInventoryOverrides();
    return o[unitId] ? o[unitId].status : defaultStatus;
  }

  function getEnrichedUnits() {
    const units = getAllUnits();
    const o = getInventoryOverrides();
    return units.map(u => {
      if (o[u.id]) return { ...u, ...o[u.id] };
      return u;
    });
  }

  /* ----------- TASKS ----------- */
  function getTasks() { return read(KEYS.tasks, []); }
  function saveTask(task) {
    const list = getTasks();
    const idx = list.findIndex(t => t.id === task.id);
    task.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = task;
    else { task.id = task.id || uid('T'); task.createdAt = new Date().toISOString(); list.unshift(task); }
    write(KEYS.tasks, list);
    return task;
  }
  function deleteTask(id) {
    write(KEYS.tasks, getTasks().filter(t => t.id !== id));
  }
  function toggleTask(id) {
    const t = getTasks().find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    saveTask(t);
    return t;
  }
  function getMyTasks() {
    const me = getCurrentUser();
    return getTasks().filter(t => t.assignedTo === me.id);
  }

  /* ----------- NOTIFICATIONS ----------- */
  function getNotifications() { return read(KEYS.notifs, []); }
  function addNotification(notif) {
    const list = getNotifications();
    notif.id = notif.id || uid('N');
    notif.createdAt = notif.createdAt || new Date().toISOString();
    notif.read = false;
    list.unshift(notif);
    if (list.length > 100) list.length = 100; // keep last 100
    write(KEYS.notifs, list);
    return notif;
  }
  function markNotifRead(id) {
    const list = getNotifications();
    const n = list.find(x => x.id === id);
    if (n) { n.read = true; write(KEYS.notifs, list); }
  }
  function markAllNotifRead() {
    const list = getNotifications();
    list.forEach(n => n.read = true);
    write(KEYS.notifs, list);
  }
  function unreadCount() {
    return getNotifications().filter(n => !n.read).length;
  }

  /* ----------- TARGETS ----------- */
  function getTargets() { return read(KEYS.targets, []); }
  function getMyTarget() {
    const me = getCurrentUser();
    const now = new Date();
    return getTargets().find(t =>
      t.salesId === me.id && t.month === now.getMonth() + 1 && t.year === now.getFullYear()
    );
  }
  function saveTarget(target) {
    const list = getTargets();
    const idx = list.findIndex(t => t.id === target.id);
    if (idx >= 0) list[idx] = target;
    else { target.id = target.id || uid('TG'); list.unshift(target); }
    write(KEYS.targets, list);
  }

  /* ----------- SETTINGS ----------- */
  function getSettings() { return read(KEYS.settings, {}); }
  function saveSettings(s) { write(KEYS.settings, s); }

  /* ----------- SAVED VIEWS (bộ lọc lưu sẵn) ----------- */
  function getSavedViews() { return read(KEYS.views, []); }
  function saveView(view) {
    const list = getSavedViews();
    view.id = view.id || uid('V');
    list.push(view);
    write(KEYS.views, list);
    return view;
  }
  function deleteView(id) {
    write(KEYS.views, getSavedViews().filter(v => v.id !== id));
  }

  /* ----------- ORGS / TEAMS / PROJECT-ASSIGNMENTS ----------- */
  function getOrgs() { return read(KEYS.orgs, []); }
  function getOrg(id) { return getOrgs().find(o => o.id === id); }
  function saveOrg(o) {
    const list = getOrgs();
    const i = list.findIndex(x => x.id === o.id);
    if (i >= 0) list[i] = o; else { o.id = o.id || uid('ORG'); list.push(o); }
    write(KEYS.orgs, list);
    return o;
  }
  function deleteOrg(id) { write(KEYS.orgs, getOrgs().filter(o => o.id !== id)); }

  function getTeamsAll() { return read(KEYS.teams, []); }
  function getTeam(id) { return getTeamsAll().find(t => t.id === id); }
  function getTeamsByOrg(orgId) { return getTeamsAll().filter(t => t.orgId === orgId); }
  function saveTeam(t) {
    const list = getTeamsAll();
    const i = list.findIndex(x => x.id === t.id);
    if (i >= 0) list[i] = t; else { t.id = t.id || uid('TEAM'); list.push(t); }
    write(KEYS.teams, list);
    return t;
  }
  function deleteTeam(id) { write(KEYS.teams, getTeamsAll().filter(t => t.id !== id)); }

  function getProjectAssignments() { return read(KEYS.assigns, []); }
  function getProjectsForOrg(orgId) {
    return getProjectAssignments().filter(a => a.orgId === orgId).map(a => a.projectId);
  }
  function saveAssignment(orgId, projectId) {
    const list = getProjectAssignments();
    if (!list.find(a => a.orgId === orgId && a.projectId === projectId)) {
      list.push({ orgId, projectId });
      write(KEYS.assigns, list);
    }
  }
  function deleteAssignment(orgId, projectId) {
    write(KEYS.assigns, getProjectAssignments().filter(a => !(a.orgId === orgId && a.projectId === projectId)));
  }

  /* ----------- SALES CRUD (mở rộng) ----------- */
  function saveSale(s) {
    const list = read(KEYS.sales, []);
    const i = list.findIndex(x => x.id === s.id);
    if (i >= 0) list[i] = s; else { s.id = s.id || uid('S'); list.push(s); }
    write(KEYS.sales, list);
    return s;
  }
  function deleteSale(id) {
    write(KEYS.sales, read(KEYS.sales, []).filter(s => s.id !== id));
  }

  /* ----------- BULK helpers ----------- */
  function bulkUpdateLeads(ids, patch) {
    const list = getLeads();
    let n = 0;
    ids.forEach(id => {
      const l = list.find(x => x.id === id);
      if (l) { Object.assign(l, patch); l.updatedAt = new Date().toISOString(); n++; }
    });
    write(KEYS.leads, list);
    return n;
  }
  function bulkDeleteLeads(ids) {
    write(KEYS.leads, getLeads().filter(l => !ids.includes(l.id)));
  }

  return {
    KEYS,
    initSeedIfNeeded,
    resetAll,
    subscribe,
    getLeads, saveLead, deleteLead, getLead, addActivity,
    getDeals, saveDeal, deleteDeal, getDeal,
    getSales, getSale, getCurrentUser, setCurrentUser,
    getInventoryOverrides, lockUnit, sellUnit, releaseUnit, getUnitStatus, getEnrichedUnits,
    getTasks, saveTask, deleteTask, toggleTask, getMyTasks,
    getNotifications, addNotification, markNotifRead, markAllNotifRead, unreadCount,
    getTargets, getMyTarget, saveTarget,
    getSettings, saveSettings,
    getSavedViews, saveView, deleteView,
    bulkUpdateLeads, bulkDeleteLeads,
    getOrgs, getOrg, saveOrg, deleteOrg,
    getTeamsAll, getTeam, getTeamsByOrg, saveTeam, deleteTeam,
    getProjectAssignments, getProjectsForOrg, saveAssignment, deleteAssignment,
    saveSale, deleteSale,
    read, write
  };
})();
