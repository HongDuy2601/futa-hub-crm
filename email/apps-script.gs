/**
 * ============================================================
 * FUTA Land — Email Marketing · Apps Script Web App
 * ============================================================
 *
 * Endpoint nhận POST từ app frontend (email/index.html), gửi
 * email qua chính tài khoản Google Workspace đang chạy script.
 *
 * Quota Workspace: ~1.500 email/ngày/người (MailApp.getRemainingDailyQuota()).
 *
 * --- DEPLOY (1 lần) ---
 * 1. Mở https://script.google.com → New project.
 * 2. Đặt tên: "FUTA Email Sender".
 * 3. Xóa code mặc định, dán toàn bộ file này vào Code.gs → Save.
 * 4. Deploy → New deployment → Type: Web app
 *      - Execute as: Me (chính bạn — email gửi sẽ từ địa chỉ này)
 *      - Who has access: Anyone (yêu cầu để frontend gọi được)
 * 5. Authorize quyền gửi email khi Google hỏi.
 * 6. Copy "Web app URL" → dán vào Cài đặt của app frontend.
 *
 * Mỗi lần sửa code: Deploy → Manage deployments → ✏ chỉnh
 * deployment hiện tại → Version: New version → Deploy.
 * URL giữ nguyên.
 *
 * --- BẢO MẬT ---
 * Endpoint "Anyone" có nghĩa ai có URL đều gọi được. Để hạn chế:
 *   - Đặt SHARED_SECRET dưới đây thành chuỗi ngẫu nhiên, và
 *     copy chuỗi đó vào ô "Mã bảo mật" trong Cài đặt của app.
 *   - Frontend sẽ gửi kèm secret, script này từ chối nếu sai.
 *
 * (Tùy chọn — phiên bản hiện tại của frontend chưa truyền secret;
 *  để bật, thêm field `secret` vào payload POST và set biến dưới.)
 * ============================================================ */

const SHARED_SECRET = ''; // để trống = không kiểm tra

/** GET — dùng cho test kết nối (ping) */
function doGet(e) {
  return jsonResponse({
    ok: true,
    email: Session.getActiveUser().getEmail(),
    quotaRemaining: MailApp.getRemainingDailyQuota(),
    version: '1.0',
  });
}

/** POST — gửi 1 email */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || '{}');

    if (SHARED_SECRET && payload.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    var to       = String(payload.to       || '').trim();
    var subject  = String(payload.subject  || '').trim();
    var htmlBody = String(payload.htmlBody || '').trim();
    var fromName = String(payload.fromName || '').trim();
    var replyTo  = String(payload.replyTo  || '').trim();

    if (!to)      return jsonResponse({ ok: false, error: 'Thiếu "to"' });
    if (!subject) return jsonResponse({ ok: false, error: 'Thiếu tiêu đề' });
    if (!htmlBody) return jsonResponse({ ok: false, error: 'Thiếu nội dung' });

    var options = { htmlBody: htmlBody };
    if (fromName) options.name = fromName;
    if (replyTo)  options.replyTo = replyTo;

    MailApp.sendEmail(to, subject, stripHtml(htmlBody), options);

    return jsonResponse({
      ok: true,
      to: to,
      quotaRemaining: MailApp.getRemainingDailyQuota(),
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function stripHtml(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
