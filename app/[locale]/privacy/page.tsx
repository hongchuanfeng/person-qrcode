import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: `${t('privacy')} - Personalized QR Code`,
    description: 'Privacy Policy for Personalized QR Code Generator'
  };
}

export default async function PrivacyPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</p>
      </section>

      <section className="content-section">
        <h2>Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including when
          you create QR codes, use our services, or contact us for support.
        </p>

        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve
          our services, process transactions, and communicate with you.
        </p>

        <h2>Information Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personal information
          to third parties without your consent, except as described in this
          policy.
        </p>

        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal
          information against unauthorized access, alteration, disclosure, or
          destruction.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at qrcode@chdaoai.com.
        </p>
      </section>
    </div>
  );
}

