/**
 * NEXCHAT VERIFICATION BADGES CATALOG & CRYPTOGRAPHIC PROVENANCE SUITE
 * Multi-Tier Verification Badges inspired by X (Twitter):
 * - Beginner Verified (Green Check / Rising Creator)
 * - Pro Creator (X Blue Standard Check)
 * - Pro Master (Premium+ Ultra Cyan Rosette)
 * - Verified Business & Studio (X Gold Organization Check)
 * - Government & Sovereign Authority (X Grey Official Check)
 * - VIP Sovereign Master Node (Royal Amethyst Crown)
 * - Apex Patron & Investor (Rose Diamond Gem)
 * - C2PA Hardware Sensor Provenance (Hardware Camera Shield)
 *
 * STRICTLY ZERO EMOJIS - Only FontAwesome Icons and Vector SVG
 */

(function () {
  'use strict';

  const VERIFICATION_TIERS = {
    TIER_BEGINNER: {
      key: 'TIER_BEGINNER',
      title: 'Beginner Verified',
      subtitle: 'Rising Talent & Verified Identity',
      category: 'Individual & Creator',
      level: 1,
      icon: 'fa-circle-check',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      priceUSD: 5,
      priceNGN: 7500,
      description: 'Entry-level verified creator status. Proves real human identity, grants basic CamShot feed reach and verified green badge in chat.',
      badgeClass: 'badge-verify-beginner',
      authority: 'NEXCHAT Creator Onboarding Registry'
    },
    TIER_PRO: {
      key: 'TIER_PRO',
      aliases: ['VERIFIED_CREATOR', 'X_BLUE', 'BLUE_CHECK'],
      title: 'Pro Creator (X Blue)',
      subtitle: 'Official Blue Checkmark Standard',
      category: 'Individual & Creator',
      level: 2,
      icon: 'fa-circle-check',
      color: '#1d9bf0',
      glow: 'rgba(29, 155, 240, 0.5)',
      priceUSD: 12,
      priceNGN: 18000,
      description: 'The iconic X Blue verification badge for active creators. Unlocks monetization eligibility, 5x CamShot velocity priority, and trusted creator status.',
      badgeClass: 'badge-verify-pro',
      authority: 'NEXCHAT Guild Verified Guild'
    },
    TIER_PRO_MAX: {
      key: 'TIER_PRO_MAX',
      aliases: ['PREMIUM_PLUS', 'PRO_MASTER'],
      title: 'Pro Master (Premium+ Ultra)',
      subtitle: 'High-Velocity Top Creator',
      category: 'Individual & Creator',
      level: 3,
      icon: 'fa-certificate',
      color: '#00f2ff',
      glow: 'rgba(0, 242, 255, 0.55)',
      priceUSD: 25,
      priceNGN: 38000,
      description: 'Maximum reach booster. 10x feed distribution priority, synthetic detector bypass whitelist, zero commission on digital tips, and cyan rosette styling.',
      badgeClass: 'badge-verify-promax',
      authority: 'NEXCHAT Sovereign Algorithmic Authority'
    },
    TIER_BUSINESS_GOLD: {
      key: 'TIER_BUSINESS_GOLD',
      aliases: ['X_GOLD', 'GOLD_CHECK', 'ORGANIZATION_GOLD', 'BUSINESS_VERIFIED'],
      title: 'Verified Business & Studio (X Gold)',
      subtitle: 'Official Organization Gold Check',
      category: 'Organizations & Studios',
      level: 4,
      icon: 'fa-certificate',
      color: '#ffd700',
      glow: 'rgba(255, 215, 0, 0.55)',
      priceUSD: 50,
      priceNGN: 75000,
      description: 'Official organization checkmark like X Gold. Enables verified studio profile branding, multi-creator staff badges, and verified business banner.',
      badgeClass: 'badge-verify-gold',
      authority: 'NEXCHAT Corporate & Enterprise Registry'
    },
    TIER_GOVERNMENT_GREY: {
      key: 'TIER_GOVERNMENT_GREY',
      aliases: ['X_GREY', 'GREY_CHECK', 'GOVERNMENT_VERIFIED', 'OFFICIAL_GREY'],
      title: 'Government & Sovereign Authority (X Grey)',
      subtitle: 'Official Regulatory & Public Entity',
      category: 'Government & Authority',
      level: 4,
      icon: 'fa-circle-check',
      color: '#94a3b8',
      glow: 'rgba(148, 163, 184, 0.45)',
      priceUSD: 40,
      priceNGN: 60000,
      description: 'Official grey checkmark for public institutions, community governance, sovereign node validators, and regulatory consensus councils.',
      badgeClass: 'badge-verify-grey',
      authority: 'Sovereign Consensus Governance Council'
    },
    TIER_VIP_SOVEREIGN: {
      key: 'TIER_VIP_SOVEREIGN',
      aliases: ['VIP_SOVEREIGN', 'SOVEREIGN_NODE'],
      title: 'VIP Sovereign Master Node',
      subtitle: 'Consensus Governance VIP Crown',
      category: 'VIP & Founders',
      level: 5,
      icon: 'fa-crown',
      color: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.55)',
      priceUSD: 35,
      priceNGN: 50000,
      description: 'Elite sovereign status with radiant purple crown. Highest protocol consensus voting weight, multi-sig arbitration privileges, and VIP lounge badge.',
      badgeClass: 'badge-verify-vip',
      authority: 'Sovereign Node Protocol Consensus'
    },
    TIER_TOP_PATRON: {
      key: 'TIER_TOP_PATRON',
      aliases: ['TOP_PATRON', 'APEX_PATRON', 'DIAMOND_PATRON'],
      title: 'Apex Patron & Investor',
      subtitle: 'Treasury Guild Diamond Patron',
      category: 'VIP & Founders',
      level: 5,
      icon: 'fa-gem',
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.55)',
      priceUSD: 75,
      priceNGN: 110000,
      description: 'Top platform liquidity angel & patron badge. Certified investor halo, zero protocol fee on escrow transactions, and commemorative diamond certificate.',
      badgeClass: 'badge-verify-patron',
      authority: 'Central Treasury Liquidity Guild'
    },
    TIER_C2PA_HARDWARE: {
      key: 'TIER_C2PA_HARDWARE',
      aliases: ['C2PA_HARDWARE_VERIFIED', 'C2PA_SENSOR'],
      title: 'C2PA Hardware Sensor Provenance',
      subtitle: 'Cryptographic Anti-Deepfake Seal',
      category: 'Hardware Provenance',
      level: 3,
      icon: 'fa-shield-halved',
      color: '#00ff88',
      glow: 'rgba(0, 255, 136, 0.55)',
      priceUSD: 20,
      priceNGN: 30000,
      description: 'Hardware secure-enclave camera provenance. Cryptographically certifies that media was physically captured through authentic hardware sensors.',
      badgeClass: 'badge-verify-c2pa',
      authority: 'Hardware Enclave Cryptographic Attestation'
    }
  };

  function getVerificationTier(tierKey) {
    if (!tierKey || tierKey === 'NONE' || tierKey === 'none' || tierKey === false) {
      return null;
    }
    const cleanKey = String(tierKey).trim().toUpperCase();
    if (VERIFICATION_TIERS[cleanKey]) {
      return VERIFICATION_TIERS[cleanKey];
    }
    // Search aliases
    for (const k in VERIFICATION_TIERS) {
      const tier = VERIFICATION_TIERS[k];
      if (tier.aliases && tier.aliases.includes(cleanKey)) {
        return tier;
      }
    }
    // Default fallback to Pro if truthy verified but unknown key
    if (tierKey === true || tierKey === 'true') {
      return VERIFICATION_TIERS.TIER_PRO;
    }
    return null;
  }

  function renderVerificationBadgeHtml(tierKey, options = {}) {
    const tier = getVerificationTier(tierKey);
    if (!tier) return '';

    const fontSize = options.fontSize || '11px';
    const margin = options.margin !== undefined ? options.margin : '0 0 0 4px';
    const showTitle = options.showTitle === true;
    const extraClass = options.extraClass || '';
    const styleAttr = `color: ${tier.color}; font-size: ${fontSize}; margin: ${margin}; vertical-align: middle; filter: drop-shadow(0 0 4px ${tier.glow}); cursor: pointer;`;

    let html = `<span class="nex-verification-badge ${tier.badgeClass} ${extraClass}" data-tier="${tier.key}" title="${tier.title} - ${tier.subtitle}" style="display: inline-flex; align-items: center; gap: 3px;">`;
    html += `<i class="fa-solid ${tier.icon}" style="${styleAttr}"></i>`;
    if (showTitle) {
      html += `<span style="font-size: 10.5px; font-weight: 700; color: ${tier.color};">${tier.title}</span>`;
    }
    html += `</span>`;
    return html;
  }

  function renderVerificationBadgePill(tierKey, options = {}) {
    const tier = getVerificationTier(tierKey);
    if (!tier) {
      return `<span class="badge" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.25); color: #94a3b8; font-size: 10px;"><i class="fa-solid fa-ban"></i> STANDARD</span>`;
    }

    const padding = options.padding || '3px 8px';
    const fontSize = options.fontSize || '10.5px';

    return `
      <span class="badge ${tier.badgeClass}" style="background: ${tier.glow.replace('0.45', '0.15').replace('0.55', '0.15').replace('0.5', '0.15')}; border: 1px solid ${tier.color}; color: ${tier.color}; font-size: ${fontSize}; padding: ${padding}; display: inline-flex; align-items: center; gap: 5px; font-weight: 700;">
        <i class="fa-solid ${tier.icon}"></i> ${tier.title.toUpperCase()}
      </span>
    `;
  }

  window.NexVerificationCatalog = {
    TIERS: VERIFICATION_TIERS,
    getVerificationTier: getVerificationTier,
    renderVerificationBadgeHtml: renderVerificationBadgeHtml,
    renderVerificationBadgePill: renderVerificationBadgePill
  };

  // Backwards compatible exports
  window.NEXCHAT_VERIFICATION_TIERS = VERIFICATION_TIERS;
  window.getVerificationTier = getVerificationTier;
  window.renderVerificationBadgeHtml = renderVerificationBadgeHtml;
})();
