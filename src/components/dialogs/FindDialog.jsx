import React, { useState, useRef, useEffect } from 'react';

export default function FindDialog({ onClose, onFind }) {
  const [query, setQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [direction, setDirection] = useState('down');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleFind = () => onFind(query, matchCase, direction);

  return (
    <div className="dialog-overlay">
      <div className="window dialog-window">
        <div className="title-bar">
          <div className="title-bar-text">Find</div>
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
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFind()}
            />
          </div>
          <div className="field-row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              id="find-match-case"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
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
                onChange={() => setDirection('up')}
              />
              <label htmlFor="find-dir-up">Up</label>
              <input
                type="radio"
                id="find-dir-down"
                name="find-direction"
                value="down"
                checked={direction === 'down'}
                onChange={() => setDirection('down')}
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
