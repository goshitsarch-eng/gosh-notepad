import '@testing-library/jest-dom';

// Mock window.electronAPI for tests
window.electronAPI = {
  openFile: vi.fn(() => Promise.resolve({ success: false })),
  saveFile: vi.fn(() => Promise.resolve({ success: true })),
  saveFileAs: vi.fn(() => Promise.resolve({ success: false })),
  readFileByPath: vi.fn(() => Promise.resolve({ success: false })),
  readDroppedFile: vi.fn(() => Promise.resolve({ success: false })),
  printDocument: vi.fn(),
  setWindowTitle: vi.fn(),
  quitApp: vi.fn(),
  forceQuit: vi.fn(),
  onCheckUnsavedBeforeClose: vi.fn(),
  removeCheckUnsavedBeforeClose: vi.fn(),
  onOpenFileFromArg: vi.fn(() => () => {}),
  getPreferences: vi.fn(() => Promise.resolve({})),
  setPreferences: vi.fn(() => Promise.resolve({ success: true })),
  getSystemDarkMode: vi.fn(() => Promise.resolve(false)),
  saveRecovery: vi.fn(() => Promise.resolve({ success: true })),
  checkRecovery: vi.fn(() => Promise.resolve({ exists: false })),
  clearRecovery: vi.fn(() => Promise.resolve({ success: true })),
};

// jsdom doesn't implement execCommand('insertText'), so apply it to the last-focused
// textarea so tests can observe the result of edits that go through the undo-preserving path.
let _lastFocusedEditor = null;
const _origFocus = HTMLTextAreaElement.prototype.focus;
HTMLTextAreaElement.prototype.focus = function () {
  _lastFocusedEditor = this;
  return _origFocus.call(this);
};

document.execCommand = vi.fn((cmd, _showUI, arg) => {
  if (cmd === 'insertText') {
    const el =
      (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT'))
        ? document.activeElement
        : _lastFocusedEditor;
    if (el) {
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? el.value.length;
      el.value = el.value.slice(0, start) + (arg ?? '') + el.value.slice(end);
      const cursor = start + (arg ?? '').length;
      if (typeof el.setSelectionRange === 'function') {
        el.setSelectionRange(cursor, cursor);
      } else {
        el.selectionStart = el.selectionEnd = cursor;
      }
    }
  }
  return true;
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  writable: true,
});
