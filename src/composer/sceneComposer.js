/**
 * Scene Composer — V1 BLINDÉ
 * jamais bloquant
 */

function pickOne(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function pickMany(list, max = 1) {
  if (!list || list.length === 0) return [];
  return [...list].sort(() => 0.5 - Math.random()).slice(0, max);
}

function spreadOver(items, duration, minGap = 20) {
  if (!items || items.length === 0) return [];
  const step = Math.max(minGap, duration / (items.length + 1));
  return items.map((item, i) => ({
    ...item,
    start: Math.round((i + 1) * step),
  }));
}

export function composeScene({ assets, climate }) {
  if (!assets || assets.length === 0) {
    throw new Error("No media assets");
  }

  /* MUSIC */
  let music =
    pickOne(assets.filter(a => a.category === "music" && a.climate === climate && a.enabled)) ||
    pickOne(assets.filter(a => a.category === "music" && a.enabled));

  if (!music) throw new Error("No music available");

  const duration = 180;

  /* VIDEO */
  let videos =
    pickMany(assets.filter(a => a.category === "video" && a.climate === climate && a.enabled), 1);

  if (videos.length === 0) {
    videos = pickMany(assets.filter(a => a.category === "video" && a.enabled), 1);
  }

  videos = videos.map(v => ({
    id: v.id,
    path: v.path,
    start: 0,
    end: duration,
    opacity: 1,
    blend: "normal",
  }));

  /* VOICES */
  let voicesRaw =
    pickMany(assets.filter(a => a.category === "voice" && a.climate === climate && a.enabled), 3);

  if (voicesRaw.length === 0) {
    voicesRaw = pickMany(assets.filter(a => a.category === "voice" && a.enabled), 2);
  }

  const voices = spreadOver(
    voicesRaw.map(v => ({
      id: v.id,
      path: v.path,
      gain: 0.6,
    })),
    duration
  );

  return {
    duration,
    climate,
    music: { id: music.id, path: music.path },
    videos,
    voices,
    fx: [{ type: "particles", preset: climate || "calm" }],
  };
}
