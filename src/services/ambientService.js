import { supabase } from "../lib/supabase";

/**
 * Pick most frequent ambient music (fallback safe)
 */
export async function fetchAmbientMusic() {
  const { data, error } = await supabase
    .from("media_assets")
    .select("path")
    .eq("category", "music")
    .eq("enabled", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error || !data?.length) return null;
  return data[0].path;
}
