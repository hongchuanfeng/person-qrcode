'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface MembershipData {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  subscriptions: Subscription[];
}

export default function MembershipPage() {
  const t = useTranslations('membership');
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipData = async () => {
      if (authLoading) return;

      if (!user) {
        setError('Please log in to view your membership information.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscriptions/list');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch membership data');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching membership data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load membership information');
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipData();
  }, [user, authLoading]);

  const getPlanName = (planType: string) => {
    const planNames: Record<string, string> = {
      monthly: t('planMonthly'),
      quarterly: t('planQuarterly'),
      yearly: t('planYearly')
    };
    return planNames[planType] || planType;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  const getActiveSubscription = () => {
    if (!data?.subscriptions) return null;
    return data.subscriptions.find(sub => isActive(sub.end_date));
  };

  const activeSubscription = getActiveSubscription();

  if (authLoading || loading) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>{t('title')}</h1>
          <p>{t('loading')}</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>{t('title')}</h1>
          <p style={{ marginBottom: '2rem' }}>{t('loginRequired')}</p>
          <Link 
            href={`/${locale}`} 
            className="btn btn-primary" 
            style={{ 
              marginTop: '2rem',
              display: 'inline-block',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}
          >
            {t('goHome')}
          </Link>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>{t('title')}</h1>
          <p className="error-message">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {t('retry')}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </section>

      {data && (
        <>
          {/* User Information */}
          <section className="membership-section">
            <h2>{t('userInfo')}</h2>
            <div className="membership-card">
              <div className="membership-info-item">
                <span className="info-label">{t('email')}:</span>
                <span className="info-value">{data.user.email}</span>
                {data.user.emailVerified && (
                  <span className="verified-badge">{t('verified')}</span>
                )}
              </div>
            </div>
          </section>

          {/* Active Subscription */}
          {activeSubscription ? (
            <section className="membership-section">
              <h2>{t('activeSubscription')}</h2>
              <div className="membership-card active">
                <div className="membership-info-item">
                  <span className="info-label">{t('planType')}:</span>
                  <span className="info-value">{getPlanName(activeSubscription.plan_type)}</span>
                </div>
                <div className="membership-info-item">
                  <span className="info-label">{t('startDate')}:</span>
                  <span className="info-value">{formatDate(activeSubscription.start_date)}</span>
                </div>
                <div className="membership-info-item">
                  <span className="info-label">{t('expiryDate')}:</span>
                  <span className="info-value expiry-date">
                    {formatDate(activeSubscription.end_date)}
                  </span>
                </div>
                <div className="membership-status active-status">
                  {t('statusActive')}
                </div>
              </div>
            </section>
          ) : (
            <section className="membership-section">
              <h2>{t('noActiveSubscription')}</h2>
              <div className="membership-card">
                <p>{t('subscribePrompt')}</p>
                <Link 
                  href={`/${locale}/batch`} 
                  className="btn btn-primary" 
                  style={{ 
                    marginTop: '2rem',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  {t('subscribeNow')}
                </Link>
              </div>
            </section>
          )}

          {/* Subscription History */}
          {data.subscriptions && data.subscriptions.length > 0 && (
            <section className="membership-section">
              <h2>{t('subscriptionHistory')}</h2>
              <div className="subscription-history">
                {data.subscriptions.map((subscription) => {
                  const active = isActive(subscription.end_date);
                  return (
                    <div
                      key={subscription.id}
                      className={`membership-card history-item ${active ? 'active' : 'expired'}`}
                    >
                      <div className="subscription-header">
                        <span className="plan-name">{getPlanName(subscription.plan_type)}</span>
                        <span className={`status-badge ${active ? 'active' : 'expired'}`}>
                          {active ? t('statusActive') : t('statusExpired')}
                        </span>
                      </div>
                      <div className="subscription-details">
                        <div className="detail-row">
                          <span className="detail-label">{t('startDate')}:</span>
                          <span className="detail-value">{formatDate(subscription.start_date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">{t('expiryDate')}:</span>
                          <span className="detail-value">{formatDate(subscription.end_date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">{t('purchasedDate')}:</span>
                          <span className="detail-value">{formatDate(subscription.created_at)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">{t('productId')}:</span>
                          <span className="detail-value product-id">{subscription.product_id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

