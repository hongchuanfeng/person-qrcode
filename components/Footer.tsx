'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('common');
  const locale = useLocale();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Personalized QRCode</h3>
          <p>Create beautiful, customized QR codes for any purpose.</p>
        </div>
        <div className="footer-section">
          <h4>Links</h4>
          <ul>
            <li>
              <Link href={`/${locale}/privacy`}>{t('privacy')}</Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`}>{t('terms')}</Link>
            </li>
            <li>
              <Link href={`/${locale}/about`}>{t('about')}</Link>
            </li>
            <li>
              <Link href={`/${locale}/contact`}>{t('contact')}</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('copyright')}</h4>
          <p>&copy; {new Date().getFullYear()} {t('chdaoai')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

