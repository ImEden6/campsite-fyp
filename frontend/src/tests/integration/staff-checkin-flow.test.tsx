import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import CheckInPage from '@/pages/CheckInPage';
import CheckOutPage from '@/pages/CheckOutPage';
import { mockBooking, mockStaff } from '../utils/mock-data';

const server = setupServer(
  http.get('/api/bookings/:id', () => {
    return HttpResponse.json(mockBooking);
  }),
  http.post('/api/bookings/:id/check-in', () => {
    return HttpResponse.json({
      ...mockBooking,
      status: 'CHECKED_IN',
      qrCode: 'mock-qr-code-data',
    });
  }),
  http.post('/api/bookings/:id/check-out', () => {
    return HttpResponse.json({
      ...mockBooking,
      status: 'CHECKED_OUT',
    });
  })
);

beforeEach(() => {
  server.listen();
  // Mock authenticated staff user
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
    JSON.stringify({ user: mockStaff })
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Staff Check-in/Check-out Flow', () => {
  it('should search and find booking by ID', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);

    const searchInput = screen.getByPlaceholderText(/booking id/i);
    await user.type(searchInput, mockBooking.id);

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(mockBooking.user.firstName)).toBeInTheDocument();
      expect(screen.getByText(mockBooking.site.name)).toBeInTheDocument();
    });
  });

  it('should complete check-in process', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);

    // Search for booking
    const searchInput = screen.getByPlaceholderText(/booking id/i);
    await user.type(searchInput, mockBooking.id);
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(mockBooking.user.firstName)).toBeInTheDocument();
    });

    // Complete check-in
    const checkInButton = screen.getByRole('button', { name: /check in/i });
    await user.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByText(/checked in successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/qr code/i)).toBeInTheDocument();
    });
  });

  it('should complete check-out process with additional charges', async () => {
    const user = userEvent.setup();
    render(<CheckOutPage />);

    // Search for booking
    const searchInput = screen.getByPlaceholderText(/booking id/i);
    await user.type(searchInput, mockBooking.id);
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(mockBooking.user.firstName)).toBeInTheDocument();
    });

    // Add additional charges
    const addChargeButton = screen.getByRole('button', { name: /add charge/i });
    await user.click(addChargeButton);

    await user.type(screen.getByLabelText(/description/i), 'Firewood');
    await user.type(screen.getByLabelText(/amount/i), '15.00');

    // Complete check-out
    const checkOutButton = screen.getByRole('button', { name: /check out/i });
    await user.click(checkOutButton);

    await waitFor(() => {
      expect(screen.getByText(/checked out successfully/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid booking ID', async () => {
    server.use(
      http.get('/api/bookings/:id', () => {
        return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
      })
    );

    const user = userEvent.setup();
    render(<CheckInPage />);

    const searchInput = screen.getByPlaceholderText(/booking id/i);
    await user.type(searchInput, 'invalid-id');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/booking not found/i)).toBeInTheDocument();
    });
  });
});
