import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { screen, waitFor } from '../utils/test-utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import GuestBookingPage from '@/pages/GuestBookingPage';
import { mockSites } from '@/services/api/mock-sites';
import { BookingFlowDriver } from '../utils/booking-flow-driver';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock PaymentModal
vi.mock('@/features/payments/components/PaymentModal', () => ({
    PaymentModal: ({ onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
        return <div>Payment Processing...</div>;
    },
}));

// Setup MSW
const server = setupServer(
    // Get Site Detail
    http.get('http://localhost:5000/api/v1/sites/:id', ({ params }) => {
        const site = mockSites.find((s) => s.id === params.id) || mockSites[0];
        return HttpResponse.json(site);
    }),

    // Create Guest Booking
    http.post('http://localhost:5000/api/v1/bookings/guest', async ({ request }) => {
        const body = await request.json() as any;
        if (!body.checkInDate || !body.checkOutDate || !body.email) {
            return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
        }
        if (body.checkInDate === '2099-01-01') {
            return HttpResponse.json({ message: 'Dates are not available' }, { status: 400 });
        }
        return HttpResponse.json({
            booking: { id: 'new-booking-id', bookingNumber: 'BK-TEST-123', totalAmount: 100, paidAmount: 0 },
            accessToken: 'guest-token'
        });
    }),

    // Calculate Price
    http.post('http://localhost:5000/api/v1/bookings/price', () => {
        return HttpResponse.json({ total: 100, subtotal: 90, tax: 10, breakdown: [] });
    }),

    // Get Booking
    http.get('http://localhost:5000/api/v1/bookings/new-booking-id', () => {
        return HttpResponse.json({ id: 'new-booking-id', totalAmount: 100, paidAmount: 0 });
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
            checkInDate: '2025-06-01',
            checkOutDate: '2025-06-05',
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
        });
    });

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
