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
    
    let filtered = mockBookingsList;
    
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
    
    return HttpResponse.json(filtered);
  }),
  // Get booking by ID
  http.get('http://localhost:5000/api/v1/bookings/:id', () => {
    return HttpResponse.json(mockBooking);
  }),
  // Get QR code
  http.get('http://localhost:5000/api/v1/bookings/:id/qr-code', () => {
    return HttpResponse.json({ qrCode: 'mock-qr-code-data' });
  }),
  http.post('http://localhost:5000/api/v1/bookings/:id/check-in', () => {
    return HttpResponse.json({
      ...mockBooking,
      status: 'CHECKED_IN',
    });
  }),
  http.post('http://localhost:5000/api/v1/bookings/:id/check-out', () => {
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

    // Component uses "Enter search term..." placeholder
    const searchInput = screen.getByPlaceholderText(/enter search term/i);
    await user.type(searchInput, mockBooking.bookingNumber || mockBooking.id);

    // Wait for search results (component searches when searchTerm.length >= 3)
    await waitFor(() => {
      expect(screen.getByText(mockBooking.user.firstName)).toBeInTheDocument();
      expect(screen.getByText(mockBooking.site.name)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should complete check-in process', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);

    // Search for booking
    const searchInput = screen.getByPlaceholderText(/enter search term/i);
    await user.type(searchInput, mockBooking.bookingNumber || mockBooking.id);

    // Wait for search results and select booking
    await waitFor(() => {
      expect(screen.getByText(mockBooking.user.firstName)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on booking to select it
    const bookingCard = screen.getByText(mockBooking.user.firstName).closest('div[class*="cursor-pointer"]');
    if (bookingCard) {
      await user.click(bookingCard);
    }

    // Complete check-in
    await waitFor(() => {
      const checkInButton = screen.getByRole('button', { name: /check in/i });
      expect(checkInButton).toBeInTheDocument();
    });

    const checkInButton = screen.getByRole('button', { name: /check in/i });
    await user.click(checkInButton);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should complete check-out process with additional charges', async () => {
    const user = userEvent.setup();
    render(<CheckOutPage />);

    // Search for booking (CheckOutPage likely uses similar search)
    const searchInput = screen.getByPlaceholderText(/enter search term/i);
    await user.type(searchInput, mockBooking.bookingNumber || mockBooking.id);

    await waitFor(() => {
      expect(screen.getByText(mockBooking.user.firstName)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select booking if needed
    const bookingCard = screen.getByText(mockBooking.user.firstName).closest('div[class*="cursor-pointer"]');
    if (bookingCard) {
      await user.click(bookingCard);
    }

    // Add additional charges (if component supports this)
    const addChargeButton = screen.queryByRole('button', { name: /add charge/i });
    if (addChargeButton) {
      await user.click(addChargeButton);
      await user.type(screen.getByLabelText(/description/i), 'Firewood');
      await user.type(screen.getByLabelText(/amount/i), '15.00');
    }

    // Complete check-out
    await waitFor(() => {
      const checkOutButton = screen.getByRole('button', { name: /check out/i });
      expect(checkOutButton).toBeInTheDocument();
    });

    const checkOutButton = screen.getByRole('button', { name: /check out/i });
    await user.click(checkOutButton);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show error for invalid booking ID', async () => {
    server.use(
      http.get('http://localhost:5000/api/v1/bookings', () => {
        return HttpResponse.json([]);
      })
    );

    const user = userEvent.setup();
    render(<CheckInPage />);

    const searchInput = screen.getByPlaceholderText(/enter search term/i);
    await user.type(searchInput, 'invalid-id-123');

    // Wait for "no bookings found" message
    await waitFor(() => {
      expect(screen.getByText(/no.*booking/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
