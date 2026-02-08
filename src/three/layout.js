// Layout stable non circulaire pour constellation Emoji
// Aucun recalcul après montage

export function computeLayout(emojis) {
  const radius = 4;

  return emojis.map((e, i) => {
    const angle = (i / emojis.length) * Math.PI * 2;

    return {
      id: e.emoji,
      x: Math.cos(angle) * radius + (Math.random() - 0.5),
      y: Math.sin(angle) * radius * 0.6,
      z: (Math.random() - 0.5) * 0.5,
      occurrences: e.occurrences || 1,
    };
  });
}
