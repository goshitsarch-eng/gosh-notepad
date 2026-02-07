import React from 'react';

const LINE_ENDING_LABELS = {
  '\r\n': 'Windows (CRLF)',
  '\n': 'Unix (LF)',
};

export default function StatusBar({ line, col, encoding, lineEnding }) {
  return (
    <div className="status-bar" role="status" aria-live="polite">
      <div className="status-bar-field status-bar-position">Ln {line}, Col {col}</div>
      <div className="status-bar-field status-bar-info">{LINE_ENDING_LABELS[lineEnding] || 'Unix (LF)'}</div>
      <div className="status-bar-field status-bar-info">{encoding || 'UTF-8'}</div>
    </div>
  );
}
