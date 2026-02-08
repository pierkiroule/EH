/**
 * Layout 3D stable et "constellation".
 * - positions sur une sphère aplatie (évite cercle)
 * - relaxation simple pour limiter les collisions
 */

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildEmojiNodes3d(emojis, occMap = {}) {
  const rng = mulberry32(1337);

  // rayon de base (monde three)
  const R = 4.2;

  const nodes = emojis.map((emoji, i) => {
    // distribution type "sphère" puis aplatissement
    const u = rng();
    const v = rng();

    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    let x = R * Math.sin(phi) * Math.cos(theta);
    let y = R * Math.sin(phi) * Math.sin(theta);
    let z = R * Math.cos(phi);

    // aplatissement léger pour un rendu plus "constellation"
    y *= 0.75;

    const occ = Math.max(1, Number(occMap[emoji] || 1));

    // taille monde (échelle sprite) : plus occ => plus grand
    const size = 0.55 + Math.min(occ, 50) * 0.01;

    return {
      id: emoji,
      x,
      y,
      z,
      size,
      occ,
    };
  });

  // relaxation simple anti-collision (rapide)
  relax(nodes, 80);

  return nodes;
}

function relax(nodes, iterations = 60) {
  const minDist = 0.85;

  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;

        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const target = minDist + (a.size + b.size) * 0.35;

        if (d < target) {
          const push = (target - d) * 0.015;
          const nx = dx / d;
          const ny = dy / d;
          const nz = dz / d;

          a.x -= nx * push;
          a.y -= ny * push;
          a.z -= nz * push;

          b.x += nx * push;
          b.y += ny * push;
          b.z += nz * push;
        }
      }
    }
  }
}
