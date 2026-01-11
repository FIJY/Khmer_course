import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // РЕГИСТРАЦИЯ
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: nickname } }
        });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        // ВХОД
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/map');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-sm space-y-10">
        <header className="text-center">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter italic">
            Khmer <span className="text-cyan-400">Mastery</span>
          </h1>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mt-4">
            {isSignUp ? 'Create your account' : 'Welcome back, student'}
          </p>
        </header>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
              <input
                type="text" placeholder="NICKNAME" required
                value={nickname} onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold focus:border-cyan-500 outline-none transition-all uppercase"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
            <input
              type="email" placeholder="EMAIL ADDRESS" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
            <input
              type="password" placeholder="PASSWORD" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-5 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-cyan-500/20"
          >
            {loading ? 'Processing...' : isSignUp ? 'Begin Journey' : 'Continue Learning'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-cyan-400 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : "New student? Create Account"}
        </button>
      </div>
    </div>
  );
}