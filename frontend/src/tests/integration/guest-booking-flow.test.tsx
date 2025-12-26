import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { screen, waitFor } from '../utils/test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import GuestBookingPage from '@/pages/GuestBookingPage';
import { mockSite } from '@/tests/utils/mock-data';
import { BookingFlowDriver } from '../utils/booking-flow-driver';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Payment Components to avoid Stripe initialization in jsdom
vi.mock('@/features/payments/components/StripeProvider', () => ({
    StripeProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/features/payments/components/PaymentForm', () => ({
    PaymentForm: ({ onSuccess }: any) => (
        <button onClick={onSuccess}>Pay</button>
    )
}));

// PaymentModal is replaced by real component with MSW handlers

// Setup MSW
const server = setupServer(
    // Get Site Detail
    http.get('http://localhost:5000/api/v1/sites/:id', ({ params }) => {
        const site = params.id === mockSite.id ? mockSite : { ...mockSite, id: params.id as string };
        return HttpResponse.json({ data: site });
    }),

    // Create Guest Booking
    http.post('http://localhost:5000/api/v1/bookings/guest', async ({ request }) => {
        const body = await request.json() as any;
        console.log('MSW Received Body:', body);
        if (!body.checkInDate || !body.checkOutDate || !body.email) {
            return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
        }
        if (body.checkInDate === '2099-01-01') {
            return HttpResponse.json({ message: 'Dates are not available' }, { status: 400 });
        }
        return HttpResponse.json({
            data: {
                booking: { id: 'new-booking-id', bookingNumber: 'BK-TEST-123', totalAmount: 100, paidAmount: 0 },
                accessToken: 'guest-token'
            }
        });
    }),

    // Calculate Price
    http.post('http://localhost:5000/api/v1/bookings/price', () => {
        return HttpResponse.json({
            data: { total: 100, subtotal: 90, tax: 10, breakdown: [] }
        });
    }),

    // Get Booking
    http.get('http://localhost:5000/api/v1/bookings/new-booking-id', () => {
        return HttpResponse.json({
            data: { id: 'new-booking-id', totalAmount: 100, paidAmount: 0 }
        });
    }),

    // Create Payment Intent
    http.post('*/api/v1/payments/intent', () => {
        console.log('MSW: Intercepted Create Payment Intent');
        // Return unwrapped response - the payment service already extracts response.data
        return HttpResponse.json({ clientSecret: 'pi_test_123_secret_456' });
    }),

    // Confirm Payment
    http.post('*/api/v1/payments/confirm/:id', () => {
        console.log('MSW: Intercepted Confirm Payment');
        // Return unwrapped response
        return HttpResponse.json({ status: 'succeeded', bookingId: 'new-booking-id' });
    })
);

beforeEach(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
    window.scrollTo = vi.fn();
});

afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
});

afterAll(() => {
    server.close();
});

describe('Guest Booking Flow', () => {
    const siteId = 'site-1';

    const renderPage = () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } }
        });

        // Override the default wrapper (AllTheProviders) to control Router
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[`/booking/guest?siteId=${siteId}`]}>
                    <Routes>
                        <Route path="/booking/guest" element={<GuestBookingPage />} />
                        <Route path="/booking/confirm/:bookingNumber" element={<div>Booking Confirmation: BK-TEST-123</div>} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
            { wrapper: ({ children }: { children: React.ReactNode }) => <>{children}</> }
        );
    };

    it('should complete a booking successfully (Happy Path)', async () => {
        const user = userEvent.setup();
        const driver = new BookingFlowDriver(user);

        renderPage();

        await driver.completeGuestBooking({
            checkInDate: '2026-06-01',
            checkOutDate: '2026-06-05',
            guests: { adults: 2, children: 0, pets: 0 },
            guestInfo: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '555-1234'
            }
        });

        // Expect to be redirected to confirmation page (simulated by Route above)
        await waitFor(() => {
            expect(screen.getByText('Booking Confirmation: BK-TEST-123')).toBeInTheDocument();
        }, { timeout: 15000 });
    }, 20000);

    it('should handle API validation errors (Negative Path)', async () => {
        const user = userEvent.setup();
        const driver = new BookingFlowDriver(user);
        renderPage();

        await driver.fillGuestInfo({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '555-5678'
        });

        await driver.fillDates('2099-01-01', '2099-01-05');
        await driver.setGuests(2, 0, 0);
        await driver.fillGuestDetails(2);
        await driver.skipVehicles();
        await driver.skipEquipment();

        await driver.reviewAndConfirm();

        // Expect Error
        const errorMessage = await screen.findByText(/dates are not available/i);
        expect(errorMessage).toBeInTheDocument();
    });
});
