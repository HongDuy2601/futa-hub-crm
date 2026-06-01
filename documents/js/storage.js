/* ============================================================
 * storage.js — LocalStorage layer (offline 100%)
 *
 *   Storage.userTemplates.list()  → array
 *   Storage.userTemplates.save(t) → saved object (id generated if mới)
 *   Storage.userTemplates.remove(id)
 *   Storage.userTemplates.get(id)
 *
 *   Storage.drafts.list()
 *   Storage.drafts.save(draft)
 *   Storage.drafts.remove(id)
 *   Storage.drafts.get(id)
 * ============================================================ */
(function () {
  const KEY_TPL    = 'futa_doc_user_templates_v1';
  const KEY_DRAFT  = 'futa_doc_drafts_v1';

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { console.warn('Storage read fail', key, e); return []; }
  }
  function write(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }
  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  }

  const userTemplates = {
    list()       { return read(KEY_TPL); },
    get(id)      { return read(KEY_TPL).find(t => t.id === id) || null; },
    save(tpl) {
      const all = read(KEY_TPL);
      if (!tpl.id) tpl.id = uid('user');
      tpl.updatedAt = new Date().toISOString();
      const idx = all.findIndex(t => t.id === tpl.id);
      if (idx >= 0) all[idx] = tpl; else all.unshift(tpl);
      write(KEY_TPL, all);
      return tpl;
    },
    remove(id) {
      write(KEY_TPL, read(KEY_TPL).filter(t => t.id !== id));
    },
    /** Lấy mọi template user-added thuộc 1 phòng ban */
    byDept(deptId) { return read(KEY_TPL).filter(t => t.deptId === deptId); }
  };

  const drafts = {
    list()  { return read(KEY_DRAFT); },
    get(id) { return read(KEY_DRAFT).find(d => d.id === id) || null; },
    save(draft) {
      const all = read(KEY_DRAFT);
      if (!draft.id) draft.id = uid('draft');
      draft.updatedAt = new Date().toISOString();
      if (!draft.createdAt) draft.createdAt = draft.updatedAt;
      const idx = all.findIndex(d => d.id === draft.id);
      if (idx >= 0) all[idx] = draft; else all.unshift(draft);
      write(KEY_DRAFT, all);
      return draft;
    },
    remove(id) {
      write(KEY_DRAFT, read(KEY_DRAFT).filter(d => d.id !== id));
    }
  };

  window.Storage = { userTemplates, drafts };
})();
