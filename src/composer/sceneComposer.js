/**
 * Scene Composer V3 — ROBUSTE
 *
 * Garanties (si le catalogue contient au moins 1 asset de chaque catégorie) :
 * - toujours musique
 * - toujours ≥ 1 vidéo
 * - toujours ≥ 1 voix
 * - toujours ≥ 1 texte
 * - seed-based (rejouable)
 * - fallback explicite
 */

/* ---------- seeded random (stable) ---------- */
function seededRandom(seed) {
  // seed must be integer-ish
  let t = Math.floor(Number(seed) || Date.now()) % 2147483647;
  if (t <= 0) t += 2147483646;
  return () => (t = (t * 16807) % 2147483647) / 2147483647;
}

/* ---------- utils ---------- */
function pickOne(list, rand) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rand() * list.length)];
}

function pickMany(list, count, rand) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const n = Math.max(0, Math.min(count, list.length));
  const shuffled = [...list].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

function ensurePool(assets, { category, climate }) {
  const primary = assets.filter(
    (a) =>
      a &&
      a.enabled === true &&
      a.category === category &&
      a.climate === climate
  );

  if (primary.length) return { pool: primary, mode: "primary" };

  const any = assets.filter(
    (a) => a && a.enabled === true && a.category === category
  );

  if (any.length) return { pool: any, mode: "fallback:any" };

  return { pool: [], mode: "missing" };
}

/* ---------- composer ---------- */
export function composeScene({ assets, climate = "calm", seed }) {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error("composeScene: no assets");
  }

  const effectiveClimate = climate || "calm";
  const rand = seededRandom(seed);

  // V1/V3: durée fixe (simple, stable)
  const duration = 180;

  /* ---------- MUSIC (OBLIGATOIRE) ---------- */
  const musicPoolInfo = ensurePool(assets, {
    category: "music",
    climate: effectiveClimate,
  });

  const music = pickOne(musicPoolInfo.pool, rand);
  if (!music) {
    throw new Error("composeScene: missing music in media_assets (enabled=true)");
  }

  /* ---------- VIDEO (≥1) ---------- */
  const videoPoolInfo = ensurePool(assets, {
    category: "video",
    climate: effectiveClimate,
  });

  if (videoPoolInfo.pool.length === 0) {
    throw new Error("composeScene: missing video in media_assets (enabled=true)");
  }

  const videos = pickMany(videoPoolInfo.pool, 1, rand).map((v) => ({
    id: v.id,
    path: v.path,
    start: 0,
    end: duration,
    opacity: 1,
    blend: "normal",
    picked_from: videoPoolInfo.mode,
  }));

  /* ---------- VOICES (≥1) ---------- */
  const voicePoolInfo = ensurePool(assets, {
    category: "voice",
    climate: effectiveClimate,
  });

  if (voicePoolInfo.pool.length === 0) {
    throw new Error("composeScene: missing voice in media_assets (enabled=true)");
  }

  const voicesCount = 1 + Math.floor(rand() * 2); // 1..2
  const voices = pickMany(voicePoolInfo.pool, voicesCount, rand).map((v) => ({
    id: v.id,
    path: v.path,
    start: Math.floor(rand() * duration * 0.2),
    gain: Number((0.55 + rand() * 0.25).toFixed(2)),
    picked_from: voicePoolInfo.mode,
  }));

  /* ---------- TEXTS (≥1) ---------- */
  const textPoolInfo = ensurePool(assets, {
    category: "text",
    climate: effectiveClimate,
  });

  if (textPoolInfo.pool.length === 0) {
    throw new Error("composeScene: missing text in media_assets (enabled=true)");
  }

  const textsCount = 1 + Math.floor(rand() * 2); // 1..2
  const texts = pickMany(textPoolInfo.pool, textsCount, rand).map((t) => ({
    id: t.id,
    path: t.path,
    start: Math.floor(rand() * duration * 0.6),
    duration: 6 + Math.floor(rand() * 6), // 6..11
    picked_from: textPoolInfo.mode,
  }));

  /* ---------- FX ---------- */
  const fx = [
    {
      type: "particles",
      preset: effectiveClimate,
      intensity: Number((0.4 + rand() * 0.4).toFixed(2)),
    },
  ];

  /* ---------- FINAL ---------- */
  return {
    duration,
    climate: effectiveClimate,
    seed: Number(seed) || null,
    music: {
      id: music.id,
      path: music.path,
      picked_from: musicPoolInfo.mode,
    },
    videos,
    voices,
    texts,
    fx,
  };
}
