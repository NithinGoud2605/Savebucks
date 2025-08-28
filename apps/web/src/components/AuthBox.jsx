import React from 'react';
import { supa } from '../lib/supa';

export default function AuthBox() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [showSignUp, setShowSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    supa.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithEmail() {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setEmail('');
      setPassword('');
      setShowSignUp(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supa.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      setMessage('Check your email for confirmation link!');
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    try {
      await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      await supa.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600 hidden md:inline">
          {user.email} {!user.email_confirmed_at && '(unconfirmed)'}
        </span>
        <button 
          onClick={signOut} 
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    );
  }

  if (showSignUp) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-lg min-w-[280px]">
        <h3 className="font-semibold text-sm">Sign up</h3>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded"
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded"
        />
        {message && <div className="text-xs text-red-600">{message}</div>}
        <div className="flex gap-2">
          <button
            onClick={signUpWithEmail}
            disabled={loading || !email || password.length < 6}
            className="flex-1 px-3 py-1.5 text-sm rounded bg-zinc-900 text-white disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
          <button
            onClick={() => setShowSignUp(false)}
            className="px-3 py-1.5 text-sm rounded bg-zinc-100"
          >
            Cancel
          </button>
        </div>
        <div className="text-xs text-zinc-500 text-center">or</div>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-lg min-w-[280px]">
      <h3 className="font-semibold text-sm">Sign in</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded"
      />
      {message && <div className="text-xs text-red-600">{message}</div>}
      <div className="flex gap-2">
        <button
          onClick={signInWithEmail}
          disabled={loading || !email || !password}
          className="flex-1 px-3 py-1.5 text-sm rounded bg-zinc-900 text-white disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <button
          onClick={() => setShowSignUp(true)}
          className="px-3 py-1.5 text-sm rounded bg-zinc-100"
        >
          Sign up
        </button>
      </div>
      <div className="text-xs text-zinc-500 text-center">or</div>
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
      >
        Continue with Google
      </button>
    </div>
  );
}
