import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes conditionally
 * @param {...string} inputs - Class names
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
