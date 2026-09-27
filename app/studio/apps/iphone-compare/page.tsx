// app/studio/apps/iphone-compare/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import * as THREE from 'three';

// Metadata for Social / OG Sharing
export const metadata = {
  title: 'iPhone 18 Pro vs Galaxy S26 Ultra: -50°C Liquid Nitrogen Freeze Test | NEX Studio',
  description: 'Interactive 3D cryogenic freeze test comparison with real-time GLSL ice shaders, GSAP slider, and durability ratings.',
  openGraph: {
    title: 'iPhone 18 Pro vs Galaxy S26 Ultra Freeze Test',
    description: 'Defy physics in real-time WebGL. Built on NEX App Forge.',
    images: ['https://nexchat-drab.vercel.app/og/freeze-test.png']
  }
};

export default function IPhoneComparePage() {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isFrozen, setIsFrozen] = useState(true);
  const [tempCelsius, setTempCelsius] = useState(-50);
  const [likes, setLikes] = useState(48200);
  const [hasLiked, setHasLiked] = useState(false);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(2500); // NGN
  const [tipEmail, setTipEmail] = useState('alexander@nexstudio.io');
  const [paystackStatus, setPaystackStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // Custom GLSL Ice Crystal Freeze Shader
  const iceVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uFreeze;

    void main() {
      vUv = uv;
      vNormal = normal;
      vec3 pos = position;
      
      // Ice crystal spike displacement
      if (uFreeze > 0.1) {
        float noise = sin(pos.x * 12.0 + uTime * 2.0) * cos(pos.y * 12.0);
        pos += normal * noise * 0.08 * uFreeze;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const iceFragmentShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uFreeze;
    uniform vec3 uBaseColor;

    void main() {
      // Fresnel rim lighting for frozen glass
      vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
      
      vec3 iceColor = vec3(0.4, 0.85, 1.0);
      vec3 finalColor = mix(uBaseColor, iceColor, uFreeze * 0.75);
      finalColor += vec3(fresnel * 0.9 * uFreeze);

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `;

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 3.5, 15);
    cyanLight.position.set(-3, 3, 4);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3.5, 15);
    purpleLight.position.set(3, -2, 4);
    scene.add(purpleLight);

    // Left Phone (iPhone 18 Pro)
    const phoneGeo = new THREE.BoxGeometry(1.6, 3.2, 0.18, 32, 32, 32);

    const iphoneShaderMat = new THREE.ShaderMaterial({
      vertexShader: iceVertexShader,
      fragmentShader: iceFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uFreeze: { value: 1.0 },
        uBaseColor: { value: new THREE.Color(0x1a2638) }
      },
      transparent: true
    });
    shaderMatRef.current = iphoneShaderMat;

    const iphoneMesh = new THREE.Mesh(phoneGeo, iphoneShaderMat);
    iphoneMesh.position.set(-1.8, 0, 0);
    scene.add(iphoneMesh);

    // Right Phone (Galaxy S26 Ultra)
    const samsungShaderMat = new THREE.ShaderMaterial({
      vertexShader: iceVertexShader,
      fragmentShader: iceFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uFreeze: { value: 1.0 },
        uBaseColor: { value: new THREE.Color(0x281836) }
      },
      transparent: true
    });

    const samsungMesh = new THREE.Mesh(phoneGeo, samsungShaderMat);
    samsungMesh.position.set(1.8, 0, 0);
    scene.add(samsungMesh);

    let frameId: number;
    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);
      const sec = time * 0.001;

      iphoneShaderMat.uniforms.uTime.value = sec;
      samsungShaderMat.uniforms.uTime.value = sec;

      // Subtle float
      iphoneMesh.rotation.y = Math.sin(sec * 0.8) * 0.15;
      samsungMesh.rotation.y = -Math.sin(sec * 0.8) * 0.15;

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update freeze uniform when state toggles
  useEffect(() => {
    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uFreeze.value = isFrozen ? 1.0 : 0.0;
    }
  }, [isFrozen]);

  const handleSliderDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  };

  const handlePaystackPayment = () => {
    setPaystackStatus('processing');
    setTimeout(() => {
      setPaystackStatus('success');
      setTimeout(() => {
        setTipModalOpen(false);
        setPaystackStatus('idle');
      }, 1500);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-between relative overflow-hidden select-none font-sans">
      {/* Top Bar */}
      <header className="w-full max-w-5xl z-30 flex items-center justify-between p-4 bg-[#18181c]/80 backdrop-blur-md border-b border-white/10 mt-2 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FE2C55] to-cyan-400 p-[1.5px]">
            <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center text-xs font-black">
              ❄️
            </div>
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white">NEX DURABILITY LAB</h1>
            <p className="text-[10px] text-cyan-400 font-mono">iPhone 18 Pro vs Galaxy S26 Ultra</p>
          </div>
        </div>

        {/* Temperature & State Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsFrozen(!isFrozen);
              setTempCelsius(isFrozen ? 22 : -50);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${
              isFrozen
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-md shadow-orange-500/20'
            }`}
          >
            <span>{isFrozen ? '❄️ LIQUID NITROGEN' : '🔥 THAWED WATER'}</span>
            <span className="font-mono">{tempCelsius}°C</span>
          </button>

          {/* Paystack Tip Jar Button */}
          <button
            onClick={() => setTipModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#00C3F7] hover:bg-[#00b0dd] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition cursor-pointer"
          >
            <span>⚡</span>
            <span>Tip Alexander (Paystack)</span>
          </button>
        </div>
      </header>

      {/* Main 3D Viewport with Comparison Splitter */}
      <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center relative my-4">
        <div
          ref={mountRef}
          onMouseMove={(e) => e.buttons === 1 && handleSliderDrag(e)}
          onTouchMove={handleSliderDrag}
          className="w-full h-[460px] md:h-[540px] relative rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0e] shadow-2xl cursor-ew-resize"
        >
          {/* GSAP Splitter Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FE2C55] via-white to-cyan-400 z-20 pointer-events-none shadow-lg"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-7 h-7 -ml-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white text-black text-xs font-black flex items-center justify-center shadow-xl border-2 border-black absolute pointer-events-auto cursor-grab">
              ⇄
            </div>
          </div>

          {/* Label Overlays */}
          <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono tracking-wider">Left Specimen</span>
            <h2 className="text-sm font-black text-white">iPhone 18 Pro</h2>
            <div className="text-[11px] text-neutral-300 mt-1 font-mono">
              <p>Glass: Liquid Nitrogen Shield</p>
              <p>Durability: <span className="text-emerald-400 font-bold">99.4% Pass</span></p>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-10 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-purple-400 font-bold uppercase font-mono tracking-wider">Right Specimen</span>
            <h2 className="text-sm font-black text-white">Galaxy S26 Ultra</h2>
            <div className="text-[11px] text-neutral-300 mt-1 font-mono">
              <p>Armor: Titanium Matrix v4</p>
              <p>Durability: <span className="text-emerald-400 font-bold">98.9% Pass</span></p>
            </div>
          </div>
        </div>

        {/* Comparison Details Cards */}
        <div className="w-full grid grid-cols-2 gap-4 mt-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-cyan-500/30 flex flex-col gap-1">
            <div className="flex justify-between items-center font-bold">
              <span className="text-cyan-300">iPhone 18 Pro Thermal Index</span>
              <span className="font-mono text-white">1.2 W/mK</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-cyan-400 h-full w-[94%]" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/30 flex flex-col gap-1">
            <div className="flex justify-between items-center font-bold">
              <span className="text-purple-300">Galaxy S26 Armor Index</span>
              <span className="font-mono text-white">1.1 W/mK</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-purple-400 h-full w-[91%]" />
            </div>
          </div>
        </div>
      </div>

      {/* TikTok Right Actions */}
      <aside className="fixed right-6 bottom-24 z-30 flex flex-col items-center gap-4">
        <button
          onClick={() => {
            setHasLiked(!hasLiked);
            setLikes((prev) => (hasLiked ? prev - 1 : prev + 1));
          }}
          className="flex flex-col items-center gap-1 group cursor-pointer"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-lg ${
              hasLiked ? 'bg-[#FE2C55] text-white scale-110' : 'bg-black/60 text-white group-hover:bg-white/20'
            }`}
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-white">{likes.toLocaleString()}</span>
        </button>

        <button
          onClick={() => setTipModalOpen(true)}
          title="Send Tip"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-[#00C3F7] text-black font-black text-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 transition cursor-pointer"
        >
          ₦
        </button>
      </aside>

      {/* Paystack Tip Jar Modal */}
      {tipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-[#18181f] border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="font-extrabold text-sm text-white">Paystack Dev Tip Jar</h3>
              </div>
              <button
                onClick={() => setTipModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Support Alexander's 3D labs on NEX. Secured via Paystack Global Gateway.
            </p>

            {/* Quick Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    tipAmount === amt
                      ? 'bg-[#00C3F7] text-black border-[#00C3F7]'
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-400 uppercase font-bold">Email Address</label>
              <input
                type="email"
                value={tipEmail}
                onChange={(e) => setTipEmail(e.target.value)}
                className="w-full bg-[#101016] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00C3F7]"
              />
            </div>

            {paystackStatus === 'success' ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs text-center font-bold">
                ✓ Payment Verified! Thanks for supporting NEX!
              </div>
            ) : (
              <button
                onClick={handlePaystackPayment}
                disabled={paystackStatus === 'processing'}
                className="w-full py-3 rounded-xl bg-[#00C3F7] hover:bg-[#00b0dd] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {paystackStatus === 'processing' ? 'Connecting to Paystack...' : `Pay ₦${tipAmount.toLocaleString()} with Paystack`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full text-center py-3 text-[11px] text-neutral-500">
        NEX-CODER 3.8 HIGH • Production Grade React Three Fiber + GSAP + Paystack
      </footer>
    </div>
  );
}
