/**
 * FUTA Email — Electron main process
 * Tạo cửa sổ native, load app email/index.html, không expose Node API vào renderer.
 */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

const APP_NAME = 'FUTA Email';
const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: APP_NAME,
    backgroundColor: '#E8F5E9',
    icon: path.join(__dirname, 'build-assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // External links (Apps Script, Supabase docs, etc.) mở trong trình duyệt mặc định,
  // không trong cửa sổ app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Cùng quy tắc cho thẻ <a href="https://..."> trong app.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (url !== current && (url.startsWith('http://') || url.startsWith('https://'))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

/* -------- App menu (Vi) -------- */
function buildMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: APP_NAME,
      submenu: [
        { role: 'about', label: 'Giới thiệu ' + APP_NAME },
        { type: 'separator' },
        { role: 'hide', label: 'Ẩn ' + APP_NAME },
        { role: 'hideOthers', label: 'Ẩn ứng dụng khác' },
        { role: 'unhide', label: 'Hiện tất cả' },
        { type: 'separator' },
        { role: 'quit', label: 'Thoát ' + APP_NAME },
      ],
    }] : []),
    {
      label: 'Tệp',
      submenu: [
        process.platform === 'darwin'
          ? { role: 'close', label: 'Đóng cửa sổ' }
          : { role: 'quit', label: 'Thoát' },
      ],
    },
    {
      label: 'Chỉnh sửa',
      submenu: [
        { role: 'undo', label: 'Hoàn tác' },
        { role: 'redo', label: 'Làm lại' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt' },
        { role: 'copy', label: 'Sao chép' },
        { role: 'paste', label: 'Dán' },
        { role: 'selectAll', label: 'Chọn tất cả' },
      ],
    },
    {
      label: 'Hiển thị',
      submenu: [
        { role: 'reload', label: 'Tải lại' },
        { role: 'forceReload', label: 'Tải lại không cache' },
        { role: 'toggleDevTools', label: 'Bật/tắt DevTools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Cỡ chữ mặc định' },
        { role: 'zoomIn',   label: 'Phóng to' },
        { role: 'zoomOut',  label: 'Thu nhỏ' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn màn hình' },
      ],
    },
    {
      label: 'Trợ giúp',
      submenu: [
        {
          label: 'Hướng dẫn deploy Apps Script',
          click: () => mainWindow?.webContents.executeJavaScript("location.hash = '#/deploy'"),
        },
        {
          label: 'Cài đặt',
          click: () => mainWindow?.webContents.executeJavaScript("location.hash = '#/settings'"),
        },
        { type: 'separator' },
        {
          label: 'Mở FUTA Land website',
          click: () => shell.openExternal('https://futaland.vn'),
        },
        {
          label: 'Giới thiệu',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Giới thiệu',
            message: APP_NAME,
            detail: 'FUTA Land · Email Marketing v1.0\n© 2026 Phương Trang Group\nGửi email cá nhân hóa hàng loạt qua Google Apps Script.',
            buttons: ['OK'],
          }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
