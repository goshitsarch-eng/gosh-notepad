import React, { useRef, useEffect, useCallback, useState } from 'react';

export default function ReplaceDialog({ onClose, onFind, onReplace, onReplaceAll, replaceState, onReplaceStateChange }) {
  const { findQuery, replaceWith, matchCase } = replaceState;
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Center on first render if no position set
  useEffect(() => {
    if (!position && dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      setPosition({
        x: Math.max(0, (window.innerWidth - rect.width) / 2),
        y: Math.max(0, window.innerHeight * 0.25),
      });
    }
  }, [position]);

  const update = useCallback((partial) => {
    onReplaceStateChange({ ...replaceState, ...partial });
  }, [replaceState, onReplaceStateChange]);

  const handleDragStart = useCallback((e) => {
    if (!dialogRef.current) return;
    const rect = dialogRef.current.getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const handleMove = (ev) => {
      setPosition({ x: ev.clientX - offset.x, y: ev.clientY - offset.y });
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp, { once: true });
  }, []);

  const style = position ? { top: position.y, left: position.x } : { top: '25%', left: '50%', transform: 'translateX(-50%)' };

  return (
    <div className="dialog-floating" ref={dialogRef} style={style} role="dialog" aria-labelledby="replace-dialog-title">
      <div className="window dialog-window">
        <div className="title-bar" onMouseDown={handleDragStart}>
          <div className="title-bar-text" id="replace-dialog-title">Replace</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="window-body">
          <div className="field-row-stacked">
            <label htmlFor="replace-find-input">Find what:</label>
            <input
              type="text"
              id="replace-find-input"
              ref={inputRef}
              value={findQuery}
              onChange={(e) => update({ findQuery: e.target.value })}
            />
          </div>
          <div className="field-row-stacked" style={{ marginTop: 8 }}>
            <label htmlFor="replace-with-input">Replace with:</label>
            <input
              type="text"
              id="replace-with-input"
              value={replaceWith}
              onChange={(e) => update({ replaceWith: e.target.value })}
            />
          </div>
          <div className="field-row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              id="replace-match-case"
              checked={matchCase}
              onChange={(e) => update({ matchCase: e.target.checked })}
            />
            <label htmlFor="replace-match-case">Match case</label>
          </div>
          <div className="button-row" style={{ marginTop: 12 }}>
            <button onClick={() => onFind(findQuery, matchCase, 'down')}>Find Next</button>
            <button onClick={() => onReplace(findQuery, replaceWith, matchCase)}>Replace</button>
            <button onClick={() => onReplaceAll(findQuery, replaceWith, matchCase)}>Replace All</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
