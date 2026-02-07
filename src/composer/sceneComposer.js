/**
 * Scene Composer V1
 * - pure logic
 * - seed-based uniqueness
 */

/* -------- seeded random -------- */

function seededRandom(seed) {
  let t = seed % 2147483647;
  return () => (t = (t * 16807) % 2147483647) / 2147483647;
}

/* -------- utils -------- */

function pickOne(list, rand) {
  if (!list.length) return null;
  return list[Math.floor(rand() * list.length)];
}

function pickMany(list, max, rand) {
  const shuffled = [...list].sort(() => rand() - 0.5);
  return shuffled.slice(0, max);
}

function spreadOver(items, duration, rand) {
  return items.map((item) => ({
    ...item,
    start: Math.floor(rand() * duration * 0.8),
  }));
}

/* -------- composer -------- */

export function composeScene({ assets, climate, seed }) {
  const rand = seededRandom(seed);

  /* --- pools --- */
  const musicPool = assets.filter(
    (a) => a.category === "music" && a.climate === climate
  );

  const videoPool = assets.filter(
    (a) => a.category === "video" && a.climate === climate
  );

  const voicePool = assets.filter(
    (a) => a.category === "voice" && a.climate === climate
  );

  const music = pickOne(musicPool, rand);
  if (!music) throw new Error("No music for climate " + climate);

  if (!videoPool.length) {
    throw new Error("No video for climate " + climate);
  }

  const duration = music.duration || 180;

  const videos = pickMany(videoPool, 1 + Math.floor(rand() * 2), rand).map(
    (v) => ({
      id: v.id,
      path: v.path,
      start: 0,
      end: duration,
      opacity: 1,
      blend: "normal",
    })
  );

  const voices = spreadOver(
    pickMany(voicePool, 1 + Math.floor(rand() * 3), rand),
    duration,
    rand
  ).map((v) => ({
    id: v.id,
    path: v.path,
    start: v.start,
    gain: 0.5 + rand() * 0.3,
  }));

  const fx = [
    {
      type: "particles",
      preset: climate,
      intensity: 0.3 + rand() * 0.5,
    },
  ];

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
