import React, { useState, useCallback, useEffect, useRef } from 'react';

export default function Editor({ editorRef, wordWrap, onInput, onCursorMove, onAction }) {
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
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

  return (
    <>
      <textarea
        ref={editorRef}
        className={`notepad-editor ${wordWrap ? 'word-wrap' : 'no-wrap'}`}
        spellCheck={false}
        onInput={onInput}
        onKeyUp={onCursorMove}
        onClick={onCursorMove}
        onMouseUp={onCursorMove}
        onContextMenu={handleContextMenu}
      />
      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="menu-option" onClick={() => handleMenuClick('undo')}>Undo</div>
          <div className="menu-separator" />
          <div className="menu-option" onClick={() => handleMenuClick('cut')}>Cut</div>
          <div className="menu-option" onClick={() => handleMenuClick('copy')}>Copy</div>
          <div className="menu-option" onClick={() => handleMenuClick('paste')}>Paste</div>
          <div className="menu-option" onClick={() => handleMenuClick('delete')}>Delete</div>
          <div className="menu-separator" />
          <div className="menu-option" onClick={() => handleMenuClick('selectAll')}>Select All</div>
        </div>
      )}
    </>
  );
}
