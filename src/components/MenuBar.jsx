import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const isMac = typeof navigator !== 'undefined' &&
  (navigator.platform?.toUpperCase().includes('MAC') || navigator.userAgent?.includes('Macintosh'));

function formatShortcut(shortcut) {
  if (!shortcut || !isMac) return shortcut;
  return shortcut
    .replace('Ctrl+', '\u2318')
    .replace('Alt+', '\u2325')
    .replace('Shift+', '\u21E7')
    .replace('Del', '\u232B');
}

const baseMenus = [
  {
    label: 'File',
    items: [
      { action: 'new', label: 'New', shortcut: 'Ctrl+N' },
      { action: 'open', label: 'Open...', shortcut: 'Ctrl+O' },
      { action: 'save', label: 'Save', shortcut: 'Ctrl+S' },
      { action: 'saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
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
      { action: 'redo', label: 'Redo', shortcut: 'Ctrl+Y' },
      'separator',
      { action: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
      { action: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
      { action: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
      { action: 'delete', label: 'Delete', shortcut: 'Del' },
      'separator',
      { action: 'find', label: 'Find...', shortcut: 'Ctrl+F' },
      { action: 'findNext', label: 'Find Next', shortcut: 'F3' },
      { action: 'replace', label: 'Replace...', shortcut: isMac ? 'Alt+Ctrl+F' : 'Ctrl+H' },
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
  const [focusedItem, setFocusedItem] = useState(-1);
  const menuBarRef = useRef(null);
  const menuTitleRefs = useRef([]);
  const menuItemRefs = useRef([]);

  // baseMenus is a module-level constant, so useMemo is just for clarity
  const menus = useMemo(() => baseMenus, []);

  const checkStates = { wordWrap, darkMode, statusBarVisible };

  // Get actionable (non-separator, non-disabled) items for the active menu
  const getActionableItems = useCallback((menuLabel) => {
    const menu = menus.find(m => m.label === menuLabel);
    if (!menu) return [];
    return menu.items
      .map((item, i) => ({ item, index: i }))
      .filter(({ item }) => item !== 'separator' && !item.disabled);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setActiveMenu(null);
        setFocusedItem(-1);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Keyboard navigation
  const handleMenuBarKeyDown = useCallback((e) => {
    if (!activeMenu) return;

    const menuIndex = menus.findIndex(m => m.label === activeMenu);
    const actionable = getActionableItems(activeMenu);

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        const nextIdx = (menuIndex + 1) % menus.length;
        setActiveMenu(menus[nextIdx].label);
        setFocusedItem(-1);
        menuTitleRefs.current[nextIdx]?.focus();
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const prevIdx = (menuIndex - 1 + menus.length) % menus.length;
        setActiveMenu(menus[prevIdx].label);
        setFocusedItem(-1);
        menuTitleRefs.current[prevIdx]?.focus();
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        if (actionable.length === 0) break;
        const currentActionIdx = actionable.findIndex(a => a.index === focusedItem);
        const nextActionIdx = currentActionIdx < actionable.length - 1 ? currentActionIdx + 1 : 0;
        const newItem = actionable[nextActionIdx].index;
        setFocusedItem(newItem);
        menuItemRefs.current[newItem]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (actionable.length === 0) break;
        const currentActionIdx = actionable.findIndex(a => a.index === focusedItem);
        const prevActionIdx = currentActionIdx > 0 ? currentActionIdx - 1 : actionable.length - 1;
        const newItem = actionable[prevActionIdx].index;
        setFocusedItem(newItem);
        menuItemRefs.current[newItem]?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (focusedItem >= 0) {
          const menu = menus.find(m => m.label === activeMenu);
          const item = menu?.items[focusedItem];
          if (item && item !== 'separator' && !item.disabled && item.action) {
            onAction(item.action);
            setActiveMenu(null);
            setFocusedItem(-1);
          }
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setActiveMenu(null);
        setFocusedItem(-1);
        const idx = menus.findIndex(m => m.label === activeMenu);
        menuTitleRefs.current[idx]?.focus();
        break;
      }
    }
  }, [activeMenu, focusedItem, getActionableItems, onAction]);

  // Reset focused item when menu changes
  useEffect(() => {
    setFocusedItem(-1);
    menuItemRefs.current = [];
  }, [activeMenu]);

  return (
    <div
      className="menu-bar"
      ref={menuBarRef}
      role="menubar"
      aria-label="Menu bar"
      onKeyDown={handleMenuBarKeyDown}
    >
      {menus.map((menu, menuIdx) => (
        <div
          key={menu.label}
          className={`menu-item${activeMenu === menu.label ? ' active' : ''}`}
        >
          <span
            className="menu-title"
            role="menuitem"
            tabIndex={menuIdx === 0 ? 0 : -1}
            aria-haspopup="true"
            aria-expanded={activeMenu === menu.label}
            ref={el => menuTitleRefs.current[menuIdx] = el}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === menu.label ? null : menu.label);
            }}
            onMouseEnter={() => {
              if (activeMenu) setActiveMenu(menu.label);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveMenu(menu.label);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIdx = (menuIdx + 1) % menus.length;
                menuTitleRefs.current[nextIdx]?.focus();
                if (activeMenu) setActiveMenu(menus[nextIdx].label);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIdx = (menuIdx - 1 + menus.length) % menus.length;
                menuTitleRefs.current[prevIdx]?.focus();
                if (activeMenu) setActiveMenu(menus[prevIdx].label);
              }
            }}
          >
            {menu.label}
          </span>
          <div className="menu-dropdown" role="menu" aria-label={menu.label}>
            {menu.items.map((item, i) => {
              if (item === 'separator') {
                return <div key={i} className="menu-separator" role="separator" />;
              }
              const checked = item.checkable && checkStates[item.checkKey];
              return (
                <div
                  key={item.action || i}
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  aria-checked={item.checkable ? !!checked : undefined}
                  ref={el => { if (activeMenu === menu.label) menuItemRefs.current[i] = el; }}
                  className={`menu-option${item.disabled ? ' disabled' : ''}${item.checkable ? ' checkable' : ''}${checked ? ' checked' : ''}${focusedItem === i && activeMenu === menu.label ? ' focused' : ''}`}
                  onClick={() => {
                    if (item.disabled) return;
                    if (item.action) onAction(item.action);
                    setActiveMenu(null);
                    setFocusedItem(-1);
                  }}
                >
                  {item.label}
                  {item.shortcut && <span className="shortcut">{formatShortcut(item.shortcut)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
