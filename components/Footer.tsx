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
          <h4>{t('friendLinks')}</h4>
          <ul className="friend-links">
            <li>
              <a href="https://mosaic.chdaoai.com/" target="_blank" rel="noopener noreferrer">{t('friendLink1')}</a>
            </li>
            <li>
              <a href="https://www.icebreakgame.com/" target="_blank" rel="noopener noreferrer">{t('friendLink2')}</a>
            </li>
            <li>
              <a href="https://www.removewatermarker.com/" target="_blank" rel="noopener noreferrer">{t('friendLink3')}</a>
            </li>
            <li>
              <a href="https://pdf.chdaoai.com/" target="_blank" rel="noopener noreferrer">{t('friendLink4')}</a>
            </li>
            <li>
              <a href="https://qrcode.chdaoai.com/" target="_blank" rel="noopener noreferrer">{t('friendLink5')}</a>
            </li>
            <li>
              <a href="https://barcode.zorezoro.com/" target="_blank" rel="noopener noreferrer">{t('friendLink6')}</a>
            </li>
            <li>
              <a href="https://www.zorezoro.com/" target="_blank" rel="noopener noreferrer">{t('friendLink7')}</a>
            </li>
            <li>
              <a href="https://video2txt.zorezoro.com/" target="_blank" rel="noopener noreferrer">{t('friendLink8')}</a>
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

