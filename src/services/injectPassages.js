import { supabase } from "../lib/supabase";

/**
 * Inject N symbolic passages into collective memory
 */
export async function injectPassages({ emojis, count = 1 }) {
  if (!Array.isArray(emojis) || emojis.length !== 3) {
    throw new Error("injectPassages requires exactly 3 emojis");
  }

  const pairs = [
    [emojis[0], emojis[1]],
    [emojis[0], emojis[2]],
    [emojis[1], emojis[2]],
  ];

  for (let i = 0; i < count; i++) {
    // occurrences
    await Promise.all(
      emojis.map((emoji) =>
        supabase.from("emoji_collective_stats").upsert(
          { emoji, occurrences: 1 },
          { onConflict: "emoji" }
        )
      )
    );

    // cooccurrences
    await Promise.all(
      pairs.map(([a, b]) =>
        supabase.from("emoji_cooccurrences").upsert(
          {
            emoji_source: a,
            emoji_target: b,
            occurrences: 1,
          },
          { onConflict: "emoji_source,emoji_target" }
        )
      )
    );
  }
}
