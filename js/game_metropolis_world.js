/**
 * js/game_metropolis_world.js
 * Slimmed zero-lag compatibility shim for legacy Metropolis world hooks.
 * World geometry & instanced rendering are now handled by src/game/astro-world-engine.js (window.AstroWorldEngine).
 */
(function (global) {
  'use strict';

  function noop() {}

  function registerCullable(grp) {
    if (global.HyperRealismEngine && typeof global.HyperRealismEngine.registerCullableGroup === 'function') {
      global.HyperRealismEngine.registerCullableGroup(grp);
    }
  }

  function toggleProvincesModal(forceOpen) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('provinces-modal') || document.getElementById('provincesModal');
    if (!modal) return;
    const isVisible = modal.style.display === 'flex' || modal.style.display === 'block';
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isVisible;
    modal.style.display = shouldOpen ? 'flex' : 'none';
  }

  function loadProvinceTag(file) {
    if (typeof document === 'undefined' || !file) return;
    const frame = document.getElementById('province-frame');
    const loader = document.getElementById('province-loader');
    if (frame) frame.src = file;
    if (loader) loader.style.display = 'flex';
  }

  function closeProvinceLoader() {
    if (typeof document === 'undefined') return;
    const loader = document.getElementById('province-loader');
    if (loader) loader.style.display = 'none';
  }

  function reloadProvinceFrame() {
    if (typeof document === 'undefined') return;
    const frame = document.getElementById('province-frame');
    if (frame && frame.src) frame.src = frame.src;
  }

  function openProvinceNewTab() {
    if (typeof document === 'undefined') return;
    const frame = document.getElementById('province-frame');
    if (frame && frame.src) global.open(frame.src, '_blank', 'noopener');
  }

  // Expose lightweight global hooks expected by legacy callers (zero intervals, zero draw calls)
  global.registerCullable = registerCullable;
  global.buildShoppingMall = noop;
  global.buildCityLivelinessElements = noop;
  global.buildCalgaryMetropolis = noop;
  global.buildTransCanadaGateway = noop;
  global.buildMetropolisConnectingArteriesAndInfill = noop;
  global.buildPerimeterMountainHorizon = noop;
  global.updateFootstepDust = noop;
  global.checkMallStoreProximity = noop;
  global.toggleProvincesModal = toggleProvincesModal;
  global.loadProvinceTag = loadProvinceTag;
  global.closeProvinceLoader = closeProvinceLoader;
  global.reloadProvinceFrame = reloadProvinceFrame;
  global.openProvinceNewTab = openProvinceNewTab;
})(typeof window !== 'undefined' ? window : globalThis);
