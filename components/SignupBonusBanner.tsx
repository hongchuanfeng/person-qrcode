'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SignupBonusBannerProps {
  /** 是否只展示给未登录用户（默认 true） */
  guestOnly?: boolean;
}

export default function SignupBonusBanner({
  guestOnly = true
}: SignupBonusBannerProps) {
  const tPromo = useTranslations('common.promo');
  const locale = useLocale();
  const router = useRouter();
  const { user, loading } = useAuth();

  // 仅展示给未登录用户
  if (guestOnly && !loading && user) return null;

  const goToSignUp = () => {
    router.push(`/signup?next=${encodeURIComponent(`/${locale}`)}`);
  };

  return (
    <section className="signup-bonus-banner" aria-label="signup-bonus">
      <div className="signup-bonus-content">
        <div className="signup-bonus-badge">{tPromo('signupBonusBadge')}</div>
        <h2 className="signup-bonus-title">{tPromo('signupBonusTitle')}</h2>
        <p className="signup-bonus-description">
          {tPromo('signupBonusDescription')}
        </p>
        <button
          className="cta-button signup-bonus-cta"
          type="button"
          onClick={goToSignUp}
        >
          {tPromo('signupBonusCta')}
        </button>
        <p className="signup-bonus-help">{tPromo('creditsHelp')}</p>
      </div>
      <div className="signup-bonus-illustration" aria-hidden="true">
        <div className="signup-bonus-coin">500</div>
        <div className="signup-bonus-coin signup-bonus-coin--small">+</div>
      </div>
    </section>
  );
}
