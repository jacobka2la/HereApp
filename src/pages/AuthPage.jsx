import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { signUp, logIn, isAuthed, authLoading, profile } = useAuth();
  const [isSignup, setIsSignup] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthed) {
    return <Navigate to={profile?.avatarId ? '/' : '/pick-avatar'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (isSignup) {
        const validUsername = /^(?=.*\d)[A-Za-z0-9_]{5,15}$/;
        if (!validUsername.test(username)) throw new Error('Username must be 5-15 characters, use only letters, numbers, or underscores, and include at least 1 number.');
        if (password.length < 8) throw new Error('PASSWORD_TOO_SHORT');
        if (!agreedToTerms) throw new Error('MUST_ACCEPT_TERMS');
        await signUp({ email, password, username });
      } else {
        await logIn(email, password);
      }
    } catch (err) {
      let message = 'Something went wrong. Try again.';
      if (err.message === 'USERNAME_TAKEN') message = 'This username is already taken.';
      else if (err.message === 'PASSWORD_TOO_SHORT') message = 'Password must be at least 8 characters.';
      else if (err.message === 'MUST_ACCEPT_TERMS') message = 'You must agree to the Terms, Privacy Policy, and Community Rules before creating an account.';
      else if (err.message?.includes('Username must be')) message = err.message;
      else if (err.code === 'auth/invalid-credential') message = 'Incorrect email or password.';
      else if (err.code === 'auth/email-already-in-use') message = 'Email is already in use.';
      else if (err.code === 'auth/invalid-email') message = 'Enter a valid email address.';
      else if (err.code === 'auth/weak-password') message = 'Password must be at least 8 characters.';
      else if (err.code === 'auth/network-request-failed') message = 'Network error. Try again.';
      else if (err.code === 'permission-denied') message = 'Firestore permissions are blocking signup.';
      else if (err.code === 'unavailable') message = 'Database temporarily unavailable. Try again.';
      setError(message);
    } finally { setSubmitting(false); }
  };

  const toggleMode = () => { setIsSignup((value) => !value); setError(''); setAgreedToTerms(false); };

  return (
    <div className="auth-shell"><section className="auth-panel">
      <div className="auth-brand"><img src="/logo-full.png" alt="Here" className="auth-logo-clean" /><p>Know Where To Go Before You Get There.</p></div>
      <div className="auth-heading"><h1>{isSignup ? 'Create Your Account' : 'Welcome Back'}</h1><p>{isSignup ? 'Check In. See What’s Live. Build Your Nightlife Stats.' : 'Log In To See What’s Happening Right Now.'}</p></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup ? <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="Enter Your Username" /></label> : null}
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoCapitalize="none" autoComplete="email" placeholder="you@email.com" /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="Enter Your Password" /></label>
        {isSignup ? <div className="signup-requirements" aria-label="Account Requirements"><div className="signup-requirements-title">Account Requirements</div><div className="requirement-row"><span className="requirement-dot" /><span><strong>Username:</strong> 5–15 Characters, Letters/Numbers/Underscores Only, With At Least 1 Number.</span></div><div className="requirement-row"><span className="requirement-dot" /><span><strong>Password:</strong> At Least 8 Characters.</span></div></div> : null}
        {isSignup ? <label className="legal-check"><input type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} /><span className="legal-check-copy">I Agree To The <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy Policy</Link>, And{' '}<Link to="/community-rules">Community Rules</Link>.</span></label> : null}
        {error ? <div className="error-banner">{error}</div> : null}
        <button className="primary-button auth-submit" disabled={submitting || (isSignup && !agreedToTerms)}>{submitting ? 'Please Wait…' : isSignup ? 'Create Account' : 'Log In'}</button>
      </form>
      <button className="text-button auth-switch" onClick={toggleMode}>{isSignup ? 'Already Have An Account? Log In' : 'New To Here? Create An Account'}</button>
      <div className="auth-footer-links"><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms</Link><Link to="/community-rules">Community Rules</Link><Link to="/support">Support</Link></div>
    </section></div>
  );
}
