/**
 * NEXCHAT App Prompt & Download Router
 * Note: Google Play Store distribution is currently deferred.
 * Auto-redirection and Play Store modal triggers are suppressed.
 */

export function initializeAppPrompt() {
  // Suppressed: NexChat is not yet published on Google Play Store.
  // Auto-redirection and Play Store prompts are completely deactivated.
}

if (typeof window !== 'undefined') {
  window.initializeAppPrompt = initializeAppPrompt;
}
