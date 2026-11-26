/**
 * js/game_hyper_realism.js
 * Slimmed zero-lag compatibility shim for legacy HyperRealismEngine callers.
 * Heavy per-frame loops, intervals, and redundant draw calls have been removed
 * in favor of src/game/astro-world-engine.js (window.AstroWorldEngine).
 */
(function (global) {
  'use strict';

  const QUALITY_PROFILES = {
    low: { name: 'LOW', pixelRatio: 1.0, shadows: false, cullDistance: 360 },
    med: { name: 'MEDIUM', pixelRatio: 1.35, shadows: true, cullDistance: 720 },
    high: { name: 'HIGH', pixelRatio: 1.75, shadows: true, cullDistance: 1400 }
  };

  const EXOTIC_CAR_CATALOG = {
    tesla_roadster: { id: 'tesla_roadster', name: 'Tesla Roadster', color: 0xef4444 },
    cyber_coupe: { id: 'cyber_coupe', name: 'Cyber Coupe', color: 0x38bdf8 },
    astro_gt: { id: 'astro_gt', name: 'Astro GT', color: 0xfacc15 }
  };

  class HyperRealismEngine {
    constructor() {
      this.quality = 'med';
      this.teslaFlightActive = false;
      this.policeUnits = [];
      this.distantCullGroup = [];
      this.dealershipShowroomCars = [];
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.player = null;
    }

    init(scene, camera, renderer, player) {
      this.scene = scene || null;
      this.camera = camera || null;
      this.renderer = renderer || null;
      this.player = player || null;
      this.setQuality(this.quality);
    }

    setQuality(mode) {
      const key = typeof mode === 'string' && QUALITY_PROFILES[mode.toLowerCase()]
        ? mode.toLowerCase()
        : 'med';
      this.quality = key;
      const profile = QUALITY_PROFILES[key];
      if (this.renderer && typeof this.renderer.setPixelRatio === 'function') {
        const dpr = (typeof global.devicePixelRatio === 'number' && global.devicePixelRatio > 0)
          ? Math.min(global.devicePixelRatio, profile.pixelRatio)
          : 1;
        this.renderer.setPixelRatio(dpr);
      }
    }

    update(dt) {
      if (global.AstroWorldEngine && typeof global.AstroWorldEngine.update === 'function') {
        const pPos = this.player && this.player.pos ? this.player.pos : null;
        global.AstroWorldEngine.update(dt, pPos, this.quality);
      }
    }

    registerCullableGroup(grp) {
      if (grp) this.distantCullGroup.push(grp);
    }

    setTeslaFlightMode(active) {
      this.teslaFlightActive = !!active;
    }

    buildRealWorldSupercar() {}
    spawnExoticCar() {}
    teleportToDistrict() {}
    triggerWantedStar() {}
    clearWantedStars() {}
    setTimeOfDay() {}

    restoreSafeDisplay() {
      this.setQuality('low');
    }
  }

  global.EXOTIC_CAR_CATALOG = EXOTIC_CAR_CATALOG;
  global.HyperRealismEngine = new HyperRealismEngine();
  global.renderLiveGPSMinimap = function () {};
  global.cycleCityWinterGear = function () {};
  global.drinkCityHotThermos = function () {};
  global.setHyperQuality = function (mode) {
    global.HyperRealismEngine.setQuality(mode);
  };
})(typeof window !== 'undefined' ? window : globalThis);
