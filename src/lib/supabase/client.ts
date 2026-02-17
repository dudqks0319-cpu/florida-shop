export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  // TODO: @supabase/supabase-js 설치 후 createClient(url, anon)으로 교체
  return null;
}
