/* ============================================================
 * SENDER — gửi batch email qua Google Apps Script Web App
 * ============================================================ */
const Sender = (() => {
  let aborted = false;

  /**
   * Gửi 1 email qua Apps Script.
   * Apps Script được deploy với "Execute as: Me" + "Who has access: Anyone".
   * Endpoint nhận POST JSON: { to, subject, htmlBody, fromName, replyTo? }
   * Response: { ok: true } hoặc { ok: false, error: "..." }
   */
  const sendOne = async (scriptUrl, payload) => {
    if (!scriptUrl) throw new Error('Chưa cấu hình Apps Script URL');
    // Dùng text/plain để tránh CORS preflight (Apps Script Web App không trả CORS headers cho OPTIONS)
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Apps Script trả lỗi không rõ');
    return data;
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /**
   * Gửi batch.
   * @param {Object} cfg { subject, body, recipients, settings }
   * @param {Function} onProgress (current, total, result) => void
   * @returns {Promise<{ ok: number, fail: number, results: Array }>}
   */
  const sendBatch = async (cfg, onProgress) => {
    aborted = false;
    const { subject, body, recipients, settings } = cfg;
    const total = recipients.length;
    const results = [];
    let ok = 0, fail = 0;

    for (let i = 0; i < total; i++) {
      if (aborted) {
        results.push({ email: recipients[i].email, ok: false, error: 'Đã hủy' });
        fail++;
        onProgress?.(i + 1, total, results[results.length - 1]);
        continue;
      }
      const r = recipients[i];
      const vars = Recipients.variableMapFor(r);
      const renderedSubject = TemplateEngine.renderRaw(subject, vars);
      const renderedBody = TemplateEngine.renderRaw(body, vars);
      const htmlBody = bodyToHtml(renderedBody);

      try {
        await sendOne(settings.scriptUrl, {
          to: r.email,
          subject: renderedSubject,
          htmlBody,
          fromName: settings.senderName || '',
        });
        ok++;
        results.push({ email: r.email, ok: true });
      } catch (e) {
        fail++;
        results.push({ email: r.email, ok: false, error: e.message });
      }
      onProgress?.(i + 1, total, results[results.length - 1]);

      if (i < total - 1 && (settings.throttleMs | 0) > 0) await sleep(settings.throttleMs | 0);
    }
    return { ok, fail, results };
  };

  /** Gửi 1 email test cho chính user */
  const sendTest = async ({ subject, body, settings, sampleRecipient }) => {
    if (!settings.testEmail) throw new Error('Chưa cấu hình email test trong Cài đặt');
    const vars = sampleRecipient ? Recipients.variableMapFor(sampleRecipient) : {};
    return sendOne(settings.scriptUrl, {
      to: settings.testEmail,
      subject: '[TEST] ' + TemplateEngine.renderRaw(subject, vars),
      htmlBody: bodyToHtml(TemplateEngine.renderRaw(body, vars)),
      fromName: settings.senderName || '',
    });
  };

  /** Ping endpoint to test connection */
  const testConnection = async (scriptUrl) => {
    if (!scriptUrl) throw new Error('Chưa nhập URL');
    const res = await fetch(scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'ping=1', {
      method: 'GET',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  /** Convert plain text body to HTML — preserve line breaks; allow raw HTML if user typed tags */
  const bodyToHtml = (text) => {
    if (!text) return '';
    // Heuristic: if body contains an HTML opener like <p>, <div>, <br>, treat as HTML.
    const looksHtml = /<\w+[^>]*>/.test(text);
    if (looksHtml) return text;
    return text
      .split(/\n{2,}/)
      .map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>')
      .join('');
  };

  const abort = () => { aborted = true; };

  return { sendBatch, sendTest, testConnection, abort };
})();
