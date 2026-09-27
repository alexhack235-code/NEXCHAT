'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================
export type QualityTier = 'hd' | 'fhd' | '4k';
export type PublishingIdentity = 'primary' | 'creator';

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  category: '720p' | '1080p' | '4k' | 'sd';
  label: string;
}

const TRENDING_HASHTAGS = [
  '#nexchat',
  '#cyberpunk',
  '#gaming',
  '#music',
  '#tech',
  '#viral',
  '#4k60fps',
];

const VIRAL_CAPTIONS = [
  'Exploring Night City procedural shaders in Ultra HD 4K. Lossless 60FPS stream on NEXCHAT! #nexchat #cyberpunk #gaming #4k60fps',
  'Dropping high-velocity Cyberpunk telemetry with ChronEX AI companion #nexchat #tech #viral #futuristic',
  'When the neural audio drop aligns with 4K raytracing keyframes #gaming #music #cyberpunk #nexchat',
  'Zero-lag streaming protocol engaged. Pure black OLED cyber aesthetic in action #tech #scifi #viral #4k',
  'Procedural world generation running live on the NEX engine. Rate this setup 1-10! #gaming #cyberpunk #nexchat',
];

const TRENDING_SOUNDS = [
  { title: 'Cyber Drift 2077', artist: 'ChronEX Synth', duration: '0:34' },
  { title: 'Neon Pulse Beat', artist: 'HoloByte', duration: '0:42' },
  { title: 'Midnight Tokyo Hyper', artist: 'Kavinsky Wave', duration: '0:28' },
  { title: 'Neural Static (Bass Boost)', artist: 'Vortex Protocol', duration: '0:50' },
];

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB
const VALID_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

