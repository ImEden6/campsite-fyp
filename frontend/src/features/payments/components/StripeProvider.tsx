import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { getStripe } from '@/config/stripe';
import { Loader2 } from 'lucide-react';

interface StripeProviderProps {
  children: ReactNode;
  clientSecret: string;
  options?: Partial<StripeElementsOptions>;
}

export const StripeProvider = ({
  children,
  clientSecret,
  options = {},
}: StripeProviderProps) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStripe()
      .then((stripeInstance) => {
        setStripe(stripeInstance);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load Stripe:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          Failed to load payment system. Please refresh the page or contact
          support.
        </p>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
    ...options,
  } as StripeElementsOptions;

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      {children}
    </Elements>
  );
};
