import { create } from 'zustand';
import { gameAudio } from './gameAudio';

export type GameMode = 'apocalypse' | 'adventure';
export type PlanetWorld = 'earth_metropolis' | 'planet_oblivion' | 'nebula_prime';
export type WeaponType = 'plasma' | 'shotgun' | 'railgun' | 'minigun';
export type VehicleType = 'rover' | 'interceptor' | 'buggy';
export type LocationType =
  | 'none'
  | 'vault'
  | 'armory'
  | 'garage'
  | 'fuel_station'
  | 'asset_importer'
  | 'spaceport'
  | 'ai_datacenter'
  | 'aircraft_carrier'
  | 'recreational_center'
  | 'nuclear_plant'
  | 'subway_station'
  | 'underground_bunker';

export interface NuclearPlantState {
  powerOutputMW: number;
  maxCapacityMW: number;
  reactorTempC: number;
  radiationLevelRad: number;
  controlRodPercent: number;
  coolantFlowPercent: number;
  isGridStable: boolean;
  totalKWhGenerated: number;
  technicianPayoutAvailable: number;
  isWorkingShift: boolean;
}

export interface UndergroundState {
  isUnderground: boolean;
  subwayPlatform: 'central' | 'industrial' | 'harbor';
  metroTransitActive: boolean;
  bunkerAccessLevel: number;
  sewerBioSamplesFound: number;
}

export interface PlanetWorldDef {
  id: PlanetWorld;
  name: string;
  galaxy: string;
  distanceLightYears: number;
  ticketCost: number;
  description: string;
  atmosphere: string;
  danger: 'STABLE' | 'EXTREME' | 'COSMIC';
}

export const PLANET_REGISTRY: Record<PlanetWorld, PlanetWorldDef> = {
  earth_metropolis: {
    id: 'earth_metropolis',
    name: 'EARTH METROPOLIS',
    galaxy: 'SOL SYSTEM // SECTOR 01',
    distanceLightYears: 0,
    ticketCost: 0,
    description: 'Cyber-noir metropolis with skyscrapers, naval aircraft carrier harbor, AI supercomputing hub, and sports arena.',
    atmosphere: 'HABITABLE NITRO-OXYGEN',
    danger: 'STABLE',
  },
  planet_oblivion: {
    id: 'planet_oblivion',
    name: 'PLANET OBLIVION',
    galaxy: 'KRYPTON DECAY // GALAXY XI',
    distanceLightYears: 4.2,
    ticketCost: 150,
    description: 'Toxic apocalyptic mutant wasteland with dense zombie horde presence and acid fog. High risk, high bio-sample yields.',
    atmosphere: 'BIO-CORROSIVE TOXIC MIST',
    danger: 'EXTREME',
  },
  nebula_prime: {
    id: 'nebula_prime',
    name: 'NEBULA PRIME',
    galaxy: 'ANDROMEDA CORE // VOID 07',
    distanceLightYears: 12.8,
    ticketCost: 250,
    description: 'Deep-space quantum orbital colony. Low gravity, floating celestial asteroids, alien energy crystals.',
    atmosphere: 'VACUUM ZERO-G // PLASMA SHIELDED',
    danger: 'COSMIC',
  },
};

export type StarshipFlightPhase =
  | 'idle'
  | 'countdown'
  | 'ignition'
  | 'gravity_turn'
  | 'max_q'
  | 'meco'
  | 'staging'
  | 'orbital_insertion'
  | 'warp'
  | 'reentry'
  | 'belly_flop'
  | 'landing_burn'
  | 'touchdown';

export interface StarshipFlightState {
  isActive: boolean;
  phase: StarshipFlightPhase;
  countdown: number;
  tPlus: number;
  altitude: number;
  velocity: number;
  downrange: number;
  throttle: number;
  dynamicPressure: number;
  propellantRemaining: number;
  thermalStress: number;
  twr: number;
  stage: number;
  targetWorld: PlanetWorld | null;
}

export interface WeaponDef {
  id: WeaponType;
  name: string;
  cost: number;
  killsRequired: number;
  damage: number;
  cooldown: number;
  magCapacity: number;
  maxReserve: number;
  reloadTime: number;
  description: string;
}

export const WEAPON_REGISTRY: Record<WeaponType, WeaponDef> = {
  plasma: {
    id: 'plasma',
    name: 'PLASMA CARBINE',
    cost: 0,
    killsRequired: 0,
    damage: 35,
    cooldown: 0.2,
    magCapacity: 30,
    maxReserve: 150,
    reloadTime: 1.6,
    description: 'Standard issue rapid-fire electromagnetic rifle. High accuracy.',
  },
  shotgun: {
    id: 'shotgun',
    name: 'SCATTER SHOTGUN',
    cost: 150,
    killsRequired: 3,
    damage: 80,
    cooldown: 0.55,
    magCapacity: 8,
    maxReserve: 48,
    reloadTime: 2.2,
    description: 'Devastating close-range kinetic blast firing 5 heavy energy pellets.',
  },
  railgun: {
    id: 'railgun',
    name: 'HYPER GAUSS RAILGUN',
    cost: 350,
    killsRequired: 8,
    damage: 180,
    cooldown: 0.85,
    magCapacity: 4,
    maxReserve: 24,
    reloadTime: 2.8,
    description: 'Extreme velocity magnetic slug that pierces through multiple infected.',
  },
  minigun: {
    id: 'minigun',
    name: 'VULCAN CYBER MINIGUN',
    cost: 600,
    killsRequired: 15,
    damage: 28,
    cooldown: 0.08,
    magCapacity: 100,
    maxReserve: 400,
    reloadTime: 3.5,
    description: 'High-RPM rotating multi-barrel chaingun spraying suppressive fire.',
  },
};

