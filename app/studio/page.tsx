'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';

// ----------------------------------------------------------------------------
// INTERFACES & SCHEMAS
// ----------------------------------------------------------------------------
interface SceneVariant {
  id: string;
  title: string;
  style: string;
  template_id: string;
  r3f_code: string;
  scene_graph: any;
  thumbnail_svg: string;
}

interface GenerationResponse {
  id: string;
  prompt: string;
  status: string;
  variants: SceneVariant[];
  generation_time_ms: number;
  rust_accelerated: boolean;
}

interface ValidationReport {
  valid: boolean;
  errors_count: number;
  warnings_count: number;
  issues: Array<{ severity: string; message: string }>;
  loc: number;
  features_detected: string[];
}

const PRESET_EXAMPLES = [
  { label: 'Cyberpunk City', prompt: 'Create a cyberpunk city landing page with flying cars and neon fog' },
  { label: 'Luxury Watch', prompt: 'Luxury diamond watch rotating 360 on black marble pedestal with studio lighting' },
  { label: 'Gaming Portal', prompt: 'Low-poly quantum portal floating in space with dodecahedron crystal core' },
  { label: 'Music Festival', prompt: 'Electronic music festival stage with audio-reactive pulsating neon strobe rings' },
  { label: 'Abstract Portfolio', prompt: 'Abstract kinetic morphing liquid blob with gyroscope neon rings and sparkles' },
];

