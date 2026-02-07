const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (filePath, content, encoding) => ipcRenderer.invoke('save-file', filePath, content, encoding),
  saveFileAs: (content, encoding) => ipcRenderer.invoke('save-file-as', content, encoding),
  readFileByPath: (filePath) => ipcRenderer.invoke('read-file-by-path', filePath),
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
    ipcRenderer.on('open-file-from-arg', (_event, filePath) => callback(filePath));
  },
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
  getSystemDarkMode: () => ipcRenderer.invoke('get-system-dark-mode'),
  saveRecovery: (data) => ipcRenderer.invoke('save-recovery', data),
  checkRecovery: () => ipcRenderer.invoke('check-recovery'),
  clearRecovery: () => ipcRenderer.invoke('clear-recovery'),
});
