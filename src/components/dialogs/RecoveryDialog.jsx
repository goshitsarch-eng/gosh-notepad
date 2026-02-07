import React from 'react';

export default function RecoveryDialog({ timestamp, filePath, onRestore, onDiscard }) {
  const dateStr = timestamp ? new Date(timestamp).toLocaleString() : 'unknown time';

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="recovery-dialog-title">
      <div className="window dialog-window">
        <div className="title-bar">
          <div className="title-bar-text" id="recovery-dialog-title">Recovery</div>
        </div>
        <div className="window-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="16" cy="16" r="14" fill="#4488ff" stroke="#000" />
              <rect x="14" y="8" width="4" height="4" fill="#fff" />
              <rect x="14" y="14" width="4" height="12" fill="#fff" />
            </svg>
            <div>
              <p style={{ margin: '0 0 4px 0' }}>An unsaved document was recovered from {dateStr}.</p>
              {filePath && <p style={{ margin: '0 0 4px 0', fontSize: 11 }}>Original file: {filePath}</p>}
              <p style={{ margin: 0 }}>Would you like to restore it?</p>
            </div>
          </div>
          <div className="button-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button onClick={onRestore}>Restore</button>
            <button onClick={onDiscard}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
}
