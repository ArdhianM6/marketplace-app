// Client Supabase untuk dipakai di komponen React (browser).
// Pakai anon key -> aman dipakai di frontend karena dibatasi Row Level Security.
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
