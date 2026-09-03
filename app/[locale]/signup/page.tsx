'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('common.auth');
  const tPromo = useTranslations('common.promo');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refresh } = useAuth();

  // 如果用户已经登录，则直接跳转回来源页
  useEffect(() => {
    if (!loading && user) {
      const next = searchParams?.get('next');
      router.replace(next || `/${locale}`);
    }
  }, [user, loading, router, locale, searchParams]);

  const handleSuccess = async () => {
    await refresh();
    const next = searchParams?.get('next');
    router.replace(next || `/${locale}`);
  };

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{tAuth('signUpTitle')}</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          {tAuth('signUpSubtitle')}
        </p>

        <div className="signup-bonus-strip" role="status">
          <span className="signup-bonus-strip-icon" aria-hidden="true">★</span>
          <span>
            <strong>{tPromo('signupBonusBadge')}</strong>
            {' · '}
            {tPromo('creditsHelp')}
          </span>
        </div>

        <div className="auth-card">
          <AuthForm mode="signup" onSuccess={handleSuccess} />
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {tCommon('haveAccount')}{' '}
          <a href={`/${locale}/signin`} className="auth-secondary-link">
            {tCommon('signInInstead')}
          </a>
        </p>
      </section>
    </div>
  );
}
