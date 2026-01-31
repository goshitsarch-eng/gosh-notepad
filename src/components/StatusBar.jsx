import React from 'react';

export default function StatusBar({ line, col }) {
  return (
    <div className="status-bar">
      <div className="status-bar-field">Ln {line}, Col {col}</div>
    </div>
  );
}
