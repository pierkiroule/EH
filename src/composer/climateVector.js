/**
 * Compute normalized climate vector
 */

export function computeClimateVector(weights) {
  const vector = {
    calm: 0,
    deep: 0,
    luminous: 0,
    tense: 0,
    contrast: 0,
  };

  for (const w of weights) {
    if (vector[w.climate] !== undefined) {
      vector[w.climate] += Number(w.weight);
    }
  }

  const total =
    Object.values(vector).reduce((a, b) => a + b, 0) || 1;

  for (const k in vector) {
    vector[k] = Number((vector[k] / total).toFixed(3));
  }

  return vector;
}

export function dominantClimate(vector) {
  return Object.entries(vector).sort(
    (a, b) => b[1] - a[1]
  )[0][0];
}