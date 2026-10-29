import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge needs to know our custom font-size tokens (tailwind.config.ts). Without this it reads
 * `text-stat` or `text-micro` as a text COLOUR and drops it whenever a colour class such as `text-accent`
 * follows, which silently shrinks type.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'body', 'lead', 'h3', 'h2', 'h1', 'mega', 'dash', 'stat'] }],
    },
  },
});

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
