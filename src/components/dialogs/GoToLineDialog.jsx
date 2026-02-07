import React, { useState, useRef, useEffect } from 'react';

export default function GoToLineDialog({ onClose, onGoTo }) {
  const [lineNum, setLineNum] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleGoTo = () => {
    const num = parseInt(lineNum, 10);
    if (!isNaN(num)) onGoTo(num);
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="goto-dialog-title">
      <div className="window dialog-window dialog-small">
        <div className="title-bar">
          <div className="title-bar-text" id="goto-dialog-title">Go To Line</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="window-body">
          <div className="field-row-stacked">
            <label htmlFor="goto-line-input">Line number:</label>
            <input
              type="number"
              id="goto-line-input"
              min="1"
              ref={inputRef}
              value={lineNum}
              onChange={(e) => setLineNum(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGoTo()}
            />
          </div>
          <div className="button-row" style={{ marginTop: 12 }}>
            <button onClick={handleGoTo}>Go To</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
