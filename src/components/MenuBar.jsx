import React, { useState, useEffect, useRef } from 'react';

const menus = [
  {
    label: 'File',
    items: [
      { action: 'new', label: 'New', shortcut: 'Ctrl+N' },
      { action: 'open', label: 'Open...', shortcut: 'Ctrl+O' },
      { action: 'save', label: 'Save', shortcut: 'Ctrl+S' },
      { action: 'saveAs', label: 'Save As...' },
      'separator',
      { label: 'Page Setup...', disabled: true },
      { action: 'print', label: 'Print...', shortcut: 'Ctrl+P' },
      'separator',
      { action: 'exit', label: 'Exit' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { action: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
      'separator',
      { action: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
      { action: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
      { action: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
      { action: 'delete', label: 'Delete', shortcut: 'Del' },
      'separator',
      { action: 'find', label: 'Find...', shortcut: 'Ctrl+F' },
      { action: 'findNext', label: 'Find Next', shortcut: 'F3' },
      { action: 'replace', label: 'Replace...', shortcut: 'Ctrl+H' },
      { action: 'goTo', label: 'Go To...', shortcut: 'Ctrl+G' },
      'separator',
      { action: 'selectAll', label: 'Select All', shortcut: 'Ctrl+A' },
      { action: 'timeDate', label: 'Time/Date', shortcut: 'F5' },
    ],
  },
  {
    label: 'Format',
    items: [
      { action: 'wordWrap', label: 'Word Wrap', checkable: true, checkKey: 'wordWrap' },
      { action: 'darkMode', label: 'Dark Mode', checkable: true, checkKey: 'darkMode' },
      { action: 'font', label: 'Font...' },
    ],
  },
  {
    label: 'View',
    items: [
      { action: 'statusBar', label: 'Status Bar', checkable: true, checkKey: 'statusBarVisible' },
    ],
  },
  {
    label: 'Help',
    items: [
      { action: 'about', label: 'About Notepad' },
    ],
  },
];

export default function MenuBar({ onAction, wordWrap, darkMode, statusBarVisible }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuBarRef = useRef(null);

  const checkStates = { wordWrap, darkMode, statusBarVisible };

  useEffect(() => {
    const handleClick = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="menu-bar" ref={menuBarRef}>
      {menus.map((menu) => (
        <div
          key={menu.label}
          className={`menu-item${activeMenu === menu.label ? ' active' : ''}`}
        >
          <span
            className="menu-title"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === menu.label ? null : menu.label);
            }}
            onMouseEnter={() => {
              if (activeMenu) setActiveMenu(menu.label);
            }}
          >
            {menu.label}
          </span>
          <div className="menu-dropdown">
            {menu.items.map((item, i) => {
              if (item === 'separator') {
                return <div key={i} className="menu-separator" />;
              }
              const checked = item.checkable && checkStates[item.checkKey];
              return (
                <div
                  key={item.action || i}
                  className={`menu-option${item.disabled ? ' disabled' : ''}${item.checkable ? ' checkable' : ''}${checked ? ' checked' : ''}`}
                  onClick={() => {
                    if (item.disabled) return;
                    if (item.action) onAction(item.action);
                    setActiveMenu(null);
                  }}
                >
                  {item.label}
                  {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
