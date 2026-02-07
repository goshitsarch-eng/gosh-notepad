import { renderHook, act } from '@testing-library/react';
import { useNotepad } from '../useNotepad';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useNotepad', () => {
  let result;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    document.body.classList.remove('dark-mode');

    const hook = renderHook(() => useNotepad());
    result = hook.result;
  });

  describe('performReplaceAll', () => {
    it('should not infinite loop when replacement contains the search term', () => {
      // Set up editor with content
      const textarea = document.createElement('textarea');
      textarea.value = 'aaa';
      result.current.editorRef.current = textarea;

      // This would infinite loop with the old while-loop implementation
      act(() => {
        result.current.performReplaceAll('a', 'ba', true);
      });

      expect(textarea.value).toBe('bababa');
    });

    it('should replace all occurrences case-insensitively', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'Hello hello HELLO';
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performReplaceAll('hello', 'world', false);
      });

      expect(textarea.value).toBe('world world world');
    });

    it('should replace all occurrences case-sensitively', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'Hello hello HELLO';
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performReplaceAll('hello', 'world', true);
      });

      expect(textarea.value).toBe('Hello world HELLO');
    });

    it('should handle special regex characters in the search term', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'price is $10.00 and $20.00';
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performReplaceAll('$10.00', '$15.00', true);
      });

      expect(textarea.value).toBe('price is $15.00 and $20.00');
    });

    it('should report zero replacements when nothing matches', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'hello world';
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performReplaceAll('xyz', 'abc', true);
      });

      expect(textarea.value).toBe('hello world');
    });

    it('should handle dollar signs in replacement text', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'price: X';
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performReplaceAll('X', '$100', true);
      });

      expect(textarea.value).toBe('price: $100');
    });
  });

  describe('performFind', () => {
    it('should find text searching down', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'hello world hello';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;
      textarea.setSelectionRange = vi.fn();
      textarea.focus = vi.fn();
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performFind('hello', false, 'down');
      });

      expect(textarea.setSelectionRange).toHaveBeenCalledWith(0, 5);
    });

    it('should find text searching up', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'hello world hello';
      textarea.selectionStart = 17;
      textarea.selectionEnd = 17;
      textarea.setSelectionRange = vi.fn();
      textarea.focus = vi.fn();
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performFind('hello', false, 'up');
      });

      expect(textarea.setSelectionRange).toHaveBeenCalledWith(12, 17);
    });

    it('should respect case sensitivity', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'Hello world';
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;
      textarea.setSelectionRange = vi.fn();
      textarea.focus = vi.fn();
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performFind('hello', true, 'down');
      });

      // Should not find 'Hello' when case sensitive search for 'hello'
      expect(textarea.setSelectionRange).not.toHaveBeenCalled();
    });
  });

  describe('performGoTo', () => {
    it('should navigate to specified line', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'line1\nline2\nline3';
      textarea.setSelectionRange = vi.fn();
      textarea.focus = vi.fn();
      result.current.editorRef.current = textarea;

      act(() => {
        result.current.performGoTo(2);
      });

      // Line 2 starts at index 6 (after "line1\n")
      expect(textarea.setSelectionRange).toHaveBeenCalledWith(6, 6);
    });
  });

  describe('handleMenuAction', () => {
    it('should dispatch known actions without error', () => {
      const textarea = document.createElement('textarea');
      textarea.focus = vi.fn();
      textarea.select = vi.fn();
      result.current.editorRef.current = textarea;

      expect(() => {
        act(() => {
          result.current.handleMenuAction('selectAll');
        });
      }).not.toThrow();

      expect(textarea.select).toHaveBeenCalled();
    });
  });
});
