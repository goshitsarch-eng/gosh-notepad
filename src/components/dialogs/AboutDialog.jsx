import React from 'react';

export default function AboutDialog({ onClose }) {
  return (
    <div className="dialog-overlay">
      <div className="window dialog-window">
        <div className="title-bar">
          <div className="title-bar-text">About Notepad</div>
        </div>
        <div className="window-body about-content">
          <div className="about-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="2" width="24" height="28" fill="#fff" stroke="#000" />
              <line x1="8" y1="8" x2="24" y2="8" stroke="#000" />
              <line x1="8" y1="12" x2="24" y2="12" stroke="#000" />
              <line x1="8" y1="16" x2="24" y2="16" stroke="#000" />
              <line x1="8" y1="20" x2="18" y2="20" stroke="#000" />
            </svg>
          </div>
          <h3>Notepad</h3>
          <p>Version 3.0.0</p>
          <hr />
          <p className="about-description">
            A Windows 95/98 Notepad clone<br />
            Built with Electron by Goshitsarch
          </p>
          <button onClick={onClose} style={{ marginTop: 12 }}>OK</button>
        </div>
      </div>
    </div>
  );
}
