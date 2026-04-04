import { createClient } from "@supabase/supabase-js";

const runtimeConfig = typeof window !== "undefined" ? window.__APP_CONFIG__ || {} : {};
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  runtimeConfig.VITE_SUPABASE_URL ||
  runtimeConfig.SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  runtimeConfig.VITE_SUPABASE_ANON_KEY ||
  runtimeConfig.SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !String(supabaseUrl).includes("placeholder")
);

let client;

if (!isSupabaseConfigured) {

  // Mock implementation to prevent "Failed to fetch" errors during fallback
  const _authError = { message: "Auth not configured — contact support." };
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      signUp: async () => ({ data: null, error: _authError }),
      signInWithPassword: async () => ({ data: null, error: _authError }),
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
export const hasSupabaseConfig = isSupabaseConfigured;

export function getAuthRedirectUrl(path = "/app") {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("aris_authenticated");
  localStorage.removeItem("sb-token");
  localStorage.removeItem("sb-user-id");
  localStorage.removeItem("sb-user-email");
}

export function syncAuthStorage(session) {
  if (typeof window === "undefined") return;

  if (!session?.user) {
    clearAuthStorage();
    return;
  }

  localStorage.setItem("aris_authenticated", "true");
  localStorage.setItem("sb-user-id", session.user.id || "");
  localStorage.setItem("sb-user-email", session.user.email || "");

  if (session.access_token) {
    localStorage.setItem("sb-token", session.access_token);
  } else {
    localStorage.removeItem("sb-token");
  }
}

/**
 * Premium Access Bridge
 * If the user has a valid institutional access key, we treat them as authenticated
 * even if Supabase isn't fully configured yet. This ensures the "10k MRR" vibe.
 */
export const checkInstitutionalAccess = (key) => {
  return key === import.meta.env.VITE_ACCESS_KEY;
};
