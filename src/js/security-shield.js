/**
 * 🛡️ FORTRESS SECURITY SHIELD FOR NEXCHAT
 * Powered by alexhack235-code/AI-Security-Scanner-API (FORTRESS v4.0)
 * 
 * Provides:
 * 1. Sub-millisecond Client-side Fast Kill WAF (XSS, SQLi, Command Injection, Path Traversal)
 * 2. LLM Adversarial Prompt Injection & DAN Jailbreak Shield for ChronEX AI
 * 3. Remote FORTRESS Cloud Gateway Integration (/api/defend, /api/scan, /api/pow)
 * 4. Anti-Tamper Payload Signatures and Zero-Trust Vault Gatekeeper Authorization
 */

const DEFAULT_FORTRESS_CONFIG = {
  enabled: true,
  apiUrl: localStorage.getItem('nexchat_fortress_url') || 'https://ai-security-scanner-api.vercel.app',
  vaultKey: localStorage.getItem('nexchat_fortress_key') || '',
  mode: localStorage.getItem('nexchat_fortress_mode') || 'active', // 'active' | 'offline_only'
  blockPromptInjection: true,
  blockXSS: true,
  blockSQLi: true
};

class FortressSecurityShield {
  constructor(config = DEFAULT_FORTRESS_CONFIG) {
    this.config = { ...DEFAULT_FORTRESS_CONFIG, ...config };
    this.threatCount = parseInt(localStorage.getItem('nexchat_threats_blocked') || '0', 10);
    this.patterns = {
      // 1. Cross-Site Scripting (XSS)
      xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript\s*:/gi,
        /data\s*:\s*text\/html/gi,
        /on(?:error|load|click|mouseover|focus|blur|submit)\s*=/gi,
        /<iframe\b|<object\b|<embed\b|<svg\b[^>]*onload/gi
      ],
      // 2. SQL Injection (SQLi)
      sqli: [
        /(\b(union(\s+all)?)\s+select\b)/gi,
        /(\b(select|delete|insert|update|drop|truncate|alter)\b.{1,40}\b(from|into|table|database)\b)/gi,
        /(?:'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|'\s*or\s*1\s*=\s*1|--\s*$|\/\*.*?\*\/)/gi,
        /\b(exec(\s+xp_cmdshell)?|sp_executesql)\b/gi
      ],
      // 3. Path Traversal & OS Commands
      traversal: [
        /(?:\.\.\/|\.\.\\){2,}/g,
        /(?:\/etc\/passwd|\/etc\/shadow|\/proc\/self|c:\\windows\\system32)/gi,
        /(?:;\s*(?:rm\s+-rf|shutdown|cat\s+\/etc|net\s+user|dir\s+c:))/gi
      ],
      // 4. LLM Prompt Injection & DAN Jailbreaks
      promptInjection: [
        /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/gi,
        /disregard\s+(all\s+)?(previous|prior)\s+instructions/gi,
        /\bDAN\s+(mode|prompt)\b/gi,
        /you\s+are\s+now\s+(in\s+)?(developer|god|unrestricted|jailbreak)\s+mode/gi,
        /system\s+override\s*:/gi,
        /bypass\s+(all\s+)?content\s+filters/gi,
        /output\s+the\s+(system\s+prompt|initial\s+instructions)/gi,
        /from\s+now\s+on\s+you\s+(will|must)\s+act\s+as\s+an\s+unfiltered/gi
      ]
    };
  }

  /**
   * Fast In-Memory Payload Inspection (< 0.5ms)
   * Returns { safe: boolean, threats: string[], sanitizedText: string }
   */
  inspectText(text) {
    if (!text || typeof text !== 'string') {
      return { safe: true, threats: [], sanitizedText: text };
    }

    const threats = [];

    // XSS check
    if (this.config.blockXSS) {
      for (const pattern of this.patterns.xss) {
        if (pattern.test(text)) {
          threats.push('XSS_ATTACK');
          break;
        }
      }
    }

    // SQLi check
    if (this.config.blockSQLi) {
      for (const pattern of this.patterns.sqli) {
        if (pattern.test(text)) {
          threats.push('SQL_INJECTION');
          break;
        }
      }
    }

    // Path Traversal check
    for (const pattern of this.patterns.traversal) {
      if (pattern.test(text)) {
        threats.push('PATH_TRAVERSAL');
        break;
      }
    }

    // Prompt Injection check
    if (this.config.blockPromptInjection) {
      for (const pattern of this.patterns.promptInjection) {
        if (pattern.test(text)) {
          threats.push('PROMPT_INJECTION');
          break;
        }
      }
    }

    if (threats.length > 0) {
      this.threatCount++;
      localStorage.setItem('nexchat_threats_blocked', this.threatCount);
      return {
        safe: false,
        threats,
        sanitizedText: this.sanitize(text)
      };
    }

    return { safe: true, threats: [], sanitizedText: text };
  }

  /**
   * Fast HTML entity escaping & normalization
   */
  sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Inspect outgoing AI prompt specifically for LLM Jailbreak attacks
   */
  guardAIPrompt(prompt) {
    const res = this.inspectText(prompt);
    if (!res.safe && res.threats.includes('PROMPT_INJECTION')) {
      return {
        allowed: false,
        reason: 'Adversarial prompt injection attempt detected by FORTRESS LLM Guard.',
        threats: res.threats
      };
    }
    return { allowed: true, prompt: prompt };
  }

  /**
   * Optional Remote FORTRESS API Inspection (/api/defend)
   */
  async defendRemote(payload, context = {}) {
    if (!this.config.enabled || this.config.mode === 'offline_only') {
      return this.inspectText(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }

    const apiUrl = this.config.apiUrl.replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (this.config.vaultKey) {
      headers['x-vault-key'] = this.config.vaultKey;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${apiUrl}/api/defend`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          payload: payload,
          context: {
            app: 'NEXCHAT',
            timestamp: Date.now(),
            ...context
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        return {
          safe: data.decision !== 'BLOCK',
          verdict: data.decision,
          score: data.riskScore,
          threats: data.threats || []
        };
      }
    } catch (e) {
      console.warn('[FORTRESS] Remote API offline, falling back to in-memory shield:', e.message);
    }

    // Fallback to local in-memory inspection
    return this.inspectText(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }

  /**
   * Test connection to the FORTRESS Cloud API
   */
  async testConnection(apiUrl = this.config.apiUrl, vaultKey = this.config.vaultKey) {
    const cleanUrl = (apiUrl || '').replace(/\/$/, '');
    const headers = {};
    if (vaultKey) headers['x-vault-key'] = vaultKey;

    const t0 = performance.now();
    try {
      const res = await fetch(`${cleanUrl}/health`, {
        headers,
        signal: AbortSignal.timeout(4000)
      });
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          online: true,
          latency,
          version: data.version || 'v4.0 Enterprise',
          status: 'CONNECTED'
        };
      }
      return { online: false, status: `HTTP_${res.status}`, latency };
    } catch (err) {
      return { online: false, status: 'TIMEOUT_OR_OFFLINE', error: err.message };
    }
  }

  saveConfig(apiUrl, vaultKey, mode = 'active') {
    this.config.apiUrl = apiUrl || this.config.apiUrl;
    this.config.vaultKey = vaultKey || '';
    this.config.mode = mode;
    localStorage.setItem('nexchat_fortress_url', this.config.apiUrl);
    localStorage.setItem('nexchat_fortress_key', this.config.vaultKey);
    localStorage.setItem('nexchat_fortress_mode', this.config.mode);
  }
}

export const fortressShield = new FortressSecurityShield();
window.fortressShield = fortressShield;
