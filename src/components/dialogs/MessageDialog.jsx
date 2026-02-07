import React, { useEffect, useRef } from 'react';

export default function MessageDialog({ title = 'Notepad', message, onClose }) {
  const okRef = useRef(null);

  useEffect(() => {
    if (okRef.current) okRef.current.focus();
  }, []);

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="message-dialog-title">
      <div className="window dialog-window">
        <div className="title-bar">
          <div className="title-bar-text" id="message-dialog-title">{title}</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="window-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="16" cy="16" r="14" fill="#3399ff" stroke="#000" />
              <rect x="14" y="14" width="4" height="10" fill="#fff" />
              <rect x="14" y="8" width="4" height="4" fill="#fff" />
            </svg>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
          <div className="button-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button ref={okRef} onClick={onClose}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}
