// js/game_military_aviation.js
// Slim compatibility layer for AstroShift: Beyond Earth.
// Legacy heavy builders, intervals, and per-frame loops have been superseded by
// src/game/astro-combat-physics.js (window.AstroCombatPhysics).

(function (window) {
  'use strict';

  function noop() {}

  window.militaryAviationState = {
    isEnlisted: false,
    lastSalaryClaim: 0,
    salaryCad: 10000,
    fighterJets: [],
    patrolJets: [],
    policeCruisers: [],
    carrierCatapultReady: true,
    cockpitViewActive: false,
    combatPaused: false,
    projectiles: [],
    explosions: [],
    hostileDrones: [],
    lockedTarget: null,
    lastCannonTime: 0,
    lastMissileTime: 0,
    missileStock: 6,
    tailhookDown: false,
    trapCatchState: null,
    isPilotingLAV: false,
    lavVehicleMesh: null,
    lavSpeed: 0,
    lavHeading: 0,
    lavTurretAngle: 0,
    lastLAVCannonTime: 0,
    lavSmokeCharges: 3,
    thermalVisorActive: false,
    cyberModalOpen: false,
    cyberThreatsDefused: [false, false, false]
  };

  function emergencyUnblackScreen() {
    if (typeof window.renderer !== 'undefined' && window.renderer &&
        typeof window.scene !== 'undefined' && typeof window.camera !== 'undefined') {
      try {
        window.renderer.render(window.scene, window.camera);
      } catch (e) {}
    }
  }

  window.buildAircraftCarrierHMCSCalgary = noop;
  window.buildCanadianMilitaryBase = noop;
  window.buildCyberSecurityHeadquarters = noop;
  window.initMilitaryAviationPatrols = noop;
  window.updateMilitaryAviation = noop;
  window.enlistInCanadianForces = noop;
  window.togglePlaneCockpitView = noop;
  window.ensureCockpitHUDDOM = noop;
  window.playMilitarySFX = noop;
  window.buildCanadianAuroraBorealis = noop;
  window.initHostileSkyRaiders = noop;
  window.fireJetCannon = noop;
  window.fireJetMissile = noop;
  window.toggleCarrierTailhook = noop;
  window.boardCanadianLAV = noop;
  window.exitCanadianLAV = noop;
  window.fireLAVBushmaster = noop;
  window.deployLAVSmokeScreen = noop;
  window.accessTacticalArmory = noop;
  window.toggleThermalReconVisor = noop;
  window.openCyberThreatMatrix = noop;
  window.defuseCyberThreat = noop;
  window.emergencyUnblackScreen = emergencyUnblackScreen;
})(window);
