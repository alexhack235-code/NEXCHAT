'use client';

import React, { useRef } from 'react';
import NexGame3D from '@/components/game/NexGame3D';
import { GameHud } from '@/components/game/GameHud';

export default function GamePage() {
  const touchInputRef = useRef({
    forward: 0,
    strafe: 0,
    shooting: false,
    jumping: false,
  });

  return (
    <div className="w-screen h-screen h-[100dvh] bg-[#05080C] relative overflow-hidden select-none">
      {/* 3D WebGL Game Scene */}
      <NexGame3D touchInputRef={touchInputRef} />

      {/* Interactive HUD Overlay */}
      <GameHud touchInputRef={touchInputRef} />
    </div>
  );
}
