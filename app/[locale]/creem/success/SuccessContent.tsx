'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

export default function SuccessContent() {
  const t = useTranslations('subscribe');
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const createSubscription = async () => {
      if (!user) {
        setStatus('error');
        setMessage('Please log in to activate your subscription.');
        return;
      }

      // Get product ID from URL params or from session storage
      const productId = searchParams.get('product_id') || 
                       searchParams.get('productId') ||
                       (typeof window !== 'undefined' ? sessionStorage.getItem('lastProductId') : null);

      if (!productId) {
        setStatus('error');
        setMessage('Product information not found. Please contact support.');
        return;
      }

      try {
        const response = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            productId: productId
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus('success');
          setMessage('Your subscription has been activated successfully!');
          // Clear session storage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('lastProductId');
          }
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to activate subscription. Please contact support.');
        }
      } catch (error) {
        console.error('Error creating subscription:', error);
        setStatus('error');
        setMessage('An error occurred while activating your subscription. Please contact support.');
      }
    };

    if (user) {
      createSubscription();
    } else {
      setStatus('error');
      setMessage('Please log in to activate your subscription.');
    }
  }, [user, searchParams]);

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>Subscription {status === 'success' ? 'Confirmed' : status === 'error' ? 'Error' : 'Processing'}</h1>
        {status === 'loading' && (
          <p>{t('redirecting')}</p>
        )}
        {status === 'success' && (
          <p>
            Thank you for choosing our service. Your subscription is active, and a
            receipt has been sent to your email.
          </p>
        )}
        {status === 'error' && (
          <p>{message}</p>
        )}
      </section>
    </div>
  );
}

