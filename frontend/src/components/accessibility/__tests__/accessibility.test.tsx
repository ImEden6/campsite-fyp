import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipNavigation from '../SkipNavigation';
import VisuallyHidden from '../VisuallyHidden';
import KeyboardShortcutsDialog from '../KeyboardShortcutsDialog';

describe('Accessibility Components', () => {
  describe('SkipNavigation', () => {
    it('renders skip links', () => {
      render(<SkipNavigation />);
      
      const mainContentLink = screen.getByText('Skip to main content');
      const navigationLink = screen.getByText('Skip to navigation');
      
      expect(mainContentLink).toBeInTheDocument();
      expect(navigationLink).toBeInTheDocument();
    });

    it('skip links have correct href attributes', () => {
      render(<SkipNavigation />);
      
      const mainContentLink = screen.getByText('Skip to main content');
      const navigationLink = screen.getByText('Skip to navigation');
      
      expect(mainContentLink).toHaveAttribute('href', '#main-content');
      expect(navigationLink).toHaveAttribute('href', '#navigation');
    });
  });

  describe('VisuallyHidden', () => {
    it('renders children with sr-only class', () => {
      render(<VisuallyHidden>Hidden content</VisuallyHidden>);
      
      const element = screen.getByText('Hidden content');
      expect(element).toHaveClass('sr-only');
    });

    it('can render as different elements', () => {
      const { container } = render(
        <VisuallyHidden as="div">Hidden content</VisuallyHidden>
      );
      
      const element = container.querySelector('div');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent('Hidden content');
    });
  });

  describe('KeyboardShortcutsDialog', () => {
    it('renders when open', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);
      
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={false} onClose={onClose} />);
      
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });

    it('displays shortcut categories', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);
      
      // Check for actual categories from KeyboardShortcutsDialog component
      // Note: The text is "Selection" but CSS makes it appear uppercase
      expect(screen.getByText('Selection')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Editing')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    it('displays keyboard shortcuts', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);
      
      // Check for actual shortcuts from KeyboardShortcutsDialog component
      expect(screen.getByText('Select tool')).toBeInTheDocument();
      expect(screen.getByText('Select all modules')).toBeInTheDocument();
      expect(screen.getByText('Pan tool')).toBeInTheDocument();
      // Note: "Delete selected modules" appears twice (Delete and Backspace keys)
      // Use getAllByText to handle multiple instances
      expect(screen.getAllByText('Delete selected modules').length).toBeGreaterThan(0);
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Toggle grid')).toBeInTheDocument();
      expect(screen.getByText('Save map')).toBeInTheDocument();
    });
  });
});
