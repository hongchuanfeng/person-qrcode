'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const navigation = [
    { name: t('home'), href: `/${locale}` },
    { name: t('batch'), href: `/${locale}/batch` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('contact'), href: `/${locale}/contact` }
  ];

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
                <span className="user-name">
                  {user.email?.split('@')[0] || user.user_metadata?.full_name || 'User'}
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
            <button onClick={signInWithGoogle} className="auth-button sign-in">
              {t('signInWithGoogle')}
            </button>
          )}
          <div className="language-switcher">
            <Link href={`/${locale === 'en' ? 'zh' : 'en'}`} className="lang-link">
              {locale === 'en' ? '中文' : 'English'}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

