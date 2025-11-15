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
    title: `${t('terms')} - Personalized QR Code`,
    description: 'Terms of Service for Personalized QR Code Generator'
  };
}

export default async function TermsPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>Terms of Service</h1>
        <p>Last updated: {new Date().toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</p>
      </section>

      <section className="content-section">
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing and using this service, you accept and agree to be bound
          by the terms and provision of this agreement.
        </p>

        <h2>Use License</h2>
        <p>
          Permission is granted to temporarily use this service for personal,
          non-commercial transitory viewing only.
        </p>

        <h2>Disclaimer</h2>
        <p>
          The materials on this service are provided on an 'as is' basis. We
          make no warranties, expressed or implied, and hereby disclaim and
          negate all other warranties.
        </p>

        <h2>Limitations</h2>
        <p>
          In no event shall we or our suppliers be liable for any damages
          arising out of the use or inability to use the materials on this
          service.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact
          us at qrcode@chdaoai.com.
        </p>
      </section>
    </div>
  );
}

