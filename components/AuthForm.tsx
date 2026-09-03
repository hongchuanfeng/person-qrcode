'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('common.auth');
  const locale = useLocale();
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isSignup && password !== confirmPassword) {
      setError(tAuth('passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(email.trim(), password, displayName.trim() || undefined);
      } else {
        await signIn(email.trim(), password);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <label className="auth-field">
        <span>{tAuth('email')}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder={tAuth('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
      </label>

      <label className="auth-field">
        <span>{tAuth('password')}</span>
        <input
          type="password"
          name="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          minLength={6}
          placeholder={tAuth('passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
      </label>

      {isSignup && (
        <>
          <label className="auth-field">
            <span>{tAuth('confirmPassword')}</span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
          </label>

          <label className="auth-field">
            <span>{tAuth('displayName')}</span>
            <input
              type="text"
              name="displayName"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={submitting}
            />
          </label>
        </>
      )}

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="cta-button auth-submit" disabled={submitting}>
        {submitting
          ? isSignup
            ? tAuth('submittingSignUp')
            : tAuth('submitting')
          : isSignup
            ? tAuth('submitSignUp')
            : tAuth('submitSignIn')}
      </button>

      <p className="auth-secondary">
        {isSignup ? tCommon('haveAccount') : tCommon('noAccount')}{' '}
        <a className="auth-secondary-link" href={isSignup ? `/${locale}/signin` : `/${locale}/signup`}>
          {isSignup ? tCommon('signInInstead') : tCommon('registerInstead')}
        </a>
      </p>
    </form>
  );
}
