import crypto from 'crypto';
import { applySecurityHeaders, handleCors, enforceRateLimit } from './_security.js';

/**
 * NEXCHAT Multi-Vault ImageKit Authentication & Token Gateway
 * Supports dynamic rotation and cascading failover across 1 to 30 ImageKit accounts.
 * Provides 20 GB to 600 GB/month of high-speed bandwidth with zero server egress costs.
 */

// Global in-memory rotation pointer for load balancing
let roundRobinIndex = 0;

/**
 * Discovers all active ImageKit vault configurations in environment variables (1 to 30).
 */
function getActiveImageKitVaults() {
  const vaults = [];

  // Check indexed vaults: 1 through 30
  for (let i = 1; i <= 30; i++) {
    const pub = process.env[`IMAGEKIT_PUBLIC_KEY_${i}`];
    const priv = process.env[`IMAGEKIT_PRIVATE_KEY_${i}`];
    const url = process.env[`IMAGEKIT_URL_ENDPOINT_${i}`];

    if (pub && priv && url) {
      vaults.push({
        index: i,
        name: `ImageKit Vault ${i}`,
        publicKey: pub.trim(),
        privateKey: priv.trim(),
        urlEndpoint: url.trim().replace(/\/+$/, '')
      });
    }
  }

  // Fallback to primary unindexed keys if no indexed keys found or as Vault 1
  if (!vaults.length && process.env.IMAGEKIT_PRIVATE_KEY) {
    vaults.push({
      index: 1,
      name: 'ImageKit Vault 1 (Default)',
      publicKey: (process.env.IMAGEKIT_PUBLIC_KEY || '').trim(),
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY.trim(),
      urlEndpoint: (process.env.IMAGEKIT_URL_ENDPOINT || '').trim().replace(/\/+$/, '')
    });
  }

  return vaults;
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!enforceRateLimit(req, res)) return;

  const vaults = getActiveImageKitVaults();

  if (!vaults.length) {
    return res.status(503).json({
      error: 'No active ImageKit vaults configured. Set IMAGEKIT_PUBLIC_KEY_1..30 in environment.'
    });
  }

  // Select vault: explicit request index (?vault=3) OR round-robin rotation
  let selectedVault = vaults[0];
  const requestedIdx = parseInt(req.query.vault, 10);

  if (!isNaN(requestedIdx)) {
    const found = vaults.find(v => v.index === requestedIdx);
    if (found) selectedVault = found;
  } else {
    selectedVault = vaults[roundRobinIndex % vaults.length];
    roundRobinIndex = (roundRobinIndex + 1) % vaults.length;
  }

  try {
    const token = req.query.token || crypto.randomUUID();
    const expire = req.query.expire || Math.floor(Date.now() / 1000) + 1800; // 30 minutes

    const signature = crypto
      .createHmac('sha1', selectedVault.privateKey)
      .update(token + expire)
      .digest('hex');

    return res.status(200).json({
      vaultIndex: selectedVault.index,
      vaultName: selectedVault.name,
      totalActiveVaults: vaults.length,
      availableVaultIndices: vaults.map(v => v.index),
      token,
      expire: Number(expire),
      signature,
      publicKey: selectedVault.publicKey,
      urlEndpoint: selectedVault.urlEndpoint
    });
  } catch (err) {
    return res.status(500).json({ error: 'Signature generation failed', details: err.message });
  }
}
