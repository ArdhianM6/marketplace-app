// Client Supabase khusus server (API routes), pakai service role key.
// PENTING: file ini hanya boleh dipakai di kode server (app/api/**), tidak boleh
// pernah diimpor di komponen React yang jalan di browser, karena service role key
// bisa bypass semua Row Level Security.
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
