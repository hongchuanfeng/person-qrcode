'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

type PlanKey = 'monthly' | 'quarterly' | 'yearly';

export default function SubscribePage() {
  const t = useTranslations('subscribe');
  const locale = useLocale();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
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
        setErrorMessage(message);
      }
    });
  };

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </section>

      <section className="plans-section">
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
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button
        className="cta-button"
        onClick={handleSubscribe}
        disabled={isPending}
        type="button"
      >
        {isPending ? t('redirecting') : t('checkout')}
      </button>
    </div>
  );
}

