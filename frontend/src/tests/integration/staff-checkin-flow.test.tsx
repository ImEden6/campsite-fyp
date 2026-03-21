import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import CheckInPage from '@/pages/CheckInPage';
import CheckOutPage from '@/pages/CheckOutPage';
import { mockBooking, mockStaff, mockBookingsList } from '../utils/mock-data';

const server = setupServer(
  // Search bookings endpoint (used by CheckInPage)
  http.get('http://localhost:5000/api/v1/bookings', ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('searchTerm');
    const status = url.searchParams.get('status');
    
    // Ensure all mock bookings have unique IDs to avoid duplicate key warnings
    let filtered = [
      ...mockBookingsList.map((b, i) => ({ ...b, id: `list-${i}` })),
      { ...mockBooking, id: 'unique-checkin-id', bookingNumber: 'BK-CHECKIN', status: 'CONFIRMED' as any }
    ];
    
    if (searchTerm && searchTerm.length >= 3) {
      filtered = filtered.filter(b => 
        b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.site?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      filtered = filtered.filter(b => statusArray.includes(b.status));
    }
    
    return HttpResponse.json({ data: filtered, success: true });
  }),
  // Get booking by ID
  http.get('http://localhost:5000/api/v1/bookings/:id', () => {
    return HttpResponse.json({ data: mockBooking, success: true });
  }),
  // Get QR code
  http.get('http://localhost:5000/api/v1/bookings/:id/qr-code', () => {
    return HttpResponse.json({ data: { qrCode: 'mock-qr-code-data' }, success: true });
  }),
  http.post('http://localhost:5000/api/v1/bookings/:id/check-in', () => {
    return HttpResponse.json({
      data: {
        ...mockBooking,
        status: 'CHECKED_IN',
      },
      success: true
    });
  }),
  http.post('http://localhost:5000/api/v1/bookings/:id/check-out', () => {
    return HttpResponse.json({
      data: {
        ...mockBooking,
        status: 'CHECKED_OUT',
      },
      success: true
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

    const searchInput = screen.getByPlaceholderText(/Search by guest name/i);
    // Use the specific booking number we added to the unique list
    await user.type(searchInput, 'BK-CHECKIN');

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${mockBooking.user.firstName} ${mockBooking.user.lastName}`, 'i'))).toBeInTheDocument();
      expect(screen.getByText(mockBooking.site.name)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should complete check-in process', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);

    const searchInput = screen.getByPlaceholderText(/Search by guest name/i);
    await user.type(searchInput, 'BK-CHECKIN');

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${mockBooking.user.firstName} ${mockBooking.user.lastName}`, 'i'))).toBeInTheDocument();
    }, { timeout: 3000 });

    const bookingCard = screen.getByText(new RegExp(`${mockBooking.user.firstName} ${mockBooking.user.lastName}`, 'i')).closest('div[class*="cursor-pointer"]');
    if (bookingCard) {
      await user.click(bookingCard);
    }

    await waitFor(() => {
      const checkInButton = screen.getByRole('button', { name: /check in/i });
      expect(checkInButton).toBeInTheDocument();
    });

    const checkInButton = screen.getByRole('button', { name: /check in/i });
    await user.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /success/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should complete check-out process', async () => {
    const user = userEvent.setup();
    render(<CheckOutPage />);

    const searchInput = screen.getByPlaceholderText(/Search by guest name/i);
    await user.type(searchInput, 'BK-CHECKIN');

    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(`${mockBooking.user.firstName} ${mockBooking.user.lastName}`, 'i'))[0]).toBeInTheDocument();
    }, { timeout: 3000 });

    const bookingCard = screen.getAllByText(new RegExp(`${mockBooking.user.firstName} ${mockBooking.user.lastName}`, 'i'))[0].closest('div[class*="cursor-pointer"]');
    if (bookingCard) {
      await user.click(bookingCard);
    }

    await waitFor(() => {
      const checkOutButton = screen.getByRole('button', { name: /check.?out/i });
      expect(checkOutButton).toBeInTheDocument();
    });

    const checkOutButton = screen.getByRole('button', { name: /check.?out/i });
    await user.click(checkOutButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /success/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show error for invalid booking ID', async () => {
    server.use(
      http.get('http://localhost:5000/api/v1/bookings', () => {
        return HttpResponse.json({ data: [], success: true });
      })
    );

    const user = userEvent.setup();
    render(<CheckInPage />);

    const searchInput = screen.getByPlaceholderText(/Search by guest name/i);
    await user.type(searchInput, 'invalid-id-123');

    await waitFor(() => {
      expect(screen.getByText(/no.*booking/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