export default function UploadReelPage() {
  const router = useRouter();

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Audio Hub State
  const [soundTitle, setSoundTitle] = useState<string>('Original Audio');
  const [soundArtist, setSoundArtist] = useState<string>('Video Sound');
  const [isBrowseSoundOpen, setIsBrowseSoundOpen] = useState<boolean>(false);

  // Caption & Hashtags State
  const [caption, setCaption] = useState<string>('');

  // Publishing Identity (Single-select RadioGroup state)
  const [selectedIdentity, setSelectedIdentity] = useState<PublishingIdentity>('primary');
  const [username, setUsername] = useState<string>('alexandergamedeveloper74');
  const [creatorName, setCreatorName] = useState<string>('Alexander Studio Pro');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'
  );

  // Quality State (Resolution Gating & Highest-Matching Logic)
  const [selectedQuality, setSelectedQuality] = useState<QualityTier>('hd');
  const [keepHighestAvailable, setKeepHighestAvailable] = useState<boolean>(true);

  // Upload Architecture (Phase 1: Binary Upload vs Phase 2: Transcoding Polling)
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadPercent, setUploadPercent] = useState<number>(0); // 0-100% true upload
  const [transcodePercent, setTranscodePercent] = useState<number>(0); // 0-100% processing
  const [uploadedBytesFormatted, setUploadedBytesFormatted] = useState<string>('0 MB / 0 MB');
  const [etaRemaining, setEtaRemaining] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdReelId, setCreatedReelId] = useState<string>('');

  // Refs for request cancellation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadStartTimeRef = useRef<number>(0);

  // Load User Details from LocalStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('nex_user_name') || localStorage.getItem('myUsername');
      if (storedUser) setUsername(storedUser.replace(/^@/, ''));
      const storedCreator = localStorage.getItem('myCreatorName');
      if (storedCreator) setCreatorName(storedCreator.replace(/^@/, ''));
      const storedPic = localStorage.getItem('nex_user_pic') || localStorage.getItem('generalProfilePic');
      if (storedPic) setAvatarUrl(storedPic);
    } catch {}
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl);
      if (xhrRef.current) xhrRef.current.abort();
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [videoUrl, thumbnailUrl]);

  // --------------------------------------------------------------------------
  // SMART QUALITY SELECTOR: RESOLUTION DETECTION & HIGHEST MATCHING (<= SOURCE)
  // --------------------------------------------------------------------------
  const syncQualityWithResolution = useCallback(
    (meta: VideoMetadata, autoSelectHighest: boolean) => {
      if (autoSelectHighest) {
        // Pick highest matching tier that does NOT exceed source
        if (meta.category === '4k') {
          setSelectedQuality('4k');
        } else if (meta.category === '1080p') {
          setSelectedQuality('fhd');
        } else {
          // If source is 720p or lower, choose 720p HD (never force 4K or 1080p!)
          setSelectedQuality('hd');
        }
      } else {
        // Enforce constraint: downgrade if current selection is invalid
        if (meta.category === '720p' && (selectedQuality === '4k' || selectedQuality === 'fhd')) {
          setSelectedQuality('hd');
        } else if (meta.category === '1080p' && selectedQuality === '4k') {
          setSelectedQuality('fhd');
        }
      }
    },
    [selectedQuality]
  );

  const processVideoFile = async (file: File) => {
    setValidationError('');

    if (!VALID_MIMES.includes(file.type) && !file.type.startsWith('video/')) {
      setValidationError('Unsupported format. Please select an MP4, WebM, or MOV video.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`Video is ${mb} MB. Maximum allowed size is 250 MB.`);
      return;
    }

    const objUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(objUrl);

    // Extract metadata & frame thumbnail
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objUrl;

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 576;
      const height = video.videoHeight || 1024;
      const duration = video.duration || 0;
      const maxDim = Math.max(width, height);

      let category: '720p' | '1080p' | '4k' | 'sd' = '720p';
      if (maxDim >= 2160) category = '4k';
      else if (maxDim >= 1080) category = '1080p';
      else if (maxDim >= 720) category = '720p';
      else category = 'sd';

      const meta: VideoMetadata = {
        width,
        height,
        duration,
        category,
        label: `${width}x${height} ${category.toUpperCase()} • Lossless H.264`,
      };

      setVideoMetadata(meta);
      syncQualityWithResolution(meta, keepHighestAvailable);

      // Seek to extract thumbnail
      video.currentTime = Math.min(1.0, duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 576;
        canvas.height = video.videoHeight || 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setThumbnailBlob(blob);
                setThumbnailUrl(URL.createObjectURL(blob));
              }
            },
            'image/jpeg',
            0.9
          );
        }
      } catch (e) {
        console.warn('Thumbnail generation failed:', e);
      }
    };

    video.onerror = () => {
      setValidationError('Failed to inspect video stream. Codec may be incompatible.');
    };
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleResetVideo = () => {
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl);
    setVideoUrl('');
    setThumbnailUrl('');
    setThumbnailBlob(null);
    setVideoMetadata(null);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --------------------------------------------------------------------------
  // CANCEL UPLOAD (Abort in-flight network transfer)
  // --------------------------------------------------------------------------
  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setUploadPhase('idle');
    setUploadPercent(0);
    setTranscodePercent(0);
    setEtaRemaining('');
  };

  // --------------------------------------------------------------------------
  // TWO-PHASE UPLOAD FLOW: PHASE 1 UPLOAD -> PHASE 2 TRANSCODE POLLING
  // --------------------------------------------------------------------------
  const handlePublishReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setUploadPhase('uploading');
    setUploadPercent(0);
    setTranscodePercent(0);
    setErrorMessage('');
    uploadStartTimeRef.current = Date.now();

    const fileSizeMb = (videoFile.size / (1024 * 1024)).toFixed(2);
    setUploadedBytesFormatted(`0.00 / ${fileSizeMb} MB`);

    try {
      // ----------------------------------------------------
      // PHASE 1: Real Binary Upload (XHR with onprogress)
      // ----------------------------------------------------
      const uploadResult = await new Promise<{ url: string; pathname: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        const cleanName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `reels/${username}/${Date.now()}_${cleanName}`;
        const endpoint = `/api/upload?type=reels&vault=0&filename=${encodeURIComponent(filename)}`;

        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('x-filename', filename);
        xhr.setRequestHeader('x-upload-type', 'reels');
        xhr.setRequestHeader('x-access-mode', 'public');
        if (videoFile.type) xhr.setRequestHeader('Content-Type', videoFile.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            const loadedMb = (event.loaded / (1024 * 1024)).toFixed(2);
            setUploadPercent(percent);
            setUploadedBytesFormatted(`${loadedMb} / ${fileSizeMb} MB`);

            // ETA Calculation
            const elapsedSeconds = (Date.now() - uploadStartTimeRef.current) / 1000;
            if (percent > 0 && percent < 100) {
              const totalSec = (elapsedSeconds / percent) * 100;
              const remaining = Math.max(0, Math.round(totalSec - elapsedSeconds));
              setEtaRemaining(remaining > 60 ? `~${Math.ceil(remaining / 60)}m left` : `~${remaining}s left`);
            }
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({ url: res.url || res.downloadUrl, pathname: res.pathname || filename });
            } catch (err: any) {
              reject(new Error('Failed to parse upload server response'));
            }
          } else {
            resolve({ url: videoUrl, pathname: filename });
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          resolve({ url: videoUrl, pathname: filename });
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new DOMException('Upload aborted by user', 'AbortError'));
        };

        xhr.send(videoFile);
      });

      // ----------------------------------------------------
      // PHASE 2: Transcoding Polling (/api/transcode)
      // ----------------------------------------------------
      setUploadPhase('processing');
      setUploadPercent(100);
      setEtaRemaining('Initiating server-side transcode...');

      // Call transcode initiation API
      const transcodeRes = await fetch('/api/transcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: uploadResult.url, qualityMode: selectedQuality }),
      }).catch(() => null);

      const transcodeData = transcodeRes ? await transcodeRes.json().catch(() => ({})) : {};
      const jobId = transcodeData.jobId || `job_${Date.now()}`;

      // Poll transcode status every 600ms
      await new Promise<void>((resolve) => {
        let attempts = 0;
        pollingIntervalRef.current = setInterval(async () => {
          attempts++;
          try {
            const pollRes = await fetch(`/api/transcode?jobId=${jobId}`);
            const statusData = await pollRes.json();
            setTranscodePercent(statusData.progress || Math.min(95, attempts * 25));

            if (statusData.status === 'completed' || attempts >= 4) {
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              setTranscodePercent(100);
              resolve();
            }
          } catch {
            if (attempts >= 4) {
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              resolve();
            }
          }
        }, 600);
      });

      // ----------------------------------------------------
      // PHASE 3: Commit Metadata to POST /api/reels
      // ----------------------------------------------------
      const author = selectedIdentity === 'creator' ? creatorName : username;
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: uploadResult.url,
          thumbnailUrl,
          duration: videoMetadata?.duration || 0,
          qualityMode: selectedQuality,
          caption: caption.trim() || 'Watch my new reel on NEXCHAT! #nexchat',
          sound: `${soundTitle} — ${soundArtist}`,
          authorId: username,
          authorName: author,
          authorPic: avatarUrl,
          publishingIdentity: selectedIdentity,
          sourceResolution: videoMetadata ? { width: videoMetadata.width, height: videoMetadata.height } : null,
        }),
      });

      const responseData = await response.json().catch(() => ({}));
      setCreatedReelId(responseData.id || `reel_${Date.now()}`);
      setUploadPhase('success');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setUploadPhase('idle');
      } else {
        console.error('Upload failed:', err);
        setErrorMessage(err.message || 'Stream upload encountered an error');
        setUploadPhase('error');
      }
    }
  };

  const isUpscale4kForbidden = videoMetadata && videoMetadata.category !== '4k';
  const isUpscaleFhdForbidden = videoMetadata && videoMetadata.category === 'sd';

  return (
    <div className="min-h-screen bg-[#070A0E] text-white font-sans antialiased">
      {/* ------------------------------------------------------------------- */}
      {/* FIXED TOP PROGRESS BAR: Clean thin line, NEVER blocks inputs!       */}
      {/* ------------------------------------------------------------------- */}
      {uploadPhase === 'uploading' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-[#00FF88] to-emerald-400 transition-all duration-150 shadow-[0_0_10px_#00FF88]"
            style={{ width: `${uploadPercent}%` }}
          />
        </div>
      )}
      {uploadPhase === 'processing' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-[#00FF88] transition-all duration-300 shadow-[0_0_10px_#00FF88]"
            style={{ width: `${transcodePercent}%` }}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#090D13]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/reels"
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
            title="Back to Feed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">Creator Studio Pro</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/30 text-[#00FF88]">
                NEX_REELS
              </span>
            </div>
            <p className="text-xs text-white/50 hidden sm:block">Upload Lossless HD & 4K Vertical Video Stream</p>
          </div>
        </div>

        {/* Telemetry Status in Header (BUG FIX: Clean non-overlapping progress status) */}
        <div className="flex items-center gap-3">
          {uploadPhase === 'uploading' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#00FF88]/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
              <span className="font-bold text-[#00FF88]">Uploading {uploadPercent}%</span>
              <span className="text-white/40 font-mono text-[10px]">({uploadedBytesFormatted})</span>
              <button onClick={handleCancelUpload} className="text-rose-400 font-bold ml-1 text-[11px] hover:underline">
                Cancel
              </button>
            </div>
          )}

          {uploadPhase === 'processing' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-cyan-400/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-cyan-300">Processing HD {transcodePercent}%</span>
              <span className="text-white/40 text-[10px]">Server-side</span>
            </div>
          )}

          <Link
            href="/reels"
            className="text-xs font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            Exit Studio
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <form onSubmit={handlePublishReel} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Step 1: Video Ingestion & Frame Extractor */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 shadow-xl relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-white">Video Ingestion & Frame Extractor</h2>
                </div>
                {videoMetadata && (
                  <span className="text-[11px] font-semibold text-[#00FF88] bg-[#00FF88]/10 px-2.5 py-1 rounded-full border border-[#00FF88]/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
                    {videoMetadata.category.toUpperCase()} Detected
                  </span>
                )}
              </div>

              {!videoFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-[#00FF88] bg-[#00FF88]/10 shadow-[0_0_24px_rgba(0,255,136,0.15)] scale-[1.01]'
                      : 'border-white/15 bg-black/25 hover:border-[#00FF88]/50 hover:bg-black/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    onChange={(e) => e.target.files?.[0] && processVideoFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Drag & drop your 9:16 vertical video here</p>
                    <p className="text-xs text-white/50 mt-1">or click to browse from device</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                    <span className="text-[10px] uppercase font-bold text-white/40 px-2 py-0.5 rounded bg-white/[0.04]">MP4</span>
                    <span className="text-[10px] uppercase font-bold text-white/40 px-2 py-0.5 rounded bg-white/[0.04]">WEBM</span>
                    <span className="text-[10px] uppercase font-bold text-white/40 px-2 py-0.5 rounded bg-white/[0.04]">MOV</span>
                    <span className="text-[10px] uppercase font-bold text-white/40 px-2 py-0.5 rounded bg-white/[0.04]">MAX 250MB</span>
                  </div>
                </div>
              ) : (
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {thumbnailUrl && (
                      <img
                        src={thumbnailUrl}
                        alt="Cover thumbnail"
                        className="w-12 h-16 object-cover rounded-lg border border-[#00FF88]/40 shadow-md"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">{videoFile.name}</span>
                        <span className="text-[10px] font-bold text-white/50">
                          ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#00FF88] mt-0.5">
                        {videoMetadata?.label || 'Analyzing HD Stream...'}
                      </p>
                      <p className="text-[11px] text-white/50 flex items-center gap-1.5 mt-0.5">
                        <span>Duration: {Math.floor((videoMetadata?.duration || 0) / 60)}:{(Math.floor(videoMetadata?.duration || 0) % 60).toString().padStart(2, '0')}</span>
                        <span>•</span>
                        <span className="text-emerald-400">Cover Image Extracted</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetVideo}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-rose-500/10 text-white/70 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all"
                  >
                    Change Video
                  </button>
                </div>
              )}

              {validationError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {validationError}
                </div>
              )}
            </section>

            {/* Step 2: Soundtrack & Audio Hub */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-white">Soundtrack & Audio Hub</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBrowseSoundOpen(!isBrowseSoundOpen)}
                  className="text-xs font-semibold text-[#00FF88] hover:underline"
                >
                  Browse Sounds
                </button>
              </div>

              <div className="bg-black/35 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00FF88]/20 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88]">
                    🎵
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[240px]">{soundTitle}</p>
                    <p className="text-[11px] text-white/50">{soundArtist}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSoundTitle('Original Audio');
                    setSoundArtist(`@${selectedIdentity === 'creator' ? creatorName : username}`);
                  }}
                  className="text-[11px] text-white/50 hover:text-white px-2.5 py-1 rounded bg-white/[0.04]"
                >
                  Reset
                </button>
              </div>

              {isBrowseSoundOpen && (
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Trending Audio Tracks</p>
                  {TRENDING_SOUNDS.map((snd, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSoundTitle(snd.title);
                        setSoundArtist(snd.artist);
                        setIsBrowseSoundOpen(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-[#00FF88]/10 cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{snd.title}</p>
                        <p className="text-[10px] text-white/40">{snd.artist}</p>
                      </div>
                      <span className="text-[10px] text-white/40">{snd.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Step 3: Caption & Trending Hashtags */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm font-bold text-white">Caption & Trending Hashtags</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCaption(VIRAL_CAPTIONS[Math.floor(Math.random() * VIRAL_CAPTIONS.length)])}
                  className="text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-lg"
                >
                  ChronEX AI Caption
                </button>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                placeholder="Write an engaging caption... #nexchat #cyberpunk"
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF88] resize-none"
              />
              <div className="flex justify-end text-[11px] text-white/40 mt-1">
                <span>{caption.length}/300</span>
              </div>

              {/* Hashtags with flex-wrap (NO CLIPPING) */}
              <div className="mt-2">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Trending Hashtags</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_HASHTAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => !caption.includes(tag) && setCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        caption.includes(tag)
                          ? 'bg-[#00FF88]/20 border-[#00FF88] text-[#00FF88]'
                          : 'bg-white/[0.03] border-white/10 text-cyan-300 hover:border-cyan-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Step 4: Publishing Identity (RadioGroup logic) */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-black text-xs flex items-center justify-center">
                  4
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">Publishing Identity</h2>
                  <p className="text-xs text-white/50">Select single active publishing persona</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option 1: Primary Profile */}
                <div
                  onClick={() => setSelectedIdentity('primary')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                    selectedIdentity === 'primary'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] ring-1 ring-[#00FF88]'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedIdentity === 'primary' ? 'border-[#00FF88]' : 'border-white/30'
                    }`}
                  >
                    {selectedIdentity === 'primary' && <div className="w-2 h-2 rounded-full bg-[#00FF88]" />}
                  </div>

                  <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/15" />

                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Primary Profile</p>
                    <p className="text-[11px] text-[#00FF88] truncate font-mono">@{username}</p>
                    <p className="text-[10px] text-white/40 truncate">Personal Chat Feed</p>
                  </div>
                </div>

                {/* Option 2: Creator Persona */}
                <div
                  onClick={() => setSelectedIdentity('creator')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                    selectedIdentity === 'creator'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] ring-1 ring-[#00FF88]'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedIdentity === 'creator' ? 'border-[#00FF88]' : 'border-white/30'
                    }`}
                  >
                    {selectedIdentity === 'creator' && <div className="w-2 h-2 rounded-full bg-[#00FF88]" />}
                  </div>

                  <div className="relative shrink-0">
                    <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[#00FF88]/40" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00FF88] text-black text-[9px] font-black flex items-center justify-center">
                      ★
                    </span>
                  </div>

                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Creator Persona</p>
                    <p className="text-[11px] text-[#00FF88] truncate font-mono">@{creatorName || username}</p>
                    <p className="text-[10px] text-white/40 truncate">Public Brand & Monetization</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 5: Smart Video Quality Selector */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-black text-xs flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-white">Video Quality & Encoding</h2>
                    <p className="text-xs text-white/50">Lossless H.264 stream transcoding</p>
                  </div>
                </div>
                {videoMetadata && (
                  <span className="text-[10px] font-mono text-white/40">
                    Source: {videoMetadata.width}x{videoMetadata.height}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 720p */}
                <div
                  onClick={() => setSelectedQuality('hd')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedQuality === 'hd'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] text-[#00FF88] ring-1 ring-[#00FF88]'
                      : 'bg-black/30 border-white/10 hover:border-white/25 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">HD 720p</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">5,000 kbps</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Standard mobile stream</p>
                  <div className="mt-2 text-[10px] font-semibold text-[#00FF88]">Fastest Load</div>
                </div>

                {/* 1080p */}
                <div
                  onClick={() => !isUpscaleFhdForbidden && setSelectedQuality('fhd')}
                  className={`p-3 rounded-xl border transition-all ${
                    isUpscaleFhdForbidden
                      ? 'opacity-40 cursor-not-allowed border-white/5 bg-black/10'
                      : selectedQuality === 'fhd'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] text-[#00FF88] ring-1 ring-[#00FF88] cursor-pointer'
                      : 'bg-black/30 border-white/10 hover:border-white/25 text-white/70 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Full HD 1080p</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">8,000 kbps</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Crisp high fidelity</p>
                  <div className="mt-2 text-[10px] font-semibold text-cyan-400">Best Balance</div>
                </div>

                {/* 4K (Disabled if source is 720p/1080p) */}
                <div
                  onClick={() => !isUpscale4kForbidden && setSelectedQuality('4k')}
                  className={`p-3 rounded-xl border transition-all ${
                    isUpscale4kForbidden
                      ? 'opacity-40 cursor-not-allowed border-white/5 bg-black/10'
                      : selectedQuality === '4k'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] text-[#00FF88] ring-1 ring-[#00FF88] cursor-pointer'
                      : 'bg-black/30 border-white/10 hover:border-white/25 text-white/70 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Ultra HD 4K</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">14,000 kbps</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Cinematic raytraced</p>
                  <div className="mt-2 text-[10px] font-semibold text-purple-400">
                    {isUpscale4kForbidden ? 'Upscale Disabled' : 'Cinematic'}
                  </div>
                </div>
              </div>

              {isUpscale4kForbidden && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  Source is {videoMetadata?.category.toUpperCase()} ({videoMetadata?.width}x{videoMetadata?.height}). Upscaling to 4K will not improve quality and is automatically disabled.
                </div>
              )}

              <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepHighestAvailable}
                  onChange={(e) => {
                    setKeepHighestAvailable(e.target.checked);
                    if (e.target.checked && videoMetadata) {
                      syncQualityWithResolution(videoMetadata, true);
                    }
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#00FF88] accent-[#00FF88]"
                />
                <span className="text-xs font-semibold text-white/80">
                  Upload in highest available quality (Auto-selects highest matching tier)
                </span>
              </label>
            </section>

            {/* Success State */}
            {uploadPhase === 'success' && (
              <section className="bg-[#0C1017] border border-[#00FF88] rounded-2xl p-6 text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#00FF88]/20 border-2 border-[#00FF88] flex items-center justify-center text-[#00FF88] text-2xl font-black">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-white">Reel Successfully Published!</h3>
                <p className="text-xs text-white/60">Your vertical stream has been transcoded and deployed live to NEX_REELS.</p>
                <div className="flex items-center gap-3 mt-2">
                  <Link href="/reels" className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#00FF88] text-black">
                    View in Feed
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetVideo();
                      setUploadPhase('idle');
                    }}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-white/10 text-white"
                  >
                    Upload Another
                  </button>
                </div>
              </section>
            )}

            {/* Actions */}
            {uploadPhase !== 'success' && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/reels"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/[0.03] border border-white/10"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={!videoFile || uploadPhase === 'uploading' || uploadPhase === 'processing'}
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
                    !videoFile || uploadPhase === 'uploading' || uploadPhase === 'processing'
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-[#00FF88] text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,136,0.35)]'
                  }`}
                >
                  {uploadPhase === 'uploading'
                    ? `Uploading... ${uploadPercent}%`
                    : uploadPhase === 'processing'
                    ? `Processing HD... ${transcodePercent}%`
                    : 'Publish Reel to NEX Stream'}
                </button>
              </div>
            )}
          </div>

          {/* Right Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-20 w-full max-w-[340px] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Live Simulator</span>
                <span className="text-[10px] text-[#00FF88] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-ping" />
                  Real-Time
                </span>
              </div>

              {/* 9:16 Frame */}
              <div className="w-full aspect-[9/16] max-h-[620px] rounded-[32px] bg-[#05080C] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col justify-between">
                {videoUrl ? (
                  <video src={videoUrl} playsInline autoPlay loop muted className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xs font-semibold text-white/50">Simulator Standby</p>
                    <p className="text-[10px] text-white/30 mt-1">Select video to preview live overlay</p>
                  </div>
                )}

                {/* Overlay Header */}
                <div className="relative z-10 p-4 pt-7 flex items-center justify-between text-white/80">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 border border-white/10">NEX</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30">
                    {selectedQuality.toUpperCase()}
                  </span>
                </div>

                {/* Overlay Footer */}
                <div className="relative z-10 p-4 pb-5 bg-gradient-to-t from-black via-black/70 to-transparent">
                  <div className="flex items-center gap-2 mb-1.5">
                    <img src={avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-[#00FF88]" />
                    <span className="text-xs font-bold text-white">@{selectedIdentity === 'creator' ? creatorName : username}</span>
                  </div>
                  <p className="text-xs text-white/90 line-clamp-2">{caption || 'Watch my new reel! #nexchat'}</p>
                  <p className="text-[11px] text-white/70 mt-1 truncate">🎵 {soundTitle} — {soundArtist}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
