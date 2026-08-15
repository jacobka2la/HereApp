import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { signUp, logIn, isAuthed, authLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthed) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        const validUsername = /^(?=.*\d)[A-Za-z0-9_]{5,15}$/;
        if (!validUsername.test(username)) {
          throw new Error(
            'Username must be 5-15 characters and include at least 1 number.'
          );
        }

        if (password.length < 8) {
          throw new Error('PASSWORD_TOO_SHORT');
        }

        if (!agreedToTerms) {
          throw new Error('MUST_ACCEPT_TERMS');
        }

        await signUp({ email, password, username });
      } else {
        await logIn(email, password);
      }
    } catch (err) {
      console.log('AUTH ERROR FULL:', err);
      console.log('AUTH ERROR CODE:', err?.code);
      console.log('AUTH ERROR MESSAGE:', err?.message);

      let message = 'Something went wrong. Try again.';

      if (err.message === 'USERNAME_TAKEN') {
        message = 'This username is already taken.';
      } else if (err.message === 'PASSWORD_TOO_SHORT') {
        message = 'Password must be at least 8 characters.';
      } else if (err.message === 'MUST_ACCEPT_TERMS') {
        message = 'You must agree to the Terms, Privacy Policy, and Community Rules before creating an account.';
      } else if (err.message?.includes('Username must be')) {
        message =
          'Username must be 5-15 characters and include at least 1 number.';
      } else if (err.code === 'auth/invalid-credential') {
        message = 'Incorrect email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Email is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Try again.';
      } else if (err.code === 'permission-denied') {
        message = 'Firestore permissions are blocking signup.';
      } else if (err.code === 'unavailable') {
        message = 'Database temporarily unavailable. Try again.';
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <motion.section
        className="auth-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="auth-logo-wrap">
          <img src="/logo-full.png" alt="Here" className="auth-logo-large" />
        </div>

        <h1
          style={{
            fontSize: '28px',
            lineHeight: '1.2',
            textAlign: 'center',
            marginTop: '18px',
            marginBottom: '-10px',
          }}
        >
          See Real-Time Activity At Popular Venues In Your Area!
        </h1>

        <p>Find The Busiest Spots In Seconds!</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="5–15 chars, include a number"
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="at least 8 characters"
            />
          </label>

          <p className="auth-note">
            Usernames are public. Everything else stays private.
          </p>

          {isSignup ? (
            <div
              style={{
                marginTop: '6px',
                marginBottom: '6px',
                padding: '14px 14px 12px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(120,255,170,0.12)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  style={{
                    marginTop: '4px',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.95rem' }}>
                  I have read and agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#78ffaa', fontWeight: 700 }}
                  >
                    Terms of Service
                  </a>
                  ,{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#78ffaa', fontWeight: 700 }}
                  >
                    Privacy Policy
                  </a>
                  , and{' '}
                  <a
                    href="/community-rules"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#78ffaa', fontWeight: 700 }}
                  >
                    Community Rules
                  </a>
                  .
                </span>
              </label>

              <p
                style={{
                  margin: '12px 0 0',
                  color: 'rgba(235,255,240,0.76)',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                }}
              >
                Here has zero tolerance for objectionable content or abusive users,
                including harassment, hate speech, threats, bullying, and targeted abuse.
                Violating content may be removed and accounts may be suspended or banned.
              </p>
            </div>
          ) : null}

          {error ? <div className="error-banner">{error}</div> : null}

          <button
            className="primary-button"
            disabled={submitting || (isSignup && !agreedToTerms)}
            style={{
              opacity: submitting || (isSignup && !agreedToTerms) ? 0.65 : 1,
              cursor:
                submitting || (isSignup && !agreedToTerms)
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {submitting ? 'Loading...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <button
          className="text-button"
          onClick={() => {
            setIsSignup((value) => !value);
            setError('');
            setAgreedToTerms(false);
          }}
        >
          {isSignup
            ? 'Already have an account? Log in'
            : 'Need an account? Sign up'}
        </button>
      </motion.section>
    </div>
  );
}