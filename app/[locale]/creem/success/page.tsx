import { setRequestLocale } from 'next-intl/server';

export default async function SuccessPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>Subscription Confirmed</h1>
        <p>
          Thank you for choosing our service. Your subscription is active, and a
          receipt has been sent to your email.
        </p>
      </section>
    </div>
  );
}

