import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuBar from '../MenuBar';
import { describe, it, expect, vi } from 'vitest';

describe('MenuBar', () => {
  const defaultProps = {
    onAction: vi.fn(),
    wordWrap: false,
    darkMode: true,
    statusBarVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all menu titles', () => {
    render(<MenuBar {...defaultProps} />);

    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('should have proper ARIA menubar role', () => {
    render(<MenuBar {...defaultProps} />);

    const menubar = screen.getByRole('menubar');
    expect(menubar).toBeInTheDocument();
  });

  it('should open a menu on click', () => {
    render(<MenuBar {...defaultProps} />);

    fireEvent.click(screen.getByText('File'));

    // After clicking File, the dropdown should be visible (active class)
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Open...')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should call onAction when a menu item is clicked', () => {
    render(<MenuBar {...defaultProps} />);

    fireEvent.click(screen.getByText('File'));
    fireEvent.click(screen.getByText('New'));

    expect(defaultProps.onAction).toHaveBeenCalledWith('new');
  });

  it('should show shortcuts on menu items', () => {
    render(<MenuBar {...defaultProps} />);

    fireEvent.click(screen.getByText('File'));

    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+O')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
  });

  it('should show Save As shortcut', () => {
    render(<MenuBar {...defaultProps} />);

    fireEvent.click(screen.getByText('File'));

    expect(screen.getByText('Ctrl+Shift+S')).toBeInTheDocument();
  });

  it('should show check marks for active toggles', () => {
    render(<MenuBar {...defaultProps} wordWrap={true} />);

    fireEvent.click(screen.getByText('Format'));

    const wordWrapItem = screen.getByText('Word Wrap').closest('[role="menuitem"]');
    expect(wordWrapItem).toHaveAttribute('aria-checked', 'true');
  });

  it('should close menu on Escape key', () => {
    render(<MenuBar {...defaultProps} />);

    // Open File menu
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByText('File').closest('.menu-item')).toHaveClass('active');

    // Press Escape on the menu bar
    fireEvent.keyDown(screen.getByRole('menubar'), { key: 'Escape' });

    expect(screen.getByText('File').closest('.menu-item')).not.toHaveClass('active');
  });

  it('should not call onAction for disabled items', () => {
    render(<MenuBar {...defaultProps} />);

    fireEvent.click(screen.getByText('File'));
    fireEvent.click(screen.getByText('Page Setup...'));

    expect(defaultProps.onAction).not.toHaveBeenCalled();
  });
});
