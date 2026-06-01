/* ============================================================
 * FUTA HUB CRM - CONFIG (nhúng sẵn cho bản deploy)
 * ============================================================
 * Để nhiều tester DÙNG CHUNG data mà KHÔNG ai phải tự nhập key:
 *   1. Tạo project Supabase free → vào Settings → API
 *   2. Copy "Project URL" và "anon public key" dán vào dưới đây
 *   3. Deploy lại (hoặc refresh) — mọi tester tự động kết nối
 *
 * Để trống = app chạy offline (LocalStorage) như bình thường.
 * Lưu ý: anon key là khóa CÔNG KHAI (an toàn để nhúng), quyền
 * truy cập do RLS trên Supabase quyết định.
 * ============================================================ */

window.FUTA_CONFIG = {
  supabaseUrl: "https://dhidmpsrwsfqkgglgdnp.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoaWRtcHNyd3NmcWtnZ2xnZG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDE3OTEsImV4cCI6MjA5NTg3Nzc5MX0.agMwhAOOs2ERgGR7dMdimG4eNMfxDypo_FicrdrDDdk"
};
