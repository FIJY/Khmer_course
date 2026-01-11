import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader, ChevronRight } from 'lucide-react';

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert('Success! Please check your email to confirm registration.');
    setLoading(false);
  };

  if (session) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
            <ChevronRight className="text-emerald-400" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
        <p className="text-gray-400 mb-10 text-center">You are already logged in. Your progress is saved.</p>
        <button
          onClick={() => navigate('/map')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-10 rounded-[2rem] shadow-xl w-full max-w-xs transition-all transform active:scale-95 uppercase tracking-widest"
        >
          Go to Course Map
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-[2.5rem] shadow-2xl p-10 border border-gray-700/50">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white tracking-tighter">SIGN <span className="text-emerald-400">IN</span></h2>
          <p className="text-gray-500 mt-2 font-medium uppercase tracking-widest text-xs">Join the mastery</p>
        </div>

        {error && <div className="text-red-400 bg-red-900/20 border border-red-900/50 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900/50 text-white pl-12 pr-4 py-4 rounded-2xl border border-gray-700 focus:border-emerald-500 outline-none transition-all"
              placeholder="Email address"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 text-white pl-12 pr-4 py-4 rounded-2xl border border-gray-700 focus:border-emerald-500 outline-none transition-all"
              placeholder="Password"
            />
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest">
              {loading ? <Loader className="animate-spin mx-auto" size={24} /> : 'Login'}
            </button>
            <button type="button" onClick={handleSignUp} disabled={loading} className="w-full bg-transparent text-gray-400 hover:text-white font-bold py-2 transition-all text-sm">
              New here? <span className="text-emerald-500">Create an account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}