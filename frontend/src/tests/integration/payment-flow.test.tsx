import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { PaymentPage } from '@/pages/PaymentPage';
import { mockBooking, mockPayment, mockUser } from '../utils/mock-data';

// Mock Stripe
const mockStripe = {
  elements: vi.fn(() => ({
    create: vi.fn(() => ({
      mount: vi.fn(),
      unmount: vi.fn(),
      on: vi.fn(),
    })),
  })),
  confirmCardPayment: vi.fn(() =>
    Promise.resolve({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded',
      },
    })
  ),
};

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => children,
  useStripe: () => mockStripe,
  useElements: () => ({
    getElement: vi.fn(() => ({})),
  }),
  CardElement: () => <div data-testid="card-element">Card Element</div>,
}));

const server = setupServer(
  http.get('/api/bookings/:id', () => {
    return HttpResponse.json(mockBooking);
  }),
  http.post('/api/payments/create-intent', () => {
    return HttpResponse.json({
      clientSecret: 'test_client_secret',
      paymentIntentId: 'pi_test_123',
    });
  }),
  http.post('/api/payments/confirm', () => {
    return HttpResponse.json(mockPayment);
  })
);

beforeEach(() => {
  server.listen();
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
    JSON.stringify({ user: mockUser })
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Payment Flow', () => {
  it('should display booking details and payment amount', async () => {
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText(mockBooking.site.name)).toBeInTheDocument();
      expect(screen.getByText(/\$70\.00/)).toBeInTheDocument();
    });
  });

  it('should process payment successfully', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    // Fill in cardholder name
    const nameInput = screen.getByLabelText(/cardholder name/i);
    await user.type(nameInput, 'Test User');

    // Submit payment
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(mockStripe.confirmCardPayment).toHaveBeenCalled();
      expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
    });
  });

  it('should handle payment failure', async () => {
    mockStripe.confirmCardPayment.mockResolvedValueOnce({
      paymentIntent: undefined,
      error: {
        type: 'card_error',
        message: 'Your card was declined',
      },
    } as any);

    const user = userEvent.setup();
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/cardholder name/i);
    await user.type(nameInput, 'Test User');

    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByText(/card was declined/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during payment processing', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    // Try to submit without filling cardholder name
    const payButton = screen.getByRole('button', { name: /pay now/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByText(/cardholder name is required/i)).toBeInTheDocument();
    });
  });

  it('should display payment breakdown', async () => {
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
      expect(screen.getByText(/deposit/i)).toBeInTheDocument();
      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });
  });
});
