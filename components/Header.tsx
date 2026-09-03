'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  const navigation = [
    { name: t('home'), href: `/${locale}` },
    { name: t('batch'), href: `/${locale}/batch` },
    { name: t('scan'), href: `/${locale}/scan` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('contact'), href: `/${locale}/contact` }
  ];

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignIn = () => {
    const next = pathname && pathname.startsWith(`/${locale}`) ? pathname : `/${locale}`;
    router.push(`/${locale}/signin?next=${encodeURIComponent(next)}`);
  };

  const handleSignUp = () => {
    const next = pathname && pathname.startsWith(`/${locale}`) ? pathname : `/${locale}`;
    router.push(`/${locale}/signup?next=${encodeURIComponent(next)}`);
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link href={`/${locale}`} className="logo">
          Personalized QRCode
        </Link>
        <button
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={() => setIsMenuOpen(false)}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="header-actions">
          {loading ? (
            <span className="auth-loading">{t('loading')}</span>
          ) : user ? (
            <div
              className="user-menu-wrapper"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div
                className="user-info"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <span className="user-credits-badge" title={t('credits')}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
                      fill="currentColor"
                    />
                  </svg>
                  {user.credits ?? 0}
                </span>
                <span className="user-name">
                  {user.displayName ||
                    user.email?.split('@')[0] ||
                    'User'}
                </span>
                <svg
                  className={`user-menu-icon ${isUserMenuOpen ? 'open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {isUserMenuOpen && (
                <>
                  <div
                    className="user-menu-backdrop"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="user-menu-dropdown">
                    <div className="user-menu-email">{user.email}</div>
                    <div className="user-menu-credits">
                      {t('credits')}: <strong>{user.credits ?? 0}</strong>
                    </div>
                    <Link
                      href={`/${locale}/membership`}
                      className="user-menu-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      {t('membership')}
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="user-menu-item user-menu-item-danger"
                    >
                      {t('signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="auth-actions">
              <button
                onClick={handleSignIn}
                className="auth-button sign-in"
                type="button"
              >
                {t('signInWithEmail')}
              </button>
              <button
                onClick={handleSignUp}
                className="auth-button sign-up"
                type="button"
              >
                {t('registerWithEmail')}
              </button>
            </div>
          )}
          <div className="language-switcher">
            <label htmlFor="language-select" className="visually-hidden">
              Language
            </label>
            <select
              id="language-select"
              className="language-select"
              value={locale}
              onChange={(event) => {
                const targetLocale = event.target.value;
                const segments = pathname?.split('/') ?? [];
                if (segments.length > 1) {
                  segments[1] = targetLocale;
                  router.push(segments.join('/') || `/${targetLocale}`);
                } else {
                  router.push(`/${targetLocale}`);
                }
              }}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="ru">Русский</option>
              <option value="pt">Português</option>
              <option value="ar">العربية</option>
              <option value="es">Español</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </nav>
    </header>
  );
}
