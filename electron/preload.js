const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (filePath, content, encoding) => ipcRenderer.invoke('save-file', filePath, content, encoding),
  saveFileAs: (content, encoding) => ipcRenderer.invoke('save-file-as', content, encoding),
  readFileByPath: (filePath) => ipcRenderer.invoke('read-file-by-path', filePath),
  // Electron >=32 removed File.path. Resolve it in the preload and read in one shot so the
  // renderer can't inject an arbitrary path — JS-constructed File objects yield '' here.
  readDroppedFile: (file) => {
    let p = '';
    try { p = webUtils.getPathForFile(file); } catch { return Promise.resolve({ success: false, error: 'Invalid file' }); }
    if (!p) return Promise.resolve({ success: false, error: 'File has no disk path' });
    return ipcRenderer.invoke('read-dropped-file', p);
  },
  printDocument: () => ipcRenderer.invoke('print-document'),
  setWindowTitle: (title) => ipcRenderer.invoke('set-window-title', title),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  forceQuit: () => ipcRenderer.send('force-quit'),
  onCheckUnsavedBeforeClose: (callback) => {
    ipcRenderer.on('check-unsaved-before-close', callback);
  },
  removeCheckUnsavedBeforeClose: (callback) => {
    ipcRenderer.removeListener('check-unsaved-before-close', callback);
  },
  onOpenFileFromArg: (callback) => {
    const wrapped = (_event, filePath) => callback(filePath);
    ipcRenderer.on('open-file-from-arg', wrapped);
    return () => ipcRenderer.removeListener('open-file-from-arg', wrapped);
  },
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
  getSystemDarkMode: () => ipcRenderer.invoke('get-system-dark-mode'),
  saveRecovery: (data) => ipcRenderer.invoke('save-recovery', data),
  checkRecovery: () => ipcRenderer.invoke('check-recovery'),
  clearRecovery: () => ipcRenderer.invoke('clear-recovery'),
});
