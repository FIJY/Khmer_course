import { createClient } from '@supabase/supabase-js'

// Берем ключи из "сейфа" (Environment Variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Создаем и экспортируем подключение
export const supabase = createClient(supabaseUrl, supabaseAnonKey)