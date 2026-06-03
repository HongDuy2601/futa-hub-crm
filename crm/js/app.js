/* ============================================================
 * FUTA HUB CRM - MAIN APP (Router + Bootstrap)
 * ============================================================ */

const App = (function () {
  const routes = {
    'dashboard':     () => Dashboard.render(),
    'leads':         () => Leads.renderList(),
    'lead':          (id) => Leads.renderDetail(id),
    'pipeline':      () => Deals.renderKanban(),
    'deal':          (id) => Deals.renderDetail(id),
    'inventory':     () => Inventory.render(),
    'tasks':         () => Tasks.render(),
    'targets':       () => Targets.render(),
    'reports':       () => Reports.render(),
    'executive':     () => Executive.render(),
    'notifications': () => Notifications.render(),
    'settings':      () => Settings.render()
  };

  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, '');
    if (!hash) return { route: 'dashboard', params: [] };
    const [route, ...params] = hash.split('/');
    return { route, params };
  }

  function navigate(path) {
    location.hash = path.startsWith('/') ? '#' + path : '#/' + path;
  }

  function setActiveNav(route) {
    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  function render() {
    const { route, params } = parseHash();
    const handler = routes[route] || routes.dashboard;
    setActiveNav(route);
    try {
      handler(...params);
    } catch (e) {
      console.error('Render error', e);
      document.getElementById('pageContent').innerHTML =
        `<div class="empty"><div class="empty-icon">⚠️</div><h3>Lỗi tải trang</h3><p>${e.message}</p></div>`;
    }
    updateBadges();
    closeSidebarOnMobile();
  }

  function updateBadges() {
    const leads = Storage.getLeads().filter(l => !['closed-won', 'closed-lost'].includes(l.status));
    const deals = Storage.getDeals().filter(d => !['completed', 'cancelled'].includes(d.stage));
    const me = Storage.getCurrentUser();
    const myOpenTasks = Storage.getTasks().filter(t => !t.done && t.assignedTo === me.id);
    const b1 = document.getElementById('badgeLeads');
    const b2 = document.getElementById('badgeDeals');
    const b3 = document.getElementById('badgeTasks');
    if (b1) b1.textContent = leads.length;
    if (b2) b2.textContent = deals.length;
    if (b3) b3.textContent = myOpenTasks.length;
    if (typeof Notifications !== 'undefined') Notifications.renderBadge();
  }

  function renderUser() {
    const u = Storage.getCurrentUser();
    document.getElementById('userAvatar').textContent = initials(u.name);
    document.getElementById('userName').textContent = u.name;
    document.getElementById('userRole').textContent = u.team + ' · ' + u.code;
  }

  /* ----------- USER SWITCHER (demo) ----------- */
  function switchUser() {
    const sales = Storage.getSales();
    const me = Storage.getCurrentUser();
    const idx = sales.findIndex(s => s.id === me.id);
    const next = sales[(idx + 1) % sales.length];
    Storage.setCurrentUser(next);
    renderUser();
    toast('Đã chuyển sang ' + next.name, 'success');
  }

  /* ----------- TOAST ----------- */
  function toast(msg, kind = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind === 'error' ? 'error' : kind === 'warning' ? 'warning' : '');
    el.innerHTML = `<span>${kind === 'error' ? '⚠️' : kind === 'warning' ? '⚡' : '✓'}</span><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
  window.toast = toast;

  /* ----------- MODAL ----------- */
  const Modal = {
    show({ title, body, footer = '', size = 'md' }) {
      const overlay = document.getElementById('modalOverlay');
      const m = document.getElementById('modal');
      m.classList.toggle('modal-lg', size === 'lg');
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').innerHTML = body;
      document.getElementById('modalFooter').innerHTML = footer;
      overlay.hidden = false;
    },
    hide() { document.getElementById('modalOverlay').hidden = true; }
  };
  window.Modal = Modal;

  /* ----------- MOBILE SIDEBAR ----------- */
  function closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }

  /* ----------- GLOBAL SEARCH ----------- */
  function setupSearch() {
    const input = document.getElementById('globalSearch');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim().toLowerCase();
        if (!q) return;
        const leads = Storage.getLeads();
        const found = leads.find(l =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.code.toLowerCase().includes(q)
        );
        if (found) navigate('lead/' + found.id);
        else toast('Không tìm thấy "' + q + '"', 'warning');
      }
    });
  }

  /* ----------- PWA ----------- */
  let deferredPrompt = null;
  function setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW register fail', err));
    }
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('installBtn');
      if (btn) btn.hidden = false;
    });
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.onclick = async () => {
        if (!deferredPrompt) {
          toast('App đã cài hoặc trình duyệt chưa hỗ trợ. Trên iOS: Share → Add to Home Screen.', 'warning');
          return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') toast('Đang cài đặt app...', 'success');
        deferredPrompt = null;
        installBtn.hidden = true;
      };
    }
    // Online/offline indicator
    window.addEventListener('online', () => toast('Đã có mạng trở lại', 'success'));
    window.addEventListener('offline', () => toast('Mất mạng — đang chạy offline', 'warning'));
  }

  /* ----------- EVENT WIRING ----------- */
  function wireEvents() {
    document.getElementById('userSwitch').onclick = switchUser;
    document.getElementById('quickAddBtn').onclick = () => Leads.openCreateModal();
    document.getElementById('modalClose').onclick = () => Modal.hide();
    document.getElementById('modalOverlay').onclick = (e) => {
      if (e.target.id === 'modalOverlay') Modal.hide();
    };
    document.getElementById('mobileMenu').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };
    document.getElementById('notifBell').onclick = (e) => {
      e.stopPropagation();
      Notifications.togglePanel();
    };
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notifPanel');
      const bell = document.getElementById('notifBell');
      if (panel && !panel.hidden && !panel.contains(e.target) && !bell.contains(e.target)) {
        Notifications.closePanel();
      }
    });
    setupSearch();
    window.addEventListener('hashchange', render);
  }

  function afterData() {
    renderUser();
    if (typeof Sync !== 'undefined') { Sync.enableAutoSync(); Sync.startPolling(); }
    if (!location.hash) location.hash = '#/dashboard';
    render();
    Storage.subscribe(updateBadges);
  }

  /* ----------- BOOT ----------- */
  function boot() {
    setupPWA();
    if (typeof Sync !== 'undefined') Sync.applyDefaultConfig();
    wireEvents();

    const cloud = (typeof Sync !== 'undefined') && Sync.isConfigured() && Sync.isOnline();
    if (cloud) {
      document.getElementById('pageContent').innerHTML =
        '<div class="loading">☁️ Đang tải dữ liệu dùng chung từ Supabase...</div>';
      Sync.pullAll()
        .then(rows => {
          if (!rows) { Storage.initSeedIfNeeded(); return Sync.pushAll(); }
        })
        .catch(() => {
          Storage.initSeedIfNeeded();
          toast('Không kết nối được cloud — đang dùng dữ liệu offline', 'warning');
        })
        .then(afterData);
    } else {
      Storage.initSeedIfNeeded();
      afterData();
    }
  }

  return { boot, navigate, render, toast, Modal };
})();

document.addEventListener('DOMContentLoaded', App.boot);
