import React, { useRef, useEffect, useCallback, useState } from 'react';

export default function FindDialog({ onClose, onFind, findState, onFindStateChange }) {
  const { query, matchCase, direction } = findState;
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
    onFindStateChange({ ...findState, ...partial });
  }, [findState, onFindStateChange]);

  const handleFind = () => onFind(query, matchCase, direction);

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
    <div className="dialog-floating" ref={dialogRef} style={style} role="dialog" aria-labelledby="find-dialog-title">
      <div className="window dialog-window">
        <div className="title-bar" onMouseDown={handleDragStart}>
          <div className="title-bar-text" id="find-dialog-title">Find</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="window-body">
          <div className="field-row-stacked">
            <label htmlFor="find-input">Find what:</label>
            <input
              type="text"
              id="find-input"
              ref={inputRef}
              value={query}
              onChange={(e) => update({ query: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleFind()}
            />
          </div>
          <div className="field-row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              id="find-match-case"
              checked={matchCase}
              onChange={(e) => update({ matchCase: e.target.checked })}
            />
            <label htmlFor="find-match-case">Match case</label>
          </div>
          <fieldset style={{ marginTop: 8 }}>
            <legend>Direction</legend>
            <div className="field-row">
              <input
                type="radio"
                id="find-dir-up"
                name="find-direction"
                value="up"
                checked={direction === 'up'}
                onChange={() => update({ direction: 'up' })}
              />
              <label htmlFor="find-dir-up">Up</label>
              <input
                type="radio"
                id="find-dir-down"
                name="find-direction"
                value="down"
                checked={direction === 'down'}
                onChange={() => update({ direction: 'down' })}
              />
              <label htmlFor="find-dir-down">Down</label>
            </div>
          </fieldset>
          <div className="button-row" style={{ marginTop: 12 }}>
            <button onClick={handleFind}>Find Next</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
