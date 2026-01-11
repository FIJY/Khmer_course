import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader, ArrowRight, UserPlus } from 'lucide-react';

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
    else if (type === 'signup') alert('Check your email for confirmation!');
    setLoading(false);
  };

  if (session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30 animate-pulse">
            <ArrowRight className="text-emerald-400" size={40} />
        </div>
        <h2 className="text-4xl font-black mb-2 tracking-tighter">ACCESS GRANTED</h2>
        <p className="text-gray-500 mb-12 text-center font-medium">Your learning vault is ready.</p>
        <button
          onClick={() => navigate('/map')}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 px-12 rounded-2xl shadow-2xl w-full max-w-xs transition-all transform active:scale-95 uppercase tracking-[0.2em] text-sm"
        >
          Enter Course Map
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Member <span className="text-emerald-400">Portal</span></h2>
          <p className="text-gray-600 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">Verify your credentials</p>
        </div>

        {error && <div className="text-red-400 bg-red-900/10 border border-red-500/20 p-4 rounded-xl mb-6 text-xs font-bold text-center">{error}</div>}

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-5 text-gray-600" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black text-white pl-14 pr-6 py-5 rounded-2xl border border-white/5 focus:border-emerald-500/50 outline-none transition-all font-medium placeholder:text-gray-700"
              placeholder="Email address"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-5 text-gray-600" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black text-white pl-14 pr-6 py-5 rounded-2xl border border-white/5 focus:border-emerald-500/50 outline-none transition-all font-medium placeholder:text-gray-700"
              placeholder="Secure password"
            />
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <button
              onClick={() => handleAction('login')}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-[0.2em] text-sm flex items-center justify-center"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'Authorize Login'}
            </button>
            <button
              onClick={() => handleAction('signup')}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-black py-5 rounded-2xl transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2"
            >
              <UserPlus size={14} /> Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}