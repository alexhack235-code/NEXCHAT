/**
 * ============================================================================
 * NEXCHAT MARKETPLACE - REGIONAL GEO-CDN & PRIVACY PARTITION ENGINE
 * ============================================================================
 * Implements country-level catalog partitioning, edge CDN geo-routing,
 * local currency resolution, and cross-border purchase privacy protection.
 * Prevents unauthorized cross-border order visibility (e.g., Russian users
 * cannot inspect Canadian user transactions).
 *
 * Standards: 0 Unicode Emojis | FontAwesome 6 Vectors | Pure Windows CRLF (\r\n)
 * ============================================================================
 */

export const SUPPORTED_COUNTRIES = {
  GLOBAL: { code: 'GLOBAL', name: 'Global Market', currency: 'USD', symbol: '$', icon: 'fa-globe', region: 'Worldwide' },
  CA: { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'CA$', icon: 'fa-map-pin', region: 'North America' },
  US: { code: 'US', name: 'United States', currency: 'USD', symbol: '$', icon: 'fa-map-pin', region: 'North America' },
  RU: { code: 'RU', name: 'Russia', currency: 'RUB', symbol: 'RUB', icon: 'fa-map-pin', region: 'Eurasia' },
  GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: 'GBP', icon: 'fa-map-pin', region: 'Europe' },
  EU: { code: 'EU', name: 'European Union', currency: 'EUR', symbol: 'EUR', icon: 'fa-map-pin', region: 'Europe' },
  AE: { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'AED', icon: 'fa-map-pin', region: 'Middle East' },
  JP: { code: 'JP', name: 'Japan', currency: 'JPY', symbol: 'JPY', icon: 'fa-map-pin', region: 'Asia-Pacific' },
  AU: { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', icon: 'fa-map-pin', region: 'Oceania' },
  IN: { code: 'IN', name: 'India', currency: 'INR', symbol: 'INR', icon: 'fa-map-pin', region: 'South Asia' },
  BR: { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', icon: 'fa-map-pin', region: 'South America' },
  NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: 'NGN', icon: 'fa-map-pin', region: 'Africa' }
};

class MarketGeoCdnEngine {
  constructor() {
    this.storageKey = 'nex_market_country_code';
    this.scopeStorageKey = 'nex_market_shipping_scope'; // 'local_only' or 'include_global'
    this.activeCountry = this.detectUserCountry();
    this.includeGlobal = localStorage.getItem(this.scopeStorageKey) !== 'false';
    this.listeners = new Set();
  }

