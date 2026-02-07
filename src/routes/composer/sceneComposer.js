/**
 * Scene Composer V2
 * - pure logic
 * - seed-based uniqueness
 * - tag-based soft scoring
 */

/* ---------- seeded random ---------- */
function seededRandom(seed) {
  let t = seed % 2147483647;
  return () => (t = (t * 16807) % 2147483647) / 2147483647;
}

/* ---------- utils ---------- */
function pickOne(list, rand) {
  if (!list.length) return null;
  return list[Math.floor(rand() * list.length)];
}

function pickMany(list, max, rand) {
  const shuffled = [...list].sort(() => rand() - 0.5);
  return shuffled.slice(0, max);
}

/* ---------- tag scoring ---------- */
function scoreAsset(asset, emojiTags) {
  if (!asset.tags || !emojiTags?.length) return 1;
  const matches = asset.tags.filter((t) =>
    emojiTags.includes(t)
  ).length;
  return 1 + matches; // biais doux
}

function weightedPool(assets, emojiTags) {
  const pool = [];
  assets.forEach((a) => {
    const weight = scoreAsset(a, emojiTags);
    for (let i = 0; i < weight; i++) pool.push(a);
  });
  return pool;
}

/* ---------- composer ---------- */
export function composeScene({ assets, climate, seed, emojiTags = [] }) {
  const rand = seededRandom(seed);

  /* --- pools filtrés par climat --- */
  const musicPool = assets.filter(
    (a) => a.category === "music" && a.climate === climate
  );
  const videoPool = assets.filter(
    (a) => a.category === "video" && a.climate === climate
  );
  const voicePool = assets.filter(
    (a) => a.category === "voice" && a.climate === climate
  );

  /* --- scoring doux par tags --- */
  const scoredMusic = weightedPool(musicPool, emojiTags);
  const scoredVideo = weightedPool(videoPool, emojiTags);
  const scoredVoice = weightedPool(voicePool, emojiTags);

  /* --- musique maîtresse --- */
  const music = pickOne(scoredMusic, rand);
  if (!music) throw new Error("No music for climate " + climate);

  const duration = music.duration || 180;

  /* --- vidéos --- */
  const videos = pickMany(
    scoredVideo,
    1 + Math.floor(rand() * 2),
    rand
  ).map((v) => ({
    id: v.id,
    path: v.path,
    start: 0,
    end: duration,
    opacity: 1,
    blend: "normal",
  }));

  /* --- voix --- */
  const voices = pickMany(
    scoredVoice,
    1 + Math.floor(rand() * 3),
    rand
  ).map((v) => ({
    id: v.id,
    path: v.path,
    start: Math.floor(rand() * duration * 0.8),
    gain: 0.5 + rand() * 0.3,
  }));

  /* --- fx --- */
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