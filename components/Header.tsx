'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: t('home'), href: `/${locale}` },
    { name: t('batch'), href: `/${locale}/batch` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('contact'), href: `/${locale}/contact` }
  ];

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
        <div className="language-switcher">
          <Link href={`/${locale === 'en' ? 'zh' : 'en'}`} className="lang-link">
            {locale === 'en' ? '中文' : 'English'}
          </Link>
        </div>
      </nav>
    </header>
  );
}

