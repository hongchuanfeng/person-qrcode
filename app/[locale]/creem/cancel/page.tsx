import { setRequestLocale } from 'next-intl/server';

export default async function CancelPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>Checkout Cancelled</h1>
        <p>
          Your checkout session was cancelled. You can restart the process
          whenever you are ready.
        </p>
      </section>
    </div>
  );
}

