// Bundle fontconfig for Linux systems missing fonts (e.g., Bazzite, Fedora Atomic).
// Must run before require('electron') so Chromium's Skia picks up the config.
const path = require('path');
const fs = require('fs');
const os = require('os');

if (process.platform === 'linux') {
  const fontsDir = path.join(process.resourcesPath, 'fonts');
  if (fs.existsSync(fontsDir)) {
    const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>${fontsDir}</dir>
</fontconfig>`;
    const confPath = path.join(os.tmpdir(), `gosh-notepad-fonts-${process.pid}.conf`);
    fs.writeFileSync(confPath, conf);
    process.env.FONTCONFIG_FILE = confPath;
  }
}

const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme } = require('electron');
const { autoUpdater } = require('electron-updater');
const fsPromises = require('fs/promises');

let mainWindow;

// Paths main has authorized the renderer to read (CLI args, macOS open-file, second-instance).
// read-file-by-path checks this set so a compromised renderer can't exfiltrate arbitrary files.
// Drag-drop uses a separate read-dropped-file channel validated in preload via webUtils.getPathForFile.
const authorizedReadPaths = new Set();

function authorizeAndSendOpenFile(filePath) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const resolved = path.resolve(filePath);
  authorizedReadPaths.add(resolved);
  mainWindow.webContents.send('open-file-from-arg', resolved);
}

// Encoding detection and conversion utilities
function detectEncoding(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'UTF-8 BOM';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'UTF-16 LE';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'UTF-16 BE';
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return 'UTF-8';
  } catch {
    return 'ANSI';
  }
}

function decodeBuffer(buffer, encoding) {
  switch (encoding) {
    case 'UTF-8 BOM':
      return buffer.slice(3).toString('utf8');
    case 'UTF-16 LE':
      return buffer.slice(2).toString('utf16le');
    case 'UTF-16 BE': {
      const content = buffer.slice(2);
      const swapped = Buffer.alloc(content.length);
      for (let i = 0; i < content.length - 1; i += 2) {
        swapped[i] = content[i + 1];
        swapped[i + 1] = content[i];
      }
      return swapped.toString('utf16le');
    }
    case 'ANSI':
      return buffer.toString('latin1');
    default:
      return buffer.toString('utf8');
  }
}

function encodeString(content, encoding) {
  switch (encoding) {
    case 'UTF-8 BOM':
      return Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(content, 'utf8')]);
    case 'UTF-16 LE': {
      const bom = Buffer.from([0xFF, 0xFE]);
      return Buffer.concat([bom, Buffer.from(content, 'utf16le')]);
    }
    case 'UTF-16 BE': {
      const bom = Buffer.from([0xFE, 0xFF]);
      const le = Buffer.from(content, 'utf16le');
      const be = Buffer.alloc(le.length);
      for (let i = 0; i < le.length - 1; i += 2) {
        be[i] = le[i + 1];
        be[i + 1] = le[i];
      }
      return Buffer.concat([bom, be]);
    }
    case 'ANSI':
      return Buffer.from(content, 'latin1');
    default:
      return Buffer.from(content, 'utf8');
  }
}

// Issue #31: Extract file path from command-line arguments
function getFileFromArgs(argv) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  for (const arg of args) {
    if (!arg.startsWith('-') && fs.existsSync(arg)) {
      return path.resolve(arg);
    }
  }
  return null;
}

// Single-instance lock: focus existing window if already running
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = getFileFromArgs(argv);
    if (filePath) {
      authorizeAndSendOpenFile(filePath);
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  // Issue #39: On macOS, provide a minimal native menu (Quit, Hide, Edit, Window).
  // On other platforms, remove the menu entirely (the app uses a custom HTML menu bar).
  if (process.platform === 'darwin') {
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      { role: 'editMenu' },
      { role: 'windowMenu' },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      e.preventDefault();
      mainWindow.webContents.send('check-unsaved-before-close');
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Issue #31: Open file passed as CLI argument
  const fileArg = getFileFromArgs(process.argv);
  if (fileArg) {
    mainWindow.webContents.once('did-finish-load', () => {
      authorizeAndSendOpenFile(fileArg);
    });
  }

  // Handle macOS open-file event (e.g., from Finder)
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    authorizeAndSendOpenFile(filePath);
  });

  // Auto-update via electron-updater:
  // - Windows: Works with NSIS builds
  // - Linux: Requires AppImage (deb/rpm users get updates via package manager)
  // - macOS: Requires code signing with Apple Developer certificate
  if (!process.env.VITE_DEV_SERVER_URL) {
    const isAppImage = !!process.env.APPIMAGE;
    const isWindows = process.platform === 'win32';
    if (isAppImage || isWindows) {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;

      autoUpdater.on('update-available', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-status', 'Downloading update...');
        }
      });

      autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: 'A new version has been downloaded. Restart to apply the update.',
          buttons: ['Restart', 'Later'],
        }).then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
      });

      autoUpdater.on('error', (err) => {
        console.log('Auto-update error:', err.message);
      });

      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.log('Update check failed:', err.message);
      });
    }
  }
});

app.on('window-all-closed', () => {
  // Issue #7: On macOS, keep the app alive in the dock when all windows are closed.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up temporary fontconfig file on quit
if (process.platform === 'linux') {
  app.on('quit', () => {
    const confPath = path.join(os.tmpdir(), `gosh-notepad-fonts-${process.pid}.conf`);
    try { fs.unlinkSync(confPath); } catch {}
  });
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Text Documents', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false };
  }

  const filePath = result.filePaths[0];
  try {
    const buffer = await fsPromises.readFile(filePath);
    const encoding = detectEncoding(buffer);
    const content = decodeBuffer(buffer, encoding);
    return { success: true, path: filePath, content, encoding };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('save-file', async (_event, filePath, content, encoding) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path' };
    }
    if (filePath.includes('\0')) {
      return { success: false, error: 'Invalid file path: null bytes are not allowed' };
    }
    const resolved = path.resolve(filePath);
    const buffer = encodeString(content, encoding || 'UTF-8');
    await fsPromises.writeFile(resolved, buffer);
    return { success: true, path: resolved };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('save-file-as', async (_event, content, encoding) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'Untitled.txt',
    filters: [
      { name: 'Text Documents', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return { success: false };
  }

  try {
    const buffer = encodeString(content, encoding || 'UTF-8');
    await fsPromises.writeFile(result.filePath, buffer);
    return { success: true, path: result.filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('print-document', () => {
  mainWindow.webContents.print();
});

ipcMain.handle('set-window-title', (_event, title) => {
  mainWindow.setTitle(title);
});

ipcMain.handle('quit-app', () => {
  mainWindow.destroy();
  app.quit();
});

ipcMain.on('force-quit', () => {
  mainWindow.destroy();
  app.quit();
});

// Issue #11: Preference persistence
const prefsPath = path.join(app.getPath('userData'), 'preferences.json');

function loadPreferences() {
  try {
    return JSON.parse(fs.readFileSync(prefsPath, 'utf-8'));
  } catch {
    return {};
  }
}

function savePreferences(prefs) {
  fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf-8');
}

ipcMain.handle('get-preferences', () => loadPreferences());

ipcMain.handle('set-preferences', (_event, prefs) => {
  savePreferences(prefs);
  return { success: true };
});

// Issue #13: OS-level dark mode detection
ipcMain.handle('get-system-dark-mode', () => nativeTheme.shouldUseDarkColors);

// Read a file that main has authorized (CLI arg / macOS open-file / second-instance).
// Rejects arbitrary paths from the renderer to contain blast radius if renderer is ever compromised.
ipcMain.handle('read-file-by-path', async (_event, filePath) => {
  try {
    if (typeof filePath !== 'string') {
      return { success: false, error: 'Invalid path' };
    }
    const resolved = path.resolve(filePath);
    if (!authorizedReadPaths.has(resolved)) {
      return { success: false, error: 'Path not authorized' };
    }
    authorizedReadPaths.delete(resolved);
    const buffer = await fsPromises.readFile(resolved);
    const encoding = detectEncoding(buffer);
    const content = decodeBuffer(buffer, encoding);
    return { success: true, path: resolved, content, encoding };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Read a path that preload extracted from a dropped File via webUtils.getPathForFile.
// Trusted because this channel is only reachable through preload's readDroppedFile wrapper,
// which validates the File object (JS-constructed Files return empty string and are rejected there).
ipcMain.handle('read-dropped-file', async (_event, filePath) => {
  try {
    if (typeof filePath !== 'string' || !filePath) {
      return { success: false, error: 'Invalid path' };
    }
    const resolved = path.resolve(filePath);
    const buffer = await fsPromises.readFile(resolved);
    const encoding = detectEncoding(buffer);
    const content = decodeBuffer(buffer, encoding);
    return { success: true, path: resolved, content, encoding };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Issue #36: Auto-save recovery
const recoveryDir = path.join(app.getPath('userData'), 'recovery');

ipcMain.handle('save-recovery', async (_event, data) => {
  try {
    await fsPromises.mkdir(recoveryDir, { recursive: true });
    await fsPromises.writeFile(
      path.join(recoveryDir, 'recovery.json'),
      JSON.stringify(data),
      'utf-8'
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('check-recovery', async () => {
  try {
    const recoveryPath = path.join(recoveryDir, 'recovery.json');
    const raw = await fsPromises.readFile(recoveryPath, 'utf-8');
    const data = JSON.parse(raw);
    return { exists: true, data };
  } catch {
    return { exists: false };
  }
});

ipcMain.handle('clear-recovery', async () => {
  try {
    await fsPromises.unlink(path.join(recoveryDir, 'recovery.json'));
  } catch {}
  return { success: true };
});
