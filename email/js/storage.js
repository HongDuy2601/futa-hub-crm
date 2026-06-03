/* ============================================================
 * STORAGE — wrapper localStorage cho Email Marketing app
 * ============================================================ */
const Storage = (() => {
  const KEYS = {
    recipients: 'futa_email_recipients',
    templates:  'futa_email_templates',
    history:    'futa_email_history',
    settings:   'futa_email_settings',
    crmConfig:  'futa_email_crm_config',
  };

  const get = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Storage.get failed:', key, e);
      return fallback;
    }
  };

  const set = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.error('Storage.set failed:', key, e); return false; }
  };

  return {
    KEYS,
    getRecipients: () => get(KEYS.recipients, []),
    setRecipients: (v) => set(KEYS.recipients, v),
    getTemplates:  () => get(KEYS.templates, []),
    setTemplates:  (v) => set(KEYS.templates, v),
    getHistory:    () => get(KEYS.history, []),
    setHistory:    (v) => set(KEYS.history, v),
    getSettings:   () => get(KEYS.settings, {
      scriptUrl: '',
      senderName: '',
      testEmail: '',
      throttleMs: 500,
    }),
    setSettings:   (v) => set(KEYS.settings, v),
    getCrmConfig:  () => get(KEYS.crmConfig, { url: '', key: '', table: 'leads' }),
    setCrmConfig:  (v) => set(KEYS.crmConfig, v),
  };
})();
