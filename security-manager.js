
export class SecurityManager {
  constructor() {
    this.requestLimits = new Map();
    this.blockedIPs = new Set();
    this.suspiciousActivity = [];
  }

  static escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;'
    };
    return text.replace(/[&<>"'\/]/g, char => map[char]);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    const dangerous = /[;'"`\\]/g;
    let sanitized = input.replace(dangerous, '');
    
    const sqlKeywords = /\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi;
    sanitized = sanitized.replace(sqlKeywords, '');
    
    return sanitized.trim();
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length < 255;
  }

  static validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
  }

  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateMessageLength(message, maxLength = 500) {
    return message && message.length > 0 && message.length <= maxLength;
  }

  rateLimit(identifier, limit = 30, window = 60000) {
    const key = identifier;
    const now = Date.now();

    if (!this.requestLimits.has(key)) {
      this.requestLimits.set(key, []);
    }

    let requests = this.requestLimits.get(key);
    requests = requests.filter(time => now - time < window);

    if (requests.length >= limit) {
      this.logSuspiciousActivity(identifier, 'Rate limit exceeded');
      return false;
    }

    requests.push(now);
    this.requestLimits.set(key, requests);
    return true;
  }

  generateCSRFToken() {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('csrfToken', token);
    return token;
  }

  verifyCSRFToken(token) {
    const storedToken = sessionStorage.getItem('csrfToken');
    return storedToken && storedToken === token;
  }

  logSuspiciousActivity(identifier, reason) {
    const log = {
      identifier,
      reason,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    this.suspiciousActivity.push(log);
    console.warn('[SECURITY ALERT] Suspicious Activity:', log);

    if (this.suspiciousActivity.length > 10) {
      this.blockedIPs.add(identifier);
    }
  }

  static applyCSPHeaders() {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https:;
      font-src 'self' https://fonts.gstatic.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `;
    document.head.appendChild(meta);
  }

  static setSecureStorage(key, value) {
    try {
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding (use crypto in production)
      localStorage.setItem(`secure_${key}`, encrypted);
      return true;
    } catch (err) {
      console.error('Storage error:', err);
      return false;
    }
  }

  static getSecureStorage(key) {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (err) {
      console.error('Storage error:', err);
      return null;
    }
  }

  static preventClickjacking() {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-UA-Compatible';
    meta.content = 'IE=edge';
    document.head.appendChild(meta);
  }

  static sanitizeMessage(message) {
    if (typeof message !== 'string') return '';
    
    let sanitized = message.replace(/<[^>]*>/g, '');
    
    sanitized = this.escapeHtml(sanitized);
    
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500);
    }

    return sanitized;
  }

  monitorSession(userId) {
    const sessionStart = Date.now();
    
    window.addEventListener('storage', (e) => {
      if (e.key === 'adminToken' && e.newValue === null) {
        console.log('[WARN] Session cleared');
      }
    });

    let lastActivity = Date.now();
    
    document.addEventListener('mousemove', () => {
      lastActivity = Date.now();
    });

    document.addEventListener('keypress', () => {
      lastActivity = Date.now();
    });

    setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
        console.warn('[WARN] Session inactive for 30 minutes');
      }
    }, 60000);
  }
}

SecurityManager.applyCSPHeaders();
SecurityManager.preventClickjacking();

export default SecurityManager;

