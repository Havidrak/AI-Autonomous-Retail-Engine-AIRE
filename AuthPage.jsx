import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { initialAuthForm } from '../lib/workspaceConfig'
import {
  IconArrowSwap,
  IconChevronLeft,
  IconGoogle,
  IconLock,
  IconMail,
  IconUser,
} from './Icons'

export default function AuthPage({ mode, onSwitchMode, onBack }) {
  const [form, setForm] = useState(initialAuthForm)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        })

        if (error) {
          throw error
        }

        setAuthMessage(
          'Account created. Check your email to confirm your account if email verification is enabled.'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setSubmitting(true)
    setAuthError('')
    setAuthMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      if (error.message?.toLowerCase().includes('provider is not enabled')) {
        setAuthError(
          'Google sign in is not enabled in Supabase yet. Enable Google in Authentication > Providers.'
        )
      } else {
        setAuthError(error.message || 'Google sign in failed.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="signin-page">
      <button className="signin-back" type="button" onClick={onBack}>
        <IconChevronLeft />
        <span>Back</span>
      </button>

      <div className="signin-card">
        <div className="signin-header">
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p>Architectural intelligence at your fingertips.</p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="signin-field">
              <span>Full Name</span>
              <div className="signin-input-wrap">
                <IconUser />
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={updateField}
                  placeholder="Your full name"
                  required
                />
              </div>
            </label>
          ) : null}

          <label className="signin-field">
            <span>Email Address</span>
            <div className="signin-input-wrap">
              <IconMail />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="name@studio.com"
                required
              />
            </div>
          </label>

          <div className="signin-password-row">
            <span>Password</span>
            {mode === 'signin' ? (
              <button className="forgot-link" type="button">
                Forgot Password?
              </button>
            ) : null}
          </div>

          <label className="signin-field">
            <div className="signin-input-wrap">
              <IconLock />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
          </label>

          <label className="remember-row">
            <input
              name="remember"
              type="checkbox"
              checked={form.remember}
              onChange={updateField}
            />
            <span>Remember this device for 30 days</span>
          </label>

          {authError ? <div className="auth-alert error">{authError}</div> : null}
          {authMessage ? <div className="auth-alert success">{authMessage}</div> : null}

          <button className="signin-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>

          <div className="signin-divider">
            <span>or continue with</span>
          </div>

          <div className="signin-socials">
            <button className="social-button" type="button" onClick={handleGoogleSignIn}>
              <IconGoogle />
              <span>Google</span>
            </button>
            <button
              className="social-button"
              type="button"
              onClick={() => onSwitchMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <IconArrowSwap />
              <span>{mode === 'signin' ? 'Create Account' : 'Back to Sign In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
