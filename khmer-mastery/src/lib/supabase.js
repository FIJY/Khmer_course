import { createClient } from '@supabase/supabase-js'

// В Vite мы используем import.meta.env, а не process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("🚨 Ошибка: Не найдены ключи Supabase в .env файле!")
}

export const supabase = createClient(supabaseUrl, supabaseKey)