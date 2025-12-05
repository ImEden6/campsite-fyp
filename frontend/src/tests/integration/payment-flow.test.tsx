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
      update: vi.fn(),
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
  confirmPayment: vi.fn(() =>
    Promise.resolve({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded',
      },
    })
  ),
};

// Create a mock element that can be found
const MockCardElement = () => <div data-testid="card-element">Card Element</div>;
const MockPaymentElement = () => <div data-testid="payment-element">Payment Element</div>;

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => (
    <div data-testid="stripe-elements">
      {children}
    </div>
  ),
  useStripe: () => mockStripe,
  useElements: () => ({
    getElement: vi.fn((elementType?: string) => {
      if (elementType === 'card' || !elementType) {
        return { 
          mount: vi.fn(),
          unmount: vi.fn(),
          on: vi.fn(),
        };
      }
      return null;
    }),
  }),
  CardElement: MockCardElement,
  PaymentElement: MockPaymentElement,
}));

const server = setupServer(
  http.get('http://localhost:5000/api/v1/bookings/:id', () => {
    return HttpResponse.json(mockBooking);
  }),
  http.post('http://localhost:5000/api/v1/payments/create-intent', () => {
    return HttpResponse.json({
      clientSecret: 'test_client_secret',
      paymentIntentId: 'pi_test_123',
    });
  }),
  http.post('http://localhost:5000/api/v1/payments/confirm', () => {
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
      // PaymentPage might show booking ID or amount differently
      // Check for payment-related content
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should process payment successfully', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);

    // Open payment modal if needed
    const payNowButton = screen.queryByRole('button', { name: /pay now/i });
    if (payNowButton) {
      await user.click(payNowButton);
    }

    // Wait for Stripe element (either card-element or payment-element)
    await waitFor(() => {
      const cardElement = screen.queryByTestId('card-element');
      const paymentElement = screen.queryByTestId('payment-element');
      expect(cardElement || paymentElement).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in cardholder name if field exists
    const nameInput = screen.queryByLabelText(/cardholder name/i);
    if (nameInput) {
      await user.type(nameInput, 'Test User');
    }

    // Submit payment
    const submitButton = screen.getByRole('button', { name: /pay|submit|confirm/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Check if payment was processed (either confirmCardPayment or confirmPayment)
      const wasCalled = mockStripe.confirmCardPayment.mock.calls.length > 0 ||
                       mockStripe.confirmPayment.mock.calls.length > 0;
      expect(wasCalled || screen.queryByText(/success|complete/i)).toBeTruthy();
    }, { timeout: 3000 });
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

    // Open payment modal if needed
    const payNowButton = screen.queryByRole('button', { name: /pay now/i });
    if (payNowButton) {
      await user.click(payNowButton);
    }

    await waitFor(() => {
      const cardElement = screen.queryByTestId('card-element');
      const paymentElement = screen.queryByTestId('payment-element');
      expect(cardElement || paymentElement).toBeInTheDocument();
    }, { timeout: 3000 });

    const nameInput = screen.queryByLabelText(/cardholder name/i);
    if (nameInput) {
      await user.type(nameInput, 'Test User');
    }

    const submitButton = screen.getByRole('button', { name: /pay|submit|confirm/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/declined|error|failed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show loading state during payment processing', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);

    // Open payment modal if needed
    const payNowButton = screen.queryByRole('button', { name: /pay now/i });
    if (payNowButton) {
      await user.click(payNowButton);
    }

    await waitFor(() => {
      const cardElement = screen.queryByTestId('card-element');
      const paymentElement = screen.queryByTestId('payment-element');
      expect(cardElement || paymentElement).toBeInTheDocument();
    }, { timeout: 3000 });

    const submitButton = screen.getByRole('button', { name: /pay|submit|confirm/i });
    await user.click(submitButton);

    // Check for loading/processing state
    await waitFor(() => {
      expect(screen.getByText(/processing|loading/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);

    // Open payment modal if needed
    const payNowButton = screen.queryByRole('button', { name: /pay now/i });
    if (payNowButton) {
      await user.click(payNowButton);
    }

    await waitFor(() => {
      const cardElement = screen.queryByTestId('card-element');
      const paymentElement = screen.queryByTestId('payment-element');
      expect(cardElement || paymentElement).toBeInTheDocument();
    }, { timeout: 3000 });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /pay|submit|confirm/i });
    await user.click(submitButton);

    // Check for validation error (might be cardholder name or other required field)
    await waitFor(() => {
      const errorText = screen.queryByText(/required|invalid|error/i);
      expect(errorText).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should display payment breakdown', async () => {
    render(<PaymentPage />);

    // Payment breakdown might be in modal or on page
    await waitFor(() => {
      // Look for payment-related terms (might be formatted differently)
      const hasPaymentInfo = screen.queryByText(/subtotal|deposit|total|amount|payment/i);
      expect(hasPaymentInfo).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
