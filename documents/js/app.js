/* ============================================================
 * app.js — Router + UI controller + WYSIWYG editor
 * ============================================================ */

(function () {
  'use strict';

  const $    = (sel, root) => (root || document).querySelector(sel);
  const $$   = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const view = $('#view');

  /* ====================================================================
   * UTILITIES
   * ==================================================================== */

  function toast(msg, isError) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2400);
  }

  function tpl(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error('Template not found: ' + id);
    return node.content.cloneNode(true);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function fmtDateVN(s) {
    if (!s) return '';
    // Accept yyyy-mm-dd → "dd/mm/yyyy"
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  }

  function fmtRelTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /** Lấy danh sách field từ chuỗi HTML (regex {{key}}, unique giữ thứ tự) */
  function extractFields(html) {
    const re = /\{\{([a-z0-9_]+)\}\}/gi;
    const out = []; const seen = new Set();
    let m;
    while ((m = re.exec(html))) {
      const k = m[1];
      if (!seen.has(k)) { seen.add(k); out.push(k); }
    }
    return out;
  }

  /** Thay {{key}} → value (escape + nl2br cho textarea) trong HTML */
  function substituteFields(html, values, fieldsMeta) {
    return html.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_, key) => {
      const meta = (fieldsMeta || []).find(f => f.key === key);
      let v = values[key];
      if (v == null || v === '') {
        return `<span class="placeholder-empty">[${key}]</span>`;
      }
      // Format theo type
      if (meta && meta.type === 'date') v = fmtDateVN(v);
      if (meta && meta.type === 'textarea') {
        return escapeHtml(v).replace(/\n/g, '<br>');
      }
      return escapeHtml(v);
    });
  }

  /* ====================================================================
   * REFORMAT — chuẩn hoá định dạng văn bản hành chính
   * Đây là tính năng then chốt theo yêu cầu user.
   *   - Font: Times New Roman 13pt, line-height 1.5
   *   - Bỏ inline color/background "lạ"
   *   - Bỏ <span style> dư thừa từ Word/Google Docs
   *   - <h1..h6> đậm + canh giữa
   *   - Section "CỘNG HOÀ XÃ HỘI..." auto canh giữa, in đậm
   *   - <p> rỗng → giữ ngắt dòng
   * ==================================================================== */
  function reformatHtml(rawHtml) {
    const tmp = document.createElement('div');
    tmp.innerHTML = rawHtml;

    // Bóc các thẻ Office-specific (o:p, w:*, xml, style, meta, link)
    Array.from(tmp.getElementsByTagName('*')).forEach(n => {
      const t = n.tagName.toLowerCase();
      if (t === 'style' || t === 'meta' || t === 'link' || t === 'xml' ||
          t.startsWith('o:') || t.startsWith('w:') || t.startsWith('v:')) {
        n.remove();
      }
    });

    // Đệ quy xử lý từng node
    function walk(node) {
      if (node.nodeType === 1) {
        const el = node;
        const tag = el.tagName.toLowerCase();

        // Bỏ class & style không an toàn (giữ text-align)
        const keepAlign = el.style ? el.style.textAlign : '';
        const keepWeight = el.style ? el.style.fontWeight : '';
        const keepStyle = el.style ? el.style.fontStyle : '';
        el.removeAttribute('class');
        el.removeAttribute('id');
        el.removeAttribute('lang');
        if (el.removeAttribute) {
          ['style','color','bgcolor','width','height','face','size'].forEach(a => el.removeAttribute(a));
        }
        // Re-apply những style hợp lệ
        if (keepAlign && ['p','div','td','th','table','h1','h2','h3','h4'].includes(tag)) {
          el.style.textAlign = keepAlign;
        }
        if (keepWeight && /bold|700|800/.test(keepWeight)) el.style.fontWeight = 'bold';
        if (keepStyle === 'italic') el.style.fontStyle = 'italic';

        // Chuẩn hoá tags
        if (tag === 'font') {
          // <font> deprecated → unwrap
          const span = document.createElement('span');
          span.innerHTML = el.innerHTML;
          el.replaceWith(span);
          walk(span);
          return;
        }
        if (tag === 'div' && el.children.length === 0 && el.textContent.trim() === '') {
          el.replaceWith(document.createElement('p'));
          return;
        }
        // Heading detection: nếu p chỉ chứa text in hoa toàn bộ & ngắn → để in đậm, canh giữa
        if (tag === 'p' && !el.children.length) {
          const txt = el.textContent.trim();
          if (txt.length > 0 && txt.length < 60 && txt === txt.toUpperCase() && /[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]/.test(txt)) {
            if (!el.style.textAlign) el.style.textAlign = 'center';
            el.innerHTML = '<strong>' + el.innerHTML + '</strong>';
          }
        }

        // Đi tiếp vào con
        Array.from(el.childNodes).forEach(walk);
      }
    }
    Array.from(tmp.childNodes).forEach(walk);

    // Trả về HTML đã chuẩn hoá; outer wrapper giữ font Times New Roman 13pt qua CSS .paper
    return tmp.innerHTML;
  }

  /* ====================================================================
   * .DOCX PARSER (basic) — dùng DecompressionStream + minimal ZIP reader
   * Trả về HTML approximate (giữ đoạn, đậm, nghiêng, gạch chân, bảng đơn)
   * Nếu trình duyệt cũ không hỗ trợ → throw, app sẽ báo dùng tab Paste
   * ==================================================================== */
  async function parseDocx(arrayBuffer) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Trình duyệt không hỗ trợ giải nén. Vui lòng dùng tab "Paste từ Word".');
    }
    const view = new DataView(arrayBuffer);
    const u8   = new Uint8Array(arrayBuffer);
    const td   = new TextDecoder('utf-8');

    // Tìm End of Central Directory (signature 0x06054b50) — quét từ cuối
    let eocd = -1;
    for (let i = view.byteLength - 22; i > Math.max(0, view.byteLength - 65536); i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('File .docx không hợp lệ (thiếu EOCD).');

    const cdEntries = view.getUint16(eocd + 10, true);
    const cdSize    = view.getUint32(eocd + 12, true);
    const cdOffset  = view.getUint32(eocd + 16, true);

    let docXmlData = null;
    let p = cdOffset;
    for (let i = 0; i < cdEntries; i++) {
      if (view.getUint32(p, true) !== 0x02014b50) break;
      const method      = view.getUint16(p + 10, true);
      const compSize    = view.getUint32(p + 20, true);
      const uncompSize  = view.getUint32(p + 24, true);
      const nameLen     = view.getUint16(p + 28, true);
      const extraLen    = view.getUint16(p + 30, true);
      const commentLen  = view.getUint16(p + 32, true);
      const localOffset = view.getUint32(p + 42, true);
      const name        = td.decode(u8.subarray(p + 46, p + 46 + nameLen));

      if (name === 'word/document.xml') {
        // Đọc local file header
        const lp = localOffset;
        const lnameLen  = view.getUint16(lp + 26, true);
        const lextraLen = view.getUint16(lp + 28, true);
        const dataStart = lp + 30 + lnameLen + lextraLen;
        const raw = u8.subarray(dataStart, dataStart + compSize);

        if (method === 0) {
          docXmlData = td.decode(raw);
        } else if (method === 8) {
          // deflate-raw
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([raw]).stream().pipeThrough(ds);
          const buf = await new Response(stream).arrayBuffer();
          docXmlData = td.decode(buf);
        } else {
          throw new Error('Phương pháp nén ZIP không hỗ trợ: ' + method);
        }
        break;
      }
      p += 46 + nameLen + extraLen + commentLen;
    }

    if (!docXmlData) throw new Error('Không tìm thấy word/document.xml.');
    return docxXmlToHtml(docXmlData);
  }

  /** Chuyển OOXML đơn giản → HTML giữ b/i/u/p/table/tr/td */
  function docxXmlToHtml(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const ns  = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    let html  = '';

    function processRun(rEl) {
      const tEl  = rEl.getElementsByTagNameNS(ns, 't')[0];
      const text = tEl ? tEl.textContent : '';
      if (!text) {
        const br = rEl.getElementsByTagNameNS(ns, 'br')[0];
        const tab = rEl.getElementsByTagNameNS(ns, 'tab')[0];
        if (br) return '<br>';
        if (tab) return '&nbsp;&nbsp;&nbsp;&nbsp;';
        return '';
      }
      let safe = escapeHtml(text);
      const rPr = rEl.getElementsByTagNameNS(ns, 'rPr')[0];
      if (rPr) {
        if (rPr.getElementsByTagNameNS(ns, 'b').length) safe = '<strong>' + safe + '</strong>';
        if (rPr.getElementsByTagNameNS(ns, 'i').length) safe = '<em>' + safe + '</em>';
        if (rPr.getElementsByTagNameNS(ns, 'u').length) safe = '<u>' + safe + '</u>';
      }
      return safe;
    }

    function processPara(pEl) {
      let inner = '';
      const children = pEl.childNodes;
      for (const c of children) {
        if (c.nodeType !== 1) continue;
        const ln = c.localName;
        if (ln === 'r') inner += processRun(c);
        else if (ln === 'hyperlink') {
          Array.from(c.getElementsByTagNameNS(ns, 'r')).forEach(r => inner += processRun(r));
        }
      }
      if (!inner.trim()) inner = '&nbsp;';
      // Alignment
      const pPr = pEl.getElementsByTagNameNS(ns, 'pPr')[0];
      let align = '';
      if (pPr) {
        const jc = pPr.getElementsByTagNameNS(ns, 'jc')[0];
        if (jc) {
          const v = jc.getAttribute('w:val') || jc.getAttribute('val');
          if (v === 'center') align = 'center';
          else if (v === 'right') align = 'right';
          else if (v === 'both') align = 'justify';
        }
      }
      return `<p${align ? ` style="text-align:${align}"` : ''}>${inner}</p>`;
    }

    function processTable(tbl) {
      let out = '<table>';
      Array.from(tbl.getElementsByTagNameNS(ns, 'tr')).forEach(tr => {
        out += '<tr>';
        Array.from(tr.getElementsByTagNameNS(ns, 'tc')).forEach(tc => {
          let cellHtml = '';
          Array.from(tc.getElementsByTagNameNS(ns, 'p')).forEach(p => cellHtml += processPara(p));
          out += '<td>' + cellHtml + '</td>';
        });
        out += '</tr>';
      });
      return out + '</table>';
    }

    const body = doc.getElementsByTagNameNS(ns, 'body')[0];
    if (!body) return '';
    for (const node of body.childNodes) {
      if (node.nodeType !== 1) continue;
      if (node.localName === 'p') html += processPara(node);
      else if (node.localName === 'tbl') html += processTable(node);
    }
    return html;
  }

  /* ====================================================================
   * VIEW: HOME
   * ==================================================================== */
  function viewHome() {
    view.innerHTML = '';
    view.appendChild(tpl('tpl-home'));

    const grid = $('#dept-grid');
    TEMPLATE_LIBRARY.forEach(d => {
      const userCount = Storage.userTemplates.byDept(d.id).length;
      const total = d.templates.length + userCount;
      const card = document.createElement('a');
      card.className = 'dept-card';
      card.href = '#/dept/' + d.id;
      card.innerHTML = `
        <div class="dept-icon">${d.icon}</div>
        <div class="dept-name">${escapeHtml(d.name)}</div>
        <div class="dept-desc">${escapeHtml(d.desc)}</div>
        <span class="dept-count">${total} mẫu</span>`;
      grid.appendChild(card);
    });
  }

  /* ====================================================================
   * VIEW: DEPARTMENT
   * ==================================================================== */
  function viewDept(deptId) {
    const dept = TEMPLATE_LIBRARY.find(d => d.id === deptId);
    if (!dept) { location.hash = '#/'; return; }

    view.innerHTML = '';
    view.appendChild(tpl('tpl-dept'));
    $$('[data-bind="deptName"]').forEach(el => el.textContent = dept.name);
    $('[data-bind="deptDesc"]').textContent = dept.desc;
    $('[data-action="add-template"]').href = '#/manage?dept=' + deptId;

    const grid = $('[data-bind="templateList"]');
    grid.innerHTML = '';

    dept.templates.forEach(t => grid.appendChild(makeTplCard(t, dept.id, false)));
    Storage.userTemplates.byDept(deptId).forEach(t => grid.appendChild(makeTplCard(t, dept.id, true)));

    if (!grid.children.length) {
      grid.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div>Chưa có template nào.</div>`;
    }
  }

  function makeTplCard(t, deptId, isUser) {
    const card = document.createElement('a');
    card.className = 'tpl-card' + (isUser ? ' user-added' : '');
    card.href = '#/edit/' + (isUser ? 'user:' : 'lib:') + deptId + ':' + t.id;
    card.innerHTML = `
      <span class="tpl-meta">${(t.fields || []).length} trường</span>
      <h4>${escapeHtml(t.name)}</h4>
      <p>${escapeHtml(t.desc || '')}</p>`;
    if (isUser) {
      const del = document.createElement('button');
      del.className = 'tpl-del'; del.textContent = '🗑 Xoá';
      del.title = 'Xoá template tự thêm';
      del.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (confirm('Xoá template "' + t.name + '"?')) {
          Storage.userTemplates.remove(t.id);
          toast('Đã xoá template');
          viewDept(deptId);
        }
      };
      card.appendChild(del);
    }
    return card;
  }

  /* ====================================================================
   * VIEW: EDITOR (điền form + preview)
   * Hash: #/edit/<src>:<deptId>:<tplId>?[draft=<draftId>]
   *   src = 'lib' | 'user'
   * ==================================================================== */
  function viewEditor(args) {
    const [src, deptId, tplId] = args.path.split(':');
    const dept = TEMPLATE_LIBRARY.find(d => d.id === deptId);
    let template;
    if (src === 'lib') template = dept && dept.templates.find(t => t.id === tplId);
    else                template = Storage.userTemplates.get(tplId);
    if (!template) { toast('Không tìm thấy template', true); location.hash = '#/'; return; }

    view.innerHTML = '';
    view.appendChild(tpl('tpl-editor'));
    const deptLink = $('[data-bind="deptLink"]');
    if (dept) { deptLink.href = '#/dept/' + dept.id; deptLink.textContent = dept.name; }
    else      { deptLink.replaceWith(document.createTextNode('Template tự thêm')); }
    $('[data-bind="tplName"]').textContent = template.name;

    // Initial values: defaults + draft
    const draft = args.draftId ? Storage.drafts.get(args.draftId) : null;
    const values = {};
    (template.fields || []).forEach(f => { values[f.key] = (draft && draft.values[f.key]) || f.default || ''; });

    const formEl = $('.form-fields');
    (template.fields || []).forEach(f => formEl.appendChild(makeField(f, values)));

    const preview = $('#preview');
    function renderPreview() {
      preview.innerHTML = substituteFields(template.content, values, template.fields);
    }
    renderPreview();

    formEl.addEventListener('input', e => {
      const k = e.target.dataset.key;
      if (!k) return;
      values[k] = e.target.value;
      renderPreview();
    });

    /* Save draft */
    $('[data-action="save-draft"]').onclick = () => {
      const saved = Storage.drafts.save({
        id: draft ? draft.id : null,
        templateRef: src + ':' + (deptId || '') + ':' + tplId,
        templateName: template.name,
        deptId: deptId,
        values: { ...values }
      });
      toast('Đã lưu nháp');
      location.hash = '#/edit/' + src + ':' + (deptId || '') + ':' + tplId + '?draft=' + saved.id;
    };
    /* Reset */
    $('[data-action="reset"]').onclick = () => {
      if (!confirm('Xoá hết dữ liệu đã nhập?')) return;
      (template.fields || []).forEach(f => {
        values[f.key] = f.default || '';
        const input = formEl.querySelector('[data-key="' + f.key + '"]');
        if (input) input.value = values[f.key];
      });
      renderPreview();
    };
    /* Export Word */
    $('[data-action="export-doc"]').onclick = () => {
      Exporter.toDoc(preview.innerHTML, template.name + '_' + new Date().toISOString().slice(0,10), template.name);
      toast('Đã tải file Word (.doc)');
    };
    /* Export PDF */
    $('[data-action="export-pdf"]').onclick = () => {
      Exporter.toPDF(preview.innerHTML, template.name, template.name);
      toast('Đang mở hộp thoại in — chọn "Save as PDF"');
    };
    /* Print */
    $('[data-action="print"]').onclick = () => {
      Exporter.print(preview.innerHTML, template.name);
    };
  }

  function makeField(f, values) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label class="field-label">${escapeHtml(f.label)}${f.required ? '<span class="req">*</span>' : ''}</label>`;
    let input;
    if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'field-textarea';
    } else if (f.type === 'select') {
      input = document.createElement('select');
      input.className = 'field-select';
      (f.options || []).forEach(opt => {
        const o = document.createElement('option');
        o.value = opt; o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.className = 'field-input';
      input.type = (f.type === 'date') ? 'date' : 'text';
    }
    input.dataset.key = f.key;
    input.placeholder = f.placeholder || '';
    input.value = values[f.key] || '';
    wrap.appendChild(input);
    return wrap;
  }

  /* ====================================================================
   * VIEW: MANAGE TEMPLATES (Add/Edit)
   * ==================================================================== */
  function viewManage(args) {
    view.innerHTML = '';
    view.appendChild(tpl('tpl-manage'));

    // Tabs
    $$('.tab').forEach(tab => {
      tab.onclick = () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        $$('.tab-panel').forEach(p => p.hidden = p.dataset.panel !== tab.dataset.tab);
      };
    });

    // ----- Upload .docx
    const dz = $('#dropzone');
    const fileInput = $('#file-input');
    const uploadEditorHost = $('#upload-editor');
    dz.onclick = () => fileInput.click();
    dz.ondragover  = e => { e.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = ()=> dz.classList.remove('dragover');
    dz.ondrop = async e => {
      e.preventDefault(); dz.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) await handleUpload(file);
    };
    fileInput.onchange = async e => {
      const file = e.target.files[0];
      if (file) await handleUpload(file);
    };

    async function handleUpload(file) {
      try {
        let html;
        const name = file.name.toLowerCase();
        if (name.endsWith('.docx')) {
          toast('Đang phân tích .docx...');
          const buf = await file.arrayBuffer();
          html = await parseDocx(buf);
        } else if (name.endsWith('.html') || name.endsWith('.htm')) {
          html = await file.text();
        } else {
          throw new Error('Định dạng không hỗ trợ. Hãy dùng .docx, .html, hoặc tab "Paste từ Word".');
        }
        uploadEditorHost.hidden = false;
        mountRichEditor(uploadEditorHost, { initialHtml: html, suggestedName: file.name.replace(/\.\w+$/, '') });
        toast('Đã nạp file — định nghĩa trường biến rồi lưu');
      } catch (err) {
        console.error(err);
        toast(err.message || 'Lỗi đọc file', true);
      }
    }

    // ----- Paste
    mountRichEditor($('#paste-editor'), { placeholder: 'Paste nội dung Word vào đây (Ctrl/Cmd+V)...' });

    // ----- Compose
    mountRichEditor($('#compose-editor'), { initialHtml: '<p>Bắt đầu soạn thảo...</p>' });

    // ----- List user templates
    const listHost = $('#user-tpl-list');
    function refreshList() {
      const all = Storage.userTemplates.list();
      listHost.innerHTML = '';
      if (!all.length) {
        listHost.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div>Chưa có template tự thêm.</div>`;
        return;
      }
      all.forEach(t => {
        const dept = TEMPLATE_LIBRARY.find(d => d.id === t.deptId);
        const card = document.createElement('div');
        card.className = 'tpl-card user-added';
        card.innerHTML = `
          <span class="tpl-meta">${dept ? dept.name : 'Chưa xếp phòng ban'} — ${(t.fields||[]).length} trường</span>
          <h4>${escapeHtml(t.name)}</h4>
          <p>${escapeHtml(t.desc || '')}</p>
          <div style="display:flex; gap:.5rem; margin-top:.5rem">
            <a class="btn btn-primary" href="#/edit/user::${t.id}" style="flex:1; justify-content:center">Mở</a>
            <button class="btn" data-del="${t.id}">🗑</button>
          </div>`;
        card.querySelector('[data-del]').onclick = () => {
          if (confirm('Xoá template "' + t.name + '"?')) {
            Storage.userTemplates.remove(t.id);
            refreshList(); toast('Đã xoá');
          }
        };
        listHost.appendChild(card);
      });
    }
    refreshList();

    // Pre-select tab nếu có dept hint
    if (args && args.params && args.params.dept) {
      $('[data-tab="compose"]').click();
    }
  }

  /* ====================================================================
   * RICH TEXT EDITOR (dùng cho 3 tab: upload-preview, paste, compose)
   * ==================================================================== */
  function mountRichEditor(host, opts) {
    opts = opts || {};
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'rt-wrapper';
    wrap.appendChild(tpl('tpl-rich-toolbar'));
    const area = document.createElement('div');
    area.className = 'rt-area';
    area.contentEditable = 'true';
    area.spellcheck = false;
    if (opts.initialHtml) area.innerHTML = opts.initialHtml;
    if (opts.placeholder && !opts.initialHtml) area.dataset.placeholder = opts.placeholder;
    wrap.appendChild(area);

    // Meta panel (fields list)
    const meta = document.createElement('div');
    meta.className = 'rt-fields-meta';
    meta.hidden = true;
    meta.innerHTML = `<h4>Trường biến đã định nghĩa (chỉnh nhãn hiển thị)</h4><div class="meta-rows"></div>`;

    // Save form
    const saveForm = document.createElement('div');
    saveForm.className = 'rt-save-form';
    saveForm.hidden = true;
    saveForm.innerHTML = `
      <div><label>Tên template *</label><input id="rt-name" placeholder="VD: Hợp đồng tài trợ" value="${escapeHtml(opts.suggestedName || '')}"></div>
      <div><label>Mô tả ngắn</label><input id="rt-desc"></div>
      <div><label>Phòng ban *</label><select id="rt-dept">
        ${TEMPLATE_LIBRARY.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}
      </select></div>
      <button class="btn btn-primary" id="rt-save-btn">💾 Lưu template vào hệ thống</button>`;

    host.appendChild(wrap);
    host.appendChild(meta);
    host.appendChild(saveForm);

    /* ===== Toolbar handlers ===== */
    function exec(cmd, val) {
      area.focus();
      document.execCommand(cmd, false, val);
    }

    wrap.querySelector('.rt-toolbar').addEventListener('click', e => {
      const btn = e.target.closest('button[data-cmd]');
      if (!btn) return;
      const cmd = btn.dataset.cmd;
      if (cmd === 'insertField')         return insertField();
      if (cmd === 'reformat')            return doReformat();
      if (cmd === 'save-as-template')    return openSaveFlow();
      exec(cmd);
    });
    wrap.querySelector('.rt-toolbar').addEventListener('change', e => {
      const sel = e.target.closest('select[data-cmd]');
      if (!sel) return;
      exec(sel.dataset.cmd, sel.value);
    });

    function insertField() {
      const key = prompt('Tên khoá trường biến (chỉ chữ thường, số, _):\nVD: ten_khach_hang');
      if (!key) return;
      const safe = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!safe.match(/^[a-z][a-z0-9_]*$/)) {
        return toast('Tên không hợp lệ. Bắt đầu bằng chữ, chỉ chứa a-z, 0-9, _', true);
      }
      area.focus();
      // Chèn token {{key}}; sau khi extractFields sẽ nhận diện
      document.execCommand('insertText', false, '{{' + safe + '}}');
      refreshMeta();
    }

    function doReformat() {
      area.innerHTML = reformatHtml(area.innerHTML);
      toast('Đã chuẩn hoá định dạng theo chuẩn FUTA (Times New Roman 13pt)');
      refreshMeta();
    }

    // Tự refresh meta panel mỗi khi gõ
    let refreshTimer;
    area.addEventListener('input', () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refreshMeta, 250);
    });
    // Highlight {{xxx}} chỉ ở chế độ overlay không khả thi với contenteditable
    // → để đơn giản: meta panel hiển thị danh sách

    function refreshMeta() {
      const keys = extractFields(area.innerHTML);
      meta.hidden = keys.length === 0;
      const rows = meta.querySelector('.meta-rows');
      rows.innerHTML = '';
      if (!keys.length) return;
      // Lấy metadata đã có trên element (nếu đang sửa)
      const prev = host._fieldsMeta || [];
      const next = keys.map(k => {
        const prior = prev.find(f => f.key === k);
        return prior || { key: k, label: humanize(k), type: 'text' };
      });
      host._fieldsMeta = next;

      next.forEach((f, i) => {
        const row = document.createElement('div');
        row.className = 'meta-row';
        row.innerHTML = `
          <code>{{${escapeHtml(f.key)}}}</code>
          <input value="${escapeHtml(f.label)}" placeholder="Nhãn hiển thị (VD: Họ tên khách hàng)">
          <select>
            <option value="text"     ${f.type==='text'?'selected':''}>Một dòng</option>
            <option value="textarea" ${f.type==='textarea'?'selected':''}>Nhiều dòng</option>
            <option value="date"     ${f.type==='date'?'selected':''}>Ngày</option>
          </select>
          <button class="meta-del" title="Xoá khỏi nội dung">×</button>`;
        const [labelInput, typeSel, delBtn] = [
          row.querySelector('input'), row.querySelector('select'), row.querySelector('button')
        ];
        labelInput.oninput = () => { next[i].label = labelInput.value; };
        typeSel.onchange   = () => { next[i].type  = typeSel.value; };
        delBtn.onclick = () => {
          // Xoá tất cả {{key}} khỏi area
          const re = new RegExp('\\{\\{' + f.key + '\\}\\}', 'g');
          area.innerHTML = area.innerHTML.replace(re, '');
          refreshMeta();
        };
        rows.appendChild(row);
      });
    }
    refreshMeta();

    function openSaveFlow() {
      const keys = extractFields(area.innerHTML);
      if (!area.textContent.trim()) return toast('Nội dung trống', true);
      saveForm.hidden = false;
      saveForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const btn = saveForm.querySelector('#rt-save-btn');
      btn.onclick = () => {
        const name = saveForm.querySelector('#rt-name').value.trim();
        const desc = saveForm.querySelector('#rt-desc').value.trim();
        const deptId = saveForm.querySelector('#rt-dept').value;
        if (!name) return toast('Phải nhập tên template', true);
        const t = {
          name, desc, deptId,
          fields: keys.length ? (host._fieldsMeta || keys.map(k => ({ key: k, label: humanize(k), type: 'text' }))) : [],
          content: area.innerHTML
        };
        Storage.userTemplates.save(t);
        toast('Đã lưu template "' + name + '"');
        saveForm.hidden = true;
        setTimeout(() => { location.hash = '#/dept/' + deptId; }, 400);
      };
    }
  }

  function humanize(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /* ====================================================================
   * VIEW: HISTORY
   * ==================================================================== */
  function viewHistory() {
    view.innerHTML = '';
    view.appendChild(tpl('tpl-history'));
    const host = $('#history-list');
    const drafts = Storage.drafts.list();
    if (!drafts.length) {
      host.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div>
        Chưa có bản nháp nào.<br>Soạn 1 văn bản và bấm "Lưu nháp" để bản đó xuất hiện ở đây.</div>`;
      return;
    }
    drafts.forEach(d => {
      const row = document.createElement('div');
      row.className = 'history-row';
      const firstVal = Object.values(d.values || {}).find(v => v && v.length > 4) || '';
      row.innerHTML = `
        <div>
          <div class="h-title">${escapeHtml(d.templateName || 'Bản nháp')}</div>
          <div class="h-meta">${escapeHtml(firstVal.slice(0, 80))}</div>
        </div>
        <div class="h-date">${fmtRelTime(d.updatedAt)}</div>
        <div class="h-actions">
          <a class="btn btn-primary" href="#/edit/${escapeHtml(d.templateRef)}?draft=${d.id}">Mở</a>
          <button class="btn" data-del="${d.id}">🗑</button>
        </div>`;
      row.querySelector('[data-del]').onclick = () => {
        if (confirm('Xoá bản nháp này?')) {
          Storage.drafts.remove(d.id);
          viewHistory();
        }
      };
      host.appendChild(row);
    });
  }

  /* ====================================================================
   * ROUTER
   * ==================================================================== */
  function parseHash() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const [path, qs] = h.split('?');
    const params = {};
    if (qs) qs.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { path, params };
  }

  function route() {
    const { path, params } = parseHash();
    // Update active nav
    $$('.topnav a').forEach(a => a.classList.remove('active'));

    const seg = path.split('/').filter(Boolean);
    if (seg.length === 0) {
      $$('.topnav [data-nav="home"]').forEach(a => a.classList.add('active'));
      return viewHome();
    }
    if (seg[0] === 'dept' && seg[1]) {
      $$('.topnav [data-nav="home"]').forEach(a => a.classList.add('active'));
      return viewDept(seg[1]);
    }
    if (seg[0] === 'edit' && seg[1]) {
      return viewEditor({ path: seg.slice(1).join('/'), draftId: params.draft });
    }
    if (seg[0] === 'manage') {
      $$('.topnav [data-nav="manage"]').forEach(a => a.classList.add('active'));
      return viewManage({ params });
    }
    if (seg[0] === 'history') {
      $$('.topnav [data-nav="history"]').forEach(a => a.classList.add('active'));
      return viewHistory();
    }
    location.hash = '#/';
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') route();
})();
