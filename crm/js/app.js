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
    'admin':         () => Admin.render(),
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
    // Guard: chặn truy cập trang vượt quyền
    if (typeof Perm !== 'undefined' && !Perm.canViewPage(route)) {
      document.getElementById('pageContent').innerHTML =
        `<div class="empty">
           <div class="empty-icon">🔒</div>
           <h3>Không có quyền truy cập</h3>
           <p>Vai trò hiện tại (${Perm.role().name}) không được phép xem trang này.</p>
           <button class="btn btn-primary" style="margin-top:1rem" onclick="App.navigate('dashboard')">← Về Dashboard</button>
         </div>`;
      updateBadges();
      return;
    }
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
    const role = (typeof ROLES !== 'undefined') ? ROLES.find(r => r.id === u.roleId) : null;
    const org = (typeof Storage.getOrg === 'function') ? Storage.getOrg(u.orgId) : null;
    const avatar = document.getElementById('userAvatar');
    avatar.textContent = initials(u.name);
    if (role) avatar.style.background = role.color;
    document.getElementById('userName').textContent = u.name;
    const subRole = role ? role.name : (u.team || u.code);
    const subOrg = org ? ' · ' + (org.name.length > 22 ? org.name.slice(0, 20) + '…' : org.name) : '';
    document.getElementById('userRole').textContent = subRole + subOrg;
    applyRoleNavVisibility();
  }

  // Ẩn / hiện nav theo role
  function applyRoleNavVisibility() {
    if (typeof Perm === 'undefined') return;
    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      const r = el.dataset.route;
      el.style.display = Perm.canViewPage(r) ? '' : 'none';
    });
  }

  /* ----------- USER SWITCHER (modal chọn) ----------- */
  function switchUser() {
    const sales = (Storage._raw && Storage._raw.getSales ? Storage._raw.getSales() : Storage.getSales)();
    const orgs = Storage.getOrgs ? Storage.getOrgs() : [];
    const me = Storage.getCurrentUser();

    // Group sales theo org
    const groups = {};
    sales.forEach(s => {
      const oId = s.orgId || 'no-org';
      if (!groups[oId]) groups[oId] = [];
      groups[oId].push(s);
    });

    const body = `
      <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:1rem">
        Chọn tài khoản để đăng nhập với tư cách đó (demo phân quyền).
      </p>
      ${Object.entries(groups).map(([oId, list]) => {
        const o = orgs.find(x => x.id === oId);
        const orgLabel = o ? `${(ORG_TYPES[o.type] || {}).icon || ''} ${o.name}` : '— Khác —';
        return `
          <div style="margin-bottom:1.25rem">
            <h4 style="color:var(--futa-green-dark);font-size:.85rem;margin-bottom:.5rem;text-transform:uppercase;letter-spacing:1px">${orgLabel}</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.5rem">
              ${list.map(s => {
                const r = (typeof ROLES !== 'undefined') ? ROLES.find(x => x.id === s.roleId) : null;
                const isMe = s.id === me.id;
                return `
                  <div class="user-pick ${isMe ? 'active' : ''}" onclick="App.pickUser('${s.id}')">
                    <div class="up-avatar" style="background:${r ? r.color : '#1B5E20'}">${initials(s.name)}</div>
                    <div class="up-info">
                      <strong>${s.name}</strong>
                      <div class="up-role" style="color:${r ? r.color : ''}">${r ? r.icon + ' ' + r.name : s.team}</div>
                      <div class="up-team">${s.team || ''} · ${s.code}</div>
                    </div>
                    ${isMe ? '<span class="up-me">ĐANG DÙNG</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;
    Modal.show({
      title: '🔄 Chuyển tài khoản (demo)',
      body,
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>`,
      size: 'lg'
    });
  }

  function pickUser(id) {
    const sales = (Storage._raw && Storage._raw.getSales ? Storage._raw.getSales() : Storage.getSales)();
    const u = sales.find(s => s.id === id);
    if (!u) return;
    Storage.setCurrentUser(u);
    Modal.hide();
    renderUser();
    toast('Đã chuyển sang: ' + u.name + ' (' + (ROLES.find(r => r.id === u.roleId) || {}).name + ')', 'success');
    // Re-render trang hiện tại với scope mới
    render();
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
    installScopedStorage();
    renderUser();
    if (typeof Sync !== 'undefined') { Sync.enableAutoSync(); Sync.startPolling(); }
    if (!location.hash) location.hash = '#/dashboard';
    render();
    Storage.subscribe(updateBadges);
  }

  /* ----------- Wrap Storage để filter theo phân quyền ----------- */
  function installScopedStorage() {
    if (typeof Perm === 'undefined' || Storage._raw) return;
    Storage._raw = {
      getLeads:         Storage.getLeads,
      getDeals:         Storage.getDeals,
      getTasks:         Storage.getTasks,
      getEnrichedUnits: Storage.getEnrichedUnits,
      getTargets:       Storage.getTargets,
      getSales:         Storage.getSales
    };
    Storage.getLeads         = function() { return Perm.filterLeads(Storage._raw.getLeads()); };
    Storage.getDeals         = function() { return Perm.filterDeals(Storage._raw.getDeals()); };
    Storage.getTasks         = function() { return Perm.filterTasks(Storage._raw.getTasks()); };
    Storage.getEnrichedUnits = function() { return Perm.filterUnits(Storage._raw.getEnrichedUnits()); };
    Storage.getTargets       = function() { return Perm.filterTargets(Storage._raw.getTargets()); };
    Storage.getSales         = function() { return Perm.filterSales(Storage._raw.getSales()); };
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

  return { boot, navigate, render, toast, Modal, pickUser };
})();

document.addEventListener('DOMContentLoaded', App.boot);
