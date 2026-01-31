const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  newFile: () => ipcRenderer.invoke('new-file'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
  saveFileAs: (content) => ipcRenderer.invoke('save-file-as', content),
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
});
