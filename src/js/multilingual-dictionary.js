/**
 * NEXCHAT Multilingual Lexicon & Master Aggregator
 * Re-exports modular per-country dictionaries from src/js/languages/
 * Covers all 195 sovereign nations on Earth.
 * Sub-0.0001s in-memory O(1) hash map lookup.
 */
import { ALL_LANGUAGE_MODULES, LANGUAGE_REGISTRY, WORLD_COUNTRIES_DATABASE, resolveCountryToLanguage } from './languages/index.js';

export const EXPANDED_MULTILINGUAL_DICTIONARY = ALL_LANGUAGE_MODULES;
export { LANGUAGE_REGISTRY, WORLD_COUNTRIES_DATABASE, resolveCountryToLanguage };
export default EXPANDED_MULTILINGUAL_DICTIONARY;