export interface VehicleDef {
  id: VehicleType;
  name: string;
  cost: number;
  killsRequired: number;
  maxHealth: number;
  speed: number;
  description: string;
}

export const VEHICLE_REGISTRY: Record<VehicleType, VehicleDef> = {
  rover: {
    id: 'rover',
    name: 'HEAVY COMBAT ROVER',
    cost: 400,
    killsRequired: 10,
    maxHealth: 500,
    speed: 16.0,
    description: 'Armored all-terrain vehicle equipped with dual roof-mounted heavy plasma cannons.',
  },
  interceptor: {
    id: 'interceptor',
    name: 'CYBER INTERCEPTOR GT',
    cost: 650,
    killsRequired: 18,
    maxHealth: 380,
    speed: 24.0,
    description: 'High-speed aerodynamic supercar with twin front pulse laser emitters and drift dynamics.',
  },
  buggy: {
    id: 'buggy',
    name: 'BIO-HAZARD OFF-ROAD BUGGY',
    cost: 300,
    killsRequired: 6,
    maxHealth: 450,
    speed: 18.5,
    description: 'Reinforced roll-cage buggy with high-torque monster suspension and kinetic ramming bumper.',
  },
};

export interface SquadMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface GameState {
  mode: GameMode;
  nexToken: number;
  health: number;
  infection: number;
  isInfected: boolean;
  zombiesEliminated: number;
  adventureCoresFound: number;
  wave: number;
  isGameOver: boolean;

  // Weapons Arsenal
  currentWeapon: WeaponType;
  unlockedWeapons: WeaponType[];

  // Combat Vehicles Fleet
  currentVehicle: VehicleType;
  unlockedVehicles: VehicleType[];
  hasVehicle: boolean;
  inVehicle: boolean;
  vehicleHealth: number;
  vehicleMaxHealth: number;
  vehicleFuel: number; // 0 - 100

  // Resources Backpack
  backpack: {
    bioSamples: number;
    plasmaCells: number;
    nanoScrap: number;
  };

  // Safehouse Bank Vault (Protected from death)
  vault: {
    nexToken: number;
    bioSamples: number;
    plasmaCells: number;
    nanoScrap: number;
  };

  // Proximity to city interactive buildings
  nearLocation: LocationType;

  // Planetary Worlds & Rocket Travel
  currentWorld: PlanetWorld;
  unlockedWorlds: PlanetWorld[];
  isWarping: boolean;
  warpCountdown: number;
  warpTargetWorld: PlanetWorld | null;

  // Flyable Stealth Jet Fighter
  hasPlane: boolean;
  inPlane: boolean;
  planeHealth: number;
  planeMaxHealth: number;
  planeAirspeed: number;
  planeAltitude: number;

  // AI Data Center & Robotics Commission Work
  aiWorker: {
    isWorking: boolean;
    hashrate: number;
    pendingCommission: number;
    totalEarned: number;
    shiftSeconds: number;
  };

  // Squad Radio Comms
  squadMessages: SquadMessage[];

  // Alerts
  deductionAlert: { amount: number; id: number } | null;
  rewardAlert: { amount: number; text?: string; id: number } | null;
  notification: string | null;

  // Actions
  switchMode: (mode: GameMode) => void;
  applyZombieBite: (damage?: number, tokenLoss?: number) => void;
  collectToken: (amount: number) => void;
  cureInfection: () => void;
  healPlayer: (amount?: number) => void;
  buyHydration: () => boolean;
  incrementZombieKills: () => void;
  incrementCoresFound: () => void;

  // Weapon Actions
  switchWeapon: (weapon: WeaponType) => void;
  buyWeapon: (weapon: WeaponType) => boolean;

  // Vehicle Actions
  switchVehicle: (vehicle: VehicleType) => void;
  buyVehicle: (vehicle?: VehicleType) => boolean;
  enterVehicle: () => void;
  exitVehicle: () => void;
  toggleVehicle: () => void;
  damageVehicle: (dmg: number) => void;
  repairVehicle: (amount: number) => void;
  consumeFuel: (amt: number) => void;
  refuelVehicle: () => boolean;

  // Rocket & Interplanetary Travel Actions
  launchRocketTo: (targetWorld: PlanetWorld) => boolean;
  completeRocketWarp: () => void;

  // Plane Flight Actions
  enterPlane: () => void;
  exitPlane: () => void;
  damagePlane: (dmg: number) => void;
  repairPlane: (amt: number) => void;

  // AI Data Center Commission Actions
  startAiShift: () => void;
  stopAiShift: () => void;
  claimAiCommission: () => number;
  tickAiShift: (delta: number) => void;

  // Loot & Vault Actions
  lootResource: (type: 'bioSamples' | 'plasmaCells' | 'nanoScrap' | 'nexToken', amount: number) => void;
  depositToVault: (type: 'nexToken' | 'bioSamples' | 'plasmaCells' | 'nanoScrap', amount: number) => void;
  withdrawFromVault: (type: 'nexToken' | 'bioSamples' | 'plasmaCells' | 'nanoScrap', amount: number) => void;

  // Building Proximity
  setNearLocation: (loc: LocationType) => void;
  addSquadMessage: (sender: string, text: string) => void;
  setNotification: (text: string) => void;
  // Tactical Character Controller & Stamina
  stamina: number;
  maxStamina: number;
  jetpackFuel: number;
  maxJetpackFuel: number;
  isSprinting: boolean;
  isCrouching: boolean;
  isSliding: boolean;
  isAiming: boolean;

