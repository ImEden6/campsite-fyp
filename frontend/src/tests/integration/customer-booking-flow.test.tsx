import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import CustomerBookingPage from '@/pages/CustomerBookingPage';
import { mockSite } from '@/tests/utils/mock-data';
import { BookingFlowDriver } from '../utils/booking-flow-driver';

// Setup MSW
const server = setupServer(
    // Get Site Detail
    http.get('http://localhost:5000/api/v1/sites/:id', ({ params }) => {
        // console.log('[MSW] Handling getSiteById', params.id);
        // console.log('[MSW] Handling getSiteById', params.id);
        const site = params.id === mockSite.id ? mockSite : { ...mockSite, id: params.id as string };
        return HttpResponse.json({ data: site });
    }),

    // Create Booking
    http.post('http://localhost:5000/api/v1/bookings', async ({ request }) => {
        if (!request.headers.get('Authorization')) {
            return new HttpResponse(null, { status: 401 });
        }
        const body = await request.json() as any;
        if (body.specialRequests === 'TRIGGER_ERROR') {
            return HttpResponse.json({ message: 'Simulated API Error' }, { status: 500 });
        }
        // Wrap response in { data: ... } to match ApiResponse structure
        return HttpResponse.json({
            data: { id: 'customer-booking-id', bookingNumber: 'BK-CUST-456', totalAmount: 100 }
        });
    }),

    // Calculate Price
    http.post('http://localhost:5000/api/v1/bookings/price', () => {
        return HttpResponse.json({ total: 100, subtotal: 90, tax: 10, breakdown: [] });
    })
);

beforeEach(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
    window.scrollTo = vi.fn();
    localStorage.setItem('campsite_auth_token', 'fake-token');
    localStorage.setItem('campsite_user', JSON.stringify({ id: 'user-1', role: 'CUSTOMER' }));
});

afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    localStorage.clear();
});

afterAll(() => {
    server.close();
});

describe('Customer Booking Flow', () => {
    const siteId = 'site-1';

    const renderPage = () => {
        window.history.pushState({}, 'Customer Booking', `/customer/book?siteId=${siteId}`);
        // console.log('[Test] URL before render:', window.location.href);
        render(<CustomerBookingPage />);
        // screen.debug(); // Print initial render
    };

    it('should complete a booking successfully (Happy Path)', async () => {
        const user = userEvent.setup();
        const driver = new BookingFlowDriver(user);
        renderPage();

        console.log('[Test] Debugging DOM before driver action');
        // console.log(document.body.innerHTML); 

        await driver.completeCustomerBooking({
            checkInDate: '2026-07-01',
            checkOutDate: '2026-07-05',
            guests: { adults: 2, children: 0, pets: 0 }
        });

        await waitFor(() => {
            expect(window.location.pathname).toContain('/customer/bookings/customer-booking-id');
        });
    });

    it('should display error when API call fails (Negative Path)', async () => {
        const user = userEvent.setup();
        const driver = new BookingFlowDriver(user);
        renderPage();

        await driver.fillDates('2025-07-01', '2025-07-05');
        await driver.setGuests(2, 0, 0);
        await driver.fillGuestDetails(2);
        await driver.skipVehicles();
        await driver.skipEquipment();

        await waitFor(() => expect(screen.getByText(/review & confirm/i)).toBeInTheDocument());

        const specialRequestsInput = screen.getByPlaceholderText(/any special requests/i);
        await user.type(specialRequestsInput, 'TRIGGER_ERROR');

        await driver.reviewAndConfirm();

        const errorMessage = await screen.findByText(/simulated api error/i);
        expect(errorMessage).toBeInTheDocument();
    });
});
