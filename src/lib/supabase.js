import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
// If the environment variables are missing (e.g. initial setup), we provide safe fallbacks
// to prevent the application from crashing while the user configures their project.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Premium Access Bridge
 * If the user has a valid institutional access key, we treat them as authenticated
 * even if Supabase isn't fully configured yet. This ensures the "10k MRR" vibe.
 */
export const checkInstitutionalAccess = (key) => {
  return key === import.meta.env.VITE_ACCESS_KEY;
};
