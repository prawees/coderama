/**
 * Prefix for plain URLs when the static export is served from a sub-path
 * (GitHub Pages serves this repo at /coderama). next/link, router.push and
 * next/font add the prefix themselves; anything written as a raw string does not.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const withBase = (path: string) => `${BASE_PATH}${path}`;
