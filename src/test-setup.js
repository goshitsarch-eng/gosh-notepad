import '@testing-library/jest-dom';

// Mock window.electronAPI for tests
window.electronAPI = {
  openFile: vi.fn(() => Promise.resolve({ success: false })),
  saveFile: vi.fn(() => Promise.resolve({ success: true })),
  saveFileAs: vi.fn(() => Promise.resolve({ success: false })),
  readFileByPath: vi.fn(() => Promise.resolve({ success: false })),
  printDocument: vi.fn(),
  setWindowTitle: vi.fn(),
  quitApp: vi.fn(),
  forceQuit: vi.fn(),
  onCheckUnsavedBeforeClose: vi.fn(),
  removeCheckUnsavedBeforeClose: vi.fn(),
  onOpenFileFromArg: vi.fn(),
  getPreferences: vi.fn(() => Promise.resolve({})),
  setPreferences: vi.fn(() => Promise.resolve({ success: true })),
  getSystemDarkMode: vi.fn(() => Promise.resolve(false)),
  saveRecovery: vi.fn(() => Promise.resolve({ success: true })),
  checkRecovery: vi.fn(() => Promise.resolve({ exists: false })),
  clearRecovery: vi.fn(() => Promise.resolve({ success: true })),
};

// Mock document.execCommand (not available in jsdom)
document.execCommand = vi.fn(() => true);

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  writable: true,
});
