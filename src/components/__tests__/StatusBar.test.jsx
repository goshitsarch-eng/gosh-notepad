import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBar from '../StatusBar';
import { describe, it, expect } from 'vitest';

describe('StatusBar', () => {
  it('should display line and column numbers', () => {
    render(<StatusBar line={5} col={12} encoding="UTF-8" lineEnding={'\n'} />);

    expect(screen.getByText('Ln 5, Col 12')).toBeInTheDocument();
  });

  it('should have status role for accessibility', () => {
    render(<StatusBar line={1} col={1} encoding="UTF-8" lineEnding={'\n'} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should update when props change', () => {
    const { rerender } = render(<StatusBar line={1} col={1} encoding="UTF-8" lineEnding={'\n'} />);
    expect(screen.getByText('Ln 1, Col 1')).toBeInTheDocument();

    rerender(<StatusBar line={10} col={25} encoding="UTF-8" lineEnding={'\n'} />);
    expect(screen.getByText('Ln 10, Col 25')).toBeInTheDocument();
  });

  it('should display encoding', () => {
    render(<StatusBar line={1} col={1} encoding="UTF-8 BOM" lineEnding={'\n'} />);

    expect(screen.getByText('UTF-8 BOM')).toBeInTheDocument();
  });

  it('should display line ending type', () => {
    render(<StatusBar line={1} col={1} encoding="UTF-8" lineEnding={'\r\n'} />);

    expect(screen.getByText('Windows (CRLF)')).toBeInTheDocument();
  });

  it('should display Unix line ending', () => {
    render(<StatusBar line={1} col={1} encoding="UTF-8" lineEnding={'\n'} />);

    expect(screen.getByText('Unix (LF)')).toBeInTheDocument();
  });
});
