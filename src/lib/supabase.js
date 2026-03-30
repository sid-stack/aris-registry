import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
// If the environment variables are missing (e.g. initial setup), we provide safe fallbacks
// to prevent the application from crashing while the user configures their project.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {

  // Mock implementation to prevent "Failed to fetch" errors during fallback
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;

/**
 * Premium Access Bridge
 * If the user has a valid institutional access key, we treat them as authenticated
 * even if Supabase isn't fully configured yet. This ensures the "10k MRR" vibe.
 */
export const checkInstitutionalAccess = (key) => {
  return key === import.meta.env.VITE_ACCESS_KEY;
};
