/**
 * SceneComposer V3 — CANONICAL & STABLE
 * - shader réellement persisté
 * - aucun preset
 * - compatible avec ton Scene.jsx actuel
 */

function seededRandom(seed) {
  let t = Number.isFinite(seed)
    ? Math.floor(seed)
    : Math.floor(Date.now() + Math.random() * 1e9);

  t = t % 2147483647;
  if (t <= 0) t += 2147483646;

  return () => (t = (t * 16807) % 2147483647) / 2147483647;
}

function pickOne(list, rand) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rand() * list.length)];
}

function pickMany(list, count, rand) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const n = Math.max(1, Math.min(count, list.length));
  return [...list].sort(() => rand() - 0.5).slice(0, n);
}

function pool(assets, category, climate) {
  const primary = assets.filter(
    (a) =>
      a &&
      a.enabled === true &&
      a.category === category &&
      a.climate === climate
  );

  if (primary.length) return primary;

  return assets.filter(
    (a) => a && a.enabled === true && a.category === category
  );
}

export function composeScene({ assets, climate = "calm", seed }) {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error("composeScene: assets missing");
  }

  const rand = seededRandom(seed);
  const duration = 180;

  /* ---------- MUSIC ---------- */
  const music = pickOne(pool(assets, "music", climate), rand);
  if (!music) throw new Error("composeScene: no music");

  /* ---------- VIDEO ---------- */
  const videos = pickMany(pool(assets, "video", climate), 1, rand).map((v) => ({
    id: v.id,
    path: v.path,
    start: 0,
    end: duration,
  }));

  /* ---------- VOICES (test rapide) ---------- */
  const voices = pickMany(pool(assets, "voice", climate), 1, rand).map((v) => ({
    id: v.id,
    path: v.path,
    start: Math.floor(rand() * 6), // volontairement tôt
    gain: 0.8,
  }));

  /* ---------- TEXTS ---------- */
  const texts = pickMany(pool(assets, "text", climate), 1, rand).map((t) => ({
    id: t.id,
    path: t.path,
    start: Math.floor(rand() * 6),
    duration: 6,
  }));

  /* ---------- SHADER (clé du bug) ---------- */
  const shader = pickOne(pool(assets, "shader", climate), rand);

  const fx = [
    {
      type: "particles",
      shader: shader ? shader.path : null,
      intensity: 0.6,
    },
  ];

  /* ---------- FINAL DESCRIPTOR ---------- */
  return {
    duration,
    climate,
    seed,
    music: {
      id: music.id,
      path: music.path,
    },
    videos,
    voices,
    texts,
    fx,
  };
}