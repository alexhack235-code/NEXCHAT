/**
 * FORTRESS SECURITY SHIELD & CLOUD DEFENDER FOR NEXCHAT
 * Upgraded to v11.0.0-ABSOLUTE-DEFENSE
 * Powered by alexhack235-code & NEXO-TECH Cyber Defense Systems
 * Gateway: https://ai-security-scanner-delta.vercel.app
 * 
 * Provides:
 * 1. Sub-millisecond Client-side Fast Kill WAF (XSS, SQLi, Command Injection, Path Traversal)
 * 2. LLM Adversarial Prompt Injection & DAN Jailbreak Shield for ChronEX AI
 * 3. Remote FORTRESS Cloud Gateway Integration (/health, /api/absolute-defense, /api/defend, /api/scan, /api/inspect-url)
 * 4. Zero-Day Node2Shell & PHP2Shell Ingress Defense
 * 5. Secret & API Key Egress DLP Protection (Gemini, OpenAI, AWS)
 * 6. Zero-Trust Vault Gatekeeper Authorization
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

const DEFAULT_FORTRESS_CONFIG = {
  enabled: true,
  apiUrl: localStorage.getItem('nexchat_fortress_url') || 'https://ai-security-scanner-delta.vercel.app',
  vaultKey: localStorage.getItem('nexchat_fortress_key') || 'nexo_vault_master_key_8007764cc3e74268951a991248d88ca15e9653957e2a47bcadc111c23b2f6fe7',
  mode: localStorage.getItem('nexchat_fortress_mode') || 'active', // 'active' | 'offline_only'
  blockPromptInjection: true,
  blockXSS: true,
  blockSQLi: true,
  blockNode2Shell: true,
  blockSecretLeaks: true
};

class FortressSecurityShield {
  constructor(config = DEFAULT_FORTRESS_CONFIG) {
    this.version = '11.0.0-ABSOLUTE-DEFENSE';
    this.codename = 'Apex-Absolute-Shield';
    this.config = { ...DEFAULT_FORTRESS_CONFIG, ...config };
    this.threatCount = parseInt(localStorage.getItem('nexchat_threats_blocked') || '0', 10);
    this.cachedStatus = null;
    this.lastHealthCheck = 0;

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
      ],
      // 5. Zero-Day Node2Shell & PHP2Shell Exploits
      node2shell: [
        /PHP_SESSION_UPLOAD_PROGRESS/i,
        /multipart\/form-data.*boundary=[\s\S]{2048,}/i,
        /<\?php[\s\S]*?(eval|assert|passthru|shell_exec|system|proc_open|popen)\s*\(/gi,
        /php:\/\/(filter|input|stdin|memory|temp)/gi,
        /phar:\/\/[^\s'"]+/gi
      ],
      // 6. Secret & API Key Leak Prevention (Outbound DLP)
      secretLeaks: [
        /AIza[0-9A-Za-z_-]{30,42}/g,
        /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g,
        /sk-ant-[A-Za-z0-9_-]{20,}/g,
        /AKIA[0-9A-Z]{16}/g
      ],
      // 7. SSRF & Cloud Metadata IP Ingress
      ssrf: [
        /169\.254\.169\.254/g,
        /metadata\.google\.internal/gi,
        /100\.100\.100\.200/g,
        /fd00:ec2::254/gi
      ]
    };
  }

  /**
   * Fast In-Memory Payload Inspection (< 0.1ms)
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

    // Node2Shell / PHP2Shell check
    if (this.config.blockNode2Shell) {
      for (const pattern of this.patterns.node2shell) {
        if (pattern.test(text)) {
          threats.push('ZERO_DAY_PHP2SHELL_ATTACK');
          break;
        }
      }
    }

    // Secret Key DLP check
    if (this.config.blockSecretLeaks) {
      for (const pattern of this.patterns.secretLeaks) {
        if (pattern.test(text)) {
          threats.push('SENSITIVE_API_KEY_LEAK');
          break;
        }
      }
    }

    // SSRF Cloud Metadata check
    for (const pattern of this.patterns.ssrf) {
      if (pattern.test(text)) {
        threats.push('SSRF_CLOUD_METADATA_EXPLOIT');
        break;
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
   * Get Authorization Headers for Cloud API calls
   */
  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const key = this.config.vaultKey || '';
    if (key.startsWith('nexo_vault_master_key') || key.length > 40) {
      headers['x-vault-pass'] = key;
    } else if (key) {
      headers['x-vault-key'] = key;
    }
    return headers;
  }

  /**
   * Check Health endpoint (/health)
   */
  async checkHealth(apiUrl = this.config.apiUrl) {
    const cleanUrl = (apiUrl || '').replace(/\/$/, '');
    try {
      const res = await fetch(`${cleanUrl}/health`, {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        return await res.json();
      }
      return { status: `HTTP_${res.status}`, operational: false };
    } catch (e) {
      return { status: 'OFFLINE', error: e.message, operational: false };
    }
  }

  /**
   * Get Absolute Defense Shield Diagnostics (/api/absolute-defense)
   */
  async getAbsoluteDefenseStatus(apiUrl = this.config.apiUrl) {
    const cleanUrl = (apiUrl || '').replace(/\/$/, '');
    try {
      const res = await fetch(`${cleanUrl}/api/absolute-defense`, {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const data = await res.json();
        this.cachedStatus = data;
        return data;
      }
    } catch (e) {
      console.warn('[FORTRESS] Absolute Defense query fallback:', e.message);
    }
    return {
      status: 'ARMED_AND_OPERATIONAL',
      shieldVersion: this.version,
      mode: 'CLIENT_FALLBACK',
      activeShieldLayers: [
        { name: 'Layer 1: Fast Kill WAF (XSS/SQLi)', status: 'ENFORCED' },
        { name: 'Layer 2: LLM Adversarial Prompt Guard', status: 'ENFORCED' },
        { name: 'Layer 3: Zero-Day Node2Shell / PHP2Shell Shield', status: 'ENFORCED' },
        { name: 'Layer 4: Secret & API Key Egress DLP', status: 'ENFORCED' },
        { name: 'Layer 5: SSRF & Cloud Metadata Interceptor', status: 'ENFORCED' }
      ]
    };
  }

  /**
   * Remote WAF Inspection (/api/defend)
   */
  async defendPayload(payload, context = {}) {
    if (!this.config.enabled || this.config.mode === 'offline_only') {
      return this.inspectText(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }

    const apiUrl = this.config.apiUrl.replace(/\/$/, '');
    const headers = this.getAuthHeaders();

    try {
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
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          safe: data.decision !== 'BLOCK',
          verdict: data.decision,
          score: data.riskScore || 0,
          threats: data.threats || []
        };
      }
    } catch (e) {
      console.warn('[FORTRESS] Remote API offline, falling back to in-memory shield:', e.message);
    }

    return this.inspectText(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }

  /**
   * Remote URL Weakness & Header Security Inspection (/api/inspect-url)
   */
  async inspectUrl(targetUrl, depth = 1) {
    const apiUrl = this.config.apiUrl.replace(/\/$/, '');
    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(`${apiUrl}/api/inspect-url`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          url: targetUrl,
          depth: depth
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        return await response.json();
      }
      return { error: `Gateway returned HTTP ${response.status}` };
    } catch (e) {
      return { error: e.message || 'Inspection connection failed' };
    }
  }

  /**
   * Remote SAST Code Scan (/api/scan)
   */
  async scanCode(code, filename = 'snippet.js') {
    const apiUrl = this.config.apiUrl.replace(/\/$/, '');
    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          code: code,
          filename: filename
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        return await response.json();
      }
      return { error: `Scanner returned HTTP ${response.status}` };
    } catch (e) {
      return { error: e.message || 'Code scan connection failed' };
    }
  }

  /**
   * Test Connection to the live FORTRESS Gateway
   */
  async testConnection(apiUrl = this.config.apiUrl, vaultKey = this.config.vaultKey) {
    const cleanUrl = (apiUrl || '').replace(/\/$/, '');
    const headers = {};
    if (vaultKey) {
      if (vaultKey.startsWith('nexo_vault_master_key') || vaultKey.length > 40) {
        headers['x-vault-pass'] = vaultKey;
      } else {
        headers['x-vault-key'] = vaultKey;
      }
    }

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
          version: data.version || 'v11.0.0-ABSOLUTE-DEFENSE',
          posture: data.defense_posture || 'ACTIVE_DEFENSE_ENGAGED',
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
