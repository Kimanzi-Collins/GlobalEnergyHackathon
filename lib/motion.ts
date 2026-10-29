/**
 * Motion tokens (DESIGN.md section 6). Never use `ease`, `ease-in`, `ease-out` or `linear`.
 * Only animate transform, opacity and clip-path.
 */
export const EASE = {
  expoOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  quartOut: [0.25, 1, 0.5, 1] as [number, number, number, number],
  expoInOut: [0.87, 0, 0.13, 1] as [number, number, number, number],
};

export const DURATION = {
  micro: 0.2,
  reveal: 0.9,
  chapter: 0.6,
};

/** Delay between staggered words and lines, in seconds. */
export const STAGGER = 0.08;
