/* ============================================================
 * FUTA HUB CRM - SUPABASE SYNC ADAPTER
 * Offline-first. Dùng raw fetch tới PostgREST (không cần CDN/npm).
 * - Chưa cấu hình / offline → chạy 100% LocalStorage (như cũ)
 * - Đã cấu hình + online → push/pull qua REST, auto-sync khi đổi data
 *
 * Mô hình bảng (đơn giản, 1 bảng/collection, lưu JSONB):
 *   create table futa_sync (
 *     collection text, id text, data jsonb,
 *     updated_at timestamptz default now(),
 *     primary key (collection, id)
 *   );
 * ============================================================ */

const Sync = (function () {
  const COLLECTIONS = {
    leads:   Storage.KEYS.leads,
    deals:   Storage.KEYS.deals,
    tasks:   Storage.KEYS.tasks,
    targets: Storage.KEYS.targets,
    notifs:  Storage.KEYS.notifs,
    inv:     Storage.KEYS.inv
  };

  let syncing = false;
  let autoTimer = null;
  let pollTimer = null;
  let applying = false;   // đang ghi data từ cloud → tạm ngưng auto-push
  let lastSig = '';

  function cfg() {
    return (Storage.getSettings().sync) || {};
  }
  function isConfigured() {
    const c = cfg();
    return !!(c.url && c.anonKey);
  }
  function isOnline() {
    return navigator.onLine;
  }
  function status() {
    if (!isConfigured()) return { state: 'offline', label: 'Chưa kết nối (Local)', color: '#6b7280' };
    if (!isOnline()) return { state: 'disconnected', label: 'Mất mạng (Local)', color: '#f59e0b' };
    return { state: 'connected', label: 'Đã kết nối Supabase', color: '#16a34a' };
  }

  function headers() {
    const c = cfg();
    return {
      'apikey': c.anonKey,
      'Authorization': 'Bearer ' + c.anonKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };
  }
  function restUrl(path) {
    const c = cfg();
    return c.url.replace(/\/$/, '') + '/rest/v1/' + path;
  }

  async function testConnection() {
    if (!isConfigured()) throw new Error('Chưa nhập URL và anon key');
    const res = await fetch(restUrl('futa_sync?select=collection&limit=1'), { headers: headers() });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('HTTP ' + res.status + ' – ' + (txt.slice(0, 120) || 'Kiểm tra URL/key & đã tạo bảng futa_sync chưa'));
    }
    return true;
  }

  // Đẩy toàn bộ local lên cloud (upsert)
  async function pushAll() {
    if (!isConfigured() || !isOnline()) throw new Error('Không có kết nối');
    const rows = [];
    Object.entries(COLLECTIONS).forEach(([col, key]) => {
      const data = Storage.read(key, col === 'inv' ? {} : []);
      if (col === 'inv') {
        Object.entries(data).forEach(([id, val]) => rows.push({ collection: col, id, data: val }));
      } else {
        data.forEach(item => rows.push({ collection: col, id: item.id, data: item }));
      }
    });
    if (!rows.length) return 0;
    // chunk 200/lần
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const res = await fetch(restUrl('futa_sync'), {
        method: 'POST', headers: headers(), body: JSON.stringify(chunk)
      });
      if (!res.ok) throw new Error('Push lỗi HTTP ' + res.status);
    }
    markSynced();
    return rows.length;
  }

  // Kéo từ cloud về local (overwrite)
  async function pullAll() {
    if (!isConfigured() || !isOnline()) throw new Error('Không có kết nối');
    const res = await fetch(restUrl('futa_sync?select=collection,id,data'), { headers: headers() });
    if (!res.ok) throw new Error('Pull lỗi HTTP ' + res.status);
    const rows = await res.json();
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.collection]) grouped[r.collection] = [];
      grouped[r.collection].push(r);
    });
    applying = true;
    try {
      Object.entries(COLLECTIONS).forEach(([col, key]) => {
        const items = grouped[col] || [];
        if (col === 'inv') {
          const obj = {};
          items.forEach(r => obj[r.id] = r.data);
          Storage.write(key, obj);
        } else {
          Storage.write(key, items.map(r => r.data));
        }
      });
    } finally {
      applying = false;
    }
    markSynced();
    return rows.length;
  }

  // Chữ ký dữ liệu để biết cloud có thay đổi không (tránh re-render thừa)
  function dataSignature() {
    const l = Storage.getLeads(), d = Storage.getDeals(), t = Storage.getTasks();
    const maxU = arr => arr.reduce((m, x) => x.updatedAt > m ? x.updatedAt : m, '');
    return [l.length, d.length, t.length, maxU(l), maxU(d), maxU(t)].join('|');
  }

  function markSynced() {
    const s = Storage.getSettings();
    s.sync = s.sync || {};
    s.sync.lastSync = new Date().toISOString();
    Storage.saveSettings(s);
  }

  // Auto-sync: khi data đổi → debounce push
  function enableAutoSync() {
    Storage.subscribe(() => {
      const c = cfg();
      if (applying || !c.autoSync || !isConfigured() || !isOnline()) return;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        pushAll().then(n => console.log('[Sync] auto-pushed', n)).catch(e => console.warn('[Sync] auto-push fail', e.message));
      }, 2500);
    });
  }

  // Poll định kỳ để thấy thay đổi của người khác (data dùng chung)
  function startPolling(intervalMs) {
    stopPolling();
    if (!isConfigured()) return;
    lastSig = dataSignature();
    pollTimer = setInterval(() => {
      if (!isConfigured() || !isOnline()) return;
      // đừng phá khi đang mở modal (nhập liệu)
      const ov = document.getElementById('modalOverlay');
      if (ov && !ov.hidden) return;
      pullAll().then(() => {
        const sig = dataSignature();
        if (sig !== lastSig) {
          lastSig = sig;
          if (typeof App !== 'undefined') App.render();
        }
      }).catch(() => {});
    }, intervalMs || 20000);
  }
  function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

  // Seed dữ liệu demo lên cloud (chạy 1 lần để bootstrap data dùng chung)
  async function seedCloud() {
    Storage.initSeedIfNeeded();
    const n = await pushAll();
    return n;
  }

  // Nạp cấu hình mặc định nhúng sẵn (config.js) nếu tester chưa tự nhập
  function applyDefaultConfig() {
    try {
      const g = (typeof window !== 'undefined') && window.FUTA_CONFIG;
      if (!g || !g.supabaseUrl) return;
      const s = Storage.getSettings();
      s.sync = s.sync || {};
      if (!s.sync.url) {
        s.sync.url = g.supabaseUrl;
        s.sync.anonKey = g.supabaseKey || '';
        s.sync.autoSync = true;
        Storage.saveSettings(s);
      }
    } catch (e) { /* ignore */ }
  }

  async function manualSync() {
    if (syncing) return;
    syncing = true;
    try {
      // Chiến lược đơn giản: pull trước, push sau (last-write-wins phía local)
      await pullAll();
      await pushAll();
      toast('Đồng bộ Supabase thành công', 'success');
    } catch (e) {
      toast('Đồng bộ lỗi: ' + e.message, 'error');
    } finally {
      syncing = false;
      if (location.hash.includes('settings')) Settings.render();
    }
  }

  // SQL snippet để user copy chạy trong Supabase SQL editor
  function schemaSQL() {
    return `-- Chạy trong Supabase → SQL Editor
create table if not exists futa_sync (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  primary key (collection, id)
);

-- Cho phép truy cập bằng anon key (demo nội bộ).
-- Production nên bật RLS + policy theo user.
alter table futa_sync enable row level security;
create policy "allow all (demo)" on futa_sync
  for all using (true) with check (true);`;
  }

  return {
    isConfigured, isOnline, status,
    testConnection, pushAll, pullAll, manualSync,
    enableAutoSync, startPolling, stopPolling, seedCloud, applyDefaultConfig, schemaSQL
  };
})();
