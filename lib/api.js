/**
 * NEXCHAT Fortress WAF Proxy Client API Bridge
 * All network requests are routed exclusively through Fortress Cloud Defender Proxy.
 * Direct backend requests are blocked at the perimeter.
 */

export const API_BASE = "https://ai-security-scanner-delta.vercel.app/api/proxy";

/**
 * Universal Proxy Fetch Wrapper
 * @param {string} endpoint - Path relative to backend (e.g. '/api/auth/login')
 * @param {RequestInit} [options={}] - Fetch configuration
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Convenience GET method
 */
export async function apiGet(endpoint, options = {}) {
  return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * Convenience POST method
 */
export async function apiPost(endpoint, body = {}, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

export default {
  API_BASE,
  apiFetch,
  apiGet,
  apiPost
};
