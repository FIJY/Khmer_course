import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Если пользователь уже вошел, кидаем его на Карту
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/map');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Welcome to Khmer Mastery
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10B981', // Наш фирменный зеленый
                  brandAccent: '#059669',
                },
              },
            },
          }}
          theme="dark"
          providers={[]} // Пока только Email/Password
        />
      </div>
    </div>
  );
}