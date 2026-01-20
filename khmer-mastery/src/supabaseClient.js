import { createClient } from '@supabase/supabase-js';

// 1. Считываем переменные
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

// 2. ДИАГНОСТИКА (Результат смотри в консоли браузера)
// Если тут будет false - значит файл .env не читается
console.log("-----------------------------------------");
console.log("🔹 [Supabase Init] Checking credentials...");
console.log("🔹 URL exists?", !!supabaseUrl);
console.log("🔹 Key exists?", !!supabaseKey);
console.log("-----------------------------------------");

// 3. Защита от "Белого экрана"
// Если ключей нет, мы не ломаем приложение молча, а говорим почему
if (!hasSupabaseConfig) {
  console.error("⛔ Supabase keys are missing! Check .env file.");
}

// 4. Инициализация
export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
