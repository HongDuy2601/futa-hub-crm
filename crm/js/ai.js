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

    /* ============================================================
     * INTENT MỞ RỘNG (Tuần 2)
     * ============================================================ */

    // Phân tích thời gian: tuần này / tháng này / tháng trước / quý / N ngày
    const period = parsePeriod(q);

    // Top deal lớn nhất
    if (/(deal.*l[ớo]n.*nh[ấâ]t|deal.*cao.*nh[ấâ]t|top deal|deal.*nhi[ềe]u nh[ấâ]t)/.test(q)) {
      const list = (period ? deals.filter(d => inRange(d.createdAt, period)) : deals)
        .sort((a, b) => b.amount - a.amount).slice(0, 5);
      if (!list.length) return 'Không có deal nào ' + (period ? 'trong ' + period.label : '') + '.';
      return `🎯 Top ${list.length} deal lớn nhất${period ? ' ' + period.label : ''}:\n` +
        list.map((d, i) => `${i+1}. ${d.code} – ${d.leadName} – ${formatVND(d.amount)} (${stageLabel(d.stage)})`).join('\n');
    }

    // Hoa hồng cao nhất / nhiều nhất
    if (/(hoa h[ồô]ng|commission)/.test(q)) {
      const sales = Storage.getSales().map(s => {
        const won = deals.filter(d => d.salesId === s.id && ['contract', 'completed'].includes(d.stage));
        return { s, comm: won.reduce((a, d) => a + d.commission, 0), n: won.length };
      }).sort((a, b) => b.comm - a.comm);
      const top = sales.slice(0, 5);
      return `🎁 Hoa hồng theo sale${period ? ' (' + period.label + ')' : ''}:\n` +
        top.map((x, i) => `${i+1}. ${x.s.name} – ${formatVND(x.comm)} (${x.n} deal)`).join('\n');
    }

    // Dự án "nóng" (nhiều lead nhất / chốt nhiều nhất)
    if (/(d[ựu] [áa]n.*n[óo]ng|d[ựu] [áa]n.*nhi[ềe]u (lead|deal|kh[áa]ch)|d[ựu] [áa]n.*t[ốô]t)/.test(q)) {
      const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];
      const stats = projects.map(p => {
        const ls = leads.filter(l => l.interest && l.interest.projectId === p.id);
        const ds = deals.filter(d => d.projectId === p.id);
        const won = ds.filter(d => ['contract', 'completed'].includes(d.stage));
        return { name: p.name, leads: ls.length, deals: ds.length, won: won.length, revenue: won.reduce((s, d) => s + d.amount, 0) };
      }).sort((a, b) => b.revenue - a.revenue);
      return '🏘️ Dự án theo doanh số:\n' + stats.map((p, i) =>
        `${i+1}. ${p.name} – ${p.leads} lead, ${p.deals} deal (${p.won} chốt), ${formatVND(p.revenue)}`
      ).join('\n');
    }

    // Conversion theo nguồn lead
    if (/(ngu[ồô]n.*hi[ệe]u qu[ảa]|hi[ệe]u qu[ảa].*ngu[ồô]n|chuy[ểe]n đ[ổô]i.*ngu[ồô]n|ngu[ồô]n.*t[ốô]t nh[ấâ]t|ngu[ồô]n.*nh[ấâ]t)/.test(q)) {
      const result = Object.keys(LEAD_SOURCES).map(k => {
        const ls = leads.filter(l => l.source === k);
        const won = ls.filter(l => l.status === 'closed-won').length;
        return { k, label: LEAD_SOURCES[k].label, total: ls.length, won, rate: ls.length ? (won / ls.length * 100) : 0 };
      }).filter(x => x.total > 0).sort((a, b) => b.rate - a.rate);
      return '📥 Tỷ lệ chốt theo nguồn:\n' +
        result.map((s, i) => `${i+1}. ${s.label} – ${s.won}/${s.total} (${s.rate.toFixed(0)}%)`).join('\n');
    }

    // So sánh kỳ này vs kỳ trước
    if (/(so s[áa]nh|so v[ớo]i (k[ỳy]|th[áa]ng|tu[ầa]n) tr[ưuớ]+c|t[ăa]ng tr[ưuớ]+ng|growth)/.test(q)) {
      const now = Date.now(), day = 86400000;
      const cur = { from: now - 30 * day, to: now };
      const prev = { from: now - 60 * day, to: now - 30 * day };
      const fn = r => {
        const won = deals.filter(d => inRange(d.createdAt, r) && ['contract', 'completed'].includes(d.stage));
        return { won: won.length, rev: won.reduce((s, d) => s + d.amount, 0), leads: leads.filter(l => inRange(l.createdAt, r)).length };
      };
      const c = fn(cur), p = fn(prev);
      const pct = (a, b) => b === 0 ? (a > 0 ? '+∞' : '0') : (((a - b) / b * 100).toFixed(0) + '%');
      return `📊 So sánh 30 ngày gần nhất vs 30 ngày trước:\n` +
        `• Lead mới: ${c.leads} (kỳ trước ${p.leads}, ${pct(c.leads, p.leads)})\n` +
        `• Deal chốt: ${c.won} (kỳ trước ${p.won}, ${pct(c.won, p.won)})\n` +
        `• Doanh số: ${formatVND(c.rev)} (kỳ trước ${formatVND(p.rev)}, ${pct(c.rev, p.rev)})`;
    }

    // Forecast: dự đoán doanh số 30 ngày tới dựa trên pipeline + win rate
    if (/(d[ựu]\s*đo[áa]n|d[ựu]\s*b[áa]o|forecast|s[ắa]p t[ớo]i|th[áa]ng t[ớo]i|sẽ.*ch[ốô]t)/.test(q)) {
      const won = deals.filter(d => ['contract', 'completed'].includes(d.stage));
      const lost = deals.filter(d => d.stage === 'cancelled');
      const closed = won.length + lost.length;
      const winRate = closed > 0 ? (won.length / closed) : 0.45;
      const active = deals.filter(d => !['contract', 'completed', 'cancelled'].includes(d.stage));
      const stageWeight = { new: 0.1, viewed: 0.2, negotiating: 0.5, deposit: 0.85 };
      const weighted = active.reduce((s, d) => s + d.amount * (stageWeight[d.stage] || 0.3), 0);
      const simple = active.reduce((s, d) => s + d.amount, 0) * winRate;
      return `🔮 Dự đoán doanh số 30-60 ngày tới:\n` +
        `• Pipeline đang chốt: ${formatVND(active.reduce((s,d)=>s+d.amount,0))} (${active.length} deal)\n` +
        `• Win-rate hiện tại: ${(winRate*100).toFixed(0)}%\n` +
        `• Ước tính theo win-rate: <strong>${formatVND(Math.round(simple))}</strong>\n` +
        `• Ước tính theo trọng số stage: <strong>${formatVND(Math.round(weighted))}</strong>\n` +
        `(Trọng số stage = xác suất chốt thực tế tại từng giai đoạn)`;
    }

    // Sale nào: tìm theo tên trong câu hỏi
    const salesMatch = matchSale(q);
    if (salesMatch && /(sale|nh[âa]n vi[êe]n|c[ủu]a|hi[ệe]u qu[ảa]|deal|kh[áa]ch).*$/.test(q)) {
      const s = salesMatch;
      const myDeals = deals.filter(d => d.salesId === s.id);
      const won = myDeals.filter(d => ['contract', 'completed'].includes(d.stage));
      const myLeads = leads.filter(l => l.assignedTo === s.id);
      return `👤 <strong>${s.name}</strong> (${s.code} · ${s.team})\n` +
        `• Lead phụ trách: ${myLeads.length}\n` +
        `• Deal: ${myDeals.length} (đã chốt: ${won.length})\n` +
        `• Doanh số: ${formatVND(won.reduce((a, d) => a + d.amount, 0))}\n` +
        `• Hoa hồng: ${formatVND(won.reduce((a, d) => a + d.commission, 0))}\n` +
        `• Conversion: ${myDeals.length ? (won.length / myDeals.length * 100).toFixed(0) : 0}%`;
    }

    // Khách hàng cụ thể (tìm theo tên trong câu hỏi)
    const leadMatch = matchLead(leads, q);
    if (leadMatch) {
      const l = leadMatch;
      const score = scoreLead(l);
      const sale = Storage.getSale(l.assignedTo);
      const myDeals = deals.filter(d => d.leadId === l.id);
      return `👥 <strong>${l.name}</strong> (${l.code})\n` +
        `• Loại: ${CUSTOMER_TYPES[l.customerType || 'individual'].label}\n` +
        `• SĐT: ${l.phone}\n` +
        `• Trạng thái: ${LEAD_STATUS[l.status].label}\n` +
        `• Nguồn: ${LEAD_SOURCES[l.source].label}\n` +
        `• Ngân sách: ${formatVND(l.interest.budget)}${l.interest.unitCount > 1 ? ' · '+l.interest.unitCount+' căn' : ''}\n` +
        `• AI Score: ${score.score}/100 (${score.label})\n` +
        `• Sale: ${sale ? sale.name : '—'}\n` +
        `• Deal: ${myDeals.length}`;
    }

    // Stage yếu nhất / cần xử lý
    if (/(stage.*y[ếe]u|y[ếe]u nh[ấâ]t|đi[ểe]m ngh[ẽe]n|bottleneck|stuck|t[ắa]c)/.test(q)) {
      const stageCount = {};
      deals.filter(d => !['completed', 'cancelled'].includes(d.stage)).forEach(d => {
        stageCount[d.stage] = (stageCount[d.stage] || 0) + 1;
      });
      const entries = Object.entries(stageCount).sort((a, b) => b[1] - a[1]);
      if (!entries.length) return 'Không có deal đang mở.';
      const worst = entries[0];
      const stage = (typeof DEAL_STAGES !== 'undefined') ? DEAL_STAGES.find(s => s.key === worst[0]) : null;
      return `⚠️ Stage có nhiều deal nhất (có thể là điểm nghẽn):\n` +
        `<strong>${stage ? stage.label : worst[0]}</strong>: ${worst[1]} deal\n\n` +
        `Tất cả: ` + entries.map(([k, v]) => {
          const s = DEAL_STAGES.find(x => x.key === k);
          return (s ? s.label : k) + ' (' + v + ')';
        }).join(', ');
    }

    // Help
    if (/(gi[úu]p|help|l[àa]m đư[ợơ]c g[ìi]|h[ưu][ơo]ng d[ẫa]n|b[ạa]n l[àa] ai)/.test(q)) {
      return '🤖 Em trả lời được những câu hỏi sau:\n' +
        '• <strong>Doanh số / Pipeline / Hoa hồng</strong>\n' +
        '• <strong>Deal sắp đến hạn / deal lớn nhất</strong>\n' +
        '• <strong>Top khách tiềm năng</strong> (AI scoring)\n' +
        '• <strong>Task hôm nay / quá hạn</strong>\n' +
        '• <strong>Quỹ căn còn / đã bán</strong>\n' +
        '• <strong>Xếp hạng sale / hiệu suất 1 sale</strong> (vd: "doanh số của Hồng Duy")\n' +
        '• <strong>1 khách hàng cụ thể</strong> (gõ tên KH)\n' +
        '• <strong>Khách doanh nghiệp</strong>\n' +
        '• <strong>Dự án nóng nhất</strong>\n' +
        '• <strong>Nguồn lead hiệu quả nhất</strong>\n' +
        '• <strong>So sánh kỳ này vs kỳ trước</strong>\n' +
        '• <strong>Dự đoán doanh số tháng tới</strong> (forecast)\n' +
        '• <strong>Stage yếu / điểm nghẽn pipeline</strong>\n\n' +
        'Hoặc bật LLM ở <strong>Cài đặt → AI</strong> để hỏi tự do.';
    }

    return null; // không match → để LLM xử lý
  }

  /* ----------- HELPER: parse khoảng thời gian từ câu hỏi ----------- */
  function parsePeriod(q) {
    const now = new Date();
    const day = 86400000;
    if (/(h[ôo]m nay|today)/.test(q)) {
      const start = new Date(now); start.setHours(0,0,0,0);
      return { from: start.getTime(), to: start.getTime() + day, label: 'hôm nay' };
    }
    if (/(h[ôo]m qua|yesterday)/.test(q)) {
      const start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate() - 1);
      return { from: start.getTime(), to: start.getTime() + day, label: 'hôm qua' };
    }
    if (/(tu[ầa]n n[àa]y|this week)/.test(q)) {
      const start = new Date(now); start.setHours(0,0,0,0);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // monday
      return { from: start.getTime(), to: start.getTime() + 7 * day, label: 'tuần này' };
    }
    if (/(tu[ầa]n tr[ưuớ]+c|last week)/.test(q)) {
      const start = new Date(now); start.setHours(0,0,0,0);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 7);
      return { from: start.getTime(), to: start.getTime() + 7 * day, label: 'tuần trước' };
    }
    if (/(th[áa]ng n[àa]y|this month)/.test(q)) {
      const s = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      return { from: s, to: e, label: 'tháng này' };
    }
    if (/(th[áa]ng tr[ưuớ]+c|last month)/.test(q)) {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const e = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { from: s, to: e, label: 'tháng trước' };
    }
    const m = q.match(/(\d+)\s*ng[àa]y/);
    if (m) {
      const n = parseInt(m[1]);
      return { from: now.getTime() - n * day, to: now.getTime(), label: n + ' ngày gần đây' };
    }
    return null;
  }

  function inRange(iso, range) {
    if (!iso || !range) return false;
    const t = new Date(iso).getTime();
    return t >= range.from && t < range.to;
  }

  function stageLabel(key) {
    const s = (typeof DEAL_STAGES !== 'undefined') ? DEAL_STAGES.find(x => x.key === key) : null;
    return s ? s.label : key;
  }

  /* ----------- HELPER: tìm sale / lead theo tên trong câu hỏi ----------- */
  function matchSale(q) {
    const sales = Storage.getSales();
    return sales.find(s => {
      const parts = s.name.toLowerCase().split(/\s+/);
      // match nếu có 2 từ liền nhau từ tên xuất hiện trong câu hỏi
      for (let i = 0; i < parts.length - 1; i++) {
        if (q.includes(parts[i] + ' ' + parts[i + 1])) return true;
      }
      return false;
    });
  }

  function matchLead(leads, q) {
    // tìm lead có tên xuất hiện trong câu hỏi (ít nhất 2 từ)
    return leads.find(l => {
      const parts = (l.name || '').toLowerCase().split(/\s+/);
      for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i].length >= 3 && q.includes(parts[i] + ' ' + parts[i + 1])) return true;
      }
      return false;
    });
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
    if (!text) return result;
    // Normalize: bỏ ký tự lạ + chuẩn hoá khoảng trắng (giữ \n để phân biệt dòng)
    let clean = text.replace(/\r/g, '').replace(/[|\\]/g, ' ').replace(/[ \t]+/g, ' ');

    // ============================================================
    // 1. CCCD/CMND TRƯỚC — số dài nhất ưu tiên. Sau khi match, xoá khỏi text
    //    để các pattern sau không "ăn" nhầm chữ số.
    // ============================================================
    // CCCD 12 số: thường có label "Số:" hoặc đứng đơn lẻ trên 1 dòng
    let cccdMatch = clean.match(/\b\d{12}\b/);
    if (cccdMatch) {
      result.cccd = cccdMatch[0];
      clean = clean.replace(cccdMatch[0], ' '.repeat(12));
    } else {
      // CMND 9 số
      const id9 = clean.match(/\b\d{9}\b/);
      if (id9) {
        result.cccd = id9[0];
        clean = clean.replace(id9[0], ' '.repeat(9));
      }
    }

    // ============================================================
    // 2. Ngày sinh — pattern dd/mm/yyyy. Xoá khỏi text sau khi match.
    // ============================================================
    let dobMatch = clean.match(/(?:ng[àa]y\s*sinh|date\s*of\s*birth|sinh\s*ng[àa]y|d[oa]b)[:\s\/]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
    if (!dobMatch) {
      // Pattern ngày bất kỳ (yyyy 19xx-20xx để tránh match số sai)
      dobMatch = clean.match(/\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.](?:19|20)\d{2})\b/);
      if (dobMatch) dobMatch[1] = dobMatch[1]; // alias để code dưới đồng nhất
    }
    if (dobMatch) {
      result.dob = (dobMatch[1] || dobMatch[0]).replace(/[.-]/g, '/');
      // remove khỏi clean
      const raw = dobMatch[0];
      clean = clean.replace(raw, ' '.repeat(raw.length));
    }

    // ============================================================
    // 3. SĐT — sau khi đã loại CCCD và ngày, các số còn lại an toàn hơn
    // ============================================================
    const phoneText = clean.replace(/[.\-\s]/g, '');
    const phoneMatch = phoneText.match(/(?:^|\D)(0\d{9}|(?:\+?84)\d{9})(?:\D|$)/);
    if (phoneMatch) result.phone = phoneMatch[1].replace(/^\+?84/, '0');

    // ============================================================
    // 4. Tên — dừng khi gặp keyword kế tiếp
    // ============================================================
    const stopKeywords = '(?=ng[àa]y\\s*sinh|sinh\\s*ng[àa]y|d[oa]b|gi[ớo]i\\s*t[íi]nh|sex|s[ốô]\\s*[:/]|cccd|cmnd|qu[êe]\\s*qu[áa]n|n[ơo]i|qu[ốo]c\\s*t[ịi]ch|date|place|$|\\n)';
    const nameByLabel = clean.match(new RegExp(
      '(?:h[ọo]\\s*v[àa]\\s*t[êe]n|h[ọo]\\s*t[êe]n|full\\s*name)[:\\s\\/]+([\\p{L}][\\p{L}\\s]{2,50}?)\\s*' + stopKeywords,
      'iu'
    ));
    if (nameByLabel) {
      result.name = nameByLabel[1].trim().replace(/\s+/g, ' ');
    } else {
      // Fallback: tìm dòng toàn chữ HOA Việt
      const upperLine = clean.split(/\n+/).map(l => l.trim())
        .find(l => /^[\p{Lu}\s]{6,50}$/u.test(l) && l.split(/\s+/).length >= 2 && l.split(/\s+/).length <= 7);
      if (upperLine) result.name = upperLine;
    }
    // Trim tên: loại bỏ các từ stop nếu lẫn vào
    if (result.name) {
      result.name = result.name.replace(/\s+(S[ốô]|SO|Ng[àa]y|NGAY|Gi[ớo]i|Date|Place|CCCD|CMND).*$/i, '').trim();
    }

    // ============================================================
    // 5. Giới tính
    // ============================================================
    const sexMatch = clean.match(/(?:gi[ớo]i\s*t[íi]nh|sex)[:\s\/]+(Nam|N[ữu]|Male|Female)\b/i);
    if (sexMatch) {
      const v = sexMatch[1].toLowerCase();
      result.sex = (v === 'nam' || v === 'male') ? 'Nam' : 'Nữ';
    }

    // ============================================================
    // 6. Địa chỉ
    // ============================================================
    const addrPatterns = [
      /(?:n[ơo]i\s*th[ưuờ]+ng\s*tr[úu]|place\s*of\s*residence)[:\s\/]+([^\n]{5,150})/i,
      /(?:qu[êe]\s*qu[áa]n|place\s*of\s*origin)[:\s\/]+([^\n]{5,150})/i,
      /(?:đ[ịi]a\s*ch[ỉi]|address)[:\s\/]+([^\n]{5,150})/i
    ];
    for (const pat of addrPatterns) {
      const m = clean.match(pat);
      if (m) {
        result.address = m[1].trim().replace(/\s+/g, ' ').slice(0, 200);
        break;
      }
    }

    // ============================================================
    // 7. Email
    // ============================================================
    const emailMatch = clean.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (emailMatch) result.email = emailMatch[0];

    return result;
  }

  /* ============================================================
   * OCR — scan ảnh CCCD/CMND tự động trích xuất thông tin
   * Dùng Tesseract.js (offline sau lần load đầu tiên ~5MB engine + 4MB Vietnamese)
   * ============================================================ */
  let _tesseractLoading = null;
  let _tesseractReady = false;

  function loadTesseract() {
    if (_tesseractReady) return Promise.resolve();
    if (_tesseractLoading) return _tesseractLoading;
    _tesseractLoading = new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      sc.onload = () => { _tesseractReady = true; resolve(); };
      sc.onerror = () => reject(new Error('Không tải được Tesseract.js — kiểm tra mạng'));
      document.head.appendChild(sc);
    });
    return _tesseractLoading;
  }

  /* Modal: 2 tab — Ảnh CCCD (OCR) và Dán text */
  let currentExtractTab = 'image';
  function openExtractModal() {
    currentExtractTab = 'image';
    const body = `
      <div class="lg-tabs" style="margin-bottom:1rem">
        <button class="lg-tab active" data-tab="image" onclick="AI.switchExtractTab('image')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          📷 Quét ảnh CCCD
        </button>
        <button class="lg-tab" data-tab="text" onclick="AI.switchExtractTab('text')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg>
          📋 Dán text
        </button>
      </div>

      <!-- Tab IMAGE -->
      <div id="aiExtractImageTab">
        <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:.75rem">
          Chụp hoặc tải ảnh CCCD/CMND mặt trước. AI sẽ tự nhận diện họ tên, số CCCD, ngày sinh, giới tính, địa chỉ.
        </p>

        <div class="ocr-dropzone" id="aiOcrDrop">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style="opacity:.35"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
          <strong>Kéo-thả ảnh vào đây</strong>
          <span>hoặc</span>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-top:.5rem">
            <label class="btn btn-secondary btn-sm">
              📁 Chọn file
              <input type="file" id="aiOcrFile" accept="image/*" hidden onchange="AI.handleOcrFile(this.files[0])">
            </label>
            <label class="btn btn-secondary btn-sm">
              📷 Chụp ảnh (mobile)
              <input type="file" id="aiOcrCamera" accept="image/*" capture="environment" hidden onchange="AI.handleOcrFile(this.files[0])">
            </label>
          </div>
          <span style="font-size:.72rem;color:var(--gray-500);margin-top:.5rem">JPG/PNG, &lt; 5MB</span>
        </div>

        <div id="aiOcrPreview" hidden style="margin-top:1rem">
          <div style="display:flex;gap:1rem;align-items:flex-start">
            <img id="aiOcrImg" style="max-width:200px;max-height:140px;border-radius:8px;border:1px solid var(--gray-200)">
            <div style="flex:1">
              <div style="font-size:.85rem;color:var(--gray-700);margin-bottom:.5rem">
                <strong id="aiOcrFileName">—</strong>
                <span id="aiOcrFileSize" style="color:var(--gray-500);font-size:.78rem"></span>
              </div>
              <button class="btn btn-primary btn-sm" id="aiOcrBtn" onclick="AI.runOCR()">🔍 Quét OCR</button>
              <button class="btn btn-ghost btn-sm" onclick="AI.clearOcr()">↺ Đổi ảnh</button>
            </div>
          </div>
        </div>

        <div id="aiOcrProgress" hidden style="margin-top:1rem">
          <div style="font-size:.85rem;margin-bottom:.4rem"><span id="aiOcrStatus">Đang chuẩn bị...</span> <span id="aiOcrPct" style="float:right;font-weight:700"></span></div>
          <div style="background:var(--gray-100);height:8px;border-radius:4px;overflow:hidden">
            <div id="aiOcrBar" style="background:linear-gradient(90deg,var(--futa-green),var(--futa-green-mid));height:100%;width:0%;transition:width .25s"></div>
          </div>
        </div>

        <details id="aiOcrRawWrap" hidden style="margin-top:.85rem">
          <summary style="cursor:pointer;font-size:.78rem;color:var(--gray-500)">Xem text gốc từ OCR</summary>
          <pre id="aiOcrRaw" style="background:#f3f4f6;padding:.65rem;border-radius:8px;font-size:.75rem;max-height:140px;overflow:auto;margin-top:.5rem;white-space:pre-wrap"></pre>
        </details>
      </div>

      <!-- Tab TEXT -->
      <div id="aiExtractTextTab" hidden>
        <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:.75rem">
          Dán text từ app OCR khác (Google Lens, app điện thoại...) hoặc gõ tay.
        </p>
        <div class="form-field full">
          <label>Dán text ở đây</label>
          <textarea id="aiExtractInput" rows="7" placeholder="VD:&#10;CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM&#10;Họ và tên: NGUYỄN VĂN AN&#10;Số: 079201001234&#10;Ngày sinh: 15/03/1990&#10;Giới tính: Nam&#10;Nơi thường trú: 123 Lê Lợi, Q1, TP.HCM&#10;SĐT: 0908123456"></textarea>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="AI.runExtract()">🔍 Phân tích</button>
      </div>

      <div id="aiExtractResult" style="margin-top:1rem"></div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>
      <button class="btn btn-primary" id="aiExtractCreateBtn" onclick="AI.createLeadFromExtract()" disabled>+ Tạo khách hàng</button>
    `;
    Modal.show({ title: '🤖 AI nhận diện CCCD / CMND', body, footer, size: 'lg' });

    // Wire drag & drop
    setTimeout(() => {
      const dz = document.getElementById('aiOcrDrop');
      if (!dz) return;
      ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag-over'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag-over'); }));
      dz.addEventListener('drop', e => {
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) handleOcrFile(f);
      });
    }, 100);
  }

  function switchExtractTab(t) {
    currentExtractTab = t;
    document.querySelectorAll('#aiExtractImageTab, #aiExtractTextTab').forEach(el => {
      el.hidden = !el.id.includes(t === 'image' ? 'ImageTab' : 'TextTab');
    });
    document.querySelectorAll('.lg-tabs .lg-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === t);
    });
  }

  let _ocrFile = null;
  function handleOcrFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Chỉ chấp nhận ảnh', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Ảnh quá lớn (>5MB)', 'error'); return; }
    _ocrFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('aiOcrImg').src = ev.target.result;
      document.getElementById('aiOcrFileName').textContent = file.name;
      document.getElementById('aiOcrFileSize').textContent = ' · ' + (file.size / 1024).toFixed(0) + ' KB';
      document.getElementById('aiOcrDrop').hidden = true;
      document.getElementById('aiOcrPreview').hidden = false;
    };
    reader.readAsDataURL(file);
  }

  function clearOcr() {
    _ocrFile = null;
    document.getElementById('aiOcrDrop').hidden = false;
    document.getElementById('aiOcrPreview').hidden = true;
    document.getElementById('aiOcrProgress').hidden = true;
    document.getElementById('aiOcrRawWrap').hidden = true;
    document.getElementById('aiExtractResult').innerHTML = '';
    document.getElementById('aiExtractCreateBtn').disabled = true;
    document.getElementById('aiOcrFile').value = '';
    document.getElementById('aiOcrCamera').value = '';
  }

  async function runOCR() {
    if (!_ocrFile) { toast('Chọn ảnh trước', 'error'); return; }
    const btn = document.getElementById('aiOcrBtn');
    btn.disabled = true; btn.textContent = '⏳ Đang xử lý...';
    const prog = document.getElementById('aiOcrProgress');
    const status = document.getElementById('aiOcrStatus');
    const pct = document.getElementById('aiOcrPct');
    const bar = document.getElementById('aiOcrBar');
    prog.hidden = false;

    try {
      status.textContent = 'Đang tải engine OCR (~5MB, lần đầu)...';
      pct.textContent = ''; bar.style.width = '10%';
      await loadTesseract();
      if (typeof Tesseract === 'undefined') throw new Error('Tesseract.js không load được');

      status.textContent = 'Đang nhận diện chữ tiếng Việt...';
      const worker = await Tesseract.createWorker('vie', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 100);
            pct.textContent = p + '%';
            bar.style.width = (15 + p * 0.8) + '%';
          } else {
            status.textContent = vietnamizeStatus(m.status);
          }
        }
      });
      const { data } = await worker.recognize(_ocrFile);
      await worker.terminate();

      bar.style.width = '100%';
      pct.textContent = '100%';
      status.textContent = '✅ Xong — phân tích thông tin...';

      const text = data.text || '';
      document.getElementById('aiOcrRaw').textContent = text;
      document.getElementById('aiOcrRawWrap').hidden = false;

      // Run extract trên text OCR
      const fields = extractFields(text);
      lastExtract = fields;
      renderExtractResult(fields, true);

      btn.disabled = false; btn.textContent = '🔍 Quét lại';
    } catch (e) {
      status.textContent = '❌ Lỗi: ' + e.message;
      bar.style.background = '#dc2626';
      btn.disabled = false; btn.textContent = '🔁 Thử lại';
      toast('OCR lỗi: ' + e.message, 'error');
    }
  }

  function vietnamizeStatus(s) {
    return ({
      'loading tesseract core': 'Đang tải lõi Tesseract...',
      'initializing tesseract': 'Khởi tạo Tesseract...',
      'loading language traineddata': 'Đang tải dữ liệu tiếng Việt...',
      'initializing api': 'Khởi tạo API...',
      'recognizing text': 'Đang nhận diện...',
    })[s] || s;
  }

  let lastExtract = null;
  function runExtract() {
    const text = document.getElementById('aiExtractInput').value;
    if (!text.trim()) { toast('Dán text trước', 'error'); return; }
    const fields = extractFields(text);
    lastExtract = fields;
    renderExtractResult(fields, false);
  }

  function renderExtractResult(fields, fromImage) {
    const keys = Object.keys(fields);
    const result = document.getElementById('aiExtractResult');
    if (!keys.length) {
      result.innerHTML = `<div style="background:#fef2f2;color:#7f1d1d;padding:.75rem 1rem;border-radius:8px;font-size:.85rem;border-left:3px solid #dc2626">
        ❌ Không nhận diện được trường nào.
        ${fromImage ? '<br><span style="font-size:.78rem">Ảnh có thể bị mờ/chéo. Thử chụp lại rõ hơn, đủ ánh sáng, không bị che.</span>' : ''}
      </div>`;
      document.getElementById('aiExtractCreateBtn').disabled = true;
      return;
    }
    const labels = { name: 'Họ tên', cccd: 'Số CCCD', phone: 'SĐT', email: 'Email', dob: 'Ngày sinh', sex: 'Giới tính', address: 'Địa chỉ' };
    result.innerHTML = `
      <div style="background:var(--futa-green-light);border-radius:10px;padding:1rem;border-left:3px solid var(--futa-green)">
        <strong style="color:var(--futa-green-dark)">✅ Nhận diện được ${keys.length} trường${fromImage ? ' từ ảnh' : ''}:</strong>
        <div class="info-grid" style="margin-top:.5rem">
          ${keys.map(k => `<div class="info-item"><label>${labels[k] || k}</label><div>${fields[k]}</div></div>`).join('')}
        </div>
        <div style="font-size:.75rem;color:var(--gray-500);margin-top:.65rem">
          💡 Anh có thể sửa lại trong form trước khi lưu nếu OCR sai.
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
        if (lastExtract.name)    { const e = document.getElementById('fName');    if (e) e.value = toTitleCase(lastExtract.name); }
        if (lastExtract.phone)   { const e = document.getElementById('fPhone');   if (e) e.value = lastExtract.phone; }
        if (lastExtract.email)   { const e = document.getElementById('fEmail');   if (e) e.value = lastExtract.email; }
        // CCCD + địa chỉ → vào tab Tổng quan / extended sau khi tạo lead
        // (lưu lại để createFromModal đọc)
        if (lastExtract.cccd || lastExtract.address || lastExtract.dob) {
          window._pendingExtended = {
            cccd: lastExtract.cccd || '',
            address: lastExtract.address || '',
            dob: lastExtract.dob || '',
            sex: lastExtract.sex || ''
          };
        }
        toast('Đã điền ' + Object.keys(lastExtract).length + ' trường từ OCR. Kiểm tra rồi lưu.', 'success');
      }, 150);
    }, 100);
  }

  function toTitleCase(s) {
    if (!s) return s;
    return s.toLowerCase().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  }

  /* ============================================================
   * AI INSIGHTS — tự sinh 3-6 thẻ insight cho Dashboard
   * Mỗi insight: { type:'positive|negative|warning|info', icon, title, body, action? }
   * ============================================================ */
  function generateInsights() {
    const leads = Storage.getLeads();
    const deals = Storage.getDeals();
    const tasks = Storage.getTasks();
    const me = Storage.getCurrentUser();
    const now = Date.now(), day = 86400000;
    const out = [];

    // 1. So sánh doanh số 30d vs 30d trước
    const won = deals.filter(d => ['contract', 'completed'].includes(d.stage));
    const cur30 = won.filter(d => new Date(d.createdAt).getTime() >= now - 30 * day);
    const prev30 = won.filter(d => {
      const t = new Date(d.createdAt).getTime();
      return t >= now - 60 * day && t < now - 30 * day;
    });
    const curRev = cur30.reduce((s, d) => s + d.amount, 0);
    const prevRev = prev30.reduce((s, d) => s + d.amount, 0);
    if (prevRev > 0) {
      const pct = ((curRev - prevRev) / prevRev * 100);
      if (pct >= 10) out.push({
        type: 'positive', icon: '📈', title: 'Doanh số tăng ' + pct.toFixed(0) + '%',
        body: '30 ngày gần nhất ' + formatVND(curRev) + ' so với ' + formatVND(prevRev) + ' kỳ trước.',
        action: { label: 'Xem báo cáo', route: 'reports' }
      });
      else if (pct <= -10) out.push({
        type: 'negative', icon: '📉', title: 'Doanh số giảm ' + Math.abs(pct).toFixed(0) + '%',
        body: 'Cần xem lại pipeline để xác định nguyên nhân.',
        action: { label: 'Xem báo cáo', route: 'reports' }
      });
    } else if (curRev > 0) {
      out.push({ type: 'positive', icon: '🎉', title: '30 ngày khởi sắc', body: 'Doanh số ' + formatVND(curRev) + ' (kỳ trước chưa có deal).' });
    }

    // 2. Sale top performer
    const sales = Storage.getSales().map(s => {
      const my = deals.filter(d => d.salesId === s.id);
      const myWon = my.filter(d => ['contract', 'completed'].includes(d.stage));
      return { s, total: my.length, won: myWon.length, conv: my.length ? myWon.length / my.length : 0, rev: myWon.reduce((a, d) => a + d.amount, 0) };
    }).filter(x => x.total >= 2);
    const topConv = [...sales].sort((a, b) => b.conv - a.conv)[0];
    if (topConv && topConv.conv >= 0.5) {
      out.push({
        type: 'positive', icon: '🏆', title: topConv.s.name + ' dẫn đầu conversion',
        body: 'Conversion ' + (topConv.conv * 100).toFixed(0) + '% (' + topConv.won + '/' + topConv.total + ' deal). Cân nhắc nhân rộng cách làm.',
        action: { label: 'Bảng xếp hạng', route: 'targets' }
      });
    }

    // 3. Stage nghẽn
    const active = deals.filter(d => !['completed', 'cancelled'].includes(d.stage));
    const byStage = {};
    active.forEach(d => byStage[d.stage] = (byStage[d.stage] || 0) + 1);
    const entries = Object.entries(byStage).sort((a, b) => b[1] - a[1]);
    if (entries.length && entries[0][1] >= Math.max(5, active.length * 0.35)) {
      const stage = (typeof DEAL_STAGES !== 'undefined') ? DEAL_STAGES.find(s => s.key === entries[0][0]) : null;
      out.push({
        type: 'warning', icon: '⚠️', title: 'Pipeline có điểm nghẽn ở "' + (stage ? stage.label : entries[0][0]) + '"',
        body: entries[0][1] + ' deal đang dồn ở stage này. Cần kế hoạch đẩy chuyển tiếp.',
        action: { label: 'Xem Pipeline', route: 'pipeline' }
      });
    }

    // 4. Task quá hạn của tôi
    const myOverdue = tasks.filter(t => !t.done && t.assignedTo === me.id && new Date(t.dueAt).getTime() < now - day / 2);
    if (myOverdue.length >= 1) {
      out.push({
        type: 'negative', icon: '🚨', title: myOverdue.length + ' task của bạn đã quá hạn',
        body: myOverdue.slice(0, 2).map(t => '• ' + t.title).join('<br>') + (myOverdue.length > 2 ? '<br>...và ' + (myOverdue.length - 2) + ' task khác' : ''),
        action: { label: 'Xem tất cả', route: 'tasks' }
      });
    }

    // 5. KH nóng cần xử lý ngay
    const hotLeads = leads
      .filter(l => !['closed-won', 'closed-lost'].includes(l.status) && l.assignedTo === me.id)
      .map(l => ({ l, s: scoreLead(l) }))
      .filter(x => x.s.temp === 'hot')
      .sort((a, b) => b.s.score - a.s.score);
    if (hotLeads.length >= 1) {
      out.push({
        type: 'info', icon: '🔥', title: hotLeads.length + ' khách "nóng" của bạn',
        body: 'Top: <strong>' + hotLeads[0].l.name + '</strong> (' + hotLeads[0].s.score + '/100). Nên liên hệ trong 24h.',
        action: { label: 'Xem KH', route: 'lead/' + hotLeads[0].l.id, isDirectLink: true }
      });
    }

    // 6. Forecast tháng tới
    const winRate = (won.length + deals.filter(d => d.stage === 'cancelled').length) > 0
      ? won.length / (won.length + deals.filter(d => d.stage === 'cancelled').length)
      : 0.45;
    const pipeline = active.reduce((s, d) => s + d.amount, 0);
    const forecast = pipeline * winRate;
    if (forecast > 0) {
      out.push({
        type: 'info', icon: '🔮', title: 'Dự đoán 30-60 ngày tới',
        body: 'Ước tính chốt ' + formatVND(Math.round(forecast)) + ' (pipeline ' + formatVND(pipeline) + ' × win-rate ' + (winRate * 100).toFixed(0) + '%).'
      });
    }

    // 7. KH lâu chưa tương tác
    const stale = leads.filter(l => {
      if (['closed-won', 'closed-lost'].includes(l.status)) return false;
      if (l.assignedTo !== me.id) return false;
      const acts = l.activities || [];
      if (!acts.length) return true;
      const last = Math.max(...acts.map(a => new Date(a.at).getTime()));
      return (now - last) > 14 * day;
    });
    if (stale.length >= 3) {
      out.push({
        type: 'warning', icon: '⏰', title: stale.length + ' khách lâu chưa tương tác',
        body: 'Có ' + stale.length + ' KH > 14 ngày chưa có activity. Cần follow up.',
        action: { label: 'Xem danh sách', route: 'leads' }
      });
    }

    return out.slice(0, 6); // max 6 insight
  }

  function renderInsightCard(ins) {
    const colors = {
      positive: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
      negative: { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d' },
      warning:  { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
      info:     { bg: '#dbeafe', border: '#2563eb', text: '#1e3a8a' }
    };
    const c = colors[ins.type] || colors.info;
    const route = ins.action && ins.action.route;
    return `
      <div class="ai-insight-card" style="background:${c.bg};border-left:4px solid ${c.border};color:${c.text}">
        <div class="ai-insight-head">
          <span class="ai-insight-icon">${ins.icon}</span>
          <strong>${ins.title}</strong>
        </div>
        <div class="ai-insight-body">${ins.body}</div>
        ${ins.action ? `<button class="ai-insight-btn" onclick="App.navigate('${route}')" style="color:${c.border}">${ins.action.label} →</button>` : ''}
      </div>
    `;
  }

  return {
    scoreLead, scoreBadge, scoreColor,
    toggleChat, handleSend,
    extractFields, openExtractModal, runExtract, createLeadFromExtract,
    switchExtractTab, handleOcrFile, runOCR, clearOcr,
    generateInsights, renderInsightCard
  };
})();
