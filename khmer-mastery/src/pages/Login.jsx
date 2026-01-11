import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Если пользователь уже вошел — сразу кидаем на карту
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/map');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/map');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Пробуем войти
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    // Если ошибок нет, useEffect выше сам перекинет на карту
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    // 2. Регистрируемся
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // В зависимости от настроек Supabase, это может сразу залогинить
      alert('Регистрация успешна! Если вход не произошел автоматически, проверьте почту.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-emerald-400">Вход</h2>
          <p className="text-gray-400 mt-2">Продолжите обучение кхмерскому</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="vasha@pochta.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-all flex justify-center items-center disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin" /> : 'Войти'}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}