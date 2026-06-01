/* ============================================================
 * exporter.js — Xuất file Word / PDF / In trực tiếp
 *
 *   Exporter.toDoc(html, filename, title?)   → tải file .doc (Word mở được)
 *   Exporter.toPDF(html, filename, title?)   → in qua trình duyệt, chọn "Save as PDF"
 *   Exporter.print(html, title?)             → in trực tiếp
 *
 * Lý do dùng .doc thay vì .docx:
 *   - .docx là ZIP + XML phức tạp, cần thư viện ~200KB.
 *   - .doc dạng "HTML Word" (Word HTML, MHTML) được MS Word/LibreOffice mở
 *     đúng định dạng, giữ font, hỗ trợ table, không cần thư viện ngoài.
 *     Khi mở trong Word có thể Save As .docx để có format chuẩn.
 * ============================================================ */
(function () {

  /* CSS in-line áp dụng cho file export — giữ giống preview */
  const PRINT_CSS = `
    @page { size: A4; margin: 2cm 2.5cm 2cm 3cm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 13pt;
           line-height: 1.5; color:#000; }
    p { margin: 0 0 8pt 0; }
    h1,h2,h3 { font-family: "Times New Roman", serif; }
    table { width: 100%; border-collapse: collapse; }
    table td { vertical-align: top; padding: 4pt 6pt; }
    em { font-style: italic; }
    strong { font-weight: bold; }
    ul, ol { margin: 0 0 8pt 24pt; }
  `;

  function wrap(html, title) {
    return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title || 'FUTA Land Document')}</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
  <![endif]-->
  <style>${PRINT_CSS}</style>
</head>
<body>${html}</body>
</html>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  function sanitizeFilename(name) {
    return String(name || 'document')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
  }

  /** Mở print preview trong cửa sổ mới (dùng cho PDF & In) */
  function openPrintWindow(html, title, autoClose) {
    const doc = wrap(html, title);
    // Dùng iframe ẩn để không bị popup-blocker chặn
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument || iframe.contentWindow.document;
    idoc.open(); idoc.write(doc); idoc.close();
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error(e);
        alert('Không in được trực tiếp. Vui lòng tải file Word về và in từ Word.');
      }
      if (autoClose) setTimeout(() => iframe.remove(), 1000);
    };
  }

  const Exporter = {
    toDoc(html, filename, title) {
      const doc = wrap(html, title);
      // BOM ﻿ để Word nhận UTF-8 đúng
      const blob = new Blob(['﻿', doc], { type: 'application/msword' });
      downloadBlob(blob, sanitizeFilename(filename) + '.doc');
    },
    toPDF(html, filename, title) {
      // Trình duyệt cho phép "Save as PDF" trong hộp thoại in
      openPrintWindow(html, title || filename, false);
    },
    print(html, title) {
      openPrintWindow(html, title, true);
    }
  };

  window.Exporter = Exporter;
})();
