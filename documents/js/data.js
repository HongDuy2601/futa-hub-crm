/* ============================================================
 * FUTA LAND - Soạn thảo Văn bản Nội bộ
 * data.js — Thư viện template chuẩn theo phòng ban
 * ============================================================
 * Cấu trúc:
 *   department: { id, name, icon, desc, templates: [...] }
 *   template:   { id, name, desc, fields: [...], content: HTML }
 *   field:      { key, label, type, placeholder?, required?, default? }
 *
 *   Trong content dùng {{key}} để đánh dấu chỗ điền.
 *   App tự sinh form từ fields & substitute vào content.
 * ============================================================ */

const TEMPLATE_LIBRARY = [
  /* ============ KINH DOANH ============ */
  {
    id: 'kinh-doanh',
    name: 'Kinh doanh',
    icon: '💼',
    desc: 'Hợp đồng đặt cọc, báo giá, biên bản bàn giao, đề xuất bán hàng',
    templates: [
      {
        id: 'kd-coc',
        name: 'Hợp đồng đặt cọc',
        desc: 'Mẫu hợp đồng đặt cọc mua bán bất động sản',
        fields: [
          { key: 'so_hd',      label: 'Số hợp đồng',          type: 'text',  placeholder: 'VD: 001/2026/HĐĐC-FTL', required: true },
          { key: 'ngay',       label: 'Ngày ký',              type: 'date',  required: true },
          { key: 'ben_a_ten',  label: 'Bên A — Họ tên',       type: 'text',  required: true },
          { key: 'ben_a_cccd', label: 'Bên A — CCCD/CMND',    type: 'text' },
          { key: 'ben_a_dc',   label: 'Bên A — Địa chỉ',      type: 'text' },
          { key: 'ben_b_ten',  label: 'Bên B — Họ tên',       type: 'text',  required: true, default: 'CÔNG TY CỔ PHẦN FUTA LAND' },
          { key: 'ben_b_dc',   label: 'Bên B — Địa chỉ',      type: 'text' },
          { key: 'tai_san',    label: 'Tài sản đặt cọc',      type: 'textarea', placeholder: 'Mô tả căn hộ/lô đất...' },
          { key: 'so_tien',    label: 'Số tiền đặt cọc (VNĐ)', type: 'text', required: true },
          { key: 'so_tien_chu',label: 'Bằng chữ',             type: 'text' },
          { key: 'thoi_han',   label: 'Thời hạn đặt cọc (ngày)', type: 'text' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center">————————</p>
<p style="text-align:center"><strong style="font-size:14pt">HỢP ĐỒNG ĐẶT CỌC</strong></p>
<p style="text-align:center">Số: {{so_hd}}</p>
<p>Hôm nay, ngày {{ngay}}, tại trụ sở Công ty Cổ phần FUTA Land, chúng tôi gồm:</p>
<p><strong>BÊN NHẬN ĐẶT CỌC (BÊN A):</strong> {{ben_a_ten}}</p>
<p>CCCD/CMND số: {{ben_a_cccd}}</p>
<p>Địa chỉ: {{ben_a_dc}}</p>
<p><strong>BÊN ĐẶT CỌC (BÊN B):</strong> {{ben_b_ten}}</p>
<p>Địa chỉ: {{ben_b_dc}}</p>
<p>Hai bên thoả thuận ký kết hợp đồng đặt cọc với các điều khoản sau:</p>
<p><strong>Điều 1. Đối tượng đặt cọc</strong></p>
<p>{{tai_san}}</p>
<p><strong>Điều 2. Số tiền đặt cọc</strong></p>
<p>Số tiền: <strong>{{so_tien}} VNĐ</strong> (Bằng chữ: {{so_tien_chu}}).</p>
<p><strong>Điều 3. Thời hạn đặt cọc</strong></p>
<p>Thời hạn: {{thoi_han}} ngày kể từ ngày ký hợp đồng này.</p>
<p><strong>Điều 4. Cam kết chung</strong></p>
<p>Hai bên cam kết thực hiện đúng các nội dung đã thoả thuận. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
<table style="width:100%; margin-top:32px">
  <tr>
    <td style="text-align:center; width:50%"><strong>BÊN A</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
    <td style="text-align:center; width:50%"><strong>BÊN B</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
  </tr>
</table>`
      },
      {
        id: 'kd-bao-gia',
        name: 'Phiếu báo giá',
        desc: 'Báo giá sản phẩm/dịch vụ gửi khách hàng',
        fields: [
          { key: 'so_bg',     label: 'Số báo giá',         type: 'text', placeholder: 'VD: BG-2026-001' },
          { key: 'ngay',      label: 'Ngày',               type: 'date' },
          { key: 'kh_ten',    label: 'Khách hàng',         type: 'text', required: true },
          { key: 'kh_dc',     label: 'Địa chỉ',            type: 'text' },
          { key: 'kh_lh',     label: 'Người liên hệ',      type: 'text' },
          { key: 'noi_dung',  label: 'Nội dung báo giá',   type: 'textarea', placeholder: 'Liệt kê sản phẩm/dịch vụ, đơn giá, số lượng...' },
          { key: 'tong_tien', label: 'Tổng tiền (đã VAT)', type: 'text' },
          { key: 'hieu_luc',  label: 'Hiệu lực báo giá',   type: 'text', default: '30 ngày kể từ ngày phát hành' }
        ],
        content: `
<table style="width:100%; border-bottom:2px solid #1B5E20; padding-bottom:8px">
  <tr>
    <td><strong style="font-size:14pt">CÔNG TY CỔ PHẦN FUTA LAND</strong><br>
        <em>Địa chỉ: ...</em><br>
        <em>Hotline: ...</em></td>
    <td style="text-align:right"><strong>BÁO GIÁ</strong><br>Số: {{so_bg}}<br>Ngày: {{ngay}}</td>
  </tr>
</table>
<p style="margin-top:24px"><strong>Kính gửi:</strong> {{kh_ten}}</p>
<p><strong>Địa chỉ:</strong> {{kh_dc}}</p>
<p><strong>Người liên hệ:</strong> {{kh_lh}}</p>
<p>FUTA Land trân trọng gửi đến Quý khách hàng báo giá chi tiết như sau:</p>
<div>{{noi_dung}}</div>
<p style="margin-top:16px"><strong>TỔNG GIÁ TRỊ (đã bao gồm VAT): {{tong_tien}} VNĐ</strong></p>
<p><em>Hiệu lực báo giá: {{hieu_luc}}.</em></p>
<p style="margin-top:32px; text-align:right"><strong>NGƯỜI LẬP BÁO GIÁ</strong><br><em>(Ký, ghi rõ họ tên)</em></p>`
      },
      {
        id: 'kd-bb-ban-giao',
        name: 'Biên bản bàn giao',
        desc: 'Biên bản bàn giao căn hộ/biệt thự cho khách hàng',
        fields: [
          { key: 'so_bb',     label: 'Số biên bản',           type: 'text' },
          { key: 'ngay',      label: 'Ngày bàn giao',         type: 'date' },
          { key: 'du_an',     label: 'Dự án',                 type: 'text' },
          { key: 'ma_can',    label: 'Mã căn / Lô',           type: 'text' },
          { key: 'kh_ten',    label: 'Khách hàng',            type: 'text' },
          { key: 'kh_cccd',   label: 'CCCD/CMND khách hàng',  type: 'text' },
          { key: 'tinh_trang', label: 'Tình trạng bàn giao',  type: 'textarea', placeholder: 'Mô tả tình trạng nội thất, thiết bị...' },
          { key: 'kem_theo',  label: 'Hồ sơ kèm theo',         type: 'textarea', placeholder: 'Chìa khoá, sổ tay cư dân, thẻ thang máy...' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">BIÊN BẢN BÀN GIAO</strong></p>
<p style="text-align:center">Số: {{so_bb}}</p>
<p>Hôm nay, ngày {{ngay}}, tại dự án <strong>{{du_an}}</strong>, hai bên gồm:</p>
<p><strong>BÊN GIAO:</strong> Công ty Cổ phần FUTA Land</p>
<p><strong>BÊN NHẬN:</strong> {{kh_ten}} — CCCD: {{kh_cccd}}</p>
<p>Cùng tiến hành bàn giao tài sản: <strong>{{ma_can}}</strong> thuộc dự án {{du_an}}.</p>
<p><strong>Tình trạng bàn giao:</strong></p>
<p>{{tinh_trang}}</p>
<p><strong>Hồ sơ kèm theo:</strong></p>
<p>{{kem_theo}}</p>
<p>Bên nhận đã kiểm tra và đồng ý với tình trạng tài sản nêu trên. Biên bản được lập thành 02 bản có giá trị pháp lý như nhau.</p>
<table style="width:100%; margin-top:32px">
  <tr>
    <td style="text-align:center"><strong>BÊN GIAO</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
    <td style="text-align:center"><strong>BÊN NHẬN</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
  </tr>
</table>`
      }
    ]
  },

  /* ============ HÀNH CHÍNH - TỔNG HỢP ============ */
  {
    id: 'hanh-chinh',
    name: 'Hành chính — Tổng hợp',
    icon: '🗂',
    desc: 'Công văn, tờ trình, quyết định, thông báo, biên bản họp',
    templates: [
      {
        id: 'hc-cong-van',
        name: 'Công văn đề nghị',
        desc: 'Mẫu công văn gửi đơn vị/cá nhân khác',
        fields: [
          { key: 'so_cv',    label: 'Số công văn',          type: 'text', placeholder: 'VD: 12/CV-FTL' },
          { key: 'ngay',     label: 'Ngày',                 type: 'date' },
          { key: 'nguoi_nhan', label: 'Kính gửi',           type: 'text', required: true },
          { key: 'trich_yeu', label: 'Trích yếu (V/v)',     type: 'text', required: true },
          { key: 'noi_dung', label: 'Nội dung công văn',    type: 'textarea', required: true },
          { key: 'noi_nhan', label: 'Nơi nhận (cuối văn bản)', type: 'textarea', default: '- Như trên;\n- Lưu: VT.' },
          { key: 'chuc_vu_ky', label: 'Chức vụ người ký',   type: 'text', default: 'TỔNG GIÁM ĐỐC' },
          { key: 'nguoi_ky',  label: 'Họ tên người ký',     type: 'text' }
        ],
        content: `
<table style="width:100%">
  <tr>
    <td style="width:50%; text-align:center">
      <strong>CÔNG TY CỔ PHẦN<br>FUTA LAND</strong><br>
      ————<br>
      Số: {{so_cv}}<br>
      V/v {{trich_yeu}}
    </td>
    <td style="width:50%; text-align:center">
      <strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
      <em>Độc lập - Tự do - Hạnh phúc</em><br>
      ————<br>
      <em>TP.HCM, ngày {{ngay}}</em>
    </td>
  </tr>
</table>
<p style="margin-top:24px"><strong>Kính gửi:</strong> {{nguoi_nhan}}</p>
<p>{{noi_dung}}</p>
<p>Trân trọng./.</p>
<table style="width:100%; margin-top:24px">
  <tr>
    <td style="vertical-align:top; width:50%">
      <strong><em>Nơi nhận:</em></strong><br>
      <span style="white-space:pre-line">{{noi_nhan}}</span>
    </td>
    <td style="text-align:center; vertical-align:top; width:50%">
      <strong>{{chuc_vu_ky}}</strong><br>
      <em>(Ký, đóng dấu)</em><br><br><br><br>
      <strong>{{nguoi_ky}}</strong>
    </td>
  </tr>
</table>`
      },
      {
        id: 'hc-to-trinh',
        name: 'Tờ trình',
        desc: 'Tờ trình xin phê duyệt nội bộ',
        fields: [
          { key: 'so_tt',  label: 'Số tờ trình', type: 'text' },
          { key: 'ngay',   label: 'Ngày',        type: 'date' },
          { key: 'kinh_gui', label: 'Kính gửi',  type: 'text', default: 'Ban Tổng Giám đốc' },
          { key: 've_viec', label: 'Về việc',    type: 'text', required: true },
          { key: 'can_cu', label: 'Căn cứ',      type: 'textarea', placeholder: '- Căn cứ ...\n- Căn cứ ...' },
          { key: 'noi_dung', label: 'Nội dung trình', type: 'textarea', required: true },
          { key: 'kien_nghi', label: 'Kiến nghị', type: 'textarea' },
          { key: 'nguoi_ky', label: 'Người ký',  type: 'text' },
          { key: 'chuc_vu',  label: 'Chức vụ',   type: 'text' }
        ],
        content: `
<table style="width:100%">
  <tr>
    <td style="width:50%; text-align:center">
      <strong>CÔNG TY CỔ PHẦN<br>FUTA LAND</strong><br>————<br>
      Số: {{so_tt}}/TTr-FTL
    </td>
    <td style="width:50%; text-align:center">
      <strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
      <em>Độc lập - Tự do - Hạnh phúc</em><br>————<br>
      <em>TP.HCM, ngày {{ngay}}</em>
    </td>
  </tr>
</table>
<p style="text-align:center; margin-top:24px"><strong style="font-size:14pt">TỜ TRÌNH</strong></p>
<p style="text-align:center"><em>V/v {{ve_viec}}</em></p>
<p><strong>Kính gửi:</strong> {{kinh_gui}}</p>
<p><strong>Căn cứ:</strong></p>
<p style="white-space:pre-line">{{can_cu}}</p>
<p><strong>Nội dung trình:</strong></p>
<p>{{noi_dung}}</p>
<p><strong>Kiến nghị:</strong></p>
<p>{{kien_nghi}}</p>
<p>Kính trình {{kinh_gui}} xem xét, phê duyệt./.</p>
<p style="text-align:right; margin-top:24px"><strong>{{chuc_vu}}</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br><strong>{{nguoi_ky}}</strong></p>`
      },
      {
        id: 'hc-quyet-dinh',
        name: 'Quyết định',
        desc: 'Quyết định hành chính nội bộ',
        fields: [
          { key: 'so_qd',     label: 'Số quyết định',    type: 'text' },
          { key: 'ngay',      label: 'Ngày',             type: 'date' },
          { key: 've_viec',   label: 'Về việc',          type: 'text', required: true },
          { key: 'can_cu',    label: 'Căn cứ',           type: 'textarea' },
          { key: 'dieu_1',    label: 'Điều 1',           type: 'textarea', required: true },
          { key: 'dieu_2',    label: 'Điều 2',           type: 'textarea' },
          { key: 'dieu_3',    label: 'Điều 3 (hiệu lực + thi hành)', type: 'textarea', default: 'Quyết định này có hiệu lực kể từ ngày ký. Các phòng ban liên quan chịu trách nhiệm thi hành Quyết định này.' },
          { key: 'nguoi_ky',  label: 'Người ký',         type: 'text' },
          { key: 'chuc_vu',   label: 'Chức vụ người ký', type: 'text', default: 'TỔNG GIÁM ĐỐC' }
        ],
        content: `
<table style="width:100%">
  <tr>
    <td style="text-align:center"><strong>CÔNG TY CỔ PHẦN<br>FUTA LAND</strong><br>————<br>Số: {{so_qd}}/QĐ-FTL</td>
    <td style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br><em>Độc lập - Tự do - Hạnh phúc</em><br>————<br><em>TP.HCM, ngày {{ngay}}</em></td>
  </tr>
</table>
<p style="text-align:center; margin-top:24px"><strong style="font-size:14pt">QUYẾT ĐỊNH</strong></p>
<p style="text-align:center"><em>V/v {{ve_viec}}</em></p>
<p style="text-align:center"><strong>TỔNG GIÁM ĐỐC CÔNG TY CỔ PHẦN FUTA LAND</strong></p>
<p style="white-space:pre-line">{{can_cu}}</p>
<p style="text-align:center"><strong>QUYẾT ĐỊNH:</strong></p>
<p><strong>Điều 1.</strong> {{dieu_1}}</p>
<p><strong>Điều 2.</strong> {{dieu_2}}</p>
<p><strong>Điều 3.</strong> {{dieu_3}}</p>
<p style="text-align:right; margin-top:32px"><strong>{{chuc_vu}}</strong><br><em>(Ký, đóng dấu)</em><br><br><br><strong>{{nguoi_ky}}</strong></p>`
      },
      {
        id: 'hc-thong-bao',
        name: 'Thông báo nội bộ',
        desc: 'Thông báo gửi toàn công ty hoặc phòng ban',
        fields: [
          { key: 'so_tb',  label: 'Số thông báo', type: 'text' },
          { key: 'ngay',   label: 'Ngày',         type: 'date' },
          { key: 've_viec',label: 'Về việc',      type: 'text', required: true },
          { key: 'doi_tuong', label: 'Đối tượng nhận', type: 'text', default: 'Toàn thể CBNV Công ty' },
          { key: 'noi_dung', label: 'Nội dung',   type: 'textarea', required: true },
          { key: 'nguoi_ky', label: 'Người ký',   type: 'text' },
          { key: 'chuc_vu',  label: 'Chức vụ',    type: 'text' }
        ],
        content: `
<table style="width:100%">
  <tr>
    <td style="text-align:center"><strong>CÔNG TY CỔ PHẦN<br>FUTA LAND</strong><br>————<br>Số: {{so_tb}}/TB-FTL</td>
    <td style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br><em>Độc lập - Tự do - Hạnh phúc</em><br>————<br><em>TP.HCM, ngày {{ngay}}</em></td>
  </tr>
</table>
<p style="text-align:center; margin-top:24px"><strong style="font-size:14pt">THÔNG BÁO</strong></p>
<p style="text-align:center"><em>V/v {{ve_viec}}</em></p>
<p><strong>Kính gửi:</strong> {{doi_tuong}}</p>
<p>{{noi_dung}}</p>
<p>Trân trọng thông báo./.</p>
<p style="text-align:right; margin-top:24px"><strong>{{chuc_vu}}</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br><strong>{{nguoi_ky}}</strong></p>`
      },
      {
        id: 'hc-bb-hop',
        name: 'Biên bản họp',
        desc: 'Biên bản cuộc họp nội bộ',
        fields: [
          { key: 'ten_cuoc_hop', label: 'Tên cuộc họp', type: 'text', required: true },
          { key: 'ngay',       label: 'Ngày họp',       type: 'date' },
          { key: 'gio_bd',     label: 'Giờ bắt đầu',    type: 'text' },
          { key: 'dia_diem',   label: 'Địa điểm',       type: 'text' },
          { key: 'chu_tri',    label: 'Chủ trì',        type: 'text' },
          { key: 'thu_ky',     label: 'Thư ký',         type: 'text' },
          { key: 'thanh_phan', label: 'Thành phần tham dự', type: 'textarea' },
          { key: 'noi_dung',   label: 'Nội dung họp',   type: 'textarea', required: true },
          { key: 'ket_luan',   label: 'Kết luận',       type: 'textarea' },
          { key: 'gio_kt',     label: 'Giờ kết thúc',   type: 'text' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">BIÊN BẢN HỌP</strong></p>
<p style="text-align:center"><em>{{ten_cuoc_hop}}</em></p>
<p>Thời gian: {{gio_bd}}, ngày {{ngay}}</p>
<p>Địa điểm: {{dia_diem}}</p>
<p><strong>Chủ trì:</strong> {{chu_tri}} &nbsp;&nbsp; <strong>Thư ký:</strong> {{thu_ky}}</p>
<p><strong>Thành phần tham dự:</strong></p>
<p style="white-space:pre-line">{{thanh_phan}}</p>
<p><strong>Nội dung họp:</strong></p>
<p>{{noi_dung}}</p>
<p><strong>Kết luận:</strong></p>
<p>{{ket_luan}}</p>
<p>Cuộc họp kết thúc lúc {{gio_kt}} cùng ngày. Biên bản được thông qua trước toàn thể thành viên tham dự.</p>
<table style="width:100%; margin-top:24px">
  <tr>
    <td style="text-align:center"><strong>THƯ KÝ</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br>{{thu_ky}}</td>
    <td style="text-align:center"><strong>CHỦ TRÌ</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br>{{chu_tri}}</td>
  </tr>
</table>`
      }
    ]
  },

  /* ============ PHÁP LÝ ============ */
  {
    id: 'phap-ly',
    name: 'Pháp lý',
    icon: '⚖',
    desc: 'Hợp đồng nguyên tắc, NDA, giấy uỷ quyền, biên bản pháp lý',
    templates: [
      {
        id: 'pl-hd-nguyen-tac',
        name: 'Hợp đồng nguyên tắc',
        desc: 'Hợp đồng nguyên tắc hợp tác giữa hai bên',
        fields: [
          { key: 'so_hd',   label: 'Số hợp đồng', type: 'text' },
          { key: 'ngay',    label: 'Ngày ký',     type: 'date' },
          { key: 'ben_a',   label: 'Bên A — Tên doanh nghiệp', type: 'text', required: true, default: 'CÔNG TY CỔ PHẦN FUTA LAND' },
          { key: 'ben_a_dd', label: 'Bên A — Đại diện', type: 'text' },
          { key: 'ben_a_mst', label: 'Bên A — MST', type: 'text' },
          { key: 'ben_b',   label: 'Bên B — Tên doanh nghiệp/cá nhân', type: 'text', required: true },
          { key: 'ben_b_dd', label: 'Bên B — Đại diện', type: 'text' },
          { key: 'ben_b_mst', label: 'Bên B — MST/CCCD', type: 'text' },
          { key: 'pham_vi', label: 'Phạm vi hợp tác', type: 'textarea', required: true },
          { key: 'quyen_nv', label: 'Quyền & nghĩa vụ các bên', type: 'textarea' },
          { key: 'hieu_luc', label: 'Hiệu lực hợp đồng', type: 'text', default: '12 tháng kể từ ngày ký' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">HỢP ĐỒNG NGUYÊN TẮC</strong></p>
<p style="text-align:center">Số: {{so_hd}}</p>
<p>Hôm nay, ngày {{ngay}}, các bên gồm:</p>
<p><strong>BÊN A:</strong> {{ben_a}}</p>
<p>Đại diện: {{ben_a_dd}} &nbsp;&nbsp; MST: {{ben_a_mst}}</p>
<p><strong>BÊN B:</strong> {{ben_b}}</p>
<p>Đại diện: {{ben_b_dd}} &nbsp;&nbsp; MST/CCCD: {{ben_b_mst}}</p>
<p>Cùng thoả thuận ký kết Hợp đồng nguyên tắc với các điều khoản sau:</p>
<p><strong>Điều 1. Phạm vi hợp tác</strong></p>
<p>{{pham_vi}}</p>
<p><strong>Điều 2. Quyền và nghĩa vụ các bên</strong></p>
<p>{{quyen_nv}}</p>
<p><strong>Điều 3. Hiệu lực hợp đồng</strong></p>
<p>{{hieu_luc}}. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
<table style="width:100%; margin-top:32px">
  <tr>
    <td style="text-align:center"><strong>ĐẠI DIỆN BÊN A</strong><br><em>(Ký, đóng dấu)</em></td>
    <td style="text-align:center"><strong>ĐẠI DIỆN BÊN B</strong><br><em>(Ký, đóng dấu)</em></td>
  </tr>
</table>`
      },
      {
        id: 'pl-nda',
        name: 'Thoả thuận bảo mật (NDA)',
        desc: 'Non-Disclosure Agreement tiếng Việt',
        fields: [
          { key: 'so_nda',   label: 'Số NDA',       type: 'text' },
          { key: 'ngay',     label: 'Ngày ký',      type: 'date' },
          { key: 'ben_a',    label: 'Bên A',        type: 'text', default: 'CÔNG TY CỔ PHẦN FUTA LAND' },
          { key: 'ben_b',    label: 'Bên B',        type: 'text', required: true },
          { key: 'muc_dich', label: 'Mục đích chia sẻ thông tin', type: 'textarea' },
          { key: 'thoi_han', label: 'Thời hạn bảo mật (năm)', type: 'text', default: '03' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">THOẢ THUẬN BẢO MẬT THÔNG TIN</strong></p>
<p style="text-align:center">Số: {{so_nda}}</p>
<p>Ngày {{ngay}}, hai bên ký kết Thoả thuận bảo mật với các nội dung sau:</p>
<p><strong>BÊN A:</strong> {{ben_a}}</p>
<p><strong>BÊN B:</strong> {{ben_b}}</p>
<p><strong>Điều 1. Mục đích</strong></p>
<p>{{muc_dich}}</p>
<p><strong>Điều 2. Phạm vi thông tin bảo mật</strong></p>
<p>Bao gồm nhưng không giới hạn: thông tin tài chính, dữ liệu khách hàng, kế hoạch kinh doanh, tài liệu kỹ thuật, bí quyết công nghệ của Bên A.</p>
<p><strong>Điều 3. Cam kết của Bên B</strong></p>
<p>Bên B cam kết: (i) chỉ sử dụng thông tin cho mục đích nêu tại Điều 1; (ii) không tiết lộ cho bên thứ ba; (iii) áp dụng biện pháp bảo mật phù hợp.</p>
<p><strong>Điều 4. Thời hạn</strong></p>
<p>Thoả thuận có hiệu lực {{thoi_han}} năm kể từ ngày ký.</p>
<p><strong>Điều 5. Vi phạm và bồi thường</strong></p>
<p>Bên vi phạm phải bồi thường toàn bộ thiệt hại phát sinh và chịu các chế tài theo quy định pháp luật.</p>
<table style="width:100%; margin-top:32px">
  <tr>
    <td style="text-align:center"><strong>BÊN A</strong></td>
    <td style="text-align:center"><strong>BÊN B</strong></td>
  </tr>
</table>`
      },
      {
        id: 'pl-uy-quyen',
        name: 'Giấy uỷ quyền',
        desc: 'Giấy uỷ quyền cá nhân/pháp nhân',
        fields: [
          { key: 'ngay',      label: 'Ngày lập', type: 'date' },
          { key: 'nguoi_uq',  label: 'Người uỷ quyền (họ tên)', type: 'text', required: true },
          { key: 'cccd_uq',   label: 'CCCD/CMND người uỷ quyền', type: 'text' },
          { key: 'dc_uq',     label: 'Địa chỉ người uỷ quyền', type: 'text' },
          { key: 'nguoi_duoc_uq', label: 'Người được uỷ quyền', type: 'text', required: true },
          { key: 'cccd_duoc_uq', label: 'CCCD/CMND người được uỷ quyền', type: 'text' },
          { key: 'dc_duoc_uq', label: 'Địa chỉ người được uỷ quyền', type: 'text' },
          { key: 'noi_dung_uq', label: 'Nội dung uỷ quyền', type: 'textarea', required: true },
          { key: 'thoi_han', label: 'Thời hạn uỷ quyền', type: 'text' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">GIẤY UỶ QUYỀN</strong></p>
<p>Hôm nay, ngày {{ngay}}, tại Công ty Cổ phần FUTA Land, chúng tôi gồm:</p>
<p><strong>NGƯỜI UỶ QUYỀN:</strong></p>
<p>Họ tên: {{nguoi_uq}}<br>CCCD: {{cccd_uq}}<br>Địa chỉ: {{dc_uq}}</p>
<p><strong>NGƯỜI ĐƯỢC UỶ QUYỀN:</strong></p>
<p>Họ tên: {{nguoi_duoc_uq}}<br>CCCD: {{cccd_duoc_uq}}<br>Địa chỉ: {{dc_duoc_uq}}</p>
<p><strong>NỘI DUNG UỶ QUYỀN:</strong></p>
<p>{{noi_dung_uq}}</p>
<p><strong>THỜI HẠN UỶ QUYỀN:</strong> {{thoi_han}}</p>
<p>Người được uỷ quyền chỉ thực hiện các công việc trong phạm vi uỷ quyền nêu trên. Giấy uỷ quyền này lập thành 02 bản có giá trị pháp lý như nhau.</p>
<table style="width:100%; margin-top:32px">
  <tr>
    <td style="text-align:center"><strong>NGƯỜI ĐƯỢC UỶ QUYỀN</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
    <td style="text-align:center"><strong>NGƯỜI UỶ QUYỀN</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
  </tr>
</table>`
      }
    ]
  },

  /* ============ NHÂN SỰ ============ */
  {
    id: 'nhan-su',
    name: 'Nhân sự (HR)',
    icon: '👥',
    desc: 'Hợp đồng lao động, quyết định bổ nhiệm, thư mời nhận việc, nghỉ phép',
    templates: [
      {
        id: 'hr-hd-ld',
        name: 'Hợp đồng lao động',
        desc: 'Hợp đồng lao động xác định/không xác định thời hạn',
        fields: [
          { key: 'so_hd',    label: 'Số hợp đồng',  type: 'text' },
          { key: 'ngay',     label: 'Ngày ký',      type: 'date' },
          { key: 'nv_ten',   label: 'NLĐ — Họ tên', type: 'text', required: true },
          { key: 'nv_cccd',  label: 'NLĐ — CCCD',   type: 'text' },
          { key: 'nv_dc',    label: 'NLĐ — Địa chỉ', type: 'text' },
          { key: 'chuc_danh', label: 'Chức danh',   type: 'text', required: true },
          { key: 'phong_ban', label: 'Phòng ban',   type: 'text' },
          { key: 'loai_hd',  label: 'Loại hợp đồng', type: 'select', options: ['Không xác định thời hạn', 'Xác định thời hạn 12 tháng', 'Xác định thời hạn 24 tháng', 'Thử việc 02 tháng'] },
          { key: 'ngay_bat_dau', label: 'Ngày bắt đầu làm việc', type: 'date' },
          { key: 'luong',    label: 'Mức lương (VNĐ/tháng)', type: 'text' },
          { key: 'phu_cap',  label: 'Phụ cấp',     type: 'textarea' },
          { key: 'noi_lam_viec', label: 'Nơi làm việc', type: 'text', default: 'Trụ sở Công ty Cổ phần FUTA Land' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">HỢP ĐỒNG LAO ĐỘNG</strong></p>
<p style="text-align:center">Số: {{so_hd}}</p>
<p>Hôm nay, ngày {{ngay}}, tại Công ty Cổ phần FUTA Land, chúng tôi gồm:</p>
<p><strong>NGƯỜI SỬ DỤNG LAO ĐỘNG:</strong> Công ty Cổ phần FUTA Land</p>
<p><strong>NGƯỜI LAO ĐỘNG:</strong></p>
<p>Họ tên: {{nv_ten}}<br>CCCD: {{nv_cccd}}<br>Địa chỉ: {{nv_dc}}</p>
<p>Hai bên thoả thuận ký kết Hợp đồng lao động với các điều khoản sau:</p>
<p><strong>Điều 1. Công việc và địa điểm làm việc</strong></p>
<p>Chức danh: {{chuc_danh}} — Phòng ban: {{phong_ban}}<br>Nơi làm việc: {{noi_lam_viec}}</p>
<p><strong>Điều 2. Thời hạn hợp đồng</strong></p>
<p>Loại hợp đồng: {{loai_hd}}<br>Ngày bắt đầu làm việc: {{ngay_bat_dau}}</p>
<p><strong>Điều 3. Lương và phụ cấp</strong></p>
<p>Mức lương: {{luong}} VNĐ/tháng<br>Phụ cấp: {{phu_cap}}</p>
<p><strong>Điều 4. Quyền và nghĩa vụ</strong></p>
<p>Thực hiện theo Nội quy lao động, Thoả ước lao động tập thể của Công ty và quy định của Bộ luật Lao động.</p>
<table style="width:100%; margin-top:32px">
  <tr>
    <td style="text-align:center"><strong>NGƯỜI LAO ĐỘNG</strong><br><em>(Ký, ghi rõ họ tên)</em></td>
    <td style="text-align:center"><strong>NGƯỜI SỬ DỤNG LAO ĐỘNG</strong><br><em>(Ký, đóng dấu)</em></td>
  </tr>
</table>`
      },
      {
        id: 'hr-bo-nhiem',
        name: 'Quyết định bổ nhiệm',
        desc: 'Quyết định bổ nhiệm cán bộ quản lý',
        fields: [
          { key: 'so_qd',   label: 'Số quyết định', type: 'text' },
          { key: 'ngay',    label: 'Ngày',          type: 'date' },
          { key: 'nv_ten',  label: 'Họ tên CB',     type: 'text', required: true },
          { key: 'nv_sinh', label: 'Ngày sinh',     type: 'date' },
          { key: 'chuc_vu_cu', label: 'Chức vụ hiện tại', type: 'text' },
          { key: 'chuc_vu_moi', label: 'Chức vụ bổ nhiệm', type: 'text', required: true },
          { key: 'phong_ban', label: 'Phòng ban',   type: 'text' },
          { key: 'hieu_luc', label: 'Ngày hiệu lực', type: 'date' },
          { key: 'thoi_han', label: 'Thời hạn bổ nhiệm', type: 'text', default: '03 năm kể từ ngày bổ nhiệm' },
          { key: 'nguoi_ky', label: 'Người ký',     type: 'text' }
        ],
        content: `
<table style="width:100%">
  <tr>
    <td style="text-align:center"><strong>CÔNG TY CỔ PHẦN<br>FUTA LAND</strong><br>————<br>Số: {{so_qd}}/QĐ-FTL</td>
    <td style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br><em>Độc lập - Tự do - Hạnh phúc</em><br>————<br><em>TP.HCM, ngày {{ngay}}</em></td>
  </tr>
</table>
<p style="text-align:center; margin-top:24px"><strong style="font-size:14pt">QUYẾT ĐỊNH</strong></p>
<p style="text-align:center"><em>V/v bổ nhiệm cán bộ quản lý</em></p>
<p style="text-align:center"><strong>TỔNG GIÁM ĐỐC CÔNG TY CỔ PHẦN FUTA LAND</strong></p>
<p>- Căn cứ Điều lệ Công ty Cổ phần FUTA Land;</p>
<p>- Căn cứ nhu cầu công tác và năng lực cán bộ,</p>
<p style="text-align:center"><strong>QUYẾT ĐỊNH:</strong></p>
<p><strong>Điều 1.</strong> Bổ nhiệm Ông/Bà <strong>{{nv_ten}}</strong>, sinh ngày {{nv_sinh}}, hiện đang giữ chức vụ {{chuc_vu_cu}}, giữ chức vụ <strong>{{chuc_vu_moi}}</strong> — {{phong_ban}}, kể từ ngày {{hieu_luc}}.</p>
<p><strong>Điều 2.</strong> Thời hạn bổ nhiệm: {{thoi_han}}.</p>
<p><strong>Điều 3.</strong> Ông/Bà {{nv_ten}}, Trưởng các phòng ban liên quan chịu trách nhiệm thi hành Quyết định này.</p>
<p style="text-align:right; margin-top:32px"><strong>TỔNG GIÁM ĐỐC</strong><br><em>(Ký, đóng dấu)</em><br><br><br><strong>{{nguoi_ky}}</strong></p>`
      },
      {
        id: 'hr-thu-moi',
        name: 'Thư mời nhận việc',
        desc: 'Offer letter gửi ứng viên trúng tuyển',
        fields: [
          { key: 'ngay',     label: 'Ngày phát hành',  type: 'date' },
          { key: 'uv_ten',   label: 'Ứng viên — Họ tên', type: 'text', required: true },
          { key: 'uv_email', label: 'Email ứng viên',  type: 'text' },
          { key: 'vi_tri',   label: 'Vị trí',          type: 'text', required: true },
          { key: 'phong_ban', label: 'Phòng ban',      type: 'text' },
          { key: 'cap_tren', label: 'Quản lý trực tiếp', type: 'text' },
          { key: 'ngay_bd',  label: 'Ngày dự kiến nhận việc', type: 'date' },
          { key: 'luong',    label: 'Mức lương đề xuất (VNĐ)', type: 'text' },
          { key: 'thu_viec', label: 'Thời gian thử việc', type: 'text', default: '02 tháng' },
          { key: 'phuc_loi', label: 'Phúc lợi',        type: 'textarea' },
          { key: 'han_phan_hoi', label: 'Hạn phản hồi', type: 'date' }
        ],
        content: `
<table style="width:100%; border-bottom:2px solid #1B5E20; padding-bottom:8px">
  <tr>
    <td><strong style="font-size:14pt">CÔNG TY CỔ PHẦN FUTA LAND</strong></td>
    <td style="text-align:right">Ngày {{ngay}}</td>
  </tr>
</table>
<p style="text-align:center; margin-top:24px"><strong style="font-size:14pt">THƯ MỜI NHẬN VIỆC</strong></p>
<p>Kính gửi: <strong>{{uv_ten}}</strong></p>
<p>Email: {{uv_email}}</p>
<p>Chúng tôi rất vui mừng thông báo rằng Quý vị đã trúng tuyển vào vị trí <strong>{{vi_tri}}</strong> tại Công ty Cổ phần FUTA Land với các điều kiện sau:</p>
<p><strong>1. Vị trí công tác:</strong> {{vi_tri}} — Phòng {{phong_ban}}</p>
<p><strong>2. Quản lý trực tiếp:</strong> {{cap_tren}}</p>
<p><strong>3. Ngày dự kiến nhận việc:</strong> {{ngay_bd}}</p>
<p><strong>4. Mức lương:</strong> {{luong}} VNĐ/tháng</p>
<p><strong>5. Thời gian thử việc:</strong> {{thu_viec}}</p>
<p><strong>6. Phúc lợi:</strong></p>
<p>{{phuc_loi}}</p>
<p>Đề nghị Quý vị xác nhận nhận lời mời trước ngày <strong>{{han_phan_hoi}}</strong>.</p>
<p>Trân trọng chào đón Quý vị gia nhập ngôi nhà FUTA Land!</p>
<p style="text-align:right; margin-top:24px"><strong>TM. CÔNG TY CỔ PHẦN FUTA LAND</strong><br><em>(Trưởng phòng Nhân sự)</em></p>`
      },
      {
        id: 'hr-nghi-phep',
        name: 'Đơn xin nghỉ phép',
        desc: 'Đơn nhân viên xin nghỉ phép có lương',
        fields: [
          { key: 'ngay',      label: 'Ngày viết đơn', type: 'date' },
          { key: 'nv_ten',    label: 'Họ tên',        type: 'text', required: true },
          { key: 'phong_ban', label: 'Phòng ban',     type: 'text' },
          { key: 'chuc_vu',   label: 'Chức vụ',       type: 'text' },
          { key: 'tu_ngay',   label: 'Nghỉ từ ngày',  type: 'date', required: true },
          { key: 'den_ngay',  label: 'Đến ngày',      type: 'date', required: true },
          { key: 'so_ngay',   label: 'Tổng số ngày',  type: 'text' },
          { key: 'ly_do',     label: 'Lý do',         type: 'textarea' },
          { key: 'ban_giao',  label: 'Người bàn giao công việc', type: 'text' }
        ],
        content: `
<p style="text-align:center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align:center"><em>Độc lập - Tự do - Hạnh phúc</em></p>
<p style="text-align:center"><strong style="font-size:14pt">ĐƠN XIN NGHỈ PHÉP</strong></p>
<p>Kính gửi: Ban Lãnh đạo Công ty Cổ phần FUTA Land &amp; Phòng Nhân sự</p>
<p>Tôi tên: <strong>{{nv_ten}}</strong></p>
<p>Phòng ban: {{phong_ban}} — Chức vụ: {{chuc_vu}}</p>
<p>Nay tôi làm đơn này kính xin Ban Lãnh đạo cho tôi được nghỉ phép từ ngày <strong>{{tu_ngay}}</strong> đến hết ngày <strong>{{den_ngay}}</strong> (tổng cộng <strong>{{so_ngay}}</strong> ngày).</p>
<p><strong>Lý do:</strong> {{ly_do}}</p>
<p>Trong thời gian nghỉ, công việc của tôi sẽ được Ông/Bà <strong>{{ban_giao}}</strong> đảm nhiệm.</p>
<p>Rất mong Ban Lãnh đạo xem xét và chấp thuận.</p>
<p>Trân trọng cảm ơn./.</p>
<p style="text-align:right">Ngày {{ngay}}</p>
<table style="width:100%; margin-top:24px">
  <tr>
    <td style="text-align:center"><strong>XÁC NHẬN CỦA TRƯỞNG PHÒNG</strong></td>
    <td style="text-align:center"><strong>NGƯỜI LÀM ĐƠN</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br>{{nv_ten}}</td>
  </tr>
</table>`
      }
    ]
  }
];

/* Tổng cộng 15 template chuẩn (4 phòng ban) */
window.TEMPLATE_LIBRARY = TEMPLATE_LIBRARY;
