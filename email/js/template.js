/* ============================================================
 * TEMPLATE — render Mustache-style placeholders {{var}}
 * Quản lý mẫu email đã lưu
 * ============================================================ */
const TemplateEngine = (() => {

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /**
   * Render template string with variable map.
   * - {{key}}        → escaped value
   * - {{{key}}}      → raw value (HTML allowed)
   * - missing keys   → kept as-is with marker so user spots it
   */
  const render = (tpl, vars, { escape = true } = {}) => {
    if (!tpl) return '';
    return String(tpl).replace(/\{\{\{?\s*([\w.-]+)\s*\}?\}\}/g, (match, key) => {
      const isRaw = match.startsWith('{{{');
      const v = vars[key];
      if (v == null || v === '') return `<span class="ph-missing">[${key}?]</span>`;
      return (escape && !isRaw) ? escapeHtml(v) : String(v);
    });
  };

  /** Plain-text render (for subject + email body sent to server) */
  const renderRaw = (tpl, vars) => {
    if (!tpl) return '';
    return String(tpl).replace(/\{\{\{?\s*([\w.-]+)\s*\}?\}\}/g, (match, key) => {
      const v = vars[key];
      return v == null || v === '' ? '' : String(v);
    });
  };

  /** Extract list of placeholder keys used in template (subject + body) */
  const extractKeys = (...templates) => {
    const set = new Set();
    templates.filter(Boolean).forEach(t => {
      const re = /\{\{\{?\s*([\w.-]+)\s*\}?\}\}/g;
      let m;
      while ((m = re.exec(t))) set.add(m[1]);
    });
    return Array.from(set);
  };

  /** ============= Saved templates CRUD ============= */
  const list = () => Storage.getTemplates();

  const save = (tpl) => {
    const all = list();
    if (tpl.id) {
      const idx = all.findIndex(t => t.id === tpl.id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...tpl, updatedAt: new Date().toISOString() }; }
      else all.push({ ...tpl, updatedAt: new Date().toISOString() });
    } else {
      tpl.id = 't_' + Math.random().toString(36).slice(2, 10);
      tpl.createdAt = new Date().toISOString();
      tpl.updatedAt = tpl.createdAt;
      all.push(tpl);
    }
    Storage.setTemplates(all);
    return tpl;
  };

  const get = (id) => list().find(t => t.id === id);

  const remove = (id) => Storage.setTemplates(list().filter(t => t.id !== id));

  return { render, renderRaw, extractKeys, list, save, get, remove };
})();