  // Weapon Magazine Ammo System
  weaponAmmo: Record<WeaponType, { current: number; reserve: number }>;
  isReloading: boolean;

  // SpaceX / NASA Colossal Starship Flight Simulation
  starshipFlight: StarshipFlightState;

  // Character Controller Actions
  setAiming: (aiming: boolean) => void;
  setCrouching: (crouching: boolean) => void;
  setSliding: (sliding: boolean) => void;
  consumeStamina: (amount: number) => boolean;
  consumeJetpack: (amount: number) => boolean;
  regenStaminaAndJetpack: (dt: number) => void;
  consumeAmmo: () => boolean;
  reloadCurrentWeapon: () => void;
  startStarshipFlight: (targetWorld?: PlanetWorld) => boolean;
  updateStarshipTelemetry: (data: Partial<StarshipFlightState>) => void;
  completeStarshipFlight: () => void;

  // Nuclear Power Complex & Electrical Grid
  nuclearPlant: NuclearPlantState;
  adjustControlRods: (delta: number) => void;
  adjustCoolantFlow: (delta: number) => void;
  startNuclearShift: () => void;
  stopNuclearShift: () => void;
  claimNuclearDividends: () => number;
  tickNuclearAndGrid: (delta: number) => void;

  // Real-World Underground Metro & Subterranean Bunker
  underground: UndergroundState;
  enterUnderground: () => void;
  exitUnderground: () => void;
  toggleSubwayTransit: () => void;
  lootSewerSample: () => void;

  respawn: () => void;
  resetGame: () => void;
}

const STORAGE_KEY = 'nextoken_game_balance';

function getInitialTokens(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val)) return val;
    }
  }
  return 1000;
}

