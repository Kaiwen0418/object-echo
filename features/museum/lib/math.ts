export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}
