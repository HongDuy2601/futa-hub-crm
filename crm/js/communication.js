/* ============================================================
 * FUTA HUB CRM - COMMUNICATION CENTER
 * Composer: Call / SMS / Zalo / Email với template
 * ============================================================ */

const Communication = (function () {

  // Mở composer cho 1 lead cụ thể
  function open(leadId, channel = 'sms') {
    const lead = Storage.getLead(leadId);
    if (!lead) return;
    const settings = Storage.getSettings();
    const me = Storage.getCurrentUser();
    const templates = settings.smsTemplates || [];

    const tabs = [
      { key: 'call',  label: '📞 Gọi điện',    color: '#3b82f6' },
      { key: 'sms',   label: '💬 SMS',          color: '#16a34a' },
      { key: 'zalo',  label: '🟦 Zalo',         color: '#0891b2' },
      { key: 'email', label: '✉️ Email',        color: '#9333ea' }
    ];

    const body = `
      <div class="comm-tabs">
        ${tabs.map(t => `
          <button class="comm-tab ${channel === t.key ? 'active' : ''}"
                  style="${channel === t.key ? 'border-bottom-color:' + t.color + ';color:' + t.color : ''}"
                  onclick="Communication.switchChannel('${leadId}', '${t.key}')">${t.label}</button>
        `).join('')}
      </div>

      <div class="comm-target">
        <div class="user-avatar" style="background:var(--futa-green)">${initials(lead.name)}</div>
        <div>
          <strong>${lead.name}</strong>
          <div style="font-size:.8rem;color:var(--gray-500)">${lead.phone} · ${lead.email || '—'}</div>
        </div>
      </div>

      ${renderChannel(channel, lead, templates, me)}
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>
      <button class="btn btn-primary" id="commSendBtn" onclick="Communication.send('${leadId}', '${channel}')">
        ${({call:'📞 Bắt đầu cuộc gọi', sms:'📤 Gửi SMS', zalo:'📤 Gửi Zalo', email:'📤 Gửi Email'})[channel]}
      </button>
    `;

    Modal.show({
      title: '📨 Liên hệ ' + lead.name,
      body, footer, size: 'lg'
    });
  }

  function renderChannel(channel, lead, templates, me) {
    if (channel === 'call') {
      return `
        <div class="comm-call">
          <div style="text-align:center;padding:2rem 1rem">
            <div style="font-size:4rem;animation:pulse 1.5s infinite">📞</div>
            <h3 style="margin-top:1rem">Sẵn sàng gọi ${lead.phone}</h3>
            <p style="color:var(--gray-500);margin-top:.5rem">Nhấn nút bên dưới để mở app gọi điện trên thiết bị</p>
          </div>
          <div class="form-field">
            <label>Ghi chú trước cuộc gọi</label>
            <textarea id="commCallNote" rows="3" placeholder="VD: Cần hỏi về khả năng tài chính, sở thích tầng..."></textarea>
          </div>
          <div class="form-field">
            <label>Kết quả cuộc gọi (sau khi gọi)</label>
            <select id="commCallResult">
              <option value="connected">✅ Đã kết nối, có trao đổi</option>
              <option value="busy">📵 Máy bận / không bắt</option>
              <option value="voicemail">📨 Để lại lời nhắn</option>
              <option value="wrong">❌ Sai số / Không phải KH</option>
            </select>
          </div>
        </div>
      `;
    }
    if (channel === 'sms' || channel === 'zalo') {
      return `
        <div class="form-field">
          <label>Chọn mẫu (template)</label>
          <select id="commTpl" onchange="Communication.applyTemplate(this.value, '${lead.id}')">
            <option value="">— Không dùng template —</option>
            ${templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field full">
          <label>Nội dung (${channel === 'sms' ? '160 ký tự cho SMS' : 'tối đa 2000 cho Zalo OA'})</label>
          <textarea id="commContent" rows="6" maxlength="${channel === 'sms' ? 160 : 2000}"
            placeholder="Nhập nội dung tin nhắn..."></textarea>
          <div style="font-size:.72rem;color:var(--gray-500);margin-top:.25rem">
            <span id="commCharCount">0</span> ký tự
          </div>
        </div>
        ${channel === 'zalo' ? `
          <div class="form-field full">
            <label>Đính kèm (Zalo OA)</label>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap">
              <label class="btn btn-secondary btn-sm"><input type="checkbox" style="margin-right:.3rem"> 📷 Hình ảnh</label>
              <label class="btn btn-secondary btn-sm"><input type="checkbox" style="margin-right:.3rem"> 📄 PDF brochure</label>
              <label class="btn btn-secondary btn-sm"><input type="checkbox" style="margin-right:.3rem"> 🎥 Video tour</label>
              <label class="btn btn-secondary btn-sm"><input type="checkbox" style="margin-right:.3rem"> 📍 Vị trí dự án</label>
            </div>
          </div>
        ` : ''}
      `;
    }
    if (channel === 'email') {
      const project = lead.interest && lead.interest.projectName ? lead.interest.projectName : 'dự án FUTA Land';
      return `
        <div class="form-field">
          <label>Tới</label>
          <input type="email" id="commEmailTo" value="${lead.email}">
        </div>
        <div class="form-field">
          <label>Tiêu đề <span class="req">*</span></label>
          <input type="text" id="commEmailSubject" value="[FUTA Land] Thông tin chi tiết dự án ${project}">
        </div>
        <div class="form-field full">
          <label>Nội dung</label>
          <textarea id="commContent" rows="10" placeholder="Soạn email...">Kính gửi anh/chị ${lead.name},

Em là ${me.name} - chuyên viên tư vấn của FUTA Land. Cảm ơn anh/chị đã quan tâm đến dự án ${project}.

Em xin gửi tới anh/chị các tài liệu chi tiết bao gồm:
• Bảng giá mới nhất
• Mặt bằng các căn còn hỗ trợ chính sách ưu đãi
• Tiến độ thi công và pháp lý
• Chính sách hỗ trợ vay ngân hàng

Anh/chị có thể liên hệ em qua SĐT ${me.phone} hoặc Zalo để được tư vấn nhanh nhất ạ.

Trân trọng,
${me.name}
${me.team} · FUTA Land
        </textarea>
        </div>
        <div class="form-field full">
          <label>File đính kèm</label>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">
            <label class="btn btn-secondary btn-sm"><input type="checkbox" checked style="margin-right:.3rem"> 📎 Bảng giá.xlsx</label>
            <label class="btn btn-secondary btn-sm"><input type="checkbox" checked style="margin-right:.3rem"> 📎 Brochure.pdf</label>
            <label class="btn btn-secondary btn-sm"><input type="checkbox" style="margin-right:.3rem"> 📎 Mặt bằng.pdf</label>
          </div>
        </div>
      `;
    }
    return '';
  }

  function switchChannel(leadId, channel) {
    Modal.hide();
    setTimeout(() => open(leadId, channel), 50);
  }

  function applyTemplate(tplId, leadId) {
    if (!tplId) return;
    const settings = Storage.getSettings();
    const tpl = (settings.smsTemplates || []).find(t => t.id === tplId);
    if (!tpl) return;
    const lead = Storage.getLead(leadId);
    const me = Storage.getCurrentUser();
    let content = tpl.content
      .replace(/{customer}/g, lead.name)
      .replace(/{phone}/g, me.phone)
      .replace(/{sale_name}/g, me.name)
      .replace(/{project}/g, (lead.interest && lead.interest.projectName) || 'dự án')
      .replace(/{date}/g, '___')
      .replace(/{unit}/g, '___')
      .replace(/{phase}/g, '___');
    const ta = document.getElementById('commContent');
    if (ta) {
      ta.value = content;
      document.getElementById('commCharCount').textContent = content.length;
    }
  }

  function send(leadId, channel) {
    const lead = Storage.getLead(leadId);
    let content = '';
    let activityContent = '';

    if (channel === 'call') {
      const note = document.getElementById('commCallNote').value;
      const result = document.getElementById('commCallResult').value;
      const resultLabel = ({
        connected: 'Đã kết nối', busy: 'Máy bận',
        voicemail: 'Để lại lời nhắn', wrong: 'Sai số'
      })[result];
      content = `Gọi điện - ${resultLabel}. ${note}`;
      activityContent = `Đã gọi ${lead.phone} (${resultLabel})${note ? '. Ghi chú: ' + note : ''}`;

      // Mock: open phone dialer
      window.location.href = 'tel:' + lead.phone;

    } else if (channel === 'sms') {
      content = document.getElementById('commContent').value.trim();
      if (!content) { toast('Nhập nội dung tin nhắn', 'error'); return; }
      activityContent = 'Gửi SMS: ' + (content.length > 80 ? content.slice(0, 80) + '…' : content);
      // Mock: open SMS app
      window.location.href = 'sms:' + lead.phone + '?body=' + encodeURIComponent(content);

    } else if (channel === 'zalo') {
      content = document.getElementById('commContent').value.trim();
      if (!content) { toast('Nhập nội dung Zalo', 'error'); return; }
      activityContent = 'Gửi Zalo OA: ' + (content.length > 80 ? content.slice(0, 80) + '…' : content);

    } else if (channel === 'email') {
      const subject = document.getElementById('commEmailSubject').value;
      content = document.getElementById('commContent').value.trim();
      const to = document.getElementById('commEmailTo').value;
      if (!content) { toast('Nhập nội dung email', 'error'); return; }
      activityContent = 'Gửi email "' + subject + '" tới ' + to;
      // Mock: open mailto
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(content);
    }

    // Log activity
    Storage.addActivity(leadId, {
      type: channel === 'call' ? 'call' : channel === 'email' ? 'email' : 'sms',
      by: Storage.getCurrentUser().id,
      content: activityContent
    });

    // Add notification
    Storage.addNotification({
      type: 'lead_new',
      title: 'Đã liên hệ ' + lead.name,
      body: activityContent,
      leadId: leadId
    });

    Modal.hide();
    toast('Đã gửi ' + ({call: 'cuộc gọi', sms: 'SMS', zalo: 'Zalo', email: 'email'})[channel] + ' tới ' + lead.name, 'success');
    Notifications.renderBadge();

    // If on lead detail page, refresh
    if (location.hash.includes('lead/' + leadId)) {
      App.render();
    }
  }

  // Char counter setup
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'commContent') {
      const c = document.getElementById('commCharCount');
      if (c) c.textContent = e.target.value.length;
    }
  });

  return { open, switchChannel, applyTemplate, send };
})();
