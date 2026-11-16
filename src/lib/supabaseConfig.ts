// Reads the Supabase settings. Kept apart from the client itself so the app
// can ask "is sync set up?" without loading the Supabase library.

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
// The publishable key (sb_publishable_...). The older variable name is still read
// so an existing .env.local keeps working.
const key = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim()

// A secret key must never ship in a browser bundle, and Supabase rejects it there anyway.
const isSecretKey = key?.startsWith('sb_secret_') ?? false

export const supabaseUrl = url
export const supabaseKey = key

// Why sync is unavailable, in words, or null when it is set up.
export const supabaseProblem: string | null = !url || !key
  ? "Supabase isn't configured. Copy .env.example to .env.local and add your project URL and publishable key."
  : isSecretKey
    ? 'The key in .env.local is a secret key. Use the publishable key (it starts with sb_publishable_).'
    : null

export const supabaseConfigured = supabaseProblem === null
