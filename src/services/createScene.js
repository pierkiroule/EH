import { supabase } from "../lib/supabase";
import {
  computeClimateVector,
  dominantClimate,
} from "../composer/climateVector";
import { composeScene } from "../composer/sceneComposer";

/**
 * Create ONE unique scene from a tiercé d'émojis
 * - always INSERT (no reuse)
 * - seed-based uniqueness
 * - climate-driven
 * - tag-oriented
 */
export async function createScene({ emojis }) {
  if (!Array.isArray(emojis) || emojis.length !== 3) {
    throw new Error("createScene requires exactly 3 emojis");
  }

  /* ---------- seed unique ---------- */
  const seed = Date.now() + Math.random();

  /* ---------- store triad ---------- */
  const { data: triad, error: triadError } = await supabase
    .from("triads")
    .insert({
      emoji_1: emojis[0],
      emoji_2: emojis[1],
      emoji_3: emojis[2],
    })
    .select()
    .single();

  if (triadError) throw triadError;

  /* ---------- fetch climate weights ---------- */
  const { data: weights, error: weightsError } = await supabase
    .from("emoji_climate_weights")
    .select("climate, weight")
    .in("emoji", emojis);

  if (weightsError) throw weightsError;

  const climateVector = computeClimateVector(weights);
  const climate = dominantClimate(climateVector);

  /* ---------- fetch media catalogue ---------- */
  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("enabled", true);

  if (assetsError) throw assetsError;

  /* ---------- emoji tags (V1 minimal) ---------- */
  // V1 : on utilise les emojis eux-mêmes comme tags faibles
  // (compatible avec tags médias, sans nouvelle table)
  const emojiTags = emojis;

  /* ---------- compose scene ---------- */
  const sceneDescriptor = composeScene({
    assets,
    climate,
    seed,
    emojiTags,
  });

  /* ---------- persist scene ---------- */
  const { data: scene, error: sceneError } = await supabase
    .from("scenes")
    .insert({
      triad_id: triad.id,
      climate_vector: climateVector,
      scene_descriptor: {
        ...sceneDescriptor,
        seed,
      },
    })
    .select()
    .single();

  if (sceneError) throw sceneError;

  return scene;
}