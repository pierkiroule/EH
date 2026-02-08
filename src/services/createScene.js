import { supabase } from "../lib/supabase";
import {
  computeClimateVector,
  dominantClimate,
} from "../composer/climateVector";
import { composeScene } from "../composer/sceneComposer";

/**
 * Create ONE unique scene from a triad of emojis
 * - jamais bloquant
 * - nourrit l’inconscient collectif en arrière-plan
 * - garantit toujours une scène jouable
 */
export async function createScene({ emojis }) {
  /* ---------- GUARDS ---------- */

  if (!Array.isArray(emojis) || emojis.length !== 3) {
    throw new Error("createScene requires exactly 3 emojis");
  }

  /* ---------- TRIAD ---------- */

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

  /* ---------- MEMORY (FIRE & FORGET) ---------- */
  // nourrit les stats collectives sans jamais bloquer l’UX
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

    // fire-and-forget volontaire
    void Promise.all([...emojiCalls, ...pairCalls]).catch(() => {});
  } catch {
    // silence volontaire
  }

  /* ---------- CLIMATE ---------- */

  let climateVector;
  let climate;

  try {
    const { data: weights } = await supabase
      .from("emoji_climate_weights")
      .select("climate, weight")
      .in("emoji", emojis);

    if (weights && weights.length > 0) {
      climateVector = computeClimateVector(weights);
      climate = dominantClimate(climateVector);
    } else {
      // fallback total
      climateVector = {
        calm: 1,
        deep: 0,
        luminous: 0,
        tense: 0,
        contrast: 0,
      };
      climate = "calm";
    }
  } catch {
    climateVector = {
      calm: 1,
      deep: 0,
      luminous: 0,
      tense: 0,
      contrast: 0,
    };
    climate = "calm";
  }

  /* ---------- MEDIA ASSETS ---------- */

  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("enabled", true);

  if (assetsError || !assets || assets.length === 0) {
    throw new Error("No enabled media_assets available");
  }

  /* ---------- COMPOSE SCENE ---------- */

  const seed = Date.now() + Math.random();

  let sceneDescriptor;

  try {
    sceneDescriptor = composeScene({
      assets,
      climate,
      seed,
    });
  } catch (e) {
    // dernier filet de sécurité
    sceneDescriptor = composeScene({
      assets,
      climate: "calm",
      seed,
    });
  }

  /* ---------- SAVE SCENE ---------- */

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