import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: `${t('title')} - Personalized QR Code`,
    description: t('description')
  };
}

export default async function AboutPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{t('title')}</h1>
        <p className="hero-description">{t('description')}</p>
      </section>

      <section className="content-section">
        <h2>{t('story.title')}</h2>
        <p>{t('story.description')}</p>
      </section>

      <section className="content-section">
        <h2>{t('mission.title')}</h2>
        <p>{t('mission.description')}</p>
      </section>

      <section className="content-section">
        <h2>{t('vision.title')}</h2>
        <p>{t('vision.description')}</p>
      </section>

      <section className="content-section">
        <h2>{t('values.title')}</h2>
        <div className="values-grid">
          <div className="value-card">
            <h3>{t('values.value1.title')}</h3>
            <p>{t('values.value1.description')}</p>
          </div>
          <div className="value-card">
            <h3>{t('values.value2.title')}</h3>
            <p>{t('values.value2.description')}</p>
          </div>
          <div className="value-card">
            <h3>{t('values.value3.title')}</h3>
            <p>{t('values.value3.description')}</p>
          </div>
          <div className="value-card">
            <h3>{t('values.value4.title')}</h3>
            <p>{t('values.value4.description')}</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <h2>{t('why.title')}</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">✨</div>
            <h3>{t('why.reason1.title')}</h3>
            <p>{t('why.reason1.description')}</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🎨</div>
            <h3>{t('why.reason2.title')}</h3>
            <p>{t('why.reason2.description')}</p>
          </div>
          <div className="why-card">
            <div className="why-icon">⚡</div>
            <h3>{t('why.reason3.title')}</h3>
            <p>{t('why.reason3.description')}</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🚀</div>
            <h3>{t('why.reason4.title')}</h3>
            <p>{t('why.reason4.description')}</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <h2>{t('team.title')}</h2>
        <p className="team-description">{t('team.description')}</p>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">👤</div>
            <h3>{t('team.member1.name')}</h3>
            <p className="member-role">{t('team.member1.role')}</p>
            <p className="member-bio">{t('team.member1.bio')}</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">👤</div>
            <h3>{t('team.member2.name')}</h3>
            <p className="member-role">{t('team.member2.role')}</p>
            <p className="member-bio">{t('team.member2.bio')}</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">👤</div>
            <h3>{t('team.member3.name')}</h3>
            <p className="member-role">{t('team.member3.role')}</p>
            <p className="member-bio">{t('team.member3.bio')}</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">👤</div>
            <h3>{t('team.member4.name')}</h3>
            <p className="member-role">{t('team.member4.role')}</p>
            <p className="member-bio">{t('team.member4.bio')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
