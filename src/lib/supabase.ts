import { createClient } from '@supabase/supabase-js'
import { supabaseConfigured, supabaseKey, supabaseUrl } from './supabaseConfig'

// Only import this file with a dynamic import(): it pulls in the Supabase
// library, which is loaded on demand so it never delays the first screen.
// The publishable key is safe in the browser; row-level security protects the data.
if (!supabaseConfigured) throw new Error('Supabase is not configured')

export const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: { persistSession: true, autoRefreshToken: true },
})
