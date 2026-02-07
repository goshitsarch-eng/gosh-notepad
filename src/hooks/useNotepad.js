import { useState, useRef, useCallback, useEffect } from 'react';

const api = window.electronAPI || {
  openFile: () => Promise.resolve({ success: false }),
  saveFile: () => Promise.resolve({ success: false }),
  saveFileAs: () => Promise.resolve({ success: false }),
  readFileByPath: () => Promise.resolve({ success: false }),
  printDocument: () => {},
  setWindowTitle: () => {},
  quitApp: () => {},
  forceQuit: () => {},
  onCheckUnsavedBeforeClose: () => {},
  removeCheckUnsavedBeforeClose: () => {},
  onOpenFileFromArg: () => {},
  getPreferences: () => Promise.resolve({}),
  setPreferences: () => Promise.resolve({ success: true }),
  getSystemDarkMode: () => Promise.resolve(false),
  saveRecovery: () => Promise.resolve({ success: true }),
  checkRecovery: () => Promise.resolve({ exists: false }),
  clearRecovery: () => Promise.resolve({ success: true }),
};

export function useNotepad() {
  const editorRef = useRef(null);

  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [originalContent, setOriginalContent] = useState('');
  const [lineEnding, setLineEnding] = useState('\n'); // '\n' (LF) or '\r\n' (CRLF)
  const [encoding, setEncoding] = useState('UTF-8');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  const [activeDialog, setActiveDialog] = useState(null);

  const [currentFont, setCurrentFont] = useState({
    family: "'Lucida Console', 'Courier New', 'DejaVu Sans Mono', 'Liberation Mono', 'Ubuntu Mono', 'Noto Sans Mono', monospace",
    style: 'normal',
    size: 12,
  });

  const [messageDialog, setMessageDialog] = useState(null); // { title, message }
  const [recoveryData, setRecoveryData] = useState(null);

  const showMessage = useCallback((message, title = 'Notepad') => {
    setMessageDialog({ title, message });
  }, []);

  const closeMessage = useCallback(() => {
    setMessageDialog(null);
  }, []);

  // Lifted find/replace state — persists across dialog open/close
  const [findState, setFindState] = useState({ query: '', matchCase: false, direction: 'down' });
  const [replaceState, setReplaceState] = useState({ findQuery: '', replaceWith: '', matchCase: false });

  const lastSearchRef = useRef({
    query: '',
    direction: 'down',
    caseSensitive: false,
  });

  const unsavedResolveRef = useRef(null);
  const handleSaveRef = useRef(null);

  // Update title
  const updateTitle = useCallback((filePath, unsaved) => {
    const filename = filePath ? filePath.split(/[\\/]/).pop() : 'Untitled';
    const modified = unsaved ? '*' : '';
    const title = `${modified}${filename} - Notepad`;
    document.title = title;
    api.setWindowTitle(title);
  }, []);

  // Update cursor position
  const updateCursorPosition = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.value;
    const pos = editor.selectionStart;
    const lines = text.substring(0, pos).split('\n');
    setCursorPosition({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  }, []);

  // Check content changes — set dirty immediately, debounce the accurate string comparison
  const dirtyCheckTimer = useRef(null);
  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Immediately mark as unsaved (avoids O(n) comparison on every keystroke)
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
      updateTitle(currentFilePath, true);
    }

    // Debounced accurate check (handles undo-back-to-original)
    clearTimeout(dirtyCheckTimer.current);
    dirtyCheckTimer.current = setTimeout(() => {
      if (!editorRef.current) return;
      const isActuallyDirty = editorRef.current.value !== originalContent;
      setHasUnsavedChanges(isActuallyDirty);
      updateTitle(currentFilePath, isActuallyDirty);
    }, 500);
  }, [hasUnsavedChanges, originalContent, currentFilePath, updateTitle]);

  // Unsaved changes dialog
  const showUnsavedDialog = useCallback((filePath) => {
    return new Promise((resolve) => {
      unsavedResolveRef.current = resolve;
      setActiveDialog('unsaved');
    });
  }, []);

  const resolveUnsaved = useCallback((result) => {
    setActiveDialog(null);
    if (unsavedResolveRef.current) {
      unsavedResolveRef.current(result);
      unsavedResolveRef.current = null;
    }
  }, []);

  const checkUnsavedChanges = useCallback(async () => {
    if (!hasUnsavedChanges) return true;
    const result = await showUnsavedDialog(currentFilePath);
    if (result === 2) return false; // Cancel
    if (result === 0) {
      // Issue #25: Use ref to avoid stale closure / circular dependency with handleSave
      const saved = await handleSaveRef.current();
      if (!saved) return false;
    }
    return true;
  }, [hasUnsavedChanges, currentFilePath, showUnsavedDialog]);

  // File operations
  const handleNew = useCallback(async () => {
    const canProceed = await checkUnsavedChanges();
    if (!canProceed) return;

    const editor = editorRef.current;
    if (editor) editor.value = '';
    setCurrentFilePath(null);
    setOriginalContent('');
    setEncoding('UTF-8');
    setLineEnding('\n');
    setHasUnsavedChanges(false);
    updateTitle(null, false);
    updateCursorPosition();
    api.clearRecovery();
    if (editor) editor.focus();
  }, [checkUnsavedChanges, updateTitle, updateCursorPosition]);

  const handleOpen = useCallback(async () => {
    const canProceed = await checkUnsavedChanges();
    if (!canProceed) return;

    const result = await api.openFile();
    if (result.success) {
      // Detect line endings before textarea normalizes them to LF
      const detectedEnding = result.content.includes('\r\n') ? '\r\n' : '\n';
      setLineEnding(detectedEnding);
      setEncoding(result.encoding || 'UTF-8');
      const editor = editorRef.current;
      if (editor) editor.value = result.content;
      setCurrentFilePath(result.path);
      setOriginalContent(result.content.replace(/\r\n/g, '\n')); // Normalize for comparison
      setHasUnsavedChanges(false);
      updateTitle(result.path, false);
      updateCursorPosition();
      api.clearRecovery();
      if (editor) editor.focus();
    } else if (result.error) {
      showMessage('Could not open file: ' + result.error);
    }
  }, [checkUnsavedChanges, updateTitle, updateCursorPosition, showMessage]);

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return false;

    if (!currentFilePath) {
      return handleSaveAs();
    }

    let contentToSave = editor.value;
    if (lineEnding === '\r\n') contentToSave = contentToSave.replace(/\n/g, '\r\n');
    const result = await api.saveFile(currentFilePath, contentToSave, encoding);
    if (result.success) {
      setOriginalContent(editor.value);
      setHasUnsavedChanges(false);
      updateTitle(currentFilePath, false);
      api.clearRecovery();
      return true;
    }
    if (result.error) showMessage('Could not save file: ' + result.error);
    return false;
  }, [currentFilePath, lineEnding, encoding, updateTitle, showMessage]);

  // Keep ref in sync so checkUnsavedChanges always calls the latest handleSave
  handleSaveRef.current = handleSave;

  const handleSaveAs = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return false;

    let contentToSave = editor.value;
    if (lineEnding === '\r\n') contentToSave = contentToSave.replace(/\n/g, '\r\n');
    const result = await api.saveFileAs(contentToSave, encoding);
    if (result.success) {
      setCurrentFilePath(result.path);
      setOriginalContent(editor.value);
      setHasUnsavedChanges(false);
      updateTitle(result.path, false);
      api.clearRecovery();
      return true;
    }
    return false;
  }, [lineEnding, encoding, updateTitle]);

  const handlePrint = useCallback(() => {
    api.printDocument();
  }, []);

  const handleExit = useCallback(async () => {
    const canClose = await checkUnsavedChanges();
    if (canClose) {
      api.quitApp();
    }
  }, [checkUnsavedChanges]);

  // Edit operations
  const handleUndo = useCallback(() => {
    document.execCommand('undo');
  }, []);

  const handleRedo = useCallback(() => {
    document.execCommand('redo');
  }, []);

  const handleCut = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return;
    const selected = editor.value.substring(start, end);
    await navigator.clipboard.writeText(selected);
    editor.focus();
    // Use insertText to preserve undo history
    document.execCommand('insertText', false, '');
    handleEditorInput();
  }, [handleEditorInput]);

  const handleCopy = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return;
    await navigator.clipboard.writeText(editor.value.substring(start, end));
  }, []);

  const handlePaste = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      editor.focus();
      // Use insertText to preserve undo history (Issue #16)
      document.execCommand('insertText', false, text);
      handleEditorInput();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }, [handleEditorInput]);

  const handleDelete = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.selectionStart !== editor.selectionEnd) {
      editor.focus();
      document.execCommand('insertText', false, '');
      handleEditorInput();
    }
  }, [handleEditorInput]);

  const handleSelectAll = useCallback(() => {
    const editor = editorRef.current;
    if (editor) editor.select();
  }, []);

  const handleTimeDate = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const insertion = `${timeString} ${dateString}`;
    editor.focus();
    document.execCommand('insertText', false, insertion);
    handleEditorInput();
  }, [handleEditorInput]);

  // Find operations
  const performFind = useCallback((query, matchCase, direction) => {
    if (!query) return;
    const editor = editorRef.current;
    if (!editor) return;

    lastSearchRef.current = { query, caseSensitive: matchCase, direction };

    const text = editor.value;
    const searchText = matchCase ? text : text.toLowerCase();
    const searchQuery = matchCase ? query : query.toLowerCase();

    if (direction === 'down') {
      const startPos = editor.selectionEnd;
      const foundIndex = searchText.indexOf(searchQuery, startPos);
      if (foundIndex !== -1) {
        editor.setSelectionRange(foundIndex, foundIndex + query.length);
        editor.focus();
      } else {
        showMessage('Cannot find "' + query + '"');
      }
    } else {
      const startPos = editor.selectionStart;
      const searchArea = searchText.substring(0, startPos);
      const foundIndex = searchArea.lastIndexOf(searchQuery);
      if (foundIndex !== -1) {
        editor.setSelectionRange(foundIndex, foundIndex + query.length);
        editor.focus();
      } else {
        showMessage('Cannot find "' + query + '"');
      }
    }
  }, [showMessage]);

  const handleFindNext = useCallback(() => {
    const { query, caseSensitive, direction } = lastSearchRef.current;
    if (query) {
      performFind(query, caseSensitive, direction);
    } else {
      setActiveDialog('find');
    }
  }, [performFind]);

  const performReplace = useCallback((findQuery, replaceWith, matchCase) => {
    const editor = editorRef.current;
    if (!editor || !findQuery) return;

    const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    const compareSelected = matchCase ? selectedText : selectedText.toLowerCase();
    const compareQuery = matchCase ? findQuery : findQuery.toLowerCase();

    if (compareSelected === compareQuery) {
      editor.focus();
      document.execCommand('insertText', false, replaceWith);
      handleEditorInput();
    }

    performFind(findQuery, matchCase, 'down');
  }, [performFind, handleEditorInput]);

  const performReplaceAll = useCallback((findQuery, replaceWith, matchCase) => {
    const editor = editorRef.current;
    if (!editor || !findQuery) return;

    let text = editor.value;
    let count = 0;

    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const matches = text.match(regex);
    count = matches ? matches.length : 0;
    text = text.replace(regex, replaceWith.replace(/\$/g, '$$$$'));

    if (count > 0) {
      editor.value = text;
      handleEditorInput();
    }

    showMessage(`Replaced ${count} occurrence(s).`);
  }, [handleEditorInput, showMessage]);

  const performGoTo = useCallback((lineNum) => {
    const editor = editorRef.current;
    if (!editor || !lineNum || lineNum < 1) return;

    const lines = editor.value.split('\n');
    if (lineNum > lines.length) {
      showMessage('The line number is beyond the total number of lines');
      return;
    }

    let charIndex = 0;
    for (let i = 0; i < lineNum - 1; i++) {
      charIndex += lines[i].length + 1;
    }

    editor.setSelectionRange(charIndex, charIndex);
    editor.focus();
    setActiveDialog(null);
    updateCursorPosition();
  }, [updateCursorPosition, showMessage]);

  // Drag-and-drop file opening
  const handleFileDrop = useCallback(async (filePath) => {
    const canProceed = await checkUnsavedChanges();
    if (!canProceed) return;
    const result = await api.readFileByPath(filePath);
    if (result.success) {
      const detectedEnding = result.content.includes('\r\n') ? '\r\n' : '\n';
      setLineEnding(detectedEnding);
      setEncoding(result.encoding || 'UTF-8');
      const editor = editorRef.current;
      if (editor) editor.value = result.content;
      setCurrentFilePath(result.path);
      setOriginalContent(result.content.replace(/\r\n/g, '\n'));
      setHasUnsavedChanges(false);
      updateTitle(result.path, false);
      updateCursorPosition();
      api.clearRecovery();
      if (editor) editor.focus();
    } else if (result.error) {
      showMessage('Could not open file: ' + result.error);
    }
  }, [checkUnsavedChanges, updateTitle, updateCursorPosition, showMessage]);

  // Format operations
  const toggleWordWrap = useCallback(() => {
    setWordWrap(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      document.body.classList.toggle('dark-mode', next);
      return next;
    });
  }, []);

  const toggleStatusBar = useCallback(() => {
    setStatusBarVisible(prev => !prev);
  }, []);

  const applyFont = useCallback((family, style, size) => {
    setCurrentFont({ family, style, size });
    const editor = editorRef.current;
    if (!editor) return;
    editor.style.fontFamily = family;
    editor.style.fontSize = size + 'px';
    editor.style.fontWeight = style.includes('bold') ? 'bold' : 'normal';
    editor.style.fontStyle = style.includes('italic') ? 'italic' : 'normal';
  }, []);

  // Menu action handler
  const handleMenuAction = useCallback((action) => {
    switch (action) {
      case 'new': handleNew(); break;
      case 'open': handleOpen(); break;
      case 'save': handleSave(); break;
      case 'saveAs': handleSaveAs(); break;
      case 'print': handlePrint(); break;
      case 'exit': handleExit(); break;
      case 'undo': handleUndo(); break;
      case 'redo': handleRedo(); break;
      case 'cut': handleCut(); break;
      case 'copy': handleCopy(); break;
      case 'paste': handlePaste(); break;
      case 'delete': handleDelete(); break;
      case 'find': setActiveDialog('find'); break;
      case 'findNext': handleFindNext(); break;
      case 'replace': setActiveDialog('replace'); break;
      case 'goTo': setActiveDialog('goto'); break;
      case 'selectAll': handleSelectAll(); break;
      case 'timeDate': handleTimeDate(); break;
      case 'wordWrap': toggleWordWrap(); break;
      case 'darkMode': toggleDarkMode(); break;
      case 'font': setActiveDialog('font'); break;
      case 'statusBar': toggleStatusBar(); break;
      case 'about': setActiveDialog('about'); break;
    }
    if (editorRef.current && !['find', 'replace', 'goTo', 'font', 'about'].includes(action)) {
      editorRef.current.focus();
    }
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handlePrint, handleExit, handleUndo, handleRedo, handleCut, handleCopy, handlePaste, handleDelete, handleFindNext, handleSelectAll, handleTimeDate, toggleWordWrap, toggleDarkMode, toggleStatusBar]);

  // Keyboard shortcuts
  useEffect(() => {
    const isMac = navigator.platform?.toUpperCase().includes('MAC') || navigator.userAgent?.includes('Macintosh');
    const handleKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'n') { e.preventDefault(); handleNew(); }
      else if (ctrl && e.key === 'o') { e.preventDefault(); handleOpen(); }
      else if (ctrl && e.key === 's' && e.shiftKey) { e.preventDefault(); handleSaveAs(); }
      else if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); }
      else if (ctrl && e.key === 'p') { e.preventDefault(); handlePrint(); }
      else if (ctrl && e.key === 'f' && !e.altKey) { e.preventDefault(); setActiveDialog('find'); }
      else if (e.key === 'F3') { e.preventDefault(); handleFindNext(); }
      // On macOS, Cmd+H is system "Hide", so use Cmd+Option+F for Replace
      else if (isMac && ctrl && e.altKey && e.key === 'f') { e.preventDefault(); setActiveDialog('replace'); }
      else if (!isMac && ctrl && e.key === 'h') { e.preventDefault(); setActiveDialog('replace'); }
      else if (ctrl && e.key === 'g') { e.preventDefault(); setActiveDialog('goto'); }
      else if (ctrl && e.key === 'y') { e.preventDefault(); handleRedo(); }
      else if (e.key === 'F5') { e.preventDefault(); handleTimeDate(); }
      else if (e.key === 'Escape') { setActiveDialog(null); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handlePrint, handleFindNext, handleRedo, handleTimeDate]);

  // Listen for close event from Electron
  useEffect(() => {
    const handler = async () => {
      const canClose = await checkUnsavedChanges();
      if (canClose) {
        api.forceQuit();
      }
    };
    api.onCheckUnsavedBeforeClose(handler);
    return () => api.removeCheckUnsavedBeforeClose(handler);
  }, [checkUnsavedChanges]);

  // Issue #31: Listen for file-open events from CLI args or file associations
  useEffect(() => {
    const handleFileFromArg = async (filePath) => {
      const result = await api.readFileByPath(filePath);
      if (result.success) {
        const detectedEnding = result.content.includes('\r\n') ? '\r\n' : '\n';
        setLineEnding(detectedEnding);
        setEncoding(result.encoding || 'UTF-8');
        const editor = editorRef.current;
        if (editor) editor.value = result.content;
        setCurrentFilePath(result.path);
        setOriginalContent(result.content.replace(/\r\n/g, '\n'));
        setHasUnsavedChanges(false);
        updateTitle(result.path, false);
        updateCursorPosition();
        api.clearRecovery();
        if (editor) editor.focus();
      }
    };
    api.onOpenFileFromArg(handleFileFromArg);
  }, [updateTitle, updateCursorPosition]);

  // Issue #11 + #13: Load preferences on mount, falling back to OS dark mode if no saved pref
  const prefsLoaded = useRef(false);
  useEffect(() => {
    (async () => {
      const prefs = await api.getPreferences();
      prefsLoaded.current = true;

      if (prefs.wordWrap !== undefined) setWordWrap(prefs.wordWrap);
      if (prefs.statusBarVisible !== undefined) setStatusBarVisible(prefs.statusBarVisible);
      if (prefs.font) setCurrentFont(prefs.font);

      // Dark mode: prefer saved pref, fall back to OS setting
      if (prefs.darkMode !== undefined) {
        setDarkMode(prefs.darkMode);
        document.body.classList.toggle('dark-mode', prefs.darkMode);
      } else {
        const systemDark = await api.getSystemDarkMode();
        setDarkMode(systemDark);
        document.body.classList.toggle('dark-mode', systemDark);
      }

      // Apply saved font to editor
      if (prefs.font) {
        const editor = editorRef.current;
        if (editor) {
          editor.style.fontFamily = prefs.font.family;
          editor.style.fontSize = prefs.font.size + 'px';
          editor.style.fontWeight = prefs.font.style?.includes('bold') ? 'bold' : 'normal';
          editor.style.fontStyle = prefs.font.style?.includes('italic') ? 'italic' : 'normal';
        }
      }
    })();
  }, []);

  // Issue #11: Save preferences when settings change (debounced)
  useEffect(() => {
    if (!prefsLoaded.current) return; // Don't save during initial load
    const timer = setTimeout(() => {
      api.setPreferences({ darkMode, wordWrap, statusBarVisible, font: currentFont });
    }, 300);
    return () => clearTimeout(timer);
  }, [darkMode, wordWrap, statusBarVisible, currentFont]);

  // Issue #36: Check for recovery file on startup
  useEffect(() => {
    (async () => {
      const result = await api.checkRecovery();
      if (result.exists && result.data) {
        setRecoveryData(result.data);
        setActiveDialog('recovery');
      }
    })();
  }, []);

  // Issue #36: Resolve recovery dialog
  const resolveRecovery = useCallback((restore) => {
    if (restore && recoveryData) {
      const editor = editorRef.current;
      if (editor) editor.value = recoveryData.content || '';
      setCurrentFilePath(recoveryData.originalPath || null);
      setEncoding(recoveryData.encoding || 'UTF-8');
      setLineEnding(recoveryData.lineEnding || '\n');
      setOriginalContent('');
      setHasUnsavedChanges(true);
      updateTitle(recoveryData.originalPath || null, true);
      updateCursorPosition();
    }
    api.clearRecovery();
    setRecoveryData(null);
    setActiveDialog(null);
  }, [recoveryData, updateTitle, updateCursorPosition]);

  // Issue #36: Auto-save recovery file every 30s when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setInterval(() => {
      const editor = editorRef.current;
      if (!editor) return;
      api.saveRecovery({
        content: editor.value,
        originalPath: currentFilePath,
        encoding,
        lineEnding,
        timestamp: Date.now(),
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [hasUnsavedChanges, currentFilePath, encoding, lineEnding]);

  // Initialize title
  useEffect(() => {
    updateTitle(null, false);
  }, [updateTitle]);

  return {
    editorRef,
    currentFilePath,
    hasUnsavedChanges,
    wordWrap,
    darkMode,
    statusBarVisible,
    cursorPosition,
    activeDialog,
    currentFont,
    encoding,
    lineEnding,
    setActiveDialog,
    handleMenuAction,
    handleEditorInput,
    updateCursorPosition,
    performFind,
    performReplace,
    performReplaceAll,
    performGoTo,
    applyFont,
    resolveUnsaved,
    messageDialog,
    closeMessage,
    findState,
    setFindState,
    replaceState,
    setReplaceState,
    handleFileDrop,
    recoveryData,
    resolveRecovery,
  };
}
