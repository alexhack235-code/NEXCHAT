/**
 * NEXCHAT Multilingual Lexicon & Master Aggregator
 * Re-exports modular per-country dictionaries from src/js/languages/
 * Sub-0.0001s in-memory O(1) hash map lookup.
 */
import { ALL_LANGUAGE_MODULES, LANGUAGE_REGISTRY } from './languages/index.js';

export const EXPANDED_MULTILINGUAL_DICTIONARY = ALL_LANGUAGE_MODULES;
export { LANGUAGE_REGISTRY };
export default EXPANDED_MULTILINGUAL_DICTIONARY;
