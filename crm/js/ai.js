/* ============================================================
 * FUTA HUB CRM - AI LAYER
 * 1) Lead scoring (offline, rule-based — chạy 100% không cần mạng)
 * 2) Chatbot trợ lý nội bộ (offline intent + optional Ollama/Gemini)
 * 3) Trích xuất thông tin từ text CMND/CCCD/HĐ (offline regex)
 * ============================================================ */

const AI = (function () {

  /* ============================================================
   * 1) LEAD SCORING — thuật toán heuristic, deterministic
   * ============================================================ */
  function scoreLead(lead) {
    if (!lead) return { score: 0, temp: 'cold', label: 'Lạnh', reasons: [] };
    const reasons = [];
    let score = 0;

    // (a) Trạng thái pipeline — trọng số lớn nhất (max 40)
    const statusScore = {
      'new': 8, 'contacted': 16, 'interested': 26,
      'viewing': 34, 'negotiating': 40,
      'closed-won': 40, 'closed-lost': 0
    }[lead.status] ?? 8;
    score += statusScore;
    if (statusScore >= 34) reasons.push('Đang ở giai đoạn cuối phễu (' + LEAD_STATUS[lead.status].label + ')');

    // (b) Đánh giá sao (max 20)
    const ratingScore = (lead.rating || 0) * 4;
    score += ratingScore;
    if (lead.rating >= 4) reasons.push('Sale đánh giá cao (' + lead.rating + '★)');

    // (c) Độ tươi của tương tác gần nhất (max 15)
    const acts = lead.activities || [];
    if (acts.length) {
      const lastAt = Math.max(...acts.map(a => new Date(a.at).getTime()));
      const days = (Date.now() - lastAt) / 86400000;
      let freshScore = days <= 1 ? 15 : days <= 3 ? 12 : days <= 7 ? 8 : days <= 14 ? 4 : 1;
      score += freshScore;
      if (days <= 3) reasons.push('Tương tác rất gần đây');
      else if (days > 14) reasons.push('⚠ Lâu chưa tương tác (' + Math.round(days) + ' ngày)');
    } else {
      reasons.push('⚠ Chưa có hoạt động nào');
    }

    // (d) Số lượng hoạt động (max 10)
    const actScore = Math.min(acts.length * 2.5, 10);
    score += actScore;

    // (e) Khả năng tài chính (max 10)
    const ext = lead.extended || {};
    if (ext.monthlyIncome && lead.interest && lead.interest.budget) {
      const months = lead.interest.budget / ext.monthlyIncome;
      if (months <= 100) { score += 10; reasons.push('Tài chính tốt so với ngân sách'); }
      else if (months <= 200) { score += 6; }
      else { score += 2; }
    }
    if (ext.purchaseHistory) { score += 5; reasons.push('🏆 Khách hàng cũ (đã từng mua)'); }

    // (f) Nguồn lead (max 5)
    const sourceScore = { referral: 5, event: 4, hotline: 4, zalo: 3, website: 3, facebook: 2 }[lead.source] || 2;
    score += sourceScore;
    if (lead.source === 'referral') reasons.push('Đến từ giới thiệu (tỉ lệ chốt cao)');

    // (g) Bonus KH doanh nghiệp (max 12)
    if (lead.customerType === 'business' && lead.business) {
      const b = lead.business;
      let bizBonus = 0;
      if (b.size === 'large')  { bizBonus += 6; reasons.push('🏢 Doanh nghiệp lớn (200+ NV)'); }
      else if (b.size === 'medium') { bizBonus += 4; reasons.push('🏢 Doanh nghiệp vừa'); }
      else if (b.size === 'small') bizBonus += 2;
      if (b.capital >= 100000) { bizBonus += 4; reasons.push('💰 Vốn điều lệ ≥ 100 tỷ'); }
      else if (b.capital >= 30000) bizBonus += 2;
      if (['real_estate', 'finance', 'construction'].includes(b.industry)) {
        bizBonus += 2;
        reasons.push('Ngành cùng lĩnh vực — quyết định nhanh');
      }
      if (lead.interest && lead.interest.unitCount >= 3) {
        bizBonus += 3;
        reasons.push('Mua ≥ 3 căn — giá trị đơn hàng cao');
      }
      score += Math.min(bizBonus, 12);
    }

    score = Math.round(Math.min(score, 100));
    let temp, label;
    if (lead.status === 'closed-lost') { temp = 'cold'; label = 'Đã mất'; }
    else if (score >= 70) { temp = 'hot'; label = 'Nóng 🔥'; }
    else if (score >= 45) { temp = 'warm'; label = 'Ấm'; }
    else { temp = 'cold'; label = 'Lạnh'; }

    return { score, temp, label, reasons };
  }

  function scoreColor(temp) {
    return { hot: '#dc2626', warm: '#f59e0b', cold: '#6b7280' }[temp] || '#6b7280';
  }

  // Badge HTML nhỏ gọn để nhúng vào bảng/list
  function scoreBadge(lead) {
    const s = scoreLead(lead);
    const color = scoreColor(s.temp);
    return `<span class="ai-score" style="background:${color}22;color:${color}" title="AI score: ${s.score}/100">${s.score} · ${s.label}</span>`;
  }

  /* ============================================================
   * 2) CHATBOT TRỢ LÝ
   * ============================================================ */
  let chatOpen = false;
  let history = [];

  function toggleChat() {
    chatOpen = !chatOpen;
    const w = document.getElementById('aiChatWindow');
    if (w) w.hidden = !chatOpen;
    if (chatOpen) {
      if (history.length === 0) {
        pushBot('Xin chào! Em là trợ lý AI của FUTA Hub 🤖\n\nEm có thể giúp anh/chị:\n• "Doanh số tháng này?"\n• "Deal nào sắp đến hạn?"\n• "Khách nào tiềm năng nhất?"\n• "Task hôm nay của tôi?"\n• "Còn bao nhiêu căn?"\n• "Ai đang dẫn đầu?"\n\nHỏi em bằng tiếng Việt tự nhiên nhé!');
      }
      setTimeout(() => { const i = document.getElementById('aiChatInput'); if (i) i.focus(); }, 100);
    }
  }

  function pushUser(text) {
    history.push({ role: 'user', text });
    renderChat();
  }
  function pushBot(text) {
    history.push({ role: 'bot', text });
    renderChat();
  }

  function renderChat() {
    const body = document.getElementById('aiChatBody');
    if (!body) return;
    body.innerHTML = history.map(m => `
      <div class="ai-msg ai-msg-${m.role}">
        ${m.role === 'bot' ? '<div class="ai-msg-avatar">🤖</div>' : ''}
        <div class="ai-msg-bubble">${m.text.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
    body.scrollTop = body.scrollHeight;
  }

  function handleSend() {
    const input = document.getElementById('aiChatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    pushUser(text);

    // Offline intent first
    const local = answerLocally(text);
    if (local) {
      setTimeout(() => pushBot(local), 250);
      return;
    }

    // Fallback to LLM if configured
    const cfg = (Storage.getSettings().ai) || {};
    if (cfg.provider && cfg.provider !== 'offline') {
      pushBot('⏳ Đang hỏi AI...');
      callLLM(text).then(ans => {
        history.pop(); // remove "đang hỏi"
        pushBot(ans);
      }).catch(err => {
        history.pop();
        pushBot('❌ Không kết nối được AI (' + err.message + ').\n\nGợi ý: kiểm tra cấu hình ở Cài đặt → AI. Hiện em vẫn trả lời được các câu hỏi về dữ liệu CRM (doanh số, deal, task, quỹ căn...).');
      });
    } else {
      pushBot('Em chưa hiểu câu hỏi này 😅. Em trả lời tốt nhất các câu về: doanh số, deal sắp đến hạn, khách tiềm năng, task, quỹ căn, xếp hạng sale.\n\nĐể bật AI tự do (hỏi gì cũng được), vào Cài đặt → AI để kết nối Ollama (miễn phí, chạy local) hoặc Gemini (free tier).');
    }
  }

  // Intent matching offline
  function answerLocally(qRaw) {
    const q = qRaw.toLowerCase();
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();

    // Doanh số
    if (/(doanh s[ốô]|doanh thu|revenue|b[áa]n đư[ợơ]c)/.test(q)) {
      const won = deals.filter(d => ['contract', 'completed'].includes(d.stage));
      const total = won.reduce((s, d) => s + d.amount, 0);
      const comm = won.reduce((s, d) => s + d.commission, 0);
      return `💰 Doanh số đã chốt: <strong>${formatVND(total)}</strong> từ ${won.length} deal.\nTổng hoa hồng: ${formatVND(comm)}.\nPipeline đang chốt: ${formatVND(deals.filter(d => !['completed','cancelled','contract'].includes(d.stage)).reduce((s,d)=>s+d.amount,0))}.`;
    }

    // Deal sắp đến hạn
    if (/(s[ắa]p đ[ếe]n h[ạa]n|deadline|h[ạa]n ch[ốô]t|s[ắa]p ch[ốô]t)/.test(q)) {
      const now = Date.now();
      const soon = deals
        .filter(d => !['completed', 'cancelled'].includes(d.stage) && d.expectedCloseDate)
        .map(d => ({ d, days: (new Date(d.expectedCloseDate).getTime() - now) / 86400000 }))
        .filter(x => x.days >= -3 && x.days <= 30)
        .sort((a, b) => a.days - b.days)
        .slice(0, 5);
      if (!soon.length) return 'Hiện không có deal nào sắp đến hạn trong 30 ngày tới. 👍';
      return '📅 Deal sắp đến hạn:\n' + soon.map(x =>
        `• ${x.d.code} – ${x.d.leadName} (${formatVND(x.d.amount)}) – ${x.days < 0 ? '⚠ quá hạn ' + Math.abs(Math.round(x.days)) + ' ngày' : 'còn ' + Math.round(x.days) + ' ngày'}`
      ).join('\n');
    }

    // Khách tiềm năng / hot lead
    if (/(ti[ềe]m n[ăa]ng|h[oô]t lead|kh[áa]ch.*cao|kh[áa]ch.*t[ốô]t|n[óo]ng nh[ấâ]t|ưu ti[êe]n)/.test(q)) {
      const scored = leads
        .filter(l => !['closed-won', 'closed-lost'].includes(l.status))
        .map(l => ({ l, s: scoreLead(l) }))
        .sort((a, b) => b.s.score - a.s.score)
        .slice(0, 5);
      return '🔥 Top khách tiềm năng (theo AI score):\n' + scored.map((x, i) =>
        `${i + 1}. ${x.l.name} – ${x.s.score}/100 (${x.s.label}) – ${x.l.phone}`
      ).join('\n');
    }

    // Task
    if (/(task|c[ôo]ng vi[ệe]c|vi[ệe]c.*h[ôo]m nay|l[ịi]ch.*h[ôo]m nay|c[ầa]n l[àa]m)/.test(q)) {
      const me = Storage.getCurrentUser();
      const now = Date.now();
      const my = Storage.getTasks().filter(t => !t.done && t.assignedTo === me.id);
      const overdue = my.filter(t => new Date(t.dueAt).getTime() < now - 43200000);
      const today = my.filter(t => { const d = new Date(t.dueAt).getTime(); return d >= now - 43200000 && d <= now + 86400000; });
      let r = `📋 Task của ${me.name}:\n• ${overdue.length} quá hạn, ${today.length} hôm nay, ${my.length} tổng đang mở.`;
      if (today.length) r += '\n\nHôm nay:\n' + today.slice(0, 5).map(t => `• ${t.title}`).join('\n');
      return r;
    }

    // Quỹ căn
    if (/(qu[ỹy] c[ăa]n|c[òo]n.*c[ăa]n|t[ồô]n kho|bao nhi[êe]u c[ăa]n|inventory)/.test(q)) {
      const units = Storage.getEnrichedUnits();
      const avail = units.filter(u => u.status === 'available').length;
      const reserved = units.filter(u => u.status === 'reserved').length;
      const sold = units.filter(u => u.status === 'sold').length;
      return `🏘️ Quỹ căn: tổng <strong>${units.length}</strong> căn.\n• 🟢 Còn trống: ${avail}\n• 🟡 Giữ chỗ: ${reserved}\n• 🔴 Đã bán: ${sold}`;
    }

    // Ranking sale
    if (/(x[ếe]p h[ạa]ng|d[ẫa]n đ[ầa]u|top sale|ai.*gi[ỏo]i|nh[âa]n vi[êe]n.*t[ốô]t)/.test(q)) {
      const sales = Storage.getSales().map(s => {
        const won = deals.filter(d => d.salesId === s.id && ['contract', 'completed'].includes(d.stage));
        return { s, rev: won.reduce((a, d) => a + d.amount, 0), n: won.length };
      }).sort((a, b) => b.rev - a.rev).slice(0, 5);
      return '🏆 Xếp hạng sale:\n' + sales.map((x, i) =>
        `${['🥇','🥈','🥉','4.','5.'][i]} ${x.s.name} – ${formatVND(x.rev)} (${x.n} deal)`
      ).join('\n');
    }

    // Tổng lead
    if (/(bao nhi[êe]u (kh[áa]ch|lead)|t[ổô]ng (kh[áa]ch|lead)|s[ốô] lư[ợơ]ng kh[áa]ch)/.test(q)) {
      const active = leads.filter(l => !['closed-won', 'closed-lost'].includes(l.status)).length;
      const biz = leads.filter(l => l.customerType === 'business').length;
      return `👥 Tổng ${leads.length} khách hàng (cá nhân ${leads.length - biz}, doanh nghiệp ${biz}). Đang hoạt động: ${active}.`;
    }

    // KH doanh nghiệp
    if (/(doanh nghi[ệe]p|kh[áa]ch.*dn|kh.*c[ôo]ng ty|b2b)/.test(q)) {
      const biz = leads.filter(l => l.customerType === 'business');
      const totalBudget = biz.reduce((s, l) => s + (l.interest && l.interest.budget || 0), 0);
      const top = biz.sort((a, b) => (b.interest.budget || 0) - (a.interest.budget || 0)).slice(0, 5);
      let r = `🏢 ${biz.length} khách doanh nghiệp · tổng ngân sách: ${formatVND(totalBudget)}.`;
      if (top.length) r += '\n\nTop ngân sách:\n' + top.map((x, i) => `${i+1}. ${x.name} – ${formatVND(x.interest.budget)} (${x.interest.unitCount || 1} căn)`).join('\n');
      return r;
    }

    // Help
    if (/(gi[úu]p|help|l[àa]m đư[ợơ]c g[ìi]|h[ưu][ơo]ng d[ẫa]n|b[ạa]n l[àa] ai)/.test(q)) {
      return 'Em là trợ lý AI của FUTA Hub 🤖. Em giúp được:\n• Doanh số, hoa hồng\n• Deal sắp đến hạn\n• Khách tiềm năng (AI scoring)\n• Task hôm nay/quá hạn\n• Quỹ căn còn lại\n• Xếp hạng sale\n\nCòn nếu kết nối Ollama/Gemini ở Cài đặt → AI, em trả lời được mọi câu hỏi tự do.';
    }

    return null; // không match → để LLM xử lý
  }

  // Gọi LLM ngoài (online) — Ollama local hoặc Gemini free
  async function callLLM(question) {
    const cfg = (Storage.getSettings().ai) || {};
    const context = buildContext();

    if (cfg.provider === 'ollama') {
      const endpoint = (cfg.ollamaUrl || 'http://localhost:11434') + '/api/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.ollamaModel || 'llama3.1',
          prompt: `Bạn là trợ lý CRM bất động sản FUTA Land. Trả lời ngắn gọn bằng tiếng Việt.\n\nDữ liệu hiện tại:\n${context}\n\nCâu hỏi: ${question}\n\nTrả lời:`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Ollama HTTP ' + res.status);
      const data = await res.json();
      return data.response || 'Không có phản hồi.';
    }

    if (cfg.provider === 'gemini') {
      if (!cfg.geminiKey) throw new Error('chưa nhập API key');
      const model = cfg.geminiModel || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Bạn là trợ lý CRM bất động sản FUTA Land. Trả lời ngắn gọn bằng tiếng Việt.\n\nDữ liệu:\n${context}\n\nCâu hỏi: ${question}` }] }]
        })
      });
      if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
      const data = await res.json();
      return (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text) || 'Không có phản hồi.';
    }

    throw new Error('chưa cấu hình provider');
  }

  // Context tóm tắt gửi cho LLM
  function buildContext() {
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();
    const units = Storage.getEnrichedUnits();
    const won = deals.filter(d => ['contract', 'completed'].includes(d.stage));
    return [
      `- Tổng khách hàng: ${leads.length}`,
      `- Deal đang chốt: ${deals.filter(d => !['completed','cancelled'].includes(d.stage)).length}`,
      `- Doanh số đã chốt: ${formatVND(won.reduce((s,d)=>s+d.amount,0))}`,
      `- Quỹ căn: ${units.length} (còn ${units.filter(u=>u.status==='available').length})`,
      `- Nhân viên: ${Storage.getSales().map(s=>s.name).join(', ')}`
    ].join('\n');
  }

  /* ============================================================
   * 3) TRÍCH XUẤT THÔNG TIN (CMND/CCCD/HĐ) từ text
   * ============================================================ */
  function extractFields(text) {
    const result = {};
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

    // CCCD/CMND: 12 hoặc 9 số
    const idMatch = text.match(/\b(\d{12}|\d{9})\b/);
    if (idMatch) result.cccd = idMatch[1];

    // SĐT
    const phoneMatch = text.match(/\b(0\d{9}|(?:\+?84)\d{9})\b/);
    if (phoneMatch) result.phone = phoneMatch[1].replace(/^\+?84/, '0');

    // Tên: dòng sau "họ và tên" / "họ tên" / "full name"
    const nameLabel = text.match(/(?:h[ọo]\s*(?:v[àa]\s*)?t[êe]n|full\s*name)[:\s]*([A-ZÀ-Ỹ][a-zà-ỹA-ZÀ-Ỹ\s]{2,40})/i);
    if (nameLabel) result.name = nameLabel[1].trim().replace(/\s+/g, ' ');

    // Ngày sinh
    const dobMatch = text.match(/(?:ng[àa]y\s*sinh|date\s*of\s*birth|sinh\s*ng[àa]y)[:\s]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
    if (dobMatch) result.dob = dobMatch[1];

    // Giới tính
    const sexMatch = text.match(/(?:gi[ớo]i\s*t[íi]nh|sex)[:\s]*(Nam|N[ữu]|Male|Female)/i);
    if (sexMatch) result.sex = sexMatch[1];

    // Địa chỉ / nơi thường trú
    const addrMatch = text.match(/(?:n[ơo]i\s*th[ưuờ]+ng\s*tr[úu]|đ[ịi]a\s*ch[ỉi]|qu[êe]\s*qu[áa]n|place\s*of\s*residence)[:\s]*([^\n]{5,120})/i);
    if (addrMatch) result.address = addrMatch[1].trim();

    // Email
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (emailMatch) result.email = emailMatch[0];

    return result;
  }

  // Modal trích xuất → tạo lead
  function openExtractModal() {
    const body = `
      <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:.75rem">
        Dán nội dung text từ CMND/CCCD/hợp đồng (có thể copy từ app OCR điện thoại, Google Lens, hoặc gõ tay).
        AI sẽ tự nhận diện họ tên, số CCCD, SĐT, địa chỉ, ngày sinh...
      </p>
      <div class="form-field full">
        <label>Dán text ở đây</label>
        <textarea id="aiExtractInput" rows="7" placeholder="VD:&#10;CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM&#10;Họ và tên: NGUYỄN VĂN AN&#10;Số: 079201001234&#10;Ngày sinh: 15/03/1990&#10;Giới tính: Nam&#10;Nơi thường trú: 123 Lê Lợi, Q1, TP.HCM&#10;SĐT: 0908123456"></textarea>
      </div>
      <button class="btn btn-secondary" onclick="AI.runExtract()">🔍 Phân tích</button>
      <div id="aiExtractResult" style="margin-top:1rem"></div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>
      <button class="btn btn-primary" id="aiExtractCreateBtn" onclick="AI.createLeadFromExtract()" disabled>+ Tạo khách hàng</button>
    `;
    Modal.show({ title: '🤖 AI trích xuất thông tin', body, footer, size: 'lg' });
  }

  let lastExtract = null;
  function runExtract() {
    const text = document.getElementById('aiExtractInput').value;
    if (!text.trim()) { toast('Dán text trước', 'error'); return; }
    const fields = extractFields(text);
    lastExtract = fields;
    const keys = Object.keys(fields);
    const result = document.getElementById('aiExtractResult');
    if (!keys.length) {
      result.innerHTML = '<div style="color:var(--red);font-size:.85rem">Không nhận diện được trường nào. Thử dán text rõ hơn.</div>';
      return;
    }
    const labels = { name: 'Họ tên', cccd: 'Số CCCD', phone: 'SĐT', email: 'Email', dob: 'Ngày sinh', sex: 'Giới tính', address: 'Địa chỉ' };
    result.innerHTML = `
      <div style="background:var(--futa-green-light);border-radius:10px;padding:1rem">
        <strong style="color:var(--futa-green-dark)">✅ Nhận diện được ${keys.length} trường:</strong>
        <div class="info-grid" style="margin-top:.5rem">
          ${keys.map(k => `<div class="info-item"><label>${labels[k] || k}</label><div>${fields[k]}</div></div>`).join('')}
        </div>
      </div>
    `;
    document.getElementById('aiExtractCreateBtn').disabled = false;
  }

  function createLeadFromExtract() {
    if (!lastExtract) return;
    Modal.hide();
    setTimeout(() => {
      Leads.openCreateModal();
      setTimeout(() => {
        if (lastExtract.name) { const e = document.getElementById('fName'); if (e) e.value = lastExtract.name; }
        if (lastExtract.phone) { const e = document.getElementById('fPhone'); if (e) e.value = lastExtract.phone; }
        if (lastExtract.email) { const e = document.getElementById('fEmail'); if (e) e.value = lastExtract.email; }
        toast('Đã điền thông tin từ AI, kiểm tra rồi lưu', 'success');
      }, 100);
    }, 100);
  }

  return {
    scoreLead, scoreBadge, scoreColor,
    toggleChat, handleSend,
    extractFields, openExtractModal, runExtract, createLeadFromExtract
  };
})();
