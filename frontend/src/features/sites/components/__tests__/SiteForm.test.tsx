import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '../SiteForm';

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  isLoading: false,
};

describe('SiteForm', () => {
  it('renders all sections', () => {
    render(<SiteForm {...defaultProps} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Site Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Amenities & Features')).toBeInTheDocument();
    expect(screen.getByText('Site Images')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders with initial empty values', () => {
    render(<SiteForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('e.g., Site A1')).toHaveValue('');
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(0);
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    render(<SiteForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /create site/i }));

    expect(screen.getByText('Site name is required')).toBeInTheDocument();
    expect(screen.getByText('Site dimensions must be greater than 0')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    const existingSite = {
      id: 'site-1',
      name: 'Existing Site',
      type: 'TENT' as const,
      status: 'AVAILABLE' as const,
      capacity: 6,
      description: 'A nice site',
      basePrice: 50,
      maxVehicles: 2,
      maxTents: 2,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: false,
      hasSewer: false,
      hasWifi: true,
      amenities: [],
      images: [],
      size: { length: 30, width: 20, unit: 'feet' as const },
      location: { latitude: 0, longitude: 0, mapPosition: { x: 0, y: 0 } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<SiteForm {...defaultProps} site={existingSite} onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: /update site/i }));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<SiteForm {...defaultProps} isLoading />);

    const submitButton = screen.getByRole('button', { name: /saving/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('populates form with existing site data', () => {
    const existingSite = {
      id: 'site-1',
      name: 'Existing Site',
      type: 'TENT' as const,
      status: 'AVAILABLE' as const,
      capacity: 6,
      description: 'A nice site',
      basePrice: 50,
      maxVehicles: 2,
      maxTents: 2,
      isPetFriendly: true,
      hasElectricity: true,
      hasWater: false,
      hasSewer: false,
      hasWifi: true,
      amenities: ['fire-pit'],
      images: ['/image1.jpg'],
      size: { length: 30, width: 20, unit: 'feet' as const },
      location: { latitude: 51.5074, longitude: -0.1278, mapPosition: { x: 100, y: 200 } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<SiteForm {...defaultProps} site={existingSite} />);

    expect(screen.getByDisplayValue('Existing Site')).toBeInTheDocument();
    expect(screen.getByDisplayValue(6)).toBeInTheDocument();
    expect(screen.getByDisplayValue(50)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<SiteForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
