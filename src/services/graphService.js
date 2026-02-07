import { supabase } from "../lib/supabase";

/**
 * Fetch emoji graph (nodes + links)
 * Base = emoji_poles + emoji_collective_stats + emoji_cooccurrences
 */
export async function fetchEmojiGraph() {
  const { data: nodes, error: e1 } = await supabase
    .from("emoji_poles")
    .select(`
      emoji,
      domain,
      emoji_collective_stats (
        occurrences,
        weight
      )
    `)
    .eq("active", true);

  if (e1) throw e1;

  const { data: links, error: e2 } = await supabase
    .from("emoji_cooccurrences")
    .select("emoji_source, emoji_target, occurrences, weight");

  if (e2) throw e2;

  return {
    nodes: (nodes || []).map((n) => ({
      id: n.emoji,
      domain: n.domain,
      size: n.emoji_collective_stats?.occurrences || 1,
      weight: n.emoji_collective_stats?.weight || 0.5,
    })),
    links: (links || []).map((l) => ({
      source: l.emoji_source,
      target: l.emoji_target,
      weight: l.weight || 0.1,
    })),
  };
}
