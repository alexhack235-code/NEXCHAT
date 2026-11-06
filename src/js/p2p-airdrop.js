/**
 * NEXCHAT - P2P AIR-DROP COMPATIBILITY FORWARDER
 * Delegates directly to the master engine at window.NexMeshSync.AirDrop
 */
(function(global) {
  'use strict';
  if (!global.NexAirDropMesh && global.NexMeshSync?.AirDrop) {
    global.NexAirDropMesh = global.NexMeshSync.AirDrop;
  }
})(typeof window !== 'undefined' ? window : globalThis);
