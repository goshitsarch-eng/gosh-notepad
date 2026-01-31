import React from 'react';

export default function UnsavedChangesDialog({ filename, onSave, onDontSave, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="window dialog-window">
        <div className="title-bar">
          <div className="title-bar-text">Notepad</div>
        </div>
        <div className="window-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="16" cy="16" r="14" fill="#ffff00" stroke="#000" />
              <rect x="14" y="8" width="4" height="12" fill="#000" />
              <rect x="14" y="22" width="4" height="4" fill="#000" />
            </svg>
            <p style={{ margin: 0 }}>Do you want to save changes to {filename}?</p>
          </div>
          <div className="button-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button onClick={onSave}>Save</button>
            <button onClick={onDontSave}>Don't Save</button>
            <button onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
