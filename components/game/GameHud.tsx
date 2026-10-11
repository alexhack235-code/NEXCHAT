'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, WeaponType, LocationType, WEAPON_REGISTRY, PlanetWorld, PLANET_REGISTRY } from '@/lib/gameStore';
import {
  Skull,
  ShieldAlert,
  Coins,
  Flame,
  Zap,
  Crosshair,
  RotateCcw,
  Compass,
  Heart,
  AlertTriangle,
  Radio,
  ArrowLeft,
  Lock,
  Check,
  Car,
  Fuel,
  Wrench,
  Dna,
  BatteryCharging,
  Cpu,
  Layers,
  ChevronRight,
  ShieldCheck,
  X,
  Box,
  Download,
  Sparkles,
  RefreshCw,
  Globe,
  FileCode,
  Plane,
  Rocket,
  Server,
  Activity,
  Play,
  Pause,
  Award,
  Disc,
  Gauge,
  Wind,
  Target,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { assetLoader, ONLINE_ASSET_PRESETS, AssetMountTarget, LoadedAssetData } from '@/lib/assetLoader';

interface GameHudProps {
  touchInputRef?: React.MutableRefObject<{
    forward: number;
    strafe: number;
    shooting: boolean;
    jumping: boolean;
  }>;
}

export function GameHud({ touchInputRef }: GameHudProps) {
  const {
    mode,
    switchMode,
    nexToken,
    health,
    infection,
    isInfected,
    zombiesEliminated,
    adventureCoresFound,
    deductionAlert,
    rewardAlert,
    notification,
    isGameOver,
    respawn,
    resetGame,
    currentWeapon,
    unlockedWeapons,
    switchWeapon,
    buyWeapon,
    hasVehicle,
    inVehicle,
    vehicleHealth,
    vehicleMaxHealth,
    vehicleFuel,
    buyVehicle,
    toggleVehicle,
    repairVehicle,
    refuelVehicle,
    backpack,
    vault,
    nearLocation,
    depositToVault,
    withdrawFromVault,
    squadMessages,
    currentWorld,
    unlockedWorlds,
    isWarping,
    warpCountdown,
    launchRocketTo,
    hasPlane,
    inPlane,
    planeHealth,
    planeMaxHealth,
    planeAirspeed,
    planeAltitude,
    enterPlane,
    exitPlane,
    repairPlane,
    aiWorker,
    startAiShift,
    stopAiShift,
    claimAiCommission,
    healPlayer,
    buyHydration,
    stamina,
    maxStamina,
    jetpackFuel,
    maxJetpackFuel,
    isSprinting,
    isCrouching,
    isSliding,
    isAiming,
    weaponAmmo,
    isReloading,
    reloadCurrentWeapon,
    starshipFlight,
    startStarshipFlight,
    nuclearPlant,
    adjustControlRods,
    adjustCoolantFlow,
    startNuclearShift,
    stopNuclearShift,
    claimNuclearDividends,
    underground,
    enterUnderground,
    exitUnderground,
    toggleSubwayTransit,
    lootSewerSample,
  } = useGameStore();

  // Floating Alert Animations
  const [showDeduction, setShowDeduction] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [activeModal, setActiveModal] = useState<LocationType>('none');

  // 3D Asset Importer State
  const [customAssetUrl, setCustomAssetUrl] = useState('');
  const [customAssetTarget, setCustomAssetTarget] = useState<AssetMountTarget>('player');
  const [customAssetScale, setCustomAssetScale] = useState(1.0);
  const [isAssetLoading, setIsAssetLoading] = useState(false);
  const [assetStatusMsg, setAssetStatusMsg] = useState<string | null>(null);
  const [activeMountedAssets, setActiveMountedAssets] = useState<Record<AssetMountTarget, LoadedAssetData | null>>({
    player: null,
    vehicle: null,
    landmark: null,
    drone: null,
  });

  useEffect(() => {
    const unsub = assetLoader.subscribe((data) => {
      setActiveMountedAssets({ ...assetLoader.activeAssets });
      if (data.status === 'loaded') {
        setIsAssetLoading(false);
        setAssetStatusMsg(`SUCCESS: Mounted ${data.name} (${data.triangleCount.toLocaleString()} triangles)`);
      } else if (data.status === 'error') {
        setIsAssetLoading(false);
        setAssetStatusMsg(`ERROR: ${data.errorMessage || 'Failed to parse model'}`);
      } else if (data.status === 'loading') {
        setIsAssetLoading(true);
        setAssetStatusMsg(`DOWNLOADING: ${data.name}...`);
      }
    });
    return unsub;
  }, []);

  const handleMountPreset = async (preset: (typeof ONLINE_ASSET_PRESETS)[0]) => {
    setIsAssetLoading(true);
    setAssetStatusMsg(`FETCHING ${preset.name}...`);
    try {
      await assetLoader.loadAsset(preset.url, preset.target, preset.name, preset.scale);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network/CORS error';
      setAssetStatusMsg(`ERROR: ${msg}`);
    } finally {
      setIsAssetLoading(false);
    }
  };

  const handleMountCustomUrl = async () => {
    if (!customAssetUrl.trim()) return;
    setIsAssetLoading(true);
    setAssetStatusMsg(`DOWNLOADING ${customAssetUrl}...`);
    try {
      await assetLoader.loadAsset(customAssetUrl, customAssetTarget, undefined, customAssetScale);
      setCustomAssetUrl('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network/CORS error';
      setAssetStatusMsg(`ERROR: ${msg}`);
    } finally {
      setIsAssetLoading(false);
    }
  };

  const handleResetMounts = () => {
    assetLoader.removeAsset('player');
    assetLoader.removeAsset('vehicle');
    assetLoader.removeAsset('landmark');
    assetLoader.removeAsset('drone');
    setActiveMountedAssets({ player: null, vehicle: null, landmark: null, drone: null });
    setAssetStatusMsg('ALL MOUNTS RESET TO PROCEDURAL HIGH-POLY CAD RIGS');
  };

  useEffect(() => {
    if (deductionAlert) {
      setShowDeduction(true);
      const timer = setTimeout(() => setShowDeduction(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [deductionAlert]);

  useEffect(() => {
    if (rewardAlert) {
      setShowReward(true);
      const timer = setTimeout(() => setShowReward(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [rewardAlert]);

  // Touch joystick tracking
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.currentTarget.getBoundingClientRect();
    const centerX = target.left + target.width / 2;
    const centerY = target.top + target.height / 2;
    const deltaX = (touch.clientX - centerX) / (target.width / 2);
    const deltaY = (touch.clientY - centerY) / (target.height / 2);

    const clampedX = Math.max(-1, Math.min(1, deltaX));
    const clampedY = Math.max(-1, Math.min(1, deltaY));

    setTouchPos({ x: clampedX * 25, y: clampedY * 25 });

    if (touchInputRef?.current) {
      touchInputRef.current.strafe = clampedX;
      touchInputRef.current.forward = clampedY;
    }
  };

  const handleTouchEnd = () => {
    setTouchPos({ x: 0, y: 0 });
    if (touchInputRef?.current) {
      touchInputRef.current.strafe = 0;
      touchInputRef.current.forward = 0;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Toxic Infection Screen Vignette */}
      {isInfected && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
          style={{
            background:
              infection > 60
                ? 'radial-gradient(circle at center, transparent 40%, rgba(255, 0, 60, 0.45) 100%)'
                : 'radial-gradient(circle at center, transparent 50%, rgba(0, 255, 136, 0.3) 100%)',
          }}
        />
      )}

      {/* ============================================================ */}
      {/* TACTICAL ADS (AIM DOWN SIGHTS) PRECISION OVERLAY */}
      {/* ============================================================ */}
      {isAiming && !inVehicle && !inPlane && (
        <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
          {/* Subtle perimeter vignette darkening during ADS zoom */}
          <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/75 pointer-events-none" />

          {/* Holographic Precision Reticle */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Outer Range Ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/40 border-dashed animate-spin-slow" />
            <div className="absolute inset-4 rounded-full border border-cyan-500/20" />

            {/* Crosshair Precision Lines */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/70 -translate-x-1/2" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-400/70 -translate-y-1/2" />

            {/* Corner Brackets */}
            <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-cyan-400" />

            {/* Windage Ticks */}
            <div className="absolute top-1/2 left-10 -translate-y-1/2 flex flex-col gap-1.5">
              <span className="w-2 h-px bg-cyan-400/60" />
              <span className="w-3.5 h-px bg-cyan-400" />
              <span className="w-2 h-px bg-cyan-400/60" />
            </div>
            <div className="absolute top-1/2 right-10 -translate-y-1/2 flex flex-col gap-1.5">
              <span className="w-2 h-px bg-cyan-400/60" />
              <span className="w-3.5 h-px bg-cyan-400" />
              <span className="w-2 h-px bg-cyan-400/60" />
            </div>

            {/* Telemetry Labels */}
            <div className="absolute top-8 left-14 text-[9px] font-mono text-cyan-300 font-bold tracking-wider">
              OPTIC: 2.5X ADS
            </div>
            <div className="absolute bottom-8 right-14 text-[9px] font-mono text-[#00FF88] font-bold tracking-wider">
              SPREAD: -65% LOCK
            </div>

            {/* Precision Center Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#00F2FF]" />
          </div>
        </div>
      )}

      {/* Standard Hipfire Reticle (When NOT aiming, driving, or flying) */}
      {!isAiming && !inVehicle && !inPlane && (
        <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute top-0 w-0.5 h-2 bg-[#00FF88]/80 -translate-x-1/2 left-1/2" />
            <div className="absolute bottom-0 w-0.5 h-2 bg-[#00FF88]/80 -translate-x-1/2 left-1/2" />
            <div className="absolute left-0 h-0.5 w-2 bg-[#00FF88]/80 -translate-y-1/2 top-1/2" />
            <div className="absolute right-0 h-0.5 w-2 bg-[#00FF88]/80 -translate-y-1/2 top-1/2" />
            <div className="w-1 h-1 rounded-full bg-white/90" />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TOP BAR: Navigation, Mode Switcher, and Main NEXTOKEN Balance */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between w-full relative z-20 pointer-events-auto gap-2">
        {/* Back Link to Showcase & 3D Asset Importer */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A0E13]/90 backdrop-blur-md border border-white/10 text-white font-mono text-xs hover:border-[#00FF88] transition-colors shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Showcase</span>
          </Link>

          <button
            onClick={() => setActiveModal(activeModal === 'asset_importer' ? 'none' : 'asset_importer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00F2FF]/15 border border-[#00F2FF]/40 hover:bg-[#00F2FF]/30 text-[#00F2FF] font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
            title="Open 3D Online Asset Importer (Hotkey: O)"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden md:inline">[O] 3D ASSETS</span>
            <span className="md:hidden">3D</span>
          </button>

          <button
            onClick={() => setActiveModal(activeModal === 'spaceport' ? 'none' : 'spaceport')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/40 hover:bg-[#00FF88]/30 text-[#00FF88] font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            title="Interplanetary Space Rocket (Light-Years Travel)"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">[R] SPACEPORT</span>
          </button>

          <button
            onClick={() => setActiveModal(activeModal === 'ai_datacenter' ? 'none' : 'ai_datacenter')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/40 text-cyan-400 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
            title="AI Supercomputing Data Center (Mine Commissions)"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">[C] AI HUB</span>
          </button>

          <button
            onClick={() => setActiveModal(activeModal === 'nuclear_plant' ? 'none' : 'nuclear_plant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 hover:bg-cyan-900/40 text-cyan-300 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
            title="Nuclear Power Complex (Manage 2400 MWe Grid & Dividends)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">[N] NUCLEAR</span>
          </button>

          <button
            onClick={() => setActiveModal(activeModal === 'subway_station' ? 'none' : 'subway_station')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-400/40 hover:bg-emerald-900/40 text-emerald-300 font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            title="Subterranean Metro Subway Station & Bunker"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">[M] METRO</span>
          </button>
        </div>

        {/* Current Planetary World Telemetry Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 font-mono text-xs text-white">
          <Globe className="w-3.5 h-3.5 text-[#00F2FF]" />
          <span className="text-[#8696A0]">PLANET:</span>
          <span className="font-bold text-[#00F2FF]">{PLANET_REGISTRY[currentWorld]?.name || currentWorld}</span>
        </div>

        {/* Subterranean Level Telemetry Badge */}
        {underground.isUnderground && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400 font-mono text-xs text-emerald-300 font-bold animate-pulse">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>SUBTERRANEAN: -22.0M</span>
          </div>
        )}

        {/* Real-Time Mode Switcher */}
        <div className="flex items-center bg-[#070B0F]/90 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-2xl">
          <button
            onClick={() => switchMode('apocalypse')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full font-mono text-xs transition-all ${
              mode === 'apocalypse'
                ? 'bg-[#FF003C] text-white font-bold shadow-lg shadow-red-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZOMBIE APOCALYPSE</span>
            <span className="sm:hidden">ZOMBIE</span>
          </button>

          <button
            onClick={() => switchMode('adventure')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full font-mono text-xs transition-all ${
              mode === 'adventure'
                ? 'bg-[#00F2FF] text-black font-bold shadow-lg shadow-cyan-400/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ADVENTURE MODE</span>
            <span className="sm:hidden">ADVENTURE</span>
          </button>
        </div>

        {/* Main NEXTOKEN Balance Ticker with Floating Alerts */}
        <div className="relative">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#0A0E13]/90 backdrop-blur-md border border-[#00FF88]/30 font-mono text-xs sm:text-sm text-white shadow-xl">
            <Coins className="w-4 h-4 text-[#00FF88]" />
            <span className="font-bold text-[#00FF88]">{nexToken.toLocaleString()}</span>
            <span className="text-[10px] text-white/50 hidden sm:inline">NEXTOKEN</span>
          </div>

          {/* DEDUCTION ALERT (ZOMBIE BITE: -50 NEXTOKEN) */}
          {showDeduction && (
            <div className="absolute right-0 top-10 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/95 border border-red-500 text-red-400 font-mono text-xs font-bold shadow-2xl animate-bounce">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span>-50 NEXTOKEN [ZOMBIE BITE]</span>
            </div>
          )}

          {/* REWARD / LOOT ALERT */}
          {showReward && (
            <div className="absolute right-0 top-10 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/95 border border-[#00FF88] text-[#00FF88] font-mono text-xs font-bold shadow-2xl animate-pulse">
              <Coins className="w-3.5 h-3.5" />
              <span>{rewardAlert?.text || `+${rewardAlert?.amount} NEXTOKEN`}</span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOP LEFT: Health, Infection Bar, Backpack Resources & Telemetry */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start justify-between relative z-20 pointer-events-auto">
        <div className="max-w-xs w-full space-y-2 mt-2">
          {/* Health & Infection Container */}
          <div className="bg-[#0A0E13]/90 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-2 shadow-xl">
            <div className="flex justify-between items-center text-xs font-mono">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>OPERATIVE VITALS</span>
              </div>
              <span className={health < 30 ? 'text-red-400 font-bold' : 'text-white'}>
                {health}%
              </span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-300 ${
                  health < 30 ? 'bg-red-500' : health < 60 ? 'bg-yellow-400' : 'bg-[#00FF88]'
                }`}
                style={{ width: `${health}%` }}
              />
            </div>

            {/* Infection Gauge (Apocalypse mode) */}
            {mode === 'apocalypse' && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-[#00FF88] font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
                    <span className={isInfected ? 'text-red-400 animate-pulse' : 'text-[#8696A0]'}>
                      {isInfected ? 'INFECTION ACTIVE' : 'NO INFECTION'}
                    </span>
                  </div>
                  <span className={infection > 50 ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                    {infection}%
                  </span>
                </div>
                <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-300"
                    style={{ width: `${infection}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tactical Stamina Gauge */}
            <div className="pt-2 border-t border-white/5 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#8696A0] font-bold">// STAMINA [SHIFT / SPRINT]</span>
                <span className={stamina < 25 ? 'text-red-400 font-bold' : 'text-[#00F2FF]'}>
                  {Math.round(stamina)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-[#00F2FF] transition-all duration-75"
                  style={{ width: `${(stamina / maxStamina) * 100}%` }}
                />
              </div>
            </div>

            {/* Jetpack Propellant Fuel Gauge */}
            <div className="pt-1 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#8696A0] font-bold">// JETPACK PROPELLANT [SPACE]</span>
                <span className={jetpackFuel < 25 ? 'text-amber-400 font-bold' : 'text-[#00FF88]'}>
                  {Math.round(jetpackFuel)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#00FF88] transition-all duration-75"
                  style={{ width: `${(jetpackFuel / maxJetpackFuel) * 100}%` }}
                />
              </div>
            </div>

            {/* Dynamic Posture & Locomotion State Badges */}
            <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
              {isSliding && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-[9px] font-bold animate-pulse">
                  SLIDING
                </span>
              )}
              {isCrouching && !isSliding && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold">
                  CROUCHING
                </span>
              )}
              {isSprinting && (
                <span className="px-2 py-0.5 rounded bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88] font-mono text-[9px] font-bold animate-pulse">
                  TACTICAL SPRINT
                </span>
              )}
              {isAiming && (
                <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400 text-purple-300 font-mono text-[9px] font-bold">
                  ADS PRECISION
                </span>
              )}
              {!isSliding && !isCrouching && !isSprinting && !isAiming && (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-mono text-[9px]">
                  COMBAT READY
                </span>
              )}
            </div>
          </div>

          {/* Tactical Backpack Resource Bar */}
          <div className="bg-[#0A0E13]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 font-mono text-[11px] text-white flex items-center justify-between shadow-xl">
            <span className="text-[#8696A0] font-bold">// BACKPACK:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#00FF66]" title="Bio-Samples">
                <Dna className="w-3 h-3" />
                {backpack.bioSamples}
              </span>
              <span className="flex items-center gap-1 text-[#00F2FF]" title="Plasma Battery Cells">
                <BatteryCharging className="w-3 h-3" />
                {backpack.plasmaCells}
              </span>
              <span className="flex items-center gap-1 text-[#FFAA33]" title="Nano-Repair Scrap">
                <Wrench className="w-3 h-3" />
                {backpack.nanoScrap}
              </span>
            </div>
          </div>

          {/* Mission Stats Tag */}
          <div className="bg-[#0A0E13]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 font-mono text-[11px] text-[#8696A0] flex justify-between shadow-lg">
            <span>ZOMBIES ELIMINATED:</span>
            <span className="text-[#00FF88] font-bold">{zombiesEliminated}</span>
          </div>
        </div>

        {/* TOP RIGHT: Live Squad Radio Comms & Notifications */}
        <div className="hidden lg:flex flex-col gap-2 max-w-sm w-full">
          {notification && (
            <div className="bg-[#00FF88]/15 border border-[#00FF88] text-[#00FF88] font-mono text-xs px-3 py-1.5 rounded-lg backdrop-blur-md shadow-xl animate-pulse">
              &gt; {notification}
            </div>
          )}

          <div className="bg-[#0A0E13]/85 backdrop-blur-md border border-white/10 rounded-xl p-2.5 font-mono text-[11px] space-y-1.5 shadow-xl">
            <div className="flex items-center gap-1.5 text-[#00F2FF] font-bold border-b border-white/5 pb-1">
              <Radio className="w-3.5 h-3.5" />
              <span>SQUAD TELEMETRY COMMS</span>
            </div>
            {squadMessages.slice(0, 2).map((msg) => (
              <div key={msg.id} className="text-[#8696A0] leading-tight">
                <span className="text-white font-bold">{msg.sender}:</span> {msg.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SPACEX / NASA STARSHIP ORBITAL FLIGHT SIMULATION TELEMETRY HUD */}
      {/* ============================================================ */}
      {starshipFlight.isActive && (
        <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-3 sm:p-6 bg-black/40 backdrop-blur-[2px]">
          {/* TOP MISSION HEADER */}
          <div className="self-center bg-[#070B0F]/95 border-2 border-emerald-400/60 rounded-2xl px-5 py-2.5 sm:px-8 sm:py-3.5 shadow-[0_0_35px_rgba(0,255,136,0.3)] flex flex-wrap items-center justify-center gap-4 sm:gap-8 font-mono text-white pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span>SPACEX STARSHIP // MISSION CONTROL TELEMETRY</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  VEHICLE: BOOSTER 9 + SHIP 28 // 145M MECHAZILLA TOWER
                </div>
              </div>
            </div>

            {/* Mission Clock */}
            <div className="px-4 py-1.5 rounded-xl bg-black/60 border border-white/10 text-center">
              <div className="text-[9px] text-[#8696A0] font-bold">MISSION CLOCK</div>
              <div className="text-sm sm:text-base font-black text-cyan-400">
                {starshipFlight.phase === 'countdown'
                  ? `T-${Math.max(0, Math.ceil(starshipFlight.countdown))}S`
                  : `T+${Math.floor(starshipFlight.tPlus)}S`}
              </div>
            </div>

            {/* Current Phase Badge */}
            <div className="px-4 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center">
              <div className="text-[9px] text-[#8696A0] font-bold">FLIGHT REGIME</div>
              <div className="text-xs sm:text-sm font-black text-emerald-300">
                {starshipFlight.phase.toUpperCase().replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* FLIGHT TELEMETRY GAUGES (MIDDLE FLANKING SIDES) */}
          <div className="flex justify-between items-center w-full px-1 sm:px-6 pointer-events-none">
            {/* Left Telemetry Stack: Kinematics */}
            <div className="bg-[#0A0E13]/90 border border-white/10 rounded-2xl p-3 sm:p-4 font-mono text-white space-y-2.5 shadow-2xl max-w-[260px] sm:max-w-xs w-full pointer-events-auto">
              <div className="text-[11px] font-bold text-cyan-400 border-b border-white/10 pb-1 flex items-center justify-between">
                <span>FLIGHT KINEMATICS</span>
                <Gauge className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>ALTITUDE</span>
                  <span className="text-white font-bold">
                    {starshipFlight.altitude >= 1000
                      ? `${(starshipFlight.altitude / 1000).toFixed(2)} KM`
                      : `${Math.round(starshipFlight.altitude)} M`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${Math.min(100, (starshipFlight.altitude / 100000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>VELOCITY</span>
                  <span className="text-[#00FF88] font-bold">
                    {Math.round(starshipFlight.velocity * 3.6)} KM/H ({Math.round(starshipFlight.velocity)} M/S)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-[#00FF88] transition-all duration-100"
                    style={{ width: `${Math.min(100, (starshipFlight.velocity / 7800) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>DOWNRANGE DISTANCE</span>
                  <span className="text-white font-bold">
                    {(starshipFlight.downrange / 1000).toFixed(2)} KM
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>DYNAMIC PRESSURE</span>
                  <span className={starshipFlight.dynamicPressure > 35 ? 'text-amber-400 font-bold' : 'text-white'}>
                    {starshipFlight.dynamicPressure.toFixed(1)} KPA {starshipFlight.dynamicPressure > 35 ? '(MAX-Q)' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Telemetry Stack: Propulsion & Heat Shield */}
            <div className="bg-[#0A0E13]/90 border border-white/10 rounded-2xl p-3 sm:p-4 font-mono text-white space-y-2.5 shadow-2xl max-w-[260px] sm:max-w-xs w-full pointer-events-auto">
              <div className="text-[11px] font-bold text-emerald-400 border-b border-white/10 pb-1 flex items-center justify-between">
                <span>PROPULSION & SHIELD</span>
                <Zap className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>ACTIVE STAGE</span>
                  <span className="text-emerald-300 font-bold text-[10px]">
                    {starshipFlight.stage === 1 ? 'STAGE 1: 33 RAPTOR BOOSTER' : 'STAGE 2: 6 RAPTOR SHIP'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>THROTTLE LEVEL</span>
                  <span className="text-white font-bold">{Math.round(starshipFlight.throttle * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-100"
                    style={{ width: `${starshipFlight.throttle * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#8696A0]">
                  <span>METHALOX PROPELLANT</span>
                  <span className={starshipFlight.propellantRemaining < 20 ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {Math.round(starshipFlight.propellantRemaining)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-100"
                    style={{ width: `${starshipFlight.propellantRemaining}%` }}
                  />
                </div>
              </div>

              {starshipFlight.thermalStress > 5 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#8696A0]">
                    <span>PICA-X HEAT SHIELD LOAD</span>
                    <span className="text-red-400 font-bold">{Math.round(starshipFlight.thermalStress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-100 animate-pulse"
                      style={{ width: `${starshipFlight.thermalStress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM FLIGHT DIRECTOR TICKER */}
          <div className="self-center bg-[#070B0F]/95 border border-white/10 rounded-xl px-5 py-2 font-mono text-xs text-[#8696A0] pointer-events-auto shadow-xl text-center max-w-2xl">
            <span className="text-white font-bold">// FLIGHT DIRECTOR: </span>
            {starshipFlight.phase === 'countdown' && 'AUTONOMOUS LAUNCH SEQUENCE RUNNING. CRYOGENIC PROPELLANT LOADING VERIFIED.'}
            {starshipFlight.phase === 'ignition' && 'ALL 33 RAPTOR ENGINES PRODUCING 16.7 MILLION LBS THRUST. CLEARING 145M TOWER.'}
            {starshipFlight.phase === 'gravity_turn' && 'DOWNRANGE PITCH MANEUVER INITIATED. GRAVITY TURN TOWARD ORBITAL TRAJECTORY.'}
            {starshipFlight.phase === 'max_q' && 'MAXIMUM DYNAMIC PRESSURE (MAX-Q) ENCOUNTERED. SUPERSONIC CONDENSATION CONE FORMED.'}
            {starshipFlight.phase === 'meco' && 'MOST ENGINES CUTOFF (MECO). PREPARING HOT-STAGING RING IGNITION.'}
            {starshipFlight.phase === 'staging' && 'HOT-STAGING COMPLETE! SHIP 28 SECOND STAGE RAPTORS IGNITED. SUPER HEAVY BOOSTER SEPARATED.'}
            {starshipFlight.phase === 'orbital_insertion' && 'SECOND STAGE VACUUM RAPTORS FIRING TO REACH INSERTION VELOCITY (7,800 M/S).'}
            {starshipFlight.phase === 'reentry' && 'ATMOSPHERIC ENTRY. PICA-X TILES ABSORBING 1400 DEGREE C RE-ENTRY PLASMA HEATING.'}
            {starshipFlight.phase === 'belly_flop' && '90 DEGREE BELLY-FLOP SKYDIVE MANEUVER. 4 AERODYNAMIC FLAPS CONTROLLING DESCENT.'}
            {starshipFlight.phase === 'landing_burn' && 'RETRO-PROPULSION LANDING BURN COMPLETE. MECHAZILLA TOUCHDOWN SUCCESSFUL!'}
            {starshipFlight.phase === 'touchdown' && 'TOUCHDOWN COMPLETE. VEHICLE SECURED AT MECHAZILLA LAUNCH COMPLEX.'}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* INTERACTIVE LOCATION PROMPT (NEAR VAULT / ARMORY / GARAGE / FUEL) */}
      {/* ============================================================ */}
      {nearLocation !== 'none' && (
        <div className="self-center pointer-events-auto relative z-30 my-2">
          <button
            onClick={() => setActiveModal(nearLocation)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00F2FF] text-black font-mono text-xs font-black uppercase tracking-wider shadow-2xl shadow-[#00FF88]/40 hover:brightness-110 active:scale-95 transition-all animate-bounce"
          >
            {nearLocation === 'vault' && (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>ENTER NEXUS VAULT [ACCESS ASSET STORAGE]</span>
              </>
            )}
            {nearLocation === 'armory' && (
              <>
                <Crosshair className="w-4 h-4" />
                <span>OPEN CYBER ARMORY [BUY / UPGRADE GUNS]</span>
              </>
            )}
            {nearLocation === 'garage' && (
              <>
                <Car className="w-4 h-4" />
                <span>OPEN CYBER GARAGE [BUY ARMED COMBAT ROVER]</span>
              </>
            )}
            {nearLocation === 'fuel_station' && (
              <>
                <Fuel className="w-4 h-4" />
                <span>RECHARGE BAY [REFUEL COMBAT VEHICLE]</span>
              </>
            )}
            {nearLocation === 'asset_importer' && (
              <>
                <Box className="w-4 h-4" />
                <span>CENTRAL PLAZA [OPEN 3D ASSET IMPORTER & PBR ENGINE]</span>
              </>
            )}
            {nearLocation === 'spaceport' && (
              <>
                <Rocket className="w-4 h-4" />
                <span>SPACEX STARSHIP LAUNCH TOWER [BOARD B / TRAVEL R]</span>
              </>
            )}
            {nearLocation === 'ai_datacenter' && (
              <>
                <Server className="w-4 h-4" />
                <span>ENTER AI DATA CENTER [WORK & MINE COMMISSIONS]</span>
              </>
            )}
            {nearLocation === 'aircraft_carrier' && (
              <>
                <Plane className="w-4 h-4" />
                <span>CARRIER CATAPULT [BOARD SUPERSONIC STEALTH JET]</span>
              </>
            )}
            {nearLocation === 'recreational_center' && (
              <>
                <Activity className="w-4 h-4" />
                <span>ENTER RECREATIONAL ARENA [CYBER SPORTS & LOUNGE]</span>
              </>
            )}
            {nearLocation === 'nuclear_plant' && (
              <>
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>NUCLEAR POWER COMPLEX [MANAGE 2400 MWE REACTOR & GRID]</span>
              </>
            )}
            {nearLocation === 'subway_station' && (
              <>
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>
                  {underground.isUnderground
                    ? 'METRO SUBWAY STAIRS [ASCEND TO STREET LEVEL (F)]'
                    : 'METRO SUBWAY ENTRANCE [DESCEND TO UNDERGROUND (F)]'}
                </span>
              </>
            )}
            {nearLocation === 'underground_bunker' && (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>SUBTERRANEAN BIO-BUNKER [LOOT MUTAGEN SAMPLES (F)]</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEALTH FIGHTER JET FLIGHT HUD OVERLAY (WHEN FLYING) */}
      {/* ============================================================ */}
      {inPlane && (
        <div className="self-center bg-[#0A0E13]/95 backdrop-blur-xl border border-[#00F2FF]/60 rounded-2xl p-3 sm:px-6 sm:py-3.5 pointer-events-auto flex items-center gap-4 sm:gap-8 shadow-2xl shadow-cyan-500/30 font-mono z-30">
          <div className="flex items-center gap-2 text-[#00F2FF] font-bold">
            <Plane className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm">SUPERSONIC STEALTH JET</span>
              <span className="text-[10px] text-white/50">AIRSPACE: CARRIER CAT-01</span>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-6 text-xs text-white">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#8696A0]">AIRSPEED</span>
              <div className="text-[#00FF88] font-bold text-sm">{Math.round(planeAirspeed * 3.6)} KM/H</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#8696A0]">ALTITUDE</span>
              <div className="text-[#00F2FF] font-bold text-sm">{Math.round(planeAltitude)} M</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#8696A0]">MISSILES</span>
              <div className="text-[#FF003C] font-bold text-sm">ARMED</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exitPlane()}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 font-bold text-xs"
            >
              LAND / EXIT [E]
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VEHICLE HUD OVERLAY (WHEN DRIVING) */}
      {/* ============================================================ */}
      {inVehicle && (
        <div className="self-center bg-[#0A0E13]/95 backdrop-blur-xl border border-[#00F2FF]/40 rounded-2xl p-3 sm:px-6 sm:py-3.5 pointer-events-auto flex items-center gap-4 sm:gap-8 shadow-2xl shadow-cyan-500/20 font-mono z-30">
          <div className="flex items-center gap-2 text-[#00F2FF] font-bold">
            <Car className="w-5 h-5" />
            <span className="text-xs sm:text-sm">COMBAT ROVER</span>
          </div>

          {/* Vehicle Hull Durability */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#8696A0]">
              <span>ARMOR</span>
              <span className="text-white font-bold">{vehicleHealth} / {vehicleMaxHealth}</span>
            </div>
            <div className="w-24 sm:w-36 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-200 ${
                  vehicleHealth < 150 ? 'bg-red-500' : 'bg-[#00F2FF]'
                }`}
                style={{ width: `${(vehicleHealth / vehicleMaxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Fuel Level */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#8696A0]">
              <span>FUEL</span>
              <span className={`font-bold ${vehicleFuel < 20 ? 'text-red-400' : 'text-[#00FF88]'}`}>
                {Math.round(vehicleFuel)}%
              </span>
            </div>
            <div className="w-20 sm:w-28 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-200 ${
                  vehicleFuel < 20 ? 'bg-red-500' : 'bg-[#00FF88]'
                }`}
                style={{ width: `${vehicleFuel}%` }}
              />
            </div>
          </div>

          {/* Exit Car Action */}
          <button
            onClick={toggleVehicle}
            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold transition-colors"
          >
            EXIT [E]
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* BOTTOM BAR: Weapon Selector Dock & Mobile Controls */}
      {/* ============================================================ */}
      <div className="flex items-end justify-between w-full relative z-20 pointer-events-auto gap-2">
        {/* WEAPONS HOTBAR DOCK (Desktop & Mobile) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0A0E13]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            {(['plasma', 'shotgun', 'railgun', 'minigun'] as WeaponType[]).map((wep, idx) => {
              const def = WEAPON_REGISTRY[wep];
              const isUnlocked = unlockedWeapons.includes(wep);
              const isEquipped = currentWeapon === wep;

              return (
                <button
                  key={wep}
                  onClick={() => {
                    if (isUnlocked) switchWeapon(wep);
                    else setActiveModal('armory');
                  }}
                  className={`flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl font-mono text-[10px] transition-all relative ${
                    isEquipped
                      ? 'bg-[#00FF88]/20 border-2 border-[#00FF88] text-[#00FF88] shadow-lg shadow-[#00FF88]/20'
                      : isUnlocked
                      ? 'bg-black/40 border border-white/10 text-white/70 hover:border-white/30'
                      : 'bg-black/60 border border-white/5 text-white/30'
                  }`}
                >
                  <span className="absolute top-1 left-1.5 text-[9px] text-white/40">{idx + 1}</span>
                  {wep === 'plasma' && <Zap className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />}
                  {wep === 'shotgun' && <Flame className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />}
                  {wep === 'railgun' && <Crosshair className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />}
                  {wep === 'minigun' && <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />}

                  <span className="text-[9px] sm:text-[10px] font-bold truncate max-w-[55px]">
                    {wep.toUpperCase()}
                  </span>

                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ACTIVE WEAPON AMMO COUNTER & MECHANICAL RELOAD */}
          <div className="hidden sm:flex items-center gap-3 bg-[#0A0E13]/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 shadow-2xl font-mono">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#8696A0] font-bold">
                {WEAPON_REGISTRY[currentWeapon]?.name.toUpperCase()}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-base font-black ${
                  (weaponAmmo[currentWeapon]?.current ?? 0) <= 5
                    ? 'text-red-400 animate-pulse'
                    : 'text-white'
                }`}>
                  {weaponAmmo[currentWeapon]?.current ?? 0}
                </span>
                <span className="text-xs text-[#8696A0]">/</span>
                <span className="text-xs text-[#8696A0] font-bold">
                  {weaponAmmo[currentWeapon]?.reserve ?? 0}
                </span>
              </div>
            </div>

            <button
              onClick={() => reloadCurrentWeapon()}
              disabled={isReloading || (weaponAmmo[currentWeapon]?.current ?? 0) >= (WEAPON_REGISTRY[currentWeapon]?.magCapacity ?? 30)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                isReloading
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95'
              }`}
              title="Reload Magazine (Hotkey: R)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-amber-300' : ''}`} />
              <span>{isReloading ? 'RELOADING...' : '[R] RELOAD'}</span>
            </button>
          </div>
        </div>

        {/* Enter Vehicle Shortcut if near vehicle and not driving */}
        {hasVehicle && !inVehicle && (
          <button
            onClick={toggleVehicle}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F2FF]/20 border border-[#00F2FF] text-[#00F2FF] font-mono text-xs font-bold hover:bg-[#00F2FF]/30 transition-all shadow-lg"
          >
            <Car className="w-4 h-4" />
            <span>DRIVE VEHICLE [E]</span>
          </button>
        )}

        {/* Mobile Virtual Touch Joystick (Bottom Left) */}
        <div
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="md:hidden relative w-24 h-24 rounded-full bg-black/50 border-2 border-white/20 flex items-center justify-center touch-none"
        >
          <div
            className="w-10 h-10 rounded-full bg-[#00FF88]/70 border border-white shadow-lg pointer-events-none"
            style={{
              transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
            }}
          />
        </div>

        {/* Mobile Action Buttons (Bottom Right) */}
        <div className="md:hidden flex items-center gap-2">
          {hasVehicle && (
            <button
              onClick={toggleVehicle}
              className="w-12 h-12 rounded-full bg-[#00F2FF]/30 border-2 border-[#00F2FF] flex items-center justify-center text-[10px] font-mono font-bold text-[#00F2FF] active:scale-95 shadow-xl"
            >
              {inVehicle ? 'EXIT' : 'DRIVE'}
            </button>
          )}

          <button
            onTouchStart={() => {
              if (touchInputRef?.current) touchInputRef.current.jumping = true;
            }}
            onTouchEnd={() => {
              if (touchInputRef?.current) touchInputRef.current.jumping = false;
            }}
            className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-[10px] font-mono font-bold text-white active:scale-95 shadow-xl"
          >
            JUMP
          </button>

          <button
            onTouchStart={() => {
              if (touchInputRef?.current) touchInputRef.current.shooting = true;
            }}
            onTouchEnd={() => {
              if (touchInputRef?.current) touchInputRef.current.shooting = false;
            }}
            className="w-14 h-14 rounded-full bg-[#00FF88] border-2 border-white flex items-center justify-center text-xs font-mono font-black text-black active:scale-95 shadow-xl shadow-[#00FF88]/40"
          >
            FIRE
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. NEXUS VAULT MODAL (SECURE VALUABLE STORAGE) */}
      {/* ============================================================ */}
      {activeModal === 'vault' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-lg w-full bg-[#0A0E13] border-2 border-[#00FF88] rounded-2xl p-6 space-y-4 shadow-2xl shadow-[#00FF88]/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>NEXUS ASSET VAULT</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              Assets deposited into the Nexus Vault are encrypted and 100% immune to zombie bite penalty or combat loss upon death.
            </p>

            {/* Balances Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Backpack */}
              <div className="bg-black/40 border border-white/10 p-3 rounded-xl space-y-2">
                <div className="text-white/60 font-bold">// BACKPACK (AT RISK)</div>
                <div className="text-[#00FF88] font-bold">{nexToken.toLocaleString()} NEXTOKEN</div>
                <div className="text-[#00FF66]">{backpack.bioSamples} Bio-Samples</div>
                <div className="text-[#00F2FF]">{backpack.plasmaCells} Plasma Cells</div>
                <div className="text-[#FFAA33]">{backpack.nanoScrap} Nano-Scraps</div>
              </div>

              {/* Vault */}
              <div className="bg-black/40 border border-[#00FF88]/30 p-3 rounded-xl space-y-2">
                <div className="text-[#00FF88] font-bold">// VAULT (SECURE)</div>
                <div className="text-[#00FF88] font-bold">{vault.nexToken.toLocaleString()} NEXTOKEN</div>
                <div className="text-[#00FF66]">{vault.bioSamples} Bio-Samples</div>
                <div className="text-[#00F2FF]">{vault.plasmaCells} Plasma Cells</div>
                <div className="text-[#FFAA33]">{vault.nanoScrap} Nano-Scraps</div>
              </div>
            </div>

            {/* Deposit / Withdraw Controls */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => depositToVault('nexToken', 100)}
                  disabled={nexToken < 100}
                  className="flex-1 py-2 rounded-lg bg-[#00FF88]/20 border border-[#00FF88] hover:bg-[#00FF88]/30 text-[#00FF88] font-bold disabled:opacity-30"
                >
                  STORE 100 TOKENS
                </button>
                <button
                  onClick={() => withdrawFromVault('nexToken', 100)}
                  disabled={vault.nexToken < 100}
                  className="flex-1 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold disabled:opacity-30"
                >
                  WITHDRAW 100 TOKENS
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    depositToVault('bioSamples', backpack.bioSamples);
                    depositToVault('plasmaCells', backpack.plasmaCells);
                    depositToVault('nanoScrap', backpack.nanoScrap);
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#00F2FF]/20 border border-[#00F2FF] hover:bg-[#00F2FF]/30 text-[#00F2FF] font-bold"
                >
                  STORE ALL RESOURCES
                </button>
                <button
                  onClick={() => {
                    withdrawFromVault('bioSamples', vault.bioSamples);
                    withdrawFromVault('plasmaCells', vault.plasmaCells);
                    withdrawFromVault('nanoScrap', vault.nanoScrap);
                  }}
                  className="flex-1 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold"
                >
                  WITHDRAW ALL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CYBER ARMORY MODAL (CUSTOM GUNS SHOP) */}
      {/* ============================================================ */}
      {activeModal === 'armory' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-[#0A0E13] border-2 border-[#00F2FF] rounded-2xl p-6 space-y-4 shadow-2xl shadow-[#00F2FF]/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#00F2FF] font-bold text-base">
                <Crosshair className="w-5 h-5" />
                <span>CYBER ARMORY // CUSTOM WEAPONS</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(Object.keys(WEAPON_REGISTRY) as WeaponType[]).map((wepKey) => {
                const def = WEAPON_REGISTRY[wepKey];
                const isUnlocked = unlockedWeapons.includes(wepKey);
                const isEquipped = currentWeapon === wepKey;
                const canAfford = nexToken >= def.cost;
                const meetsKills = zombiesEliminated >= def.killsRequired;

                return (
                  <div
                    key={wepKey}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{def.name}</span>
                        {isEquipped && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#00FF88]/20 text-[#00FF88] font-bold">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8696A0]">{def.description}</p>
                      <div className="flex gap-4 text-[10px] text-white/60">
                        <span>DAMAGE: {def.damage}</span>
                        <span>COOLDOWN: {def.cooldown}s</span>
                        <span>REQ: {def.killsRequired} KILLS</span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button
                          onClick={() => {
                            switchWeapon(wepKey);
                            setActiveModal('none');
                          }}
                          disabled={isEquipped}
                          className="px-4 py-2 rounded-lg bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88] text-xs font-bold hover:bg-[#00FF88]/30 disabled:opacity-40"
                        >
                          {isEquipped ? 'ACTIVE' : 'EQUIP'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyWeapon(wepKey)}
                          disabled={!canAfford || !meetsKills}
                          className="px-4 py-2 rounded-lg bg-[#00F2FF]/20 border border-[#00F2FF] text-[#00F2FF] text-xs font-bold hover:bg-[#00F2FF]/30 disabled:opacity-30"
                        >
                          BUY ({def.cost} TOKENS)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CYBER GARAGE MODAL (COMBAT VEHICLE DEALER & REPAIRS) */}
      {/* ============================================================ */}
      {activeModal === 'garage' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-lg w-full bg-[#0A0E13] border-2 border-[#FFAA33] rounded-2xl p-6 space-y-4 shadow-2xl shadow-amber-500/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#FFAA33] font-bold text-base">
                <Car className="w-5 h-5" />
                <span>CYBER GARAGE // COMBAT ROVER BAY</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white">ARMED CYBER COMBAT ROVER</span>
                  <span className="text-[#00F2FF] font-bold">400 NEXTOKEN</span>
                </div>
                <p className="text-[#8696A0]">
                  Heavy armored twin-turret assault vehicle. Features high-speed zombie ramming and dual plasma roof cannons.
                </p>
                <div className="flex justify-between text-white/60 text-[11px]">
                  <span>KILLS REQUIRED: 10 (Current: {zombiesEliminated})</span>
                  <span>MAX ARMOR: 500 HP</span>
                </div>

                {!hasVehicle ? (
                  <button
                    onClick={() => {
                      if (buyVehicle()) setActiveModal('none');
                    }}
                    disabled={nexToken < 400 || zombiesEliminated < 10}
                    className="w-full py-2.5 rounded-xl bg-[#FFAA33]/20 border border-[#FFAA33] text-[#FFAA33] font-bold hover:bg-[#FFAA33]/30 disabled:opacity-30 transition-all"
                  >
                    PURCHASE & DEPLOY TO TARMAC
                  </button>
                ) : (
                  <div className="p-2 rounded bg-emerald-950/40 border border-[#00FF88] text-[#00FF88] text-center font-bold">
                    OWNED: DEPLOYED AT GARAGE BAY
                  </div>
                )}
              </div>

              {/* Vehicle Repair Station */}
              {hasVehicle && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white">FIELD REPAIR BAY</span>
                    <span className="text-white/60">ARMOR: {vehicleHealth} / {vehicleMaxHealth}</span>
                  </div>
                  <p className="text-[#8696A0]">
                    Consume 1 Nano-Repair Scrap to restore +200 HP to vehicle hull.
                  </p>
                  <button
                    onClick={() => repairVehicle(200)}
                    disabled={backpack.nanoScrap <= 0 || vehicleHealth >= vehicleMaxHealth}
                    className="w-full py-2 rounded-lg bg-[#00F2FF]/20 border border-[#00F2FF] text-[#00F2FF] font-bold hover:bg-[#00F2FF]/30 disabled:opacity-30"
                  >
                    REPAIR VEHICLE (+200 HP)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. CYBER FUEL STATION MODAL (REFUEL) */}
      {/* ============================================================ */}
      {activeModal === 'fuel_station' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-md w-full bg-[#0A0E13] border-2 border-[#00F2FF] rounded-2xl p-6 space-y-4 shadow-2xl shadow-cyan-500/20 font-mono text-white text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#00F2FF]/20 border border-[#00F2FF] flex items-center justify-center text-[#00F2FF]">
              <Fuel className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">CYBER FUEL & RECHARGE BAY</h3>
            <p className="text-xs text-[#8696A0]">
              Refuels Combat Rover to 100% capacity. Can consume 1 Plasma Battery Cell or 30 NEXTOKEN.
            </p>

            <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs flex justify-between">
              <span>CURRENT FUEL:</span>
              <span className="text-[#00FF88] font-bold">{Math.round(vehicleFuel)}%</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  refuelVehicle();
                  setActiveModal('none');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FF] to-[#00FF88] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all"
              >
                RECHARGE FULL (30 TOKENS / 1 CELL)
              </button>
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. 3D ONLINE ASSET IMPORTER & PBR ENGINE MODAL */}
      {/* ============================================================ */}
      {activeModal === 'asset_importer' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-auto overflow-y-auto">
          <div className="max-w-3xl w-full bg-[#0A0E13] border-2 border-[#00F2FF] rounded-2xl p-5 sm:p-7 space-y-5 shadow-2xl shadow-cyan-500/20 font-mono text-white max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00F2FF]/20 border border-[#00F2FF] flex items-center justify-center text-[#00F2FF]">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>3D ASSET IMPORTER // GLTF & PBR ENGINE</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40">
                      ONLINE READY
                    </span>
                  </h3>
                  <p className="text-xs text-[#8696A0]">
                    Directly import, load, and hot-swap free 3D models (.glb/.gltf) from online CDNs or local storage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Feedback Banner */}
            {assetStatusMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  assetStatusMsg.startsWith('ERROR')
                    ? 'bg-red-950/60 border-red-500 text-red-300'
                    : assetStatusMsg.startsWith('SUCCESS')
                    ? 'bg-emerald-950/60 border-[#00FF88] text-[#00FF88]'
                    : 'bg-cyan-950/60 border-[#00F2FF] text-[#00F2FF]'
                }`}
              >
                <span>&gt; {assetStatusMsg}</span>
                {isAssetLoading && (
                  <span className="animate-spin text-white">/</span>
                )}
              </div>
            )}

            {/* Section 1: Curated Verified Online Asset Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00F2FF] flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>PRESET ONLINE ASSETS (VERIFIED OPEN-ACCESS CDNS)</span>
                </span>
                <span className="text-[10px] text-[#8696A0]">CORS-Enabled High Speed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ONLINE_ASSET_PRESETS.map((preset) => {
                  const isMounted = activeMountedAssets[preset.target]?.url === preset.url;

                  return (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-xl bg-black/50 border border-white/10 hover:border-[#00F2FF]/40 transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-white">{preset.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-white/70 uppercase">
                            {preset.target}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8696A0] leading-snug">{preset.description}</p>
                        <div className="text-[9px] text-[#00FF88]/70">SOURCE: {preset.source}</div>
                      </div>

                      <div className="pt-1">
                        {isMounted ? (
                          <div className="w-full py-1.5 rounded-lg bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88] text-center font-bold text-xs flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>ACTIVE MOUNTED</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMountPreset(preset)}
                            disabled={isAssetLoading}
                            className="w-full py-1.5 rounded-lg bg-[#00F2FF]/20 border border-[#00F2FF] hover:bg-[#00F2FF]/30 text-[#00F2FF] font-bold text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>MOUNT TO {preset.target.toUpperCase()}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Custom Online URL / Local Path Importer */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-3">
              <span className="text-xs font-bold text-[#00FF88] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>LOAD CUSTOM 3D ASSET (ONLINE URL OR /models/ PATH)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="https://.../model.glb OR /models/car.glb"
                  value={customAssetUrl}
                  onChange={(e) => setCustomAssetUrl(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-lg bg-black/80 border border-white/20 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00F2FF]"
                />

                <select
                  value={customAssetTarget}
                  onChange={(e) => setCustomAssetTarget(e.target.value as AssetMountTarget)}
                  className="px-3 py-2 rounded-lg bg-black/80 border border-white/20 text-xs text-white focus:outline-none focus:border-[#00F2FF]"
                >
                  <option value="player">TARGET: PLAYER AVATAR</option>
                  <option value="vehicle">TARGET: COMBAT VEHICLE</option>
                  <option value="landmark">TARGET: PLAZA LANDMARK</option>
                  <option value="drone">TARGET: RECON DRONE</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#8696A0]">
                  <span>SCALE: {customAssetScale.toFixed(1)}x</span>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={customAssetScale}
                    onChange={(e) => setCustomAssetScale(parseFloat(e.target.value))}
                    className="w-24 accent-[#00F2FF]"
                  />
                </div>

                <button
                  onClick={handleMountCustomUrl}
                  disabled={!customAssetUrl.trim() || isAssetLoading}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00F2FF] to-[#00FF88] text-black font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>FETCH & MOUNT ASSET</span>
                </button>
              </div>
            </div>

            {/* Section 3: Local Storage / Offline Guide */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs text-[#8696A0]">
              <div className="font-bold text-white flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#00F2FF]" />
                <span>OFFLINE LOCAL STORAGE (ZERO CORS, INSTANT 60 FPS LOAD)</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                You can download free 3D models (.glb/.gltf) from <strong className="text-white">Sketchfab</strong>, <strong className="text-white">Kenney.nl</strong>, or <strong className="text-white">Mixamo</strong> and save them into the project folder:
              </p>
              <div className="p-2 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-[#00FF88]">
                c:\Users\USER\Desktop\WEB-PRINT BUILDER\public\models\character.glb
              </div>
              <p className="text-[10px] text-white/50">
                Any asset saved in public/models/ is loaded instantly using the relative URL &quot;/models/character.glb&quot; with 0ms network lag and zero CORS blockers.
              </p>
            </div>

            {/* Section 4: Active Mounts Telemetry & Reset */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-4 text-[11px] text-white/60">
                <span>PLAYER: {activeMountedAssets.player?.name || 'PROCEDURAL RIG'}</span>
                <span>VEHICLE: {activeMountedAssets.vehicle?.name || 'PROCEDURAL FLEET'}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetMounts}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RESET TO PROCEDURAL RIGS</span>
                </button>
                <button
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-2 rounded-lg bg-[#00FF88]/20 border border-[#00FF88] hover:bg-[#00FF88]/30 text-[#00FF88] font-bold text-xs"
                >
                  RESUME COMBAT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. ORBITAL SPACEPORT & INTERPLANETARY STARSHIP MODAL */}
      {/* ============================================================ */}
      {activeModal === 'spaceport' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-2xl w-full bg-[#0A0E13] border-2 border-[#00FF88] rounded-2xl p-6 space-y-5 shadow-2xl shadow-[#00FF88]/20 font-mono text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold text-base">
                <Rocket className="w-5 h-5 text-[#00FF88]" />
                <span>ORBITAL SPACEPORT // INTERPLANETARY GATEWAY</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              Launch into deep-space sub-orbital trajectory. Game worlds exist across different star systems light-years away. Travel requires orbital rocket ignition fueled by NEXTOKEN. You remain deployed on target worlds until boarding a return rocket.
            </p>

            {/* Current Colony Telemetry */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00F2FF]" />
                <span className="text-[#8696A0]">CURRENT DEPLOYMENT:</span>
                <span className="font-bold text-[#00FF88]">{PLANET_REGISTRY[currentWorld]?.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70">
                <span>BALANCE:</span>
                <span className="text-[#00FF88] font-bold">{nexToken.toLocaleString()} NEXTOKEN</span>
              </div>
            </div>

            {/* SpaceX Starship Flight Test Simulation Launcher */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border-2 border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span>SPACEX STARSHIP INTEGRATED FLIGHT TEST (B9/S28)</span>
                </div>
                <p className="text-[10px] text-[#8696A0] leading-relaxed">
                  Colossal 120m rocket &amp; 145m Mechazilla tower. 33 Raptor ignition, Max-Q shockwave, hot-staging interstage, orbital coast, re-entry plasma, 90-degree belly-flop skydive &amp; tower catch!
                </p>
              </div>
              <button
                onClick={() => {
                  startStarshipFlight();
                  setActiveModal('none');
                }}
                disabled={starshipFlight.isActive}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00F2FF] hover:brightness-110 active:scale-95 disabled:opacity-40 text-black font-black text-xs font-mono transition-all shadow-lg whitespace-nowrap"
              >
                {starshipFlight.isActive ? 'FLIGHT IN PROGRESS' : 'IGNITE STARSHIP [B]'}
              </button>
            </div>

            {/* Planets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(PLANET_REGISTRY) as PlanetWorld[]).map((pKey) => {
                const planet = PLANET_REGISTRY[pKey];
                const isCurrent = currentWorld === pKey;
                const canAfford = nexToken >= planet.ticketCost;

                return (
                  <div
                    key={pKey}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all space-y-3 ${
                      isCurrent
                        ? 'bg-[#00FF88]/10 border-[#00FF88] shadow-lg shadow-[#00FF88]/10'
                        : 'bg-black/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white text-xs">{planet.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            planet.danger === 'STABLE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : planet.danger === 'EXTREME'
                              ? 'bg-red-950 text-red-400 border border-red-500/40'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                          {planet.danger}
                        </span>
                      </div>

                      <div className="text-[10px] text-[#00F2FF] font-semibold">{planet.galaxy}</div>
                      <div className="text-[10px] text-[#8696A0]">
                        DISTANCE: {planet.distanceLightYears === 0 ? 'ORIGIN POINT' : `${planet.distanceLightYears} LIGHT-YEARS`}
                      </div>
                      <p className="text-[10px] text-white/60 leading-relaxed min-h-[40px]">
                        {planet.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#8696A0]">LAUNCH TICKET:</span>
                        <span className="text-[#00FF88] font-bold">
                          {planet.ticketCost === 0 ? 'FREE LAUNCH' : `${planet.ticketCost} NEXTOKEN`}
                        </span>
                      </div>

                      {isCurrent ? (
                        <div className="w-full py-2 rounded-lg bg-white/10 text-center text-[10px] font-bold text-white/60">
                          CURRENT LOCATION
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const success = launchRocketTo(pKey);
                            if (success) setActiveModal('none');
                          }}
                          disabled={!canAfford || isWarping}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-[#00FF88] to-[#00F2FF] hover:brightness-110 active:scale-95 text-black font-bold text-[10px] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>IGNITE WARP ROCKET</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-[#8696A0] flex items-center justify-between">
              <span>WARP ENGINE: CRYOGENIC LOX-METHALOX // WARP COILS ARMED</span>
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                RETURN TO SURFACE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. AI DATA CENTER & ROBOTICS COMMISSION HUB MODAL */}
      {/* ============================================================ */}
      {activeModal === 'ai_datacenter' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-[#0A0E13] border-2 border-[#00F2FF] rounded-2xl p-6 space-y-5 shadow-2xl shadow-cyan-500/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#00F2FF] font-bold text-base">
                <Server className="w-5 h-5 text-[#00F2FF]" />
                <span>AI SUPERCOMPUTING MATRIX // ROBOTICS NEURAL HUB</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              Industrial quantum server farm with robotic arm assembly lines. Players can clock in as decentralized AI Compute Validators to run neural weights and earn real-time commission payouts (+5.5 NEXTOKEN / sec).
            </p>

            {/* Telemetry Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] text-[#8696A0]">VALIDATOR STATUS</div>
                <div className={`text-xs font-bold mt-1 ${aiWorker.isWorking ? 'text-[#00FF88] animate-pulse' : 'text-white/40'}`}>
                  {aiWorker.isWorking ? 'ACTIVE VALIDATOR' : 'OFFLINE / IDLE'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] text-[#8696A0]">NEURAL HASH RATE</div>
                <div className="text-xs font-bold text-[#00F2FF] mt-1">
                  {aiWorker.isWorking ? '480.0 TFLOPS' : '0.0 TFLOPS'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] text-[#8696A0]">COMMISSION ACCRUED</div>
                <div className="text-xs font-bold text-[#00FF88] mt-1">
                  +{aiWorker.pendingCommission.toFixed(1)} NXC
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[10px] text-[#8696A0]">LIFETIME COMMISSIONS</div>
                <div className="text-xs font-bold text-white mt-1">
                  {aiWorker.totalEarned.toLocaleString()} NXC
                </div>
              </div>
            </div>

            {/* Neural Cluster Hardware Specs */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-[#8696A0]">
              <div className="font-bold text-white flex items-center justify-between">
                <span>NEURAL CLUSTER HARDWARE SPECIFICATIONS</span>
                <span className="text-[10px] text-[#00FF88] font-bold">CRYOGENIC HELIUM-4 COOLING</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>• Architecture: 8,192 Tensor Cores</div>
                <div>• Substation Power: 45 MW Liquid Helium</div>
                <div>• Robotic Arms: 6-Axis Hydraulic Servos</div>
                <div>• Network Bandwidth: 800 Gbps Low-Latency</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/10">
              {aiWorker.isWorking ? (
                <button
                  onClick={stopAiShift}
                  className="flex-1 py-3 rounded-xl bg-red-600/30 border border-red-500 hover:bg-red-600/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>CLOCK OUT // PAUSE COMPUTE SHIFT</span>
                </button>
              ) : (
                <button
                  onClick={startAiShift}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00F2FF] to-[#00FF88] hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  <span>CLOCK IN // START COMPUTE SHIFT (+5.5/S)</span>
                </button>
              )}

              <button
                onClick={claimAiCommission}
                disabled={aiWorker.pendingCommission < 1}
                className="py-3 px-5 rounded-xl bg-[#00FF88]/20 border border-[#00FF88] hover:bg-[#00FF88]/30 disabled:opacity-30 disabled:pointer-events-none text-[#00FF88] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>CLAIM COMMISSION (+{Math.floor(aiWorker.pendingCommission)} NEXTOKEN)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. NAVAL AIRCRAFT CARRIER CVN-99 & STEALTH JET MODAL */}
      {/* ============================================================ */}
      {activeModal === 'aircraft_carrier' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-[#0A0E13] border-2 border-[#00F2FF] rounded-2xl p-6 space-y-5 shadow-2xl shadow-cyan-500/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#00F2FF] font-bold text-base">
                <Plane className="w-5 h-5 text-[#00F2FF]" />
                <span>NAVAL SUPERCARRIER CVN-99 // STEALTH FLIGHT DECK</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              Nuclear-powered aircraft carrier stationed in the harbor basin. Equipped with electromagnetic catapults (EMALS), 120-meter flight deck, and twin-engine supersonic stealth fighter jets.
            </p>

            {/* Flight Deck Telemetry */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">CATAPULT LINE</div>
                <div className="text-[#00FF88] font-bold">READY (CAT-01)</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">AIRFRAME INTEGRITY</div>
                <div className="text-[#00F2FF] font-bold">{planeHealth} / {planeMaxHealth} HP</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">WEAPONS SYSTEM</div>
                <div className="text-[#FF003C] font-bold">PLASMA MISSILES</div>
              </div>
            </div>

            {/* Flight Control System Specs */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-[#8696A0]">
              <div className="font-bold text-white flex items-center justify-between">
                <span>SUPERSONIC FLIGHT CONTROLS GUIDE</span>
                <span className="text-[#00FF88] text-[10px] font-bold">MACH 2.4 CAPABLE</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>• [W] / [S]: Throttle & Pitch Up/Down</div>
                <div>• [A] / [D]: Aerodynamic Banking Roll</div>
                <div>• [F] / Space: Fire Air-to-Ground Missiles</div>
                <div>• [E]: Safe Catapult Touchdown / Eject</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/10">
              {planeHealth < planeMaxHealth && (
                <button
                  onClick={() => repairPlane(50)}
                  disabled={backpack.nanoScrap <= 0}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>REPAIR HULL (1 NANO-SCRAP)</span>
                </button>
              )}

              <button
                onClick={() => {
                  enterPlane();
                  setActiveModal('none');
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00F2FF] to-[#00FF88] hover:brightness-110 active:scale-95 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <Plane className="w-4 h-4" />
                <span>BOARD FIGHTER & LAUNCH CATAPULT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. RECREATIONAL ARENA & METAVERSE LOUNGE MODAL */}
      {/* ============================================================ */}
      {activeModal === 'recreational_center' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-[#0A0E13] border-2 border-[#00FF88] rounded-2xl p-6 space-y-5 shadow-2xl shadow-[#00FF88]/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold text-base">
                <Activity className="w-5 h-5 text-[#00FF88]" />
                <span>METAVERSE RECREATIONAL ARENA // ATHLETIC COMPLEX</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              Cyber-noir recreational mega-stadium featuring biometric energy turf, neon spectator galleries, and synthesis hydration dispensaries to replenish operator health during combat sorties.
            </p>

            {/* Stadium Status Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/50 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="text-[10px] text-[#8696A0]">OPERATOR VITALITY</div>
                <div className="text-[#00FF88] font-bold text-sm">{health} / 100 HP</div>
                <div className="text-[10px] text-white/50">Status: {health > 50 ? 'Optimal' : 'Compromised'}</div>
              </div>

              <div className="bg-black/50 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="text-[10px] text-[#8696A0]">SPECTATOR CAPACITY</div>
                <div className="text-[#00F2FF] font-bold text-sm">65,000 SEATS</div>
                <div className="text-[10px] text-white/50">Atmosphere: Pressurized Eco-Dome</div>
              </div>
            </div>

            {/* Recovery / Beverage Bar */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00FF88]" />
                  <span>NANO-SYNTH BIO-HYDRATION INFUSION</span>
                </div>
                <span className="text-[#00FF88] font-bold text-xs">25 NEXTOKEN</span>
              </div>

              <p className="text-[#8696A0] text-[11px] leading-relaxed">
                Purified cellular electrolytes infused with molecular nanites. Instantly restores +50 HP to physical resilience and clears residual fatigue.
              </p>

              <button
                onClick={() => buyHydration()}
                disabled={nexToken < 25 || health >= 100}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00F2FF] hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>PURCHASE BIO-HYDRATION (+50 HP)</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveModal('none')}
                className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                RETURN TO CITY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. NUCLEAR POWER COMPLEX & ELECTRICAL GRID CONTROL ROOM */}
      {/* ============================================================ */}
      {activeModal === 'nuclear_plant' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-[#0A0E13] border-2 border-cyan-400 rounded-2xl p-6 space-y-5 shadow-2xl shadow-cyan-500/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>NUCLEAR POWER COMPLEX // ELECTRICAL GRID CONTROL</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              2400 MWe nuclear fission facility with twin hyperbolic natural-draft cooling towers and Cherenkov reactor core. Powers the megacity skyscrapers, subterranean subway, and AI supercomputing clusters.
            </p>

            {/* Reactor Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">GRID OUTPUT</div>
                <div className="text-[#00FF88] font-bold text-sm">{nuclearPlant.powerOutputMW} MWE</div>
                <div className="text-[10px] text-white/40">Max: {nuclearPlant.maxCapacityMW} MW</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">CORE TEMP</div>
                <div className={`font-bold text-sm ${nuclearPlant.reactorTempC > 360 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {nuclearPlant.reactorTempC} DEG C
                </div>
                <div className="text-[10px] text-white/40">Limit: 400 C</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">RADIATION</div>
                <div className="text-emerald-400 font-bold text-sm">{nuclearPlant.radiationLevelRad.toFixed(2)} RAD</div>
                <div className="text-[10px] text-white/40">Shielded</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">GRID STATUS</div>
                <div className={`font-bold text-xs ${nuclearPlant.isGridStable ? 'text-[#00FF88]' : 'text-amber-400 animate-pulse'}`}>
                  {nuclearPlant.isGridStable ? 'STABLE 60HZ' : 'STRESSED'}
                </div>
                <div className="text-[10px] text-white/40">Synchronized</div>
              </div>
            </div>

            {/* Controls: Control Rods & Coolant Pumps */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">// CONTROL ROD INSERTION: {nuclearPlant.controlRodPercent}%</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => adjustControlRods(5)}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px]"
                  >
                    +5% INSERT (COOL)
                  </button>
                  <button
                    onClick={() => adjustControlRods(-5)}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px]"
                  >
                    -5% WITHDRAW (BOOST)
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white font-bold">// COOLANT PUMP FLOW: {nuclearPlant.coolantFlowPercent}%</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => adjustCoolantFlow(5)}
                    className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold text-[10px]"
                  >
                    +5% COOLANT
                  </button>
                  <button
                    onClick={() => adjustCoolantFlow(-5)}
                    className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold text-[10px]"
                  >
                    -5% COOLANT
                  </button>
                </div>
              </div>
            </div>

            {/* Actions: Shift & Dividends */}
            <div className="flex gap-3 pt-2 border-t border-white/10">
              {nuclearPlant.isWorkingShift ? (
                <button
                  onClick={stopNuclearShift}
                  className="flex-1 py-3 rounded-xl bg-amber-600/20 border border-amber-500 hover:bg-amber-600/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>CLOCK OUT // END POWER SHIFT</span>
                </button>
              ) : (
                <button
                  onClick={startNuclearShift}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-[#00FF88] hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  <span>CLOCK IN // GRID TECHNICIAN SHIFT (+8.5/S)</span>
                </button>
              )}

              <button
                onClick={claimNuclearDividends}
                disabled={nuclearPlant.technicianPayoutAvailable < 1}
                className="py-3 px-5 rounded-xl bg-[#00FF88]/20 border border-[#00FF88] hover:bg-[#00FF88]/30 disabled:opacity-30 disabled:pointer-events-none text-[#00FF88] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>CLAIM DIVIDENDS (+{Math.floor(nuclearPlant.technicianPayoutAvailable)} NEXTOKEN)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11. SUBTERRANEAN METRO TRANSIT & BIO-BUNKER */}
      {/* ============================================================ */}
      {activeModal === 'subway_station' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-[#0A0E13] border-2 border-emerald-400 rounded-2xl p-6 space-y-5 shadow-2xl shadow-emerald-500/20 font-mono text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>SUBTERRANEAN METRO TRANSIT // LEVEL -1 (Y: -22M)</span>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696A0] leading-relaxed">
              Real-world subterranean transit system excavated beneath the metropolis. Connects the Central Station platform, dual railway lines, cyber subway trains, and the fortified bio-quarantine research bunker.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">DEPTH LEVEL</div>
                <div className="text-[#00F2FF] font-bold text-sm">-22.0 METERS</div>
                <div className="text-[10px] text-white/40">Subterranean</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">METRO LINE</div>
                <div className="text-[#00FF88] font-bold text-sm">LINE 01 DOWNTOWN</div>
                <div className="text-[10px] text-white/40">Electrified Rail</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <div className="text-[10px] text-[#8696A0]">SUBWAY TRAIN</div>
                <div className="text-cyan-400 font-bold text-sm">{underground.metroTransitActive ? 'IN TRANSIT' : 'AT PLATFORM'}</div>
                <div className="text-[10px] text-white/40">3 Articulated Cars</div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  toggleSubwayTransit();
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Car className="w-4 h-4 text-cyan-400" />
                <span>{underground.metroTransitActive ? 'DISEMBARK SUBWAY TRAIN' : 'BOARD SUBWAY TRAIN [RAPID TRANSIT]'}</span>
              </button>

              <button
                onClick={() => {
                  if (underground.isUnderground) {
                    exitUnderground();
                  } else {
                    enterUnderground();
                  }
                  setActiveModal('none');
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00F2FF] hover:brightness-110 active:scale-95 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Layers className="w-4 h-4" />
                <span>{underground.isUnderground ? 'TAKE STAIRS TO SURFACE' : 'DESCEND TO UNDERGROUND'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GAME OVER MODAL */}
      {/* ============================================================ */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-md w-full bg-[#0A0E13] border-2 border-red-500 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl shadow-red-500/30">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500 animate-pulse">
              <Skull className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white">
              QUARANTINE PROTOCOL ACTIVATED
            </h2>

            <p className="text-sm font-mono text-[#8696A0] leading-relaxed">
              {infection >= 100
                ? 'Patient zero status confirmed. Severe zombie bite infection reached 100% capacity.'
                : 'Vital signs depleted in combat with the zombie horde.'}
            </p>

            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 font-mono text-xs text-red-300">
              UNSECURED BACKPACK TOKENS PENALIZED 15%. VAULT ASSETS (
              {vault.nexToken.toLocaleString()} NEXTOKEN) PRESERVED 100%.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={respawn}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:brightness-110 text-white font-mono font-bold text-xs uppercase transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                RESPAWN & ADMINISTER ANTIDOTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
