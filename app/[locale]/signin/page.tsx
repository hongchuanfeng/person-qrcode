'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInPage() {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('common.auth');
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
        <h1>{tAuth('signInTitle')}</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          {tAuth('signInSubtitle')}
        </p>
        <div className="auth-card">
          <AuthForm mode="signin" onSuccess={handleSuccess} />
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {tCommon('noAccount')}{' '}
          <a href={`/${locale}/signup`} className="auth-secondary-link">
            {tCommon('registerInstead')}
          </a>
        </p>
      </section>
    </div>
  );
}
