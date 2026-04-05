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
    const validUsername = /^(?=.*\d)[a-z0-9_]{5,}$/;

    if (!validUsername.test(username)) {
      throw new Error(
        'Username must be at least 5 characters and include at least 1 number. Only lowercase letters, numbers, and underscores are allowed.'
      );
    }

    await signUp({ email, password, username });
  } else {
    await logIn(email, password);
  }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
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
        <img src="/logo-wordmark.svg" alt="Here" className="auth-logo" />
        <h1>Don’t Show Up To A Dead Bar.</h1>
        <p>
        See What’s Actually Popping In East Lansing Right Now!
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="at least 5 characters, 1 number"
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

          {error ? <div className="error-banner">{error}</div> : null}

          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Loading...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <button className="text-button" onClick={() => setIsSignup((value) => !value)}>
          {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </motion.section>
    </div>
  );
}
