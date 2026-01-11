import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader } from 'lucide-react';

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <h2 className="text-4xl font-bold mb-4">Welcome back</h2>
        <p className="text-gray-500 mb-10 text-center">You are authorized. Ready to continue?</p>
        <button
          onClick={() => navigate('/map')}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-5 px-12 rounded-2xl shadow-xl w-full max-w-xs transition-all transform active:scale-95 uppercase tracking-widest"
        >
          Go to Map
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-gray-900/50 rounded-[2.5rem] p-10 border border-white/5">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white tracking-tight">Sign <span className="text-cyan-400">In</span></h2>
        </div>

        {error && <div className="text-red-400 bg-red-900/20 p-4 rounded-xl mb-6 text-xs text-center border border-red-900/50">{error}</div>}

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-700"
            placeholder="Email address"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-700"
            placeholder="Password"
          />
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
    </div>
  );
}