import { apiClient } from '@/services/api/client';
import type {
  Payment,
  PaymentIntent,
  CreatePaymentIntentRequest,
  RefundRequest,
  RefundResponse,
} from '../types/payment.types';
import { getMockBookingPayments, getMockPaymentHistory } from './mockCurrentPayments';
import { env } from '@/config/env';
import { createMockPaymentIntent, createMockConfirmedPayment } from './mock-payment-intent';

export const paymentService = {
  /**
   * Create a payment intent for a booking
   */
  createPaymentIntent: async (
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> => {
    // Environment-gated mock for dev/preview
    if (env.useMockPayments) {
      console.warn('[Mock] Using mock payment intent (VITE_USE_MOCK_PAYMENTS=true)');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      return createMockPaymentIntent(data.amount, data.currency);
    }

    const response = await apiClient.post<PaymentIntent>(
      '/payments/intent',
      data
    );
    return response.data;
  },

  /**
   * Get payment details by ID
   */
  getPayment: async (paymentId: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Get all payments for a booking
   */
  getBookingPayments: async (bookingId: string): Promise<Payment[]> => {
    try {
      const response = await apiClient.get<Payment[]>(
        `/bookings/${bookingId}/payments`
      );
      return response.data;
    } catch (error) {
      console.warn('[Mock] Using mock booking payments', error);
      return getMockBookingPayments(bookingId);
    }
  },

  /**
   * Get payment history for current user
   */
  getPaymentHistory: async (): Promise<Payment[]> => {
    try {
      const response = await apiClient.get<Payment[]>('/payments/history');
      return response.data;
    } catch (error) {
      console.warn('[Mock] Using mock payment history', error);
      return getMockPaymentHistory();
    }
  },

  /**
   * Process a refund
   */
  processRefund: async (data: RefundRequest): Promise<RefundResponse> => {
    const response = await apiClient.post<RefundResponse>(
      `/payments/${data.paymentId}/refund`,
      {
        amount: data.amount,
        reason: data.reason,
      }
    );
    return response.data;
  },

  /**
   * Download payment receipt
   */
  downloadReceipt: async (paymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Confirm payment intent (after Stripe confirmation)
   */
  confirmPayment: async (paymentIntentId: string): Promise<Payment> => {
    // Environment-gated mock for dev/preview
    if (env.useMockPayments) {
      console.warn('[Mock] Confirming mock payment (VITE_USE_MOCK_PAYMENTS=true)');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      // Note: We don't have the bookingId here easily in the service without extra fetch, 
      // but for mock purposes 'mock-id' is often sufficient or we can pass it if we refactor.
      // For now, let's use a placeholder which is acceptable for a dev mock.
      return createMockConfirmedPayment(paymentIntentId, undefined, 1000, 'usd');
    }

    const response = await apiClient.post<Payment>(
      `/payments/confirm/${paymentIntentId}`
    );
    return response.data;
  },
};
