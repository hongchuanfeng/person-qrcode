import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ReactNode } from 'react';

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'membership' });

  return {
    title: t('title'),
    description: t('description')
  };
}

export default function MembershipLayout({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

