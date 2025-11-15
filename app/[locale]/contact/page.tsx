'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    // 这里可以集成实际的表单提交API
    // 现在只是模拟提交
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{t('title')}</h1>
        <p className="hero-description">{t('description')}</p>
      </section>

      <section className="content-section">
        <h2>{t('email.title')}</h2>
        <p>{t('email.description')}</p>
        <div className="contact-info-grid">
          <div className="contact-item">
            <h3>{t('email.general')}</h3>
            <p>
              <a href="mailto:qrcode@chdaoai.com">qrcode@chdaoai.com</a>
            </p>
          </div>
          <div className="contact-item">
            <h3>{t('email.support')}</h3>
            <p>
              <a href="mailto:qrcode@chdaoai.com">qrcode@chdaoai.com</a>
            </p>
          </div>
          <div className="contact-item">
            <h3>{t('email.business')}</h3>
            <p>
              <a href="mailto:qrcode@chdaoai.com">qrcode@chdaoai.com</a>
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <h2>{t('support.title')}</h2>
        <p>{t('support.description')}</p>
        <p className="support-hours">{t('support.hours')}</p>
      </section>

      <section className="content-section">
        <h2>{t('response.title')}</h2>
        <p>{t('response.description')}</p>
      </section>

      <section className="content-section">
        <h2>{t('form.title')}</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">{t('form.name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">{t('form.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="subject">{t('form.subject')}</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">{t('form.message')}</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="form-textarea"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn btn-primary"
          >
            {status === 'sending' ? t('form.sending') : t('form.send')}
          </button>
          {status === 'success' && (
            <p className="form-success">{t('form.success')}</p>
          )}
          {status === 'error' && (
            <p className="form-error">{t('form.error')}</p>
          )}
        </form>
      </section>

      <section className="content-section">
        <h2>{t('social.title')}</h2>
        <p>{t('social.description')}</p>
        <div className="social-links">
          <a href="#" className="social-link" aria-label="Twitter">
            Twitter
          </a>
          <a href="#" className="social-link" aria-label="Facebook">
            Facebook
          </a>
          <a href="#" className="social-link" aria-label="LinkedIn">
            LinkedIn
          </a>
          <a href="#" className="social-link" aria-label="GitHub">
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
