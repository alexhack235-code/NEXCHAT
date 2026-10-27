/**
 * NEXCHAT - Lenis Smooth Scroll ESM Bridge
 * Bridges Lenis IIFE browser bundle to standard ES module default export.
 * PURE CRLF. ZERO UNICODE EMOJIS.
 */
import '../../node_modules/lenis/dist/lenis.js';

const Lenis = (typeof globalThis !== 'undefined' ? globalThis.Lenis : (typeof window !== 'undefined' ? window.Lenis : class {}));

export default Lenis;
export { Lenis };
