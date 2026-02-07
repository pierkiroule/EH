import { supabase } from "../lib/supabase";
import {
  computeClimateVector,
  dominantClimate,
} from "../composer/climateVector";
import { composeScene } from "../composer/sceneComposer";

/**
 * Create ONE scene from exactly 3 emojis
 * - conforme à la base existante
 * - robuste (fallbacks)
 */
export async function createScene({ emojis }) {
  if (!Array.isArray(emojis) || emojis.length !== 3) {
    throw new Error("createScene requires exactly 3 emojis");
  }

  /* ---------- 1. créer le triad ---------- */
  const { data: triad, error: triadError } = await supabase
    .from("triads")
    .insert({
      emoji_1: emojis[0],
      emoji_2: emojis[1],
      emoji_3: emojis[2],
    })
    .select()
    .single();

  if (triadError) {
    throw new Error(triadError.message);
  }

  /* ---------- 2. récupérer les poids climat ---------- */
  const { data: weights, error: weightsError } = await supabase
    .from("emoji_climate_weights")
    .select("climate, weight")
    .in("emoji", emojis);

  if (weightsError) {
    throw new Error(weightsError.message);
  }

  const climateVector = computeClimateVector(weights || []);
  const climate =
    dominantClimate(climateVector) || "calm";

  /* ---------- 3. charger le catalogue média ---------- */
  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("enabled", true);

  if (assetsError) {
    throw new Error(assetsError.message);
  }

  if (!assets || assets.length === 0) {
    throw new Error("No media assets available");
  }

  /* ---------- 4. composer la scène ---------- */
  const sceneDescriptor = composeScene({
    assets,
    climate,
  });

  if (!sceneDescriptor) {
    throw new Error("composeScene returned null");
  }

  /* ---------- 5. persister la scène ---------- */
  const { data: scene, error: sceneError } = await supabase
    .from("scenes")
    .insert({
      triad_id: triad.id,
      climate_vector: climateVector,
      scene_descriptor: sceneDescriptor,
    })
    .select()
    .single();

  if (sceneError) {
    throw new Error(sceneError.message);
  }

  return scene;
}