/**
 * Scene Composer — V1 BLINDÉ
 * - jamais de blocage
 * - fallback intelligent
 * - compatible mobile
 * - aligné schema Supabase
 */

/* ------------------ utils ------------------ */

function pickOne(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function pickMany(list, max = 1) {
  if (!list || list.length === 0) return [];
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, max);
}

function spreadOver(items, duration, minGap = 20) {
  if (!items || items.length === 0) return [];

  const step = Math.max(minGap, duration / (items.length + 1));

  return items.map((item, i) => ({
    ...item,
    start: Math.round((i + 1) * step),
  }));
}

/* ------------------ composer ------------------ */

export function composeScene({ assets, climate }) {
  if (!assets || assets.length === 0) {
    throw new Error("No media assets provided");
  }

  /* ---------- MUSIC (maîtresse) ---------- */

  const musicPrimary = assets.filter(
    (a) =>
      a.category === "music" &&
      a.climate === climate &&
      a.enabled
  );

  let music = pickOne(musicPrimary);

  // 🔥 FALLBACK 1 — calm
  if (!music) {
    const calmPool = assets.filter(
      (a) =>
        a.category === "music" &&
        a.climate === "calm" &&
        a.enabled
    );
    music = pickOne(calmPool);
  }

  // 🔥 FALLBACK 2 — any music
  if (!music) {
    const anyMusic = assets.filter(
      (a) =>
        a.category === "music" &&
        a.enabled
    );
    music = pickOne(anyMusic);
  }

  if (!music) {
    throw new Error("No music available in media_assets");
  }

  // V1 durée fixe (simplification volontaire)
  const duration = 180;

  /* ---------- VIDEO ---------- */

  const videoPrimary = assets.filter(
    (a) =>
      a.category === "video" &&
      a.climate === climate &&
      a.enabled
  );

  let videos = pickMany(videoPrimary, 1);

  // fallback vidéo
  if (videos.length === 0) {
    const anyVideo = assets.filter(
      (a) =>
        a.category === "video" &&
        a.enabled
    );
    videos = pickMany(anyVideo, 1);
  }

  videos = videos.map((v) => ({
    id: v.id,
    path: v.path,
    start: 0,
    end: duration,
    opacity: 1,
    blend: "normal",
  }));

  /* ---------- VOICES ---------- */

  const voicePrimary = assets.filter(
    (a) =>
      a.category === "voice" &&
      a.climate === climate &&
      a.enabled
  );

  let voicesRaw = pickMany(voicePrimary, 3);

  // fallback voix
  if (voicesRaw.length === 0) {
    const anyVoice = assets.filter(
      (a) =>
        a.category === "voice" &&
        a.enabled
    );
    voicesRaw = pickMany(anyVoice, 2);
  }

  const voices = spreadOver(
    voicesRaw.map((v) => ({
      id: v.id,
      path: v.path,
      gain: 0.6,
    })),
    duration
  );

  /* ---------- FX ---------- */

  const fx = [
    {
      type: "particles",
      preset: climate || "calm",
    },
  ];

  /* ---------- FINAL DESCRIPTOR ---------- */

  return {
    duration,
    climate,
    music: {
      id: music.id,
      path: music.path,
    },
    videos,
    voices,
    fx,
  };
}