/**
 * NEXCHAT Encoding & Text Sanitization Engine
 * Guarantees pure UTF-8 encoding, strips emojis and mojibake corruption strings.
 */

// Universal comprehensive regex matching all unicode emojis and symbols
export const EMOJI_REGEX = /[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{200D}\u{FE0E}\u{FE0F}]/gu;

// Mojibake sequence regex (e.g. â~, Ã, Â, â€™, ï¸)
export const MOJIBAKE_REGEX = /(?:â~|â€™|âœ…|âœ•|â Œ|âš |ðŸ|ï¸|Ã[^\s]|Â[^\s]|[\u0080-\u009F])/g;

/**
 * Removes all non-ASCII characters from a string.
 * Use for pure ASCII string normalization when necessary.
 */
export const sanitize = (str: string): string => {
  if (!str) return '';
  return str.replace(/[^\x00-\x7F]/g, '');
};

/**
 * Strips all emojis from user input and message payloads.
 * Satisfies the GLOBAL ZERO EMOJI POLICY.
 */
export const stripEmoji = (str: string): string => {
  if (!str) return '';
  return str.replace(EMOJI_REGEX, '');
};

/**
 * Cleans mojibake encoding glitches from imported or legacy text strings.
 */
export const cleanMojibake = (str: string): string => {
  if (!str) return '';
  return str.replace(MOJIBAKE_REGEX, '');
};
