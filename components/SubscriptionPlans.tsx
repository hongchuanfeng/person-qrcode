'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

type PlanKey = 'monthly' | 'quarterly' | 'yearly';

export default function SubscriptionPlans() {
  const t = useTranslations('subscribe');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = () => {
    // This function should only be called when user is logged in
    // The button logic ensures this, but we add a safety check
    if (!user) {
      signInWithGoogle();
      return;
    }

    setSubscribeError(null);
    startTransition(async () => {
      try {
        // Get product ID for the selected plan
        const PRODUCT_IDS: Record<PlanKey, string> = {
          monthly: 'prod_4L6YdpnlJEdRjzPg9OjH8Z',
          quarterly: 'prod_6MCeuAFjzFqFZduAn74Ew7',
          yearly: 'prod_6LKkd6OJ8pLCesUdoVNV9I'
        };

        const productId = PRODUCT_IDS[selectedPlan];
        
        // Save product ID to session storage for success page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('lastProductId', productId);
        }

        const response = await fetch('/api/creem/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ planId: selectedPlan })
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          const message =
            payload?.error ??
            `Creem checkout failed with status ${response.status}.`;
          throw new Error(message);
        }

        const redirectUrl =
          payload.data?.url ??
          payload.data?.checkout_url ??
          payload.data?.redirect_url;

        if (!redirectUrl) {
          throw new Error('Missing checkout URL in Creem response.');
        }

        window.location.href = redirectUrl;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unexpected error during checkout.';
        setSubscribeError(message);
      }
    });
  };

  return (
    <section className="content-section">
      <div className="plans-section-wrapper">
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem' }}>
          {t('title')}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {t('description')}
        </p>
        
        <div className="plans-section">
          {(['monthly', 'quarterly', 'yearly'] as PlanKey[]).map((key) => {
            const isActive = selectedPlan === key;
            return (
              <article
                key={key}
                className={`plan-card${isActive ? ' active' : ''}`}
                onClick={() => setSelectedPlan(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedPlan(key);
                  }
                }}
              >
                <div className="plan-header">
                  <h2>{t(`plans.${key}.title`)}</h2>
                  <span className="price">{t(`plans.${key}.priceLabel`)}</span>
                </div>
                <p className="subtitle">{t(`plans.${key}.subtitle`)}</p>
                <p className="savings">
                  {t(`plans.${key}.savings`)}
                </p>
              </article>
            );
          })}
        </div>

        {subscribeError && <p className="error-message">{subscribeError}</p>}

        {authLoading ? (
          <button className="cta-button" disabled type="button">
            {t('redirecting')}
          </button>
        ) : !user ? (
          <button
            className="cta-button"
            onClick={signInWithGoogle}
            type="button"
          >
            {tCommon('signInWithGoogle')}
          </button>
        ) : (
          <button
            className="cta-button"
            onClick={handleSubscribe}
            disabled={isPending}
            type="button"
          >
            {isPending ? t('redirecting') : t('checkout')}
          </button>
        )}
        
        {!user && (
          <p style={{ 
            textAlign: 'center', 
            color: 'var(--text-secondary)', 
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
            {t('loginRequired')}
          </p>
        )}
      </div>
    </section>
  );
}

