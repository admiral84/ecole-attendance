

// lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.SUPABASE_URL
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey)