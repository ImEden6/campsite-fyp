import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GuestBookingPage from '@/pages/GuestBookingPage';
import { mockSite } from '@/tests/utils/mock-data';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as router from 'react-router-dom';


// --- MSW Setup ---
const server = setupServer(
    http.get('http://localhost:5000/api/v1/sites/:id', ({ request, params }) => {
        console.log(`[MSW] HIT: ${request.method} ${request.url}`);
        const site = params.id === mockSite.id ? mockSite : { ...mockSite, id: params.id as string };
        return HttpResponse.json({ data: site });
    })
);

beforeEach(() => {
    server.listen({
        onUnhandledRequest: (req) => {
            console.log(`[MSW] UNHANDLED: ${req.method} ${req.url}`);
        }
    });
    vi.clearAllMocks();
});

afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
});

afterAll(() => server.close());

describe('Diagnostic: GuestBookingPage', () => {

    it('3a. Full Integration (Direct Render)', async () => {
        vi.restoreAllMocks();
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/booking/guest?siteId=site-1']}>
                    <GuestBookingPage />
                </MemoryRouter>
            </QueryClientProvider>
        );

        try {
            await waitFor(() => expect(screen.getByText('Enter Guest Information')).toBeInTheDocument(), { timeout: 3000 });
            console.log('[PASS] 3a (Direct Render) works');
        } catch (e) {
            console.log('[FAIL] 3a (Direct Render) failed');
            console.log(document.body.innerHTML);
            throw e;
        }
    });

    it('3b. Full Integration (With Routes)', async () => {
        vi.restoreAllMocks();
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        const DebugWrapper = ({ children }: { children: React.ReactNode }) => {
            const location = router.useLocation();
            const [params] = router.useSearchParams();
            console.log('[Debug] Location:', location.pathname, location.search);
            console.log('[Debug] SearchParams:', params.toString());
            return <>{children}</>;
        };

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/booking/guest?siteId=site-1']}>
                    <Routes>
                        <Route path="/booking/guest" element={
                            <DebugWrapper>
                                <GuestBookingPage />
                            </DebugWrapper>
                        } />
                        <Route path="*" element={<div>NO MATCH: {window.location.href}</div>} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );

        try {
            await waitFor(() => expect(screen.getByText('Enter Guest Information')).toBeInTheDocument(), { timeout: 3000 });
            console.log('[PASS] 3b (With Routes) works');
        } catch (e) {
            console.log('[FAIL] 3b (With Routes) failed');
            screen.debug();
            throw e;
        }
    });

});
