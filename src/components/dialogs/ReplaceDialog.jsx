import React, { useState, useRef, useEffect } from 'react';

export default function ReplaceDialog({ onClose, onFind, onReplace, onReplaceAll }) {
  const [findQuery, setFindQuery] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  return (
    <div className="dialog-overlay">
      <div className="window dialog-window">
        <div className="title-bar">
          <div className="title-bar-text">Replace</div>
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
              onChange={(e) => setFindQuery(e.target.value)}
            />
          </div>
          <div className="field-row-stacked" style={{ marginTop: 8 }}>
            <label htmlFor="replace-with-input">Replace with:</label>
            <input
              type="text"
              id="replace-with-input"
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
            />
          </div>
          <div className="field-row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              id="replace-match-case"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
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
