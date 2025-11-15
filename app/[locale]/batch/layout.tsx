import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'batch' });

  return {
    title: `${t('title')} - Personalized QRCode`,
    description: t('description')
  };
}

export default function BatchLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