function saveTokens(val: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, val.toString());
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'apocalypse',
  nexToken: getInitialTokens(),
  health: 100,
  infection: 0,
  isInfected: false,
  zombiesEliminated: 0,
  adventureCoresFound: 0,
  wave: 1,
  isGameOver: false,

  currentWeapon: 'plasma',
  unlockedWeapons: ['plasma'],

  // Tactical Character Controller & Stamina
  stamina: 100,
  maxStamina: 100,
  jetpackFuel: 100,
  maxJetpackFuel: 100,
  isSprinting: false,
  isCrouching: false,
  isSliding: false,
  isAiming: false,
  isReloading: false,

  weaponAmmo: {
    plasma: { current: 30, reserve: 150 },
    shotgun: { current: 8, reserve: 48 },
    railgun: { current: 4, reserve: 24 },
    minigun: { current: 100, reserve: 400 },
  },

  starshipFlight: {
    isActive: false,
    phase: 'idle',
    countdown: 0,
    tPlus: 0,
    altitude: 0,
    velocity: 0,
    downrange: 0,
    throttle: 0,
    dynamicPressure: 0,
    propellantRemaining: 100,
    thermalStress: 0,
    twr: 1.45,
    stage: 1,
    targetWorld: null,
  },

  nuclearPlant: {
    powerOutputMW: 2400,
    maxCapacityMW: 3200,
    reactorTempC: 295,
    radiationLevelRad: 0.08,
    controlRodPercent: 65,
    coolantFlowPercent: 92,
    isGridStable: true,
    totalKWhGenerated: 48500000,
    technicianPayoutAvailable: 0,
    isWorkingShift: false,
  },

  underground: {
    isUnderground: false,
    subwayPlatform: 'central',
    metroTransitActive: false,
    bunkerAccessLevel: 1,
    sewerBioSamplesFound: 0,
  },

  currentVehicle: 'rover',
  unlockedVehicles: [],
  hasVehicle: false,
  inVehicle: false,
  vehicleHealth: 500,
  vehicleMaxHealth: 500,
  vehicleFuel: 100,

  backpack: {
    bioSamples: 0,
    plasmaCells: 2,
    nanoScrap: 1,
  },

  vault: {
    nexToken: 0,
    bioSamples: 0,
    plasmaCells: 0,
    nanoScrap: 0,
  },

  nearLocation: 'none',

  // Planetary Worlds & Rocket Travel
  currentWorld: 'earth_metropolis',
  unlockedWorlds: ['earth_metropolis'],
  isWarping: false,
  warpCountdown: 0,
  warpTargetWorld: null,

  // Flyable Stealth Jet Fighter
  hasPlane: true,
  inPlane: false,
  planeHealth: 600,
  planeMaxHealth: 600,
  planeAirspeed: 0,
  planeAltitude: 0,

  // AI Data Center & Robotics Commission Work
  aiWorker: {
    isWorking: false,
    hashrate: 480,
    pendingCommission: 0,
    totalEarned: 0,
    shiftSeconds: 0,
  },

  squadMessages: [
    {
      id: '1',
      sender: 'SQUAD CIPHER-7',
      text: 'Grid telemetry online. Monitoring bio-signatures in perimeter sectors.',
      timestamp: Date.now(),
    },
  ],

  deductionAlert: null,
  rewardAlert: null,
  notification: null,

  switchMode: (mode) => {
    set({
      mode,
      infection: 0,
      isInfected: false,
      health: 100,
      isGameOver: false,
    });
  },

  applyZombieBite: (damage = 15, tokenLoss = 50) => {
    const { health, infection, nexToken, inVehicle } = get();

    if (inVehicle) {
      get().damageVehicle(damage * 1.5);
      return;
    }

    const newHealth = Math.max(0, health - damage);
    const newInfection = Math.min(100, infection + 18);
    const newTokens = Math.max(0, nexToken - tokenLoss);

    saveTokens(newTokens);
    gameAudio.playBite();

    set({
      health: newHealth,
      infection: newInfection,
      isInfected: true,
      nexToken: newTokens,
      deductionAlert: { amount: tokenLoss, id: Date.now() },
      isGameOver: newHealth <= 0 || newInfection >= 100,
    });
  },

  collectToken: (amount = 25) => {
    const { nexToken } = get();
    const newTokens = nexToken + amount;
    saveTokens(newTokens);
    gameAudio.playTokenPickup();

    set({
      nexToken: newTokens,
      rewardAlert: { amount, id: Date.now() },
    });
  },

  cureInfection: () => {
    const { health } = get();
    gameAudio.playCure();
    set({
      infection: 0,
      isInfected: false,
      health: Math.min(100, health + 30),
      notification: 'DECONTAMINATED: INFECTION PURGED',
    });
  },

  healPlayer: (amount = 20) => {
    const { health } = get();
    set({ health: Math.min(100, health + amount) });
  },

  buyHydration: () => {
    const { nexToken, health } = get();
    if (nexToken < 25 || health >= 100) return false;
    const nextBal = nexToken - 25;
    saveTokens(nextBal);
    gameAudio.playCure();
    set({
      nexToken: nextBal,
      health: Math.min(100, health + 50),
      deductionAlert: { amount: 25, id: Date.now() },
      notification: 'NANO-HYDRATION CONSUMED: +50 HP RESTORED',
    });
    return true;
  },

  incrementZombieKills: () => {
    const { zombiesEliminated } = get();
    gameAudio.playZombieHit();
    const nextKills = zombiesEliminated + 1;
    set({ zombiesEliminated: nextKills });

    if (nextKills % 5 === 0) {
      get().addSquadMessage(
        'SQUAD GHOST-9',
        `Confirmed kill count: ${nextKills}. Resupply stations are operational.`
      );
    }
  },

  incrementCoresFound: () => {
    const { adventureCoresFound } = get();
    gameAudio.playTokenPickup();
    set({ adventureCoresFound: adventureCoresFound + 1 });
  },

  switchWeapon: (weapon: WeaponType) => {
    const { unlockedWeapons } = get();
    if (unlockedWeapons.includes(weapon)) {
      set({ currentWeapon: weapon, notification: `EQUIPPED: ${WEAPON_REGISTRY[weapon].name}` });
    }
  },

  buyWeapon: (weapon: WeaponType) => {
    const { nexToken, zombiesEliminated, unlockedWeapons } = get();
    const def = WEAPON_REGISTRY[weapon];
    if (unlockedWeapons.includes(weapon)) return false;

    if (zombiesEliminated < def.killsRequired) {
      set({ notification: `LOCKED: REQUIRES ${def.killsRequired} ZOMBIE KILLS` });
      return false;
    }

    if (nexToken < def.cost) {
      set({ notification: `INSUFFICIENT NEXTOKEN (NEED ${def.cost})` });
      return false;
    }

    const nextBal = nexToken - def.cost;
    saveTokens(nextBal);
    gameAudio.playVault();

    set({
      nexToken: nextBal,
      unlockedWeapons: [...unlockedWeapons, weapon],
      currentWeapon: weapon,
      notification: `PURCHASED: ${def.name}`,
    });
    return true;
  },

  switchVehicle: (vehicle: VehicleType) => {
    const { unlockedVehicles } = get();
    if (unlockedVehicles.includes(vehicle)) {
      const def = VEHICLE_REGISTRY[vehicle];
      set({
        currentVehicle: vehicle,
        vehicleMaxHealth: def.maxHealth,
        vehicleHealth: def.maxHealth,
        notification: `ACTIVE VEHICLE: ${def.name}`,
      });
    }
  },

  buyVehicle: (vehicle: VehicleType = 'rover') => {
    const { nexToken, zombiesEliminated, unlockedVehicles } = get();
    const def = VEHICLE_REGISTRY[vehicle];

    if (unlockedVehicles.includes(vehicle)) return false;

    if (zombiesEliminated < def.killsRequired) {
      set({ notification: `GARAGE LOCKED: REQUIRES ${def.killsRequired} ZOMBIE KILLS` });
      return false;
    }

    if (nexToken < def.cost) {
      set({ notification: `INSUFFICIENT NEXTOKEN (NEED ${def.cost})` });
      return false;
    }

    const nextBal = nexToken - def.cost;
    saveTokens(nextBal);
    gameAudio.playVault();

    const newUnlocked = [...unlockedVehicles, vehicle];

    set({
      nexToken: nextBal,
      hasVehicle: true,
      currentVehicle: vehicle,
      unlockedVehicles: newUnlocked,
      vehicleHealth: def.maxHealth,
      vehicleMaxHealth: def.maxHealth,
      vehicleFuel: 100,
      notification: `${def.name} DELIVERED TO GARAGE BAY`,
    });
    return true;
  },

  enterVehicle: () => {
    const { hasVehicle, vehicleHealth } = get();
    if (!hasVehicle) return;
    if (vehicleHealth <= 0) {
      set({ notification: 'VEHICLE CRITICALLY DAMAGED: REPAIR REQUIRED' });
      return;
    }
    set({ inVehicle: true, notification: 'PILOT ENGAGED: VEHICLE ACTIVE' });
  },

  exitVehicle: () => {
    set({ inVehicle: false, notification: 'DISMOUNTED: ON FOOT' });
  },

  toggleVehicle: () => {
    const { inVehicle } = get();
    if (inVehicle) {
      get().exitVehicle();
    } else {
      get().enterVehicle();
    }
  },

  damageVehicle: (dmg: number) => {
    const { vehicleHealth } = get();
    const nextHp = Math.max(0, vehicleHealth - dmg);
    gameAudio.playBite();
    if (nextHp <= 0) {
      set({ vehicleHealth: 0, inVehicle: false, notification: 'VEHICLE COMPROMISED: FORCED EJECT' });
    } else {
      set({ vehicleHealth: nextHp });
    }
  },

  repairVehicle: (amount: number) => {
    const { vehicleHealth, vehicleMaxHealth, backpack } = get();
    if (backpack.nanoScrap <= 0) {
      set({ notification: 'NO NANO-SCRAP AVAILABLE FOR REPAIRS' });
      return;
    }
    const nextHp = Math.min(vehicleMaxHealth, vehicleHealth + amount);
    set({
      vehicleHealth: nextHp,
      backpack: { ...backpack, nanoScrap: backpack.nanoScrap - 1 },
      notification: `VEHICLE REPAIRED: +${amount} HP`,
    });
  },

  consumeFuel: (amt: number) => {
    const { vehicleFuel, inVehicle } = get();
    if (!inVehicle) return;
    const nextFuel = Math.max(0, vehicleFuel - amt);
    if (nextFuel <= 0 && vehicleFuel > 0) {
      set({ vehicleFuel: 0, notification: 'FUEL DEPLETED: LOCATE FUEL STATION' });
    } else {
      set({ vehicleFuel: nextFuel });
    }
  },

  refuelVehicle: () => {
    const { nexToken, backpack } = get();
    if (backpack.plasmaCells > 0) {
      gameAudio.playRefuel();
      set({
        vehicleFuel: 100,
        backpack: { ...backpack, plasmaCells: backpack.plasmaCells - 1 },
        notification: 'REFUELED TO 100% (CONSUMED 1 PLASMA CELL)',
      });
      return true;
    }

    if (nexToken >= 30) {
      const nextBal = nexToken - 30;
      saveTokens(nextBal);
      gameAudio.playRefuel();
      set({
        nexToken: nextBal,
        vehicleFuel: 100,
        notification: 'REFUELED TO 100% (-30 NEXTOKEN)',
      });
      return true;
    }

    set({ notification: 'NEED 30 NEXTOKEN OR 1 PLASMA CELL TO REFUEL' });
    return false;
  },

  // Rocket & Interplanetary Travel Actions
  launchRocketTo: (targetWorld) => {
    const { nexToken, currentWorld, isWarping } = get();
    if (isWarping || currentWorld === targetWorld) return false;
    const def = PLANET_REGISTRY[targetWorld];
    if (nexToken < def.ticketCost) {
      set({ notification: `INSUFFICIENT TOKENS. LAUNCH TICKET REQUIRES ${def.ticketCost} NEXTOKEN` });
      return false;
    }

    const nextBal = nexToken - def.ticketCost;
    saveTokens(nextBal);
    gameAudio.playRocketLaunch();

    set({
      nexToken: nextBal,
      isWarping: true,
      warpCountdown: 3,
      warpTargetWorld: targetWorld,
      inVehicle: false,
      inPlane: false,
      deductionAlert: def.ticketCost > 0 ? { amount: def.ticketCost, id: Date.now() } : null,
      notification: `ROCKET IGNITION: TRAJECTORY LOCKED TO ${def.name} (${def.distanceLightYears} LY)`,
    });

    setTimeout(() => {
      gameAudio.playWarpDrive();
    }, 1500);

    setTimeout(() => {
      get().completeRocketWarp();
    }, 3800);

    return true;
  },

  completeRocketWarp: () => {
    const { warpTargetWorld, unlockedWorlds } = get();
    if (!warpTargetWorld) return;
    const def = PLANET_REGISTRY[warpTargetWorld];
    const newUnlocked = unlockedWorlds.includes(warpTargetWorld)
      ? unlockedWorlds
      : [...unlockedWorlds, warpTargetWorld];

    set({
      currentWorld: warpTargetWorld,
      unlockedWorlds: newUnlocked,
      isWarping: false,
      warpTargetWorld: null,
      warpCountdown: 0,
      notification: `TOUCHDOWN AT ${def.name}. GALAXY: ${def.galaxy}`,
    });
  },

  // Plane Flight Actions
  enterPlane: () => {
    const { inVehicle } = get();
    if (inVehicle) get().exitVehicle();
    gameAudio.playJetThrust();
    set({
      inPlane: true,
      notification: 'ENGAGED JET FIGHTER COCKPIT. AIRSPACE CLEAR FOR TAKEOFF.',
    });
  },

  exitPlane: () => {
    set({
      inPlane: false,
      planeAirspeed: 0,
      planeAltitude: 0,
      notification: 'EXITED JET FIGHTER. ON GROUND DECK.',
    });
  },

  damagePlane: (dmg) => {
    const { planeHealth, inPlane } = get();
    const nextHP = Math.max(0, planeHealth - dmg);
    set({ planeHealth: nextHP });
    if (nextHP <= 0 && inPlane) {
      get().exitPlane();
      get().healPlayer(-40);
      set({ notification: 'JET CRITICAL! EMERGENCY PILOT EJECTION TRIGGERED.' });
    }
  },

  repairPlane: (amt) => {
    const { planeHealth, planeMaxHealth, backpack } = get();
    if (backpack.nanoScrap <= 0 || planeHealth >= planeMaxHealth) return;
    set({
      backpack: { ...backpack, nanoScrap: backpack.nanoScrap - 1 },
      planeHealth: Math.min(planeMaxHealth, planeHealth + amt),
      notification: `REPAIRED JET FIGHTER (+${amt} HP)`,
    });
  },

  // AI Data Center Commission Actions
  startAiShift: () => {
    const { aiWorker } = get();
    gameAudio.playAiComputeHash();
    set({
      aiWorker: { ...aiWorker, isWorking: true },
      notification: 'CLOCKED IN AT AI SUPERCOMPUTING DATA CENTER. MINING COMMISSIONS.',
    });
  },

  stopAiShift: () => {
    const { aiWorker } = get();
    set({
      aiWorker: { ...aiWorker, isWorking: false },
      notification: 'PAUSED AI COMPUTE SHIFT.',
    });
  },

  claimAiCommission: () => {
    const { aiWorker, nexToken } = get();
    const payout = Math.floor(aiWorker.pendingCommission);
    if (payout <= 0) return 0;
    const nextBal = nexToken + payout;
    saveTokens(nextBal);
    gameAudio.playCommissionPayout();
    set({
      nexToken: nextBal,
      aiWorker: {
        ...aiWorker,
        pendingCommission: 0,
        totalEarned: aiWorker.totalEarned + payout,
      },
      rewardAlert: { amount: payout, text: 'AI COMPUTE COMMISSION', id: Date.now() },
      notification: `CLAIMED ${payout} NEXTOKEN FROM AI DATA CENTER`,
    });
    return payout;
  },

  tickAiShift: (delta) => {
    const { aiWorker } = get();
    if (!aiWorker.isWorking) return;
    const added = delta * 5.5; // Earn 5.5 NEXTOKEN per second
    set({
      aiWorker: {
        ...aiWorker,
        pendingCommission: aiWorker.pendingCommission + added,
        shiftSeconds: aiWorker.shiftSeconds + delta,
      },
    });
  },

  lootResource: (type, amount) => {
    gameAudio.playLootResource();
    const { backpack, nexToken } = get();

    if (type === 'nexToken') {
      const nextBal = nexToken + amount;
      saveTokens(nextBal);
      set({
        nexToken: nextBal,
        rewardAlert: { amount, text: `+${amount} NEXTOKEN`, id: Date.now() },
      });
      return;
    }

    const nextBp = { ...backpack, [type]: backpack[type] + amount };
    const label =
      type === 'bioSamples'
        ? 'BIO-SAMPLE'
        : type === 'plasmaCells'
        ? 'PLASMA BATTERY CELL'
        : 'NANO-REPAIR SCRAP';

    set({
      backpack: nextBp,
      rewardAlert: { amount, text: `+${amount} ${label}`, id: Date.now() },
    });
  },

  depositToVault: (type, amount) => {
    const { nexToken, backpack, vault } = get();
    gameAudio.playVault();

    if (type === 'nexToken') {
      if (nexToken < amount) return;
      const nextBal = nexToken - amount;
      saveTokens(nextBal);
      set({
        nexToken: nextBal,
        vault: { ...vault, nexToken: vault.nexToken + amount },
        notification: `STORED ${amount} NEXTOKEN IN VAULT`,
      });
    } else {
      if (backpack[type] < amount) return;
      set({
        backpack: { ...backpack, [type]: backpack[type] - amount },
        vault: { ...vault, [type]: vault[type] + amount },
        notification: `STORED ${amount} ${type.toUpperCase()} IN VAULT`,
      });
    }
  },

  withdrawFromVault: (type, amount) => {
    const { nexToken, backpack, vault } = get();
    if (vault[type] < amount) return;
    gameAudio.playVault();

    if (type === 'nexToken') {
      const nextBal = nexToken + amount;
      saveTokens(nextBal);
      set({
        nexToken: nextBal,
        vault: { ...vault, nexToken: vault.nexToken - amount },
        notification: `WITHDREW ${amount} NEXTOKEN FROM VAULT`,
      });
    } else {
      set({
        backpack: { ...backpack, [type]: backpack[type] + amount },
        vault: { ...vault, [type]: vault[type] - amount },
        notification: `WITHDREW ${amount} ${type.toUpperCase()} FROM VAULT`,
      });
    }
  },

  setNearLocation: (loc) => {
    set({ nearLocation: loc });
  },

  addSquadMessage: (sender: string, text: string) => {
    const { squadMessages } = get();
    const msg: SquadMessage = {
      id: Math.random().toString(),
      sender,
      text,
      timestamp: Date.now(),
    };
    set({ squadMessages: [msg, ...squadMessages.slice(0, 5)] });
  },

  setNotification: (text: string) => {
    set({ notification: text });
  },

  // Tactical Character Controller Actions
  setAiming: (aiming: boolean) => set({ isAiming: aiming }),
  setCrouching: (crouching: boolean) => set({ isCrouching: crouching }),
  setSliding: (sliding: boolean) => {
    if (sliding) gameAudio.playSlideScrape();
    set({ isSliding: sliding });
  },

  consumeStamina: (amount: number) => {
    const { stamina } = get();
    if (stamina < amount) return false;
    set({ stamina: Math.max(0, stamina - amount) });
    return true;
  },

  consumeJetpack: (amount: number) => {
    const { jetpackFuel } = get();
    if (jetpackFuel < amount) return false;
    gameAudio.playJetpackThrust();
    set({ jetpackFuel: Math.max(0, jetpackFuel - amount) });
    return true;
  },

  regenStaminaAndJetpack: (dt: number) => {
    const { stamina, maxStamina, jetpackFuel, maxJetpackFuel, isSprinting } = get();
    let nextStamina = stamina;
    if (!isSprinting && stamina < maxStamina) {
      nextStamina = Math.min(maxStamina, stamina + 28 * dt);
    }
    let nextFuel = jetpackFuel;
    if (jetpackFuel < maxJetpackFuel) {
      nextFuel = Math.min(maxJetpackFuel, jetpackFuel + 18 * dt);
    }
    if (nextStamina !== stamina || nextFuel !== jetpackFuel) {
      set({ stamina: nextStamina, jetpackFuel: nextFuel });
    }
  },

  consumeAmmo: () => {
    const { currentWeapon, weaponAmmo, isReloading } = get();
    if (isReloading) return false;
    const currentAmmo = weaponAmmo[currentWeapon];
    if (currentAmmo.current <= 0) {
      get().reloadCurrentWeapon();
      return false;
    }
    set({
      weaponAmmo: {
        ...weaponAmmo,
        [currentWeapon]: {
          ...currentAmmo,
          current: currentAmmo.current - 1,
        },
      },
    });
    return true;
  },

  reloadCurrentWeapon: () => {
    const { currentWeapon, weaponAmmo, isReloading } = get();
    if (isReloading) return;
    const def = WEAPON_REGISTRY[currentWeapon];
    const ammoState = weaponAmmo[currentWeapon];
    if (ammoState.current >= def.magCapacity || ammoState.reserve <= 0) return;

    gameAudio.playWeaponReload();
    set({ isReloading: true, notification: `RELOADING ${def.name}...` });

    setTimeout(() => {
      const { weaponAmmo: latestAmmo } = get();
      const current = latestAmmo[currentWeapon];
      const needed = def.magCapacity - current.current;
      const amountToTransfer = Math.min(needed, current.reserve);

      set({
        isReloading: false,
        weaponAmmo: {
          ...latestAmmo,
          [currentWeapon]: {
            current: current.current + amountToTransfer,
            reserve: current.reserve - amountToTransfer,
          },
        },
        notification: `RELOADED: ${def.name} (${current.current + amountToTransfer}/${current.reserve - amountToTransfer})`,
      });
    }, def.reloadTime * 1000);
  },

  startStarshipFlight: (targetWorld: PlanetWorld = 'planet_oblivion') => {
    const { nexToken, unlockedWorlds } = get();
    const def = PLANET_REGISTRY[targetWorld] || PLANET_REGISTRY.planet_oblivion;
    const isUnlocked = unlockedWorlds.includes(targetWorld);
    const ticketCost = isUnlocked ? 0 : def.ticketCost;
    if (!isUnlocked && nexToken < ticketCost) {
      set({ notification: `INSUFFICIENT TOKENS FOR STARSHIP ORBITAL LAUNCH (${ticketCost} NEXTOKEN)` });
      return false;
    }

    const nextBal = Math.max(0, nexToken - ticketCost);
    saveTokens(nextBal);
    gameAudio.playStarshipRaptorRoar();

    set({
      nexToken: nextBal,
      inVehicle: false,
      inPlane: false,
      starshipFlight: {
        isActive: true,
        phase: 'countdown',
        countdown: 3,
        tPlus: 0,
        altitude: 0,
        velocity: 0,
        downrange: 0,
        throttle: 1.0,
        dynamicPressure: 0,
        propellantRemaining: 100,
        thermalStress: 0,
        twr: 1.45,
        stage: 1,
        targetWorld,
      },
      deductionAlert: ticketCost > 0 ? { amount: ticketCost, id: Date.now() } : null,
      notification: `SPACEX STARSHIP LAUNCH SEQUENCE INITIATED: T-3S TO RAPTOR IGNITION`,
    });
    return true;
  },

  updateStarshipTelemetry: (data: Partial<StarshipFlightState>) => {
    const { starshipFlight } = get();
    set({
      starshipFlight: {
        ...starshipFlight,
        ...data,
      },
    });
  },

  completeStarshipFlight: () => {
    const { starshipFlight, unlockedWorlds } = get();
    if (!starshipFlight.targetWorld) return;
    const target = starshipFlight.targetWorld;
    const def = PLANET_REGISTRY[target];
    const newUnlocked = unlockedWorlds.includes(target)
      ? unlockedWorlds
      : [...unlockedWorlds, target];

    set({
      currentWorld: target,
      unlockedWorlds: newUnlocked,
      starshipFlight: {
        ...starshipFlight,
        isActive: false,
        phase: 'touchdown',
      },
      notification: `STARSHIP TOUCHDOWN SUCCESSFUL AT ${def.name}! ATMOSPHERE: ${def.atmosphere}`,
    });
  },

  respawn: () => {
    const { nexToken } = get();
    const loss = Math.floor(nexToken * 0.15);
    const newTokens = Math.max(0, nexToken - loss);
    saveTokens(newTokens);

    set({
      health: 100,
      infection: 0,
      isInfected: false,
      isGameOver: false,
      inVehicle: false,
      nexToken: newTokens,
      notification: loss > 0 ? `RESPAWNED. LOST ${loss} UNSECURED TOKENS (VAULT PROTECTED)` : 'RESPAWNED AT BASE',
    });
  },

  // Nuclear Plant Actions
  adjustControlRods: (delta: number) => {
    const { nuclearPlant } = get();
    const nextRods = Math.max(10, Math.min(100, nuclearPlant.controlRodPercent + delta));
    // Inserting rods (higher %) lowers reaction rate, reducing temp & power output
    const targetTemp = 240 + (100 - nextRods) * 1.8;
    const targetPower = Math.round(nuclearPlant.maxCapacityMW * ((100 - nextRods) / 80));
    gameAudio.playElectricalHum();
    set({
      nuclearPlant: {
        ...nuclearPlant,
        controlRodPercent: nextRods,
        reactorTempC: Math.round(targetTemp),
        powerOutputMW: Math.max(400, Math.min(nuclearPlant.maxCapacityMW, targetPower)),
        isGridStable: targetTemp < 380,
      },
      notification: `NUCLEAR CONTROL RODS ADJUSTED: ${nextRods}% INSERTION (${targetPower} MWE)`,
    });
  },

  adjustCoolantFlow: (delta: number) => {
    const { nuclearPlant } = get();
    const nextFlow = Math.max(20, Math.min(100, nuclearPlant.coolantFlowPercent + delta));
    gameAudio.playElectricalHum();
    set({
      nuclearPlant: {
        ...nuclearPlant,
        coolantFlowPercent: nextFlow,
        reactorTempC: Math.max(220, Math.round(nuclearPlant.reactorTempC - delta * 0.4)),
      },
      notification: `REACTOR COOLANT FLOW: ${nextFlow}% (PUMPS OPERATIONAL)`,
    });
  },

  startNuclearShift: () => {
    const { nuclearPlant } = get();
    gameAudio.playElectricalHum();
    set({
      nuclearPlant: {
        ...nuclearPlant,
        isWorkingShift: true,
      },
      notification: 'CLOCKED IN AS NUCLEAR GRID OPERATOR: GENERATING POWER DIVIDENDS (+8.5 TOKENS/S)',
    });
  },

  stopNuclearShift: () => {
    const { nuclearPlant } = get();
    set({
      nuclearPlant: {
        ...nuclearPlant,
        isWorkingShift: false,
      },
      notification: 'CLOCKED OUT OF NUCLEAR CONTROL CONSOLE',
    });
  },

  claimNuclearDividends: () => {
    const { nuclearPlant, nexToken } = get();
    const earned = Math.floor(nuclearPlant.technicianPayoutAvailable);
    if (earned <= 0) return 0;
    const nextBal = nexToken + earned;
    saveTokens(nextBal);
    gameAudio.playTokenPickup();
    set({
      nexToken: nextBal,
      nuclearPlant: {
        ...nuclearPlant,
        technicianPayoutAvailable: 0,
      },
      rewardAlert: { amount: earned, text: `+${earned} NEXTOKEN (POWER GRID DIVIDEND)`, id: Date.now() },
      notification: `CLAIMED ${earned} NEXTOKEN CLEAN ENERGY COMMISSION`,
    });
    return earned;
  },

  tickNuclearAndGrid: (delta: number) => {
    const { nuclearPlant } = get();
    const kWhAdded = (nuclearPlant.powerOutputMW * 1000 * delta) / 3600;
    let nextPayout = nuclearPlant.technicianPayoutAvailable;
    if (nuclearPlant.isWorkingShift && nuclearPlant.isGridStable) {
      nextPayout += delta * 8.5; // 8.5 tokens per second on shift
    }
    set({
      nuclearPlant: {
        ...nuclearPlant,
        totalKWhGenerated: nuclearPlant.totalKWhGenerated + Math.round(kWhAdded),
        technicianPayoutAvailable: nextPayout,
      },
    });
  },

  // Underground Transit & Bunker Actions
  enterUnderground: () => {
    const { underground } = get();
    gameAudio.playElevatorHum();
    set({
      underground: {
        ...underground,
        isUnderground: true,
      },
      nearLocation: 'none',
      notification: 'DESCENDED TO SUBTERRANEAN METRO STATION // LEVEL -1 (Y: -22M)',
    });
  },

  exitUnderground: () => {
    const { underground } = get();
    gameAudio.playElevatorHum();
    set({
      underground: {
        ...underground,
        isUnderground: false,
      },
      nearLocation: 'none',
      notification: 'ASCENDED TO STREET LEVEL METROPOLIS // SURFACE (Y: 0M)',
    });
  },

  toggleSubwayTransit: () => {
    const { underground } = get();
    gameAudio.playSubwayTrainRumble();
    const nextActive = !underground.metroTransitActive;
    set({
      underground: {
        ...underground,
        metroTransitActive: nextActive,
      },
      notification: nextActive
        ? 'BOARDED METRO TRAIN: RAPID TRANSIT ACTIVE THROUGH SUBTERRANEAN CITY'
        : 'DISEMBARKED METRO TRAIN: STATION PLATFORM SECURED',
    });
  },

  lootSewerSample: () => {
    const { underground, backpack } = get();
    gameAudio.playTokenPickup();
    set({
      underground: {
        ...underground,
        sewerBioSamplesFound: underground.sewerBioSamplesFound + 1,
      },
      backpack: {
        ...backpack,
        bioSamples: backpack.bioSamples + 2,
      },
      rewardAlert: { amount: 2, text: '+2 RARE SUBTERRANEAN BIO-SAMPLES', id: Date.now() },
      notification: 'LOOTED MUTAGENIC SAMPLE FROM SUBTERRANEAN DRAINAGE TUNNEL',
    });
  },

  resetGame: () => {
    set({
      health: 100,
      infection: 0,
      isInfected: false,
      zombiesEliminated: 0,
      adventureCoresFound: 0,
      isGameOver: false,
      inVehicle: false,
      deductionAlert: null,
      rewardAlert: null,
      notification: null,
    });
  },
}));
