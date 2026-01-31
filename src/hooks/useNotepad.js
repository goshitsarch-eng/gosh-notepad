import { useState, useRef, useCallback, useEffect } from 'react';

const api = window.electronAPI || {
  newFile: () => Promise.resolve({ success: false }),
  openFile: () => Promise.resolve({ success: false }),
  saveFile: () => Promise.resolve({ success: false }),
  saveFileAs: () => Promise.resolve({ success: false }),
  printDocument: () => {},
  setWindowTitle: () => {},
  quitApp: () => {},
  forceQuit: () => {},
  onCheckUnsavedBeforeClose: () => {},
  removeCheckUnsavedBeforeClose: () => {},
};

export function useNotepad() {
  const editorRef = useRef(null);

  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [originalContent, setOriginalContent] = useState('');
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

  const lastSearchRef = useRef({
    query: '',
    direction: 'down',
    caseSensitive: false,
  });

  const unsavedResolveRef = useRef(null);

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

  // Check content changes
  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const unsaved = editor.value !== originalContent;
    setHasUnsavedChanges(unsaved);
    updateTitle(currentFilePath, unsaved);
  }, [originalContent, currentFilePath, updateTitle]);

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
      const saved = await handleSave();
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
    setHasUnsavedChanges(false);
    updateTitle(null, false);
    updateCursorPosition();
    if (editor) editor.focus();
  }, [checkUnsavedChanges, updateTitle, updateCursorPosition]);

  const handleOpen = useCallback(async () => {
    const canProceed = await checkUnsavedChanges();
    if (!canProceed) return;

    const result = await api.openFile();
    if (result.success) {
      const editor = editorRef.current;
      if (editor) editor.value = result.content;
      setCurrentFilePath(result.path);
      setOriginalContent(result.content);
      setHasUnsavedChanges(false);
      updateTitle(result.path, false);
      updateCursorPosition();
      if (editor) editor.focus();
    }
  }, [checkUnsavedChanges, updateTitle, updateCursorPosition]);

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return false;

    if (!currentFilePath) {
      return handleSaveAs();
    }

    const result = await api.saveFile(currentFilePath, editor.value);
    if (result.success) {
      setOriginalContent(editor.value);
      setHasUnsavedChanges(false);
      updateTitle(currentFilePath, false);
      return true;
    }
    return false;
  }, [currentFilePath, updateTitle]);

  const handleSaveAs = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return false;

    const result = await api.saveFileAs(editor.value);
    if (result.success) {
      setCurrentFilePath(result.path);
      setOriginalContent(editor.value);
      setHasUnsavedChanges(false);
      updateTitle(result.path, false);
      return true;
    }
    return false;
  }, [updateTitle]);

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

  const handleCut = useCallback(() => {
    document.execCommand('cut');
  }, []);

  const handleCopy = useCallback(() => {
    document.execCommand('copy');
  }, []);

  const handlePaste = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + text.length;
      handleEditorInput();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }, [handleEditorInput]);

  const handleDelete = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start !== end) {
      editor.value = editor.value.slice(0, start) + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start;
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
    const pos = editor.selectionStart;
    editor.value = editor.value.slice(0, pos) + insertion + editor.value.slice(editor.selectionEnd);
    editor.selectionStart = editor.selectionEnd = pos + insertion.length;
    editor.focus();
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
        alert('Cannot find "' + query + '"');
      }
    } else {
      const startPos = editor.selectionStart;
      const searchArea = searchText.substring(0, startPos);
      const foundIndex = searchArea.lastIndexOf(searchQuery);
      if (foundIndex !== -1) {
        editor.setSelectionRange(foundIndex, foundIndex + query.length);
        editor.focus();
      } else {
        alert('Cannot find "' + query + '"');
      }
    }
  }, []);

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
      const start = editor.selectionStart;
      editor.value = editor.value.substring(0, start) + replaceWith + editor.value.substring(editor.selectionEnd);
      editor.setSelectionRange(start, start + replaceWith.length);
      handleEditorInput();
    }

    performFind(findQuery, matchCase, 'down');
  }, [performFind, handleEditorInput]);

  const performReplaceAll = useCallback((findQuery, replaceWith, matchCase) => {
    const editor = editorRef.current;
    if (!editor || !findQuery) return;

    let text = editor.value;
    let count = 0;

    if (matchCase) {
      while (text.includes(findQuery)) {
        text = text.replace(findQuery, replaceWith);
        count++;
      }
    } else {
      const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      count = matches ? matches.length : 0;
      text = text.replace(regex, replaceWith.replace(/\$/g, '$$$$'));
    }

    if (count > 0) {
      editor.value = text;
      handleEditorInput();
    }

    alert(`Replaced ${count} occurrence(s).`);
  }, [handleEditorInput]);

  const performGoTo = useCallback((lineNum) => {
    const editor = editorRef.current;
    if (!editor || !lineNum || lineNum < 1) return;

    const lines = editor.value.split('\n');
    if (lineNum > lines.length) {
      alert('The line number is beyond the total number of lines');
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
  }, [updateCursorPosition]);

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
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handlePrint, handleExit, handleUndo, handleCut, handleCopy, handlePaste, handleDelete, handleFindNext, handleSelectAll, handleTimeDate, toggleWordWrap, toggleDarkMode, toggleStatusBar]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'n') { e.preventDefault(); handleNew(); }
      else if (ctrl && e.key === 'o') { e.preventDefault(); handleOpen(); }
      else if (ctrl && e.key === 's' && e.shiftKey) { e.preventDefault(); handleSaveAs(); }
      else if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); }
      else if (ctrl && e.key === 'p') { e.preventDefault(); handlePrint(); }
      else if (ctrl && e.key === 'f') { e.preventDefault(); setActiveDialog('find'); }
      else if (e.key === 'F3') { e.preventDefault(); handleFindNext(); }
      else if (ctrl && e.key === 'h') { e.preventDefault(); setActiveDialog('replace'); }
      else if (ctrl && e.key === 'g') { e.preventDefault(); setActiveDialog('goto'); }
      else if (e.key === 'F5') { e.preventDefault(); handleTimeDate(); }
      else if (e.key === 'Escape') { setActiveDialog(null); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handlePrint, handleFindNext, handleTimeDate]);

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
  };
}
