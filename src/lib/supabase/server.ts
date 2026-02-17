export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  // TODO: @supabase/supabase-js 설치 후 createClient(url, serviceKey)로 교체
  return null;
}
