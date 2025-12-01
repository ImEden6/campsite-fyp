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
      
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('UI')).toBeInTheDocument();
      expect(screen.getByText('Accessibility')).toBeInTheDocument();
    });

    it('displays keyboard shortcuts', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Create New Booking')).toBeInTheDocument();
      expect(screen.getByText('Toggle Sidebar')).toBeInTheDocument();
    });
  });
});
