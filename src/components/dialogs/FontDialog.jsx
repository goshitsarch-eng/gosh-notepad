import React, { useState, useEffect } from 'react';

const fontFamilies = [
  { label: 'Fixedsys', value: "'Fixedsys Excelsior', Fixedsys, monospace" },
  { label: 'Lucida Console', value: "'Lucida Console', monospace" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Consolas', value: "Consolas, monospace" },
  { label: 'Monaco', value: "Monaco, monospace" },
  { label: 'DejaVu Sans Mono', value: "'DejaVu Sans Mono', monospace" },
  { label: 'Liberation Mono', value: "'Liberation Mono', monospace" },
  { label: 'Ubuntu Mono', value: "'Ubuntu Mono', monospace" },
  { label: 'Noto Sans Mono', value: "'Noto Sans Mono', monospace" },
  { label: 'System Monospace', value: "monospace" },
];

const fontStyles = [
  { label: 'Regular', value: 'normal' },
  { label: 'Italic', value: 'italic' },
  { label: 'Bold', value: 'bold' },
  { label: 'Bold Italic', value: 'bold italic' },
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];

export default function FontDialog({ onClose, onApply, currentFont }) {
  const [selectedFamily, setSelectedFamily] = useState(currentFont.family);
  const [selectedStyle, setSelectedStyle] = useState(currentFont.style);
  const [selectedSize, setSelectedSize] = useState(currentFont.size);
  const [availableFonts, setAvailableFonts] = useState(fontFamilies);

  useEffect(() => {
    // Filter to fonts actually available on this system
    const available = fontFamilies.filter((f) => {
      if (f.value === 'monospace') return true; // System fallback always available
      const primaryFont = f.value.split(',')[0].trim().replace(/'/g, '');
      return document.fonts.check(`12px "${primaryFont}"`);
    });
    // Ensure System Monospace is always present
    if (!available.find(f => f.value === 'monospace')) {
      available.push({ label: 'System Monospace', value: 'monospace' });
    }
    setAvailableFonts(available);
  }, []);

  const sampleStyle = {
    fontFamily: selectedFamily,
    fontSize: selectedSize + 'px',
    fontWeight: selectedStyle.includes('bold') ? 'bold' : 'normal',
    fontStyle: selectedStyle.includes('italic') ? 'italic' : 'normal',
  };

  const currentFamilyLabel = availableFonts.find(f => f.value === selectedFamily)?.label
    || fontFamilies.find(f => f.value === selectedFamily)?.label
    || 'Lucida Console';
  const currentStyleLabel = fontStyles.find(f => f.value === selectedStyle)?.label || 'Regular';

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="font-dialog-title">
      <div className="window dialog-window dialog-large">
        <div className="title-bar">
          <div className="title-bar-text" id="font-dialog-title">Font</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="window-body">
          <div className="font-selectors">
            <div className="font-column">
              <label>Font:</label>
              <input type="text" readOnly value={currentFamilyLabel} />
              <div className="font-listbox" role="listbox" aria-label="Font family">
                {availableFonts.map((f) => (
                  <div
                    key={f.value}
                    role="option"
                    aria-selected={selectedFamily === f.value}
                    className={`font-listbox-item${selectedFamily === f.value ? ' selected' : ''}`}
                    onClick={() => setSelectedFamily(f.value)}
                  >
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="font-column-small">
              <label>Font Style:</label>
              <input type="text" readOnly value={currentStyleLabel} />
              <div className="font-listbox" role="listbox" aria-label="Font style">
                {fontStyles.map((s) => (
                  <div
                    key={s.value}
                    role="option"
                    aria-selected={selectedStyle === s.value}
                    className={`font-listbox-item${selectedStyle === s.value ? ' selected' : ''}`}
                    onClick={() => setSelectedStyle(s.value)}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="font-column-small">
              <label>Size:</label>
              <input type="text" readOnly value={selectedSize} />
              <div className="font-listbox" role="listbox" aria-label="Font size">
                {fontSizes.map((sz) => (
                  <div
                    key={sz}
                    role="option"
                    aria-selected={selectedSize === sz}
                    className={`font-listbox-item${selectedSize === sz ? ' selected' : ''}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <fieldset style={{ marginTop: 12 }}>
            <legend>Sample</legend>
            <div id="font-sample" style={sampleStyle}>AaBbYyZz</div>
          </fieldset>
          <div className="button-row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => { onApply(selectedFamily, selectedStyle, selectedSize); onClose(); }}>OK</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
