import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/payment.service';
import type {
  CreatePaymentIntentRequest,
  RefundRequest,
} from '../types/payment.types';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (bookingId?: string) =>
    [...paymentKeys.lists(), { bookingId }] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  history: () => [...paymentKeys.all, 'history'] as const,
};

export const usePayment = (paymentId: string) => {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: () => paymentService.getPayment(paymentId),
    enabled: !!paymentId,
  });
};

export const useBookingPayments = (bookingId: string) => {
  return useQuery({
    queryKey: paymentKeys.list(bookingId),
    queryFn: () => paymentService.getBookingPayments(bookingId),
    enabled: !!bookingId,
  });
};

export const usePaymentHistory = () => {
  return useQuery({
    queryKey: paymentKeys.history(),
    queryFn: () => paymentService.getPaymentHistory(),
  });
};

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentIntentRequest) =>
      paymentService.createPaymentIntent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.list(variables.bookingId),
      });
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentIntentId: string) =>
      paymentService.confirmPayment(paymentIntentId),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({
        queryKey: ['bookings', 'detail', payment.bookingId],
      });
    },
  });
};

export const useProcessRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RefundRequest) => paymentService.processRefund(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(variables.paymentId),
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
};

export const useDownloadReceipt = () => {
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const blob = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};
