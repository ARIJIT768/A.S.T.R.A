'use client';

import { useEffect } from 'react';

export function DisableActions() {
  useEffect(() => {
    // Prevent text selection with mouse
    const handleMouseDown = (e: Event) => {
      const event = e as MouseEvent;
      // Allow selection in input/textarea elements
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault();
      }
    };

    // Prevent selection during drag
    const handleMouseMove = (e: Event) => {
      const event = e as MouseEvent;
      // Disable text selection during mouse movement
      if (event.buttons === 1) {
        getSelection()?.removeAllRanges();
      }
    };

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection in input/textarea elements
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      return false;
    };

    // Right-click context menu - ALLOWED for developer tools
    // Removed to allow inspect element feature

    // Disable copy
    const handleCopy = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow copy in input/textarea elements
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      return false;
    };

    // Disable cut
    const handleCut = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable paste
    const handlePaste = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: Event) => {
      const event = e as KeyboardEvent;
      // Ctrl+C (Copy)
      if (event.ctrlKey && event.key === 'c') {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          return false;
        }
      }
      // Ctrl+X (Cut)
      if (event.ctrlKey && event.key === 'x') {
        event.preventDefault();
        return false;
      }
      // Ctrl+V (Paste)
      if (event.ctrlKey && event.key === 'v') {
        event.preventDefault();
        return false;
      }
      // Cmd+C (Mac Copy)
      if (event.metaKey && event.key === 'c') {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          return false;
        }
      }
      // Cmd+X (Mac Cut)
      if (event.metaKey && event.key === 'x') {
        event.preventDefault();
        return false;
      }
      // Cmd+V (Mac Paste)
      if (event.metaKey && event.key === 'v') {
        event.preventDefault();
        return false;
      }
    };

    // Add event listeners to document
    document.addEventListener('mousedown', handleMouseDown as any, false);
    document.addEventListener('mousemove', handleMouseMove as any, false);
    document.addEventListener('selectstart', handleSelectStart as any, false);
    // contextmenu removed to allow developer tools access
    document.addEventListener('copy', handleCopy as any, false);
    document.addEventListener('cut', handleCut as any, false);
    document.addEventListener('paste', handlePaste as any, false);
    document.addEventListener('keydown', handleKeyDown as any, false);

    // Disable selection on body
    document.body.style.webkitUserSelect = 'none';
    (document.body as any).style.mozUserSelect = 'none';
    (document.body as any).style.msUserSelect = 'none';
    document.body.style.userSelect = 'none';

    // Clear any existing selections
    getSelection()?.removeAllRanges();

    return () => {
      document.removeEventListener('mousedown', handleMouseDown as any);
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('selectstart', handleSelectStart as any);
      // contextmenu removed to allow developer tools access
      document.removeEventListener('copy', handleCopy as any);
      document.removeEventListener('cut', handleCut as any);
      document.removeEventListener('paste', handlePaste as any);
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, []);

  return null;
}