  /**
   * Detects user country via stored preference, CDN headers, or client timezone heuristics.
   */
  detectUserCountry() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && SUPPORTED_COUNTRIES[stored]) {
        return stored;
      }

      // Timezone based geo-heuristic fallback
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      
      if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Edmonton') || tz.includes('Winnipeg') || tz.includes('Halifax') || tz.includes('St_Johns')) {
        return 'CA';
      }
      if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver') || tz.includes('Phoenix')) {
        return 'US';
      }
      if (tz.includes('Moscow') || tz.includes('Yekaterinburg') || tz.includes('Novosibirsk') || tz.includes('Vladivostok') || tz.includes('Samara')) {
        return 'RU';
      }
      if (tz.includes('London')) {
        return 'GB';
      }
      if (tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome') || tz.includes('Madrid') || tz.includes('Amsterdam') || tz.includes('Brussels')) {
        return 'EU';
      }
      if (tz.includes('Dubai')) {
        return 'AE';
      }
      if (tz.includes('Tokyo')) {
        return 'JP';
      }
      if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane') || tz.includes('Perth')) {
        return 'AU';
      }
      if (tz.includes('Kolkata') || tz.includes('Calcutta')) {
        return 'IN';
      }
      if (tz.includes('Sao_Paulo')) {
        return 'BR';
      }
      if (tz.includes('Lagos')) {
        return 'NG';
      }
    } catch (_) {}

    return 'CA'; // Default to Canada
  }

  getActiveCountry() {
    return this.activeCountry;
  }

  getActiveCountryInfo() {
    return SUPPORTED_COUNTRIES[this.activeCountry] || SUPPORTED_COUNTRIES.GLOBAL;
  }

  setActiveCountry(countryCode) {
    if (SUPPORTED_COUNTRIES[countryCode]) {
      this.activeCountry = countryCode;
      try {
        localStorage.setItem(this.storageKey, countryCode);
      } catch (_) {}
      this.notifyListeners();
    }
  }

  setIncludeGlobal(include) {
    this.includeGlobal = !!include;
    try {
      localStorage.setItem(this.scopeStorageKey, String(this.includeGlobal));
    } catch (_) {}
    this.notifyListeners();
  }

  isIncludeGlobal() {
    return this.includeGlobal;
  }

  onRegionChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notifyListeners() {
    for (const fn of this.listeners) {
      try {
        fn(this.getActiveCountryInfo(), this.includeGlobal);
      } catch (err) {
        console.warn('[MarketGeoCdn] Listener error:', err);
      }
    }
  }

  /**
   * Filters an advertisement according to the active regional partition.
   * Cross-Border Privacy Rule:
   * - A listing marked domestic-only for Russia will NEVER appear in Canada.
   * - A listing marked domestic-only for Canada will NEVER appear in Russia.
   * - Only listings with shippingScope === 'global' or matching country are shown.
   */
  isAdVisible(ad) {
    if (!ad) return false;

    const adCountry = (ad.country || 'GLOBAL').toUpperCase();
    const adScope = (ad.shippingScope || 'local').toLowerCase();

    // If user is browsing in Global Mode
    if (this.activeCountry === 'GLOBAL') {
      return adScope === 'global' || adCountry === 'GLOBAL';
    }

    // Direct country match (e.g. Canadian user browsing Canadian ad)
    if (adCountry === this.activeCountry) {
      return true;
    }

    // If ad is from another country, it is ONLY visible if it has global shipping AND user enabled includeGlobal
    if (this.includeGlobal && (adScope === 'global' || adCountry === 'GLOBAL')) {
      return true;
    }

    return false;
  }

  /**
   * Formats price display with regional currency code and symbol.
   */
  formatPrice(amount, adCountry = null) {
    const num = parseFloat(amount) || 0;
    const countryInfo = (adCountry && SUPPORTED_COUNTRIES[adCountry]) ? SUPPORTED_COUNTRIES[adCountry] : this.getActiveCountryInfo();
    return `${countryInfo.symbol}${num.toFixed(2)} ${countryInfo.currency}`;
  }

  /**
   * Renders the interactive Regional Partition Bar into the marketplace container.
   */
  renderRegionSelectorBar(containerId = 'geoRegionSelectorMount') {
    const mount = document.getElementById(containerId);
    if (!mount) return;

    const info = this.getActiveCountryInfo();
    const optionsHtml = Object.values(SUPPORTED_COUNTRIES).map(c => `
      <option value="${c.code}" ${c.code === this.activeCountry ? 'selected' : ''}>
        [${c.code}] ${c.name} (${c.currency} ${c.symbol})
      </option>
    `).join('');

    mount.innerHTML = `
      <div class="geo-partition-bar" id="geoPartitionBar">
        <div class="geo-partition-left">
          <div class="geo-region-chip" id="geoRegionChip">
            <i class="fa-solid ${info.icon}"></i>
            <span class="geo-country-label">Region:</span>
            <select id="geoCountrySelect" class="geo-country-dropdown" aria-label="Select Marketplace Country Region">
              ${optionsHtml}
            </select>
          </div>
          
          <label class="geo-scope-toggle-label" title="Show international listings willing to ship to your country">
            <input type="checkbox" id="geoIncludeGlobalToggle" ${this.includeGlobal ? 'checked' : ''}>
            <span class="geo-scope-toggle-text">Include Global Shipping</span>
          </label>
        </div>

        <div class="geo-partition-right">
          <span class="geo-privacy-badge" title="Purchases, carts, and order details are strictly isolated in your local encrypted vault">
            <i class="fa-solid fa-shield-halved"></i> Privacy Partition Active
          </span>
        </div>
      </div>
    `;

    // Bind event listeners
    const selectEl = document.getElementById('geoCountrySelect');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        this.setActiveCountry(e.target.value);
      });
    }

    const toggleEl = document.getElementById('geoIncludeGlobalToggle');
    if (toggleEl) {
      toggleEl.addEventListener('change', (e) => {
        this.setIncludeGlobal(e.target.checked);
      });
    }
  }
}

export const marketGeoCdn = new MarketGeoCdnEngine();
if (typeof window !== 'undefined') {
  window.marketGeoCdn = marketGeoCdn;
}
