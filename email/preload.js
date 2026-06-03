/**
 * FUTA Email — preload script
 * Chạy trước renderer, có quyền Node giới hạn để expose API an toàn.
 * Hiện tại chưa cần API native, để trống cho mở rộng sau (vd: lưu file, in PDF).
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('futaApp', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome:   process.versions.chrome,
    node:     process.versions.node,
  },
  isDesktop: true,
});
