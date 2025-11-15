import { getTranslations, setRequestLocale } from 'next-intl/server';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: `${t('title')} - Personalized QR Code Generator`,
    description: t('description'),
    keywords: 'personalized qr code, qr code generator, custom qr code, qr code with image, qr code maker',
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website'
    }
  };
}

export default async function HomePage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
        <p className="description">{t('description')}</p>
      </section>

      <section className="get-started-section">
        <h2 className="get-started-title">{t('getStarted.title')}</h2>
        <p className="get-started-subtitle">{t('getStarted.subtitle')}</p>
        <div className="get-started-steps">
          <div className="get-started-step">
            <div className="step-number-large">1</div>
            <div className="step-content">
              <h3>{t('getStarted.step1.title')}</h3>
              <p>{t('getStarted.step1.description')}</p>
            </div>
          </div>
          <div className="get-started-step">
            <div className="step-number-large">2</div>
            <div className="step-content">
              <h3>{t('getStarted.step2.title')}</h3>
              <p>{t('getStarted.step2.description')}</p>
            </div>
          </div>
          <div className="get-started-step">
            <div className="step-number-large">3</div>
            <div className="step-content">
              <h3>{t('getStarted.step3.title')}</h3>
              <p>{t('getStarted.step3.description')}</p>
            </div>
          </div>
          <div className="get-started-step">
            <div className="step-number-large">4</div>
            <div className="step-content">
              <h3>{t('getStarted.step4.title')}</h3>
              <p>{t('getStarted.step4.description')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="qr-generator-section">
        <QRCodeGenerator />
      </section>

      <section className="features-section">
        <h2>{t('features.title')}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>{t('features.upload')}</h3>
            <p>{t('features.uploadDesc')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('features.generate')}</h3>
            <p>{t('features.generateDesc')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('features.download')}</h3>
            <p>{t('features.downloadDesc')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('features.track')}</h3>
            <p>{t('features.trackDesc')}</p>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <h2>{t('howItWorks.title')}</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>{t('howItWorks.step1')}</h3>
            <p>{t('howItWorks.step1Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>{t('howItWorks.step2')}</h3>
            <p>{t('howItWorks.step2Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>{t('howItWorks.step3')}</h3>
            <p>{t('howItWorks.step3Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>{t('howItWorks.step4')}</h3>
            <p>{t('howItWorks.step4Desc')}</p>
          </div>
        </div>
      </section>

      <section className="examples-section">
        <h2>{t('examples.title')}</h2>
        <div className="examples-grid">
          <div className="example-card">
            <h3>{t('examples.business')}</h3>
            <p>{t('examples.businessDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.marketing')}</h3>
            <p>{t('examples.marketingDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.events')}</h3>
            <p>{t('examples.eventsDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.product')}</h3>
            <p>{t('examples.productDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.restaurant')}</h3>
            <p>{t('examples.restaurantDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.wifi')}</h3>
            <p>{t('examples.wifiDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.payment')}</h3>
            <p>{t('examples.paymentDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.social')}</h3>
            <p>{t('examples.socialDesc')}</p>
          </div>
          <div className="example-card">
            <h3>{t('examples.website')}</h3>
            <p>{t('examples.websiteDesc')}</p>
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <h2>{t('gallery.title')}</h2>
        <p className="gallery-subtitle">{t('gallery.subtitle')}</p>
        <div className="gallery-grid">
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/demo1.png" alt={t('gallery.example1.title')} />
            </div>
            <h3>{t('gallery.example1.title')}</h3>
            <p>{t('gallery.example1.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/demo2.png" alt={t('gallery.example2.title')} />
            </div>
            <h3>{t('gallery.example2.title')}</h3>
            <p>{t('gallery.example2.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/demo3.png" alt={t('gallery.example3.title')} />
            </div>
            <h3>{t('gallery.example3.title')}</h3>
            <p>{t('gallery.example3.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/demo4.png" alt={t('gallery.example4.title')} />
            </div>
            <h3>{t('gallery.example4.title')}</h3>
            <p>{t('gallery.example4.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/demo5.png" alt={t('gallery.example5.title')} />
            </div>
            <h3>{t('gallery.example5.title')}</h3>
            <p>{t('gallery.example5.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/demo6.png" alt={t('gallery.example6.title')} />
            </div>
            <h3>{t('gallery.example6.title')}</h3>
            <p>{t('gallery.example6.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/facebook.svg" alt={t('gallery.example7.title')} />
            </div>
            <h3>{t('gallery.example7.title')}</h3>
            <p>{t('gallery.example7.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/twitter.svg" alt={t('gallery.example8.title')} />
            </div>
            <h3>{t('gallery.example8.title')}</h3>
            <p>{t('gallery.example8.description')}</p>
          </div>
          <div className="gallery-item">
            <div className="gallery-image">
              <img src="/images/youtube.svg" alt={t('gallery.example9.title')} />
            </div>
            <h3>{t('gallery.example9.title')}</h3>
            <p>{t('gallery.example9.description')}</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>{t('about.title')}</h2>
        <h3 className="about-subtitle">{t('about.subtitle')}</h3>
        <p className="about-description">{t('about.description')}</p>
        
        <div className="about-features">
          <div className="about-feature-card">
            <h3>{t('about.features.lifetime.title')}</h3>
            <p>{t('about.features.lifetime.description')}</p>
          </div>
          
          <div className="about-feature-card">
            <h3>{t('about.features.logo.title')}</h3>
            <p>{t('about.features.logo.description')}</p>
          </div>
          
          <div className="about-feature-card">
            <h3>{t('about.features.design.title')}</h3>
            <p>{t('about.features.design.description')}</p>
          </div>
          
          <div className="about-feature-card">
            <h3>{t('about.features.print.title')}</h3>
            <p>{t('about.features.print.description')}</p>
          </div>
          
          <div className="about-feature-card">
            <h3>{t('about.features.vector.title')}</h3>
            <p>{t('about.features.vector.description')}</p>
          </div>
          
          <div className="about-feature-card">
            <h3>{t('about.features.commercial.title')}</h3>
            <p>{t('about.features.commercial.description')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

