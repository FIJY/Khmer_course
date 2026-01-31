import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAction = async (type) => {
    setLoading(true);
    setError(null);
    const { error } = type === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) setError(error.message);
    else if (type === 'signup') alert('Check your email to confirm!');
    setLoading(false);
  };

  if (session) {
    return (
      <MobileLayout withNav={false} contentClassName="flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Khmer Mastery</p>
            <h2 className="text-4xl font-bold mt-3">Welcome back</h2>
            <p className="text-gray-500 mt-3">You are authorized. Ready to continue?</p>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-5 px-12 rounded-2xl shadow-xl w-full transition-all transform active:scale-95 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-black"
          >
            Go to Map
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout withNav={false} contentClassName="flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gradient-to-b from-gray-900/70 via-gray-900/40 to-black/60 rounded-[2.5rem] p-10 border border-white/10 shadow-[0_25px_60px_-35px_rgba(34,211,238,0.35)]">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Khmer Mastery</p>
          <h2 className="text-3xl font-bold text-white tracking-tight mt-3">Sign <span className="text-cyan-400">In</span></h2>
          <p className="text-sm text-gray-500 mt-3">Continue your Khmer learning path.</p>
        </div>

        {error && <div className="text-red-400 bg-red-900/20 p-4 rounded-xl mb-6 text-xs text-center border border-red-900/50">{error}</div>}

        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-[0.3em] text-gray-500">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-2 w-full bg-black/80 text-white px-6 py-5 rounded-2xl border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all placeholder:text-gray-700"
              placeholder="Email address"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.3em] text-gray-500">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full bg-black/80 text-white px-6 py-5 rounded-2xl border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all placeholder:text-gray-700"
              placeholder="Password"
            />
          </label>
          <div className="flex flex-col gap-4 pt-4">
            <button onClick={() => handleAction('login')} disabled={loading} className="w-full bg-cyan-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95">
              {loading ? <Loader className="animate-spin mx-auto" /> : 'Login'}
            </button>
            <button onClick={() => handleAction('signup')} className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">
              Create a new account
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
