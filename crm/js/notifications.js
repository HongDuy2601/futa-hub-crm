/* ============================================================
 * FUTA HUB CRM - NOTIFICATIONS
 * Bell with badge + dropdown panel + page view
 * ============================================================ */

const Notifications = (function () {

  function renderBadge() {
    const count = Storage.unreadCount();
    const el = document.getElementById('notifBadge');
    if (!el) return;
    if (count === 0) {
      el.hidden = true;
    } else {
      el.hidden = false;
      el.textContent = count > 9 ? '9+' : count;
    }
  }

  function togglePanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderPanel();
  }

  function closePanel() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.hidden = true;
  }

  function renderPanel() {
    const items = Storage.getNotifications();
    const list = document.getElementById('notifList');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>Không có thông báo</p></div>';
      return;
    }

    list.innerHTML = items.slice(0, 20).map(n => {
      const type = NOTIF_TYPES[n.type] || { icon: '🔔', label: 'Khác', color: '#6b7280' };
      return `
        <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}" onclick="Notifications.handleClick('${n.id}')">
          <div class="notif-icon" style="background:${type.color}22;color:${type.color}">${type.icon}</div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            ${n.body ? `<div class="notif-text">${n.body}</div>` : ''}
            <div class="notif-time">${relativeTime(n.createdAt)} · ${type.label}</div>
          </div>
          ${n.read ? '' : '<span class="notif-dot"></span>'}
        </div>
      `;
    }).join('');
  }

  function handleClick(id) {
    Storage.markNotifRead(id);
    renderBadge();
    renderPanel();
    const notif = Storage.getNotifications().find(n => n.id === id);
    if (notif && notif.leadId) {
      closePanel();
      App.navigate('lead/' + notif.leadId);
    } else if (notif && notif.dealId) {
      closePanel();
      App.navigate('deal/' + notif.dealId);
    }
  }

  function markAllRead() {
    Storage.markAllNotifRead();
    renderBadge();
    renderPanel();
    toast('Đã đánh dấu tất cả là đã đọc', 'success');
  }

  function renderFullPage() {
    const items = Storage.getNotifications();
    const unread = items.filter(n => !n.read);

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Thông báo</h1>
          <p>${items.length} thông báo · ${unread.length} chưa đọc</p>
        </div>
        <div class="page-actions">
          ${unread.length > 0 ? '<button class="btn btn-secondary" onclick="Notifications.markAllRead()">✓ Đánh dấu tất cả đã đọc</button>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          ${items.length === 0 ? '<div class="empty"><div class="empty-icon">📭</div><h3>Không có thông báo</h3></div>' :
            items.map(n => {
              const type = NOTIF_TYPES[n.type] || { icon: '🔔', label: 'Khác', color: '#6b7280' };
              return `
                <div class="notif-item ${n.read ? '' : 'unread'}" style="padding:1rem 1.25rem;border-bottom:1px solid var(--gray-100)" onclick="Notifications.handleClick('${n.id}')">
                  <div class="notif-icon" style="background:${type.color}22;color:${type.color};width:40px;height:40px;font-size:1.1rem">${type.icon}</div>
                  <div class="notif-body">
                    <div class="notif-title" style="font-size:.95rem">${n.title}</div>
                    ${n.body ? `<div class="notif-text">${n.body}</div>` : ''}
                    <div class="notif-time">${formatDateTime(n.createdAt)} · ${type.label}</div>
                  </div>
                  ${n.read ? '' : '<span class="notif-dot"></span>'}
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;
    document.getElementById('pageContent').innerHTML = html;
  }

  return {
    renderBadge, togglePanel, closePanel, renderPanel, handleClick, markAllRead,
    render: renderFullPage
  };
})();
