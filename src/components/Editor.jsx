import React, { useState, useCallback, useEffect, useRef } from 'react';

export default function Editor({ editorRef, wordWrap, onInput, onCursorMove, onAction, onDrop }) {
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    // Clamp position to viewport to prevent overflow
    const menuWidth = 160;
    const menuHeight = 200;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 4);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 4);
    setContextMenu({ x: Math.max(0, x), y: Math.max(0, y) });
  }, []);

  const handleMenuClick = useCallback((action) => {
    setContextMenu(null);
    if (editorRef.current) editorRef.current.focus();
    // Small delay to ensure focus is restored before execCommand
    setTimeout(() => {
      if (onAction) onAction(action);
    }, 0);
  }, [onAction, editorRef]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.path && onDrop) {
      onDrop(file.path);
    }
  }, [onDrop]);

  return (
    <>
      <textarea
        ref={editorRef}
        className={`notepad-editor ${wordWrap ? 'word-wrap' : 'no-wrap'}`}
        aria-label="Text editor"
        spellCheck={false}
        onInput={onInput}
        onKeyUp={onCursorMove}
        onClick={onCursorMove}
        onMouseUp={onCursorMove}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          role="menu"
          aria-label="Context menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="menu-option" role="menuitem" onClick={() => handleMenuClick('undo')}>Undo</div>
          <div className="menu-separator" role="separator" />
          <div className="menu-option" role="menuitem" onClick={() => handleMenuClick('cut')}>Cut</div>
          <div className="menu-option" role="menuitem" onClick={() => handleMenuClick('copy')}>Copy</div>
          <div className="menu-option" role="menuitem" onClick={() => handleMenuClick('paste')}>Paste</div>
          <div className="menu-option" role="menuitem" onClick={() => handleMenuClick('delete')}>Delete</div>
          <div className="menu-separator" role="separator" />
          <div className="menu-option" role="menuitem" onClick={() => handleMenuClick('selectAll')}>Select All</div>
        </div>
      )}
    </>
  );
}