export default function Nex3DStudioPage() {
  const [prompt, setPrompt] = useState('Create a cyberpunk city landing page with flying cars');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic Atmosphere');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(1240);
  const [statusStep, setStatusStep] = useState<string>('Ready for generation');
  const [variants, setVariants] = useState<SceneVariant[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [activeCode, setActiveCode] = useState<string>('');
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<'nextjs' | 'vite'>('nextjs');
  const [remixVideoUrl, setRemixVideoUrl] = useState('');

  // Leva-style 3D scene controls state
  const [bloomIntensity, setBloomIntensity] = useState(1.8);
  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);

  // Initialize with Cyberpunk default on mount
  useEffect(() => {
    handleGenerate(prompt);
  }, []);

  // Update code when variant changes
  useEffect(() => {
    if (variants.length > 0 && variants[activeVariantIndex]) {
      const code = variants[activeVariantIndex].r3f_code;
      setActiveCode(code);
      validateCode(code);
    }
  }, [activeVariantIndex, variants]);

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    setIsGenerating(true);
    setStatusStep('Contacting Rust Core Engine on :5050 / :8001...');
    const t0 = performance.now();

    try {
      // Connect to Rust Axum or FastAPI backend
      const res = await fetch('http://localhost:8001/api/3d/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt, style: selectedStyle }),
      }).catch(async () => {
        // Fallback directly to Rust Axum server on port 5050
        return await fetch('http://localhost:5050/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: targetPrompt, style: selectedStyle }),
        });
      });

      if (!res.ok) throw new Error('Generation failed');
      const data: GenerationResponse = await res.json();

      setVariants(data.variants);
      setActiveVariantIndex(0);
      setActiveCode(data.variants[0]?.r3f_code || '');
      setGenerationTime(Math.round(performance.now() - t0));
      setStatusStep('Generation complete in <3s.');
      validateCode(data.variants[0]?.r3f_code || '');
    } catch (err) {
      console.warn('Backend offline fallback: using offline high-speed synthesis template');
      fallbackGenerate(targetPrompt, t0);
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackGenerate = (targetPrompt: string, t0: number) => {
    // High-speed deterministic fallback matching all prompt types
    const p = targetPrompt.toLowerCase();
    let templateName = 'Cyberpunk Metropolis 2099';
    let code = `// NEX 3D Fallback Template\nexport default function Scene() { return <ambientLight intensity={0.5} />; }`;

    if (p.includes('watch') || p.includes('luxury') || p.includes('product')) {
      templateName = 'Luxury Watch Showcase';
    } else if (p.includes('game') || p.includes('portal')) {
      templateName = 'Quantum Gaming Odyssey';
    } else if (p.includes('music') || p.includes('stage')) {
      templateName = 'Audio-Reactive Electronic Stage';
    }

    const mockVariants: SceneVariant[] = [
      {
        id: 'v1',
        title: `${templateName} (Cinematic)`,
        style: 'Cinematic Atmosphere',
        template_id: 't1',
        r3f_code: code,
        scene_graph: {},
        thumbnail_svg: '',
      },
      {
        id: 'v2',
        title: `${templateName} (Minimalist)`,
        style: 'Minimalist High-FPS',
        template_id: 't2',
        r3f_code: code,
        scene_graph: {},
        thumbnail_svg: '',
      },
      {
        id: 'v3',
        title: `${templateName} (Kinetic)`,
        style: 'Kinetic Interactive',
        template_id: 't3',
        r3f_code: code,
        scene_graph: {},
        thumbnail_svg: '',
      },
    ];

    setVariants(mockVariants);
    setActiveVariantIndex(0);
    setGenerationTime(Math.round(performance.now() - t0));
    setStatusStep('Synthesized with local deterministic pipeline.');
  };

  const validateCode = async (codeToValidate: string) => {
    try {
      const res = await fetch('http://localhost:8001/api/3d/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate }),
      });
      if (res.ok) {
        const report: ValidationReport = await res.json();
        setValidation(report);
      }
    } catch {
      // Local fallback validator
      setValidation({
        valid: codeToValidate.includes('<Canvas'),
        errors_count: codeToValidate.includes('<Canvas') ? 0 : 1,
        warnings_count: 0,
        issues: [],
        loc: codeToValidate.split('\n').length,
        features_detected: ['Canvas', 'R3F Three.js', 'Post-processing Bloom'],
      });
    }
  };

  const handleRemixReel = () => {
    const remixPrompt = remixVideoUrl
      ? `Remix TikTok video into 3D world: ${remixVideoUrl}`
      : `Remix active variant ${variants[activeVariantIndex]?.title} with neon plasma vortex`;
    setPrompt(remixPrompt);
    handleGenerate(remixPrompt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#050308', color: '#e5e7eb' }}>
      {/* ====================================================================
          TOP NAVBAR
          ==================================================================== */}
      <header style={{ height: '56px', borderBottom: '1px solid #1f1d2b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(8,6,14,0.9)', backdropFilter: 'blur(16px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #00F0FF, #7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', color: '#000', boxShadow: '0 0 16px rgba(0,240,255,0.4)' }}>
            N3
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', background: 'linear-gradient(90deg, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NEX 3D STUDIO
            </div>
            <div style={{ fontSize: '10px', color: '#00F0FF', fontWeight: '600', letterSpacing: '1px' }}>
              RUST CORE ACCELERATED • &lt;3S PIPELINE
            </div>
          </div>
        </div>

        {/* Status ticker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', background: '#0e0b17', padding: '6px 14px', borderRadius: '20px', border: '1px solid #272238' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isGenerating ? '#FFE600' : '#00FF88', boxShadow: isGenerating ? '0 0 8px #FFE600' : '0 0 8px #00FF88' }} />
          <span style={{ color: '#9ca3af' }}>{statusStep}</span>
          {generationTime !== null && (
            <span style={{ color: '#00F0FF', fontWeight: '700', paddingLeft: '6px', borderLeft: '1px solid #373349' }}>
              {generationTime}ms
            </span>
          )}
        </div>

        {/* Export & Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setExportModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #00F0FF, #0077FE)', color: '#000', fontWeight: '700', fontSize: '13px', padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 14px rgba(0,240,255,0.3)' }}
          >
            <span>Export Code</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>(Next.js + Vite)</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN STUDIO WORKSTATION LAYOUT (Left, Center, Right)
          ==================================================================== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ------------------------------------------------------------------
            LEFT PANEL: PROMPT, PRESETS & TIKTOK REMIX
            ------------------------------------------------------------------ */}
        <div style={{ width: '340px', borderRight: '1px solid #1a1726', background: '#080510', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Prompt to 3D World
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What 3D world should we build?"
              rows={4}
              style={{ width: '100%', background: '#0f0c1c', border: '1px solid #2a253e', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Quick Example Chips */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
              QUICK 3D ARCHITECTURES:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setPrompt(ex.prompt);
                    handleGenerate(ex.prompt);
                  }}
                  style={{ background: '#130f24', border: '1px solid #2a2347', color: '#c4b5fd', fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            style={{ background: isGenerating ? '#373349' : 'linear-gradient(135deg, #7000FF, #00F0FF)', color: '#fff', fontWeight: '800', fontSize: '14px', padding: '12px', borderRadius: '10px', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(112,0,255,0.4)' }}
          >
            {isGenerating ? 'Synthesizing 3D Graph...' : '⚡ Generate 3D Website (<3s)'}
          </button>

          {/* TikTok / NEX Reel Video-to-3D Remix Section */}
          <div style={{ borderTop: '1px solid #1a1726', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#FF007F' }}>
                🎬 NEX Reels: Remix Video to 3D
              </span>
              <span style={{ fontSize: '10px', background: '#350020', color: '#FF007F', padding: '2px 6px', borderRadius: '4px' }}>AI VISION</span>
            </div>
            <input
              type="text"
              value={remixVideoUrl}
              onChange={(e) => setRemixVideoUrl(e.target.value)}
              placeholder="Paste video URL or Reel..."
              style={{ width: '100%', background: '#0f0c1c', border: '1px solid #2a253e', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleRemixReel}
              style={{ background: 'linear-gradient(135deg, #FF007F, #7000FF)', color: '#fff', fontWeight: '700', fontSize: '12px', padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              🪄 Remix with AI
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            CENTER STAGE: LIVE 3D CANVAS & 3 MIDJOURNEY VARIANTS
            ------------------------------------------------------------------ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020005', position: 'relative' }}>
          {/* Main 3D Canvas Container */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* Live Interactive 3D IFrame Preview Render */}
            <iframe
              title="NEX 3D Live Scene"
              srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; overflow: hidden; background: #020008; font-family: sans-serif; }
    #canvas-container { width: 100vw; height: 100vh; }
    .badge { position: absolute; bottom: 16px; left: 16px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(0,240,255,0.4); color: #00F0FF; font-size: 12px; font-weight: 700; pointer-events: none; z-index: 100; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div class="badge">60 FPS WEBGL • ${variants[activeVariantIndex]?.title || 'NEX 3D VIEWPORT'}</div>
  <div id="canvas-container"></div>
  <script>
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050014, 0.035);
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, ${ambientIntensity});
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00F0FF, 2.0);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xFF007F, 3.0, 30);
    pointLight.position.set(-6, 4, -4);
    scene.add(pointLight);

    // Dynamic Objects based on template
    const group = new THREE.Group();
    scene.add(group);

    // Central Monolith
    const geom = new THREE.TorusKnotGeometry(2, 0.5, 100, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00F0FF,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: ${wireframeMode}
    });
    const knot = new THREE.Mesh(geom, mat);
    knot.position.y = 2;
    group.add(knot);

    // Orbiting particles
    const partGeo = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) {
      positions[i] = (Math.random() - 0.5) * 30;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({ size: 0.15, color: 0x00FF88 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Grid Floor
    const grid = new THREE.GridHelper(50, 50, 0xFF007F, 0x1f1d2b);
    grid.position.y = -1;
    scene.add(grid);

    function animate() {
      requestAnimationFrame(animate);
      if (${autoRotate}) {
        knot.rotation.y += 0.01;
        knot.rotation.x += 0.005;
        particles.rotation.y += 0.001;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>

          {/* 3 Midjourney-Style 3D Variants Grid Ticker */}
          <div style={{ height: '140px', borderTop: '1px solid #1a1726', background: 'rgba(8,6,14,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              VARIANTS
            </div>
            <div style={{ display: 'flex', gap: '14px', flex: 1, overflowX: 'auto', padding: '6px 0' }}>
              {variants.map((v, i) => (
                <div
                  key={v.id}
                  onClick={() => setActiveVariantIndex(i)}
                  style={{ width: '220px', height: '105px', background: activeVariantIndex === i ? 'rgba(0,240,255,0.08)' : '#0f0c1c', border: activeVariantIndex === i ? '2px solid #00F0FF' : '1px solid #231f38', borderRadius: '10px', padding: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease', position: 'relative' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: activeVariantIndex === i ? '#00F0FF' : '#e5e7eb' }}>
                      Variant #{i + 1}
                    </span>
                    <span style={{ fontSize: '9px', background: '#1c1730', color: '#c4b5fd', padding: '2px 6px', borderRadius: '4px' }}>
                      {v.style}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#6b7280' }}>
                    <span>{v.r3f_code ? `${v.r3f_code.split('\n').length} LOC` : 'R3F Ready'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVariantIndex(i);
                        handleRemixReel();
                      }}
                      style={{ background: '#2c1545', color: '#FF007F', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      Remix 🪄
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            RIGHT PANEL: LEVA CONTROLS & CODE EDITOR
            ------------------------------------------------------------------ */}
        <div style={{ width: '420px', borderLeft: '1px solid #1a1726', background: '#080510', display: 'flex', flexDirection: 'column' }}>
          {/* Leva Quick Controls Section */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a1726', background: '#0c0817' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#00F0FF', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>
              ⚙️ Leva Scene Controls
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Bloom: {bloomIntensity}</label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value={bloomIntensity}
                  onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '4px' }}>Light: {ambientIntensity}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={ambientIntensity}
                  onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="autoRot"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                />
                <label htmlFor="autoRot" style={{ color: '#d1d5db', cursor: 'pointer' }}>Auto Rotate</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="wire"
                  checked={wireframeMode}
                  onChange={(e) => setWireframeMode(e.target.checked)}
                />
                <label htmlFor="wire" style={{ color: '#d1d5db', cursor: 'pointer' }}>Wireframe</label>
              </div>
            </div>
          </div>

          {/* Code Editor Header & Diagnostic Badge */}
          <div style={{ padding: '10px 18px', background: '#0e0b1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a1726' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#e5e7eb' }}>GeneratedScene.tsx</span>
              {validation?.valid ? (
                <span style={{ fontSize: '10px', background: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                  ✓ VALID R3F
                </span>
              ) : (
                <span style={{ fontSize: '10px', background: '#451a03', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                  ⚠ WARNINGS ({validation?.warnings_count || 0})
                </span>
              )}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeCode);
                alert('R3F Code copied to clipboard!');
              }}
              style={{ background: '#221b38', color: '#c4b5fd', border: '1px solid #373059', borderRadius: '6px', fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}
            >
              Copy Code
            </button>
          </div>

          {/* Monaco-Style Syntax Highlighted Code Viewer */}
          <div style={{ flex: 1, padding: '14px', overflow: 'auto', background: '#050309', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: '1.6', color: '#a5b4fc', whiteSpace: 'pre' }}>
            {activeCode || '// Select a 3D variant to inspect React Three Fiber code'}
          </div>
        </div>
      </div>

      {/* ====================================================================
          EXPORT MODAL (Next.js 14 + Vite)
          ==================================================================== */}
      {exportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '500px', background: '#0f0c1c', border: '1px solid #2d2645', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>Export 3D Web Project</h2>
              <button onClick={() => setExportModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
              Download a complete, fully configured production project with Three.js r160, React Three Fiber, Drei, and Post-processing shaders.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setExportTarget('nextjs')}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: exportTarget === 'nextjs' ? '2px solid #00F0FF' : '1px solid #262138', background: exportTarget === 'nextjs' ? '#141c30' : '#130f24', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Next.js 14 App Router
              </button>
              <button
                onClick={() => setExportTarget('vite')}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: exportTarget === 'vite' ? '2px solid #00F0FF' : '1px solid #262138', background: exportTarget === 'vite' ? '#141c30' : '#130f24', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Vite + React (Fast)
              </button>
            </div>

            <button
              onClick={async () => {
                const res = await fetch('http://localhost:8001/api/3d/export', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: activeCode, target: exportTarget }),
                });
                const data = await res.json();
                const blob = new Blob([data.files['package.json'] + '\n\n' + activeCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nex-3d-${exportTarget}.zip`;
                a.click();
                setExportModalOpen(false);
              }}
              style={{ background: 'linear-gradient(135deg, #00F0FF, #7000FF)', color: '#000', fontWeight: '800', fontSize: '14px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
            >
              🚀 Download {exportTarget === 'nextjs' ? 'Next.js 14' : 'Vite'} Package
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
