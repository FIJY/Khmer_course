import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null); // Сохраняем сессию локально
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ПРОВЕРЯЕМ СЕССИЮ, НО НЕ ДЕЛАЕМ АВТО-ПЕРЕХОД
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    setLoading(false);
    // После входа кнопка "Перейти к карте" появится сама
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert('Проверьте почту или входите сразу (если подтверждение отключено)');
    setLoading(false);
  };

  // ЕСЛИ МЫ ЗАЛОГИНЕНЫ — ПОКАЗЫВАЕМ БЕЗОПАСНЫЙ ЭКРАН
  if (session) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
        <h2 className="text-2xl text-emerald-400 mb-4">Вы уже вошли!</h2>
        <p className="text-gray-400 mb-8 text-center">Бесконечный цикл остановлен. Нажмите кнопку ниже.</p>
        <button
          onClick={() => navigate('/map')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg w-full max-w-xs"
        >
          ПЕРЕЙТИ К КАРТЕ ВРУЧНУЮ
        </button>
      </div>
    );
  }

  // ОБЫЧНАЯ ФОРМА ВХОДА
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-emerald-400">Вход</h2>
        </div>

        {error && <div className="text-red-500 bg-red-900/20 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700"
              placeholder="Email"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700"
              placeholder="Пароль"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-lg">
              {loading ? <Loader className="animate-spin mx-auto" /> : 'Войти'}
            </button>
            <button type="button" onClick={handleSignUp} disabled={loading} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}