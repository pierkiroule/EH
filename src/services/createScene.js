import { supabase } from "../lib/supabase";
import {
  computeClimateVector,
  dominantClimate,
} from "../composer/climateVector";
import { composeScene } from "../composer/sceneComposer";

/**
 * Create ONE unique scene from a triad of emojis
 * - UX non bloquante
 * - mémoire collective en arrière-plan
 */
export async function createScene({ emojis }) {
  if (!Array.isArray(emojis) || emojis.length !== 3) {
    throw new Error("createScene requires exactly 3 emojis");
  }

  /* ---------- TRIAD ---------- */
  const { data: triad, error: e1 } = await supabase
    .from("triads")
    .insert({
      emoji_1: emojis[0],
      emoji_2: emojis[1],
      emoji_3: emojis[2],
    })
    .select()
    .single();

  if (e1) throw e1;

  /* ---------- MEMORY (NON BLOQUANT) ---------- */
  try {
    const emojiCalls = emojis.map((emoji) =>
      supabase.rpc("increment_emoji_stat", { p_emoji: emoji })
    );

    const pairs = [
      [emojis[0], emojis[1]],
      [emojis[0], emojis[2]],
      [emojis[1], emojis[2]],
    ];

    const pairCalls = pairs.map(([a, b]) =>
      supabase.rpc("increment_emoji_cooccurrence", {
        p_source: a,
        p_target: b,
      })
    );

    Promise.all([...emojiCalls, ...pairCalls]).catch(() => {});
  } catch {
    // silence volontaire
  }

  /* ---------- CLIMATE ---------- */
  const { data: weights } = await supabase
    .from("emoji_climate_weights")
    .select("climate, weight")
    .in("emoji", emojis);

  const climateVector =
    weights && weights.length
      ? computeClimateVector(weights)
      : { calm: 1, deep: 0, luminous: 0, tense: 0, contrast: 0 };

  const climate = dominantClimate(climateVector);

  /* ---------- ASSETS ---------- */
  const { data: assets, error: e3 } = await supabase
    .from("media_assets")
    .select("*")
    .eq("enabled", true);

  if (e3) throw e3;

  /* ---------- COMPOSE ---------- */
  const seed = Date.now() + Math.random();

  const sceneDescriptor = composeScene({
    assets,
    climate,
    seed,
  });

  /* ---------- SAVE SCENE ---------- */
  const { data: scene, error: e4 } = await supabase
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

  if (e4) throw e4;

  return scene;
}