import { createClient } from '@supabase/supabase-js';

// 🔧 SUBSTITUA COM SUAS CREDENCIAIS DO SUPABASE
// Vá em: Supabase Dashboard → Project Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);