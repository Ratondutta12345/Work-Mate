import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import './Landing.css'
import './Auth.css'

const socialProviders = [
  { id: 'google', label: 'Google', className: 'social-google' },
  { id: 'facebook', label: 'Facebook', className: 'social-facebook' },
  { id: 'apple', label: 'Apple', className: 'social-apple' },
  { id: 'github', label: 'GitHub', className: 'social-github' },
  { id: 'microsoft', label: 'Microsoft', className: 'social-microsoft' },
  { id: 'x', label: 'X / Twitter', className: 'social-x' },
]

function SocialIcon({ id }) {
  if (id === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
        />
        <path
          fill="#34A853"
          d="M3.8 7.4l3 2.2C7.7 7.5 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 8.5 2.7 5.5 4.7 3.8 7.4z"
        />
        <path
          fill="#4A90E2"
          d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9 1-3.1 1-3.5 0-6.5-2.4-7.5-5.6l-3 2.3C3.3 18.4 7.3 21.3 12 21.3z"
        />
        <path
          fill="#FBBC05"
          d="M4.5 12c0-.7.1-1.3.3-1.9l-3-2.3C1.3 9 1 10.5 1 12s.3 3 1 4.2l3-2.3c-.2-.6-.5-1.2-.5-1.9z"
        />
      </svg>
    )
  }

  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9v2.2h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"
        />
      </svg>
    )
  }

  if (id === 'apple') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.4 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7zM14.5 5.8c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.7 1.4-.6.6-1.1 1.7-1 2.6 1 .1 2-.5 2.8-1.3z"
        />
      </svg>
    )
  }

  if (id === 'github') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.2 3.4 9.6 8.1 11.1.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.8 1.8 2.8 1.3.1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"
        />
      </svg>
    )
  }

  if (id === 'microsoft') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
        <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
        <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
        <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.9-7.2L5.4 22H2.6l7.1-8.1L2 2h6.3l4.4 6.6L18.2 2zm-1.1 18h1.7L7 3.9H5.2L17.1 20z"
      />
    </svg>
  )
}

function Login() {
  const { user, login, signup, loginWithProvider } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/profile'
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busyProvider, setBusyProvider] = useState('')

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  const finishAuth = () => navigate(redirectTo)

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.')
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.')
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        await signup({ name, email, password })
      } else {
        await login({ email, password })
      }
      finishAuth()
    } catch (err) {
      setError(err.message || 'Authentication failed.')
    }
  }

  const handleSocialLogin = async (providerId) => {
    setError('')
    setBusyProvider(providerId)
    try {
      await loginWithProvider(providerId)
      finishAuth()
    } catch (err) {
      setError(err.message || 'Social login failed.')
    } finally {
      setBusyProvider('')
    }
  }

  return (
    <div className="landing auth-page">
      <SiteNav />
      <main className="auth-main">
        <section className="auth-shell">
          <div className="auth-brand-panel">
            <img src={logo} alt="Work Mate" />
            <h2>Work Mate</h2>
            <p>
              Create amazing content with AI tools. Sign in to save your work
              and sync across sessions.
            </p>
          </div>

          <div className="auth-card">
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => {
                  setMode('signup')
                  setError('')
                }}
              >
                Sign Up
              </button>
            </div>

            <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p>
              {mode === 'login'
                ? 'Login with email or continue with a social account.'
                : 'Sign up with email or create an account with a social provider.'}
            </p>

            <div className="social-grid">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className={`social-btn ${provider.className}`}
                  onClick={() => handleSocialLogin(provider.id)}
                  disabled={Boolean(busyProvider)}
                >
                  <SocialIcon id={provider.id} />
                  <span>
                    {busyProvider === provider.id
                      ? 'Connecting…'
                      : `Continue with ${provider.label}`}
                  </span>
                </button>
              ))}
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form className="auth-form" onSubmit={handleEmailSubmit}>
              {mode === 'signup' ? (
                <>
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </>
              ) : null}

              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              {mode === 'signup' ? (
                <>
                  <label htmlFor="auth-confirm">Confirm password</label>
                  <input
                    id="auth-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </>
              ) : null}

              {error ? <p className="auth-error">{error}</p> : null}

              <button type="submit" className="btn btn-primary auth-submit">
                {mode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'login' ? (
                <>
                  New here?{' '}
                  <button type="button" onClick={() => setMode('signup')}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')}>
                    Login
                  </button>
                </>
              )}
            </p>

            <Link to="/" className="auth-back">
              ← Back to home
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Login
