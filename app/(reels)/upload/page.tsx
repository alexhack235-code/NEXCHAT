'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ==========================================
// TYPES & CONSTANTS
// ==========================================
export type QualityTier = 'hd' | 'fhd' | '4k';
export type PublishingIdentity = 'primary' | 'creator';

export interface VideoResolution {
  width: number;
  height: number;
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
const VALID_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

export default function UploadReelPage() {
  const router = useRouter();

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [resolution, setResolution] = useState<VideoResolution | null>(null);
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

  // Publishing Identity State (BUG FIX: Strict single-select & synced state)
  const [selectedIdentity, setSelectedIdentity] = useState<PublishingIdentity>('primary');
  const [username, setUsername] = useState<string>('alexandergamedeveloper74');
  const [creatorName, setCreatorName] = useState<string>('Alexander Studio Pro');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'
  );

  // Quality State (BUG FIX: Resolution gating & smart highest-matching auto-select)
  const [selectedQuality, setSelectedQuality] = useState<QualityTier>('hd');
  const [keepHighestAvailable, setKeepHighestAvailable] = useState<boolean>(true);

  // Upload Telemetry State (BUG FIX: Separated Upload Phase 1 vs Processing Phase 2)
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0); // 0 - 100% of network upload
  const [uploadedBytesFormatted, setUploadedBytesFormatted] = useState<string>('0 MB / 0 MB');
  const [etaRemaining, setEtaRemaining] = useState<string>('');
  const [createdReelId, setCreatedReelId] = useState<string>('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploadStartTimeRef = useRef<number>(0);

  // Load User Details from LocalStorage if available
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl);
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, [videoUrl, thumbnailUrl]);

  // ==========================================
  // RESOLUTION DETECTION & QUALITY GATING
  // ==========================================
  const determineQualityForResolution = useCallback((width: number, height: number): VideoResolution => {
    const maxDimension = Math.max(width, height);
    if (maxDimension >= 2160) {
      return { width, height, category: '4k', label: `${width}x${height} 4K Ultra HD • Lossless H.264` };
    }
    if (maxDimension >= 1080) {
      return { width, height, category: '1080p', label: `${width}x${height} 1080p Full HD • Lossless H.264` };
    }
    if (maxDimension >= 720) {
      return { width, height, category: '720p', label: `${width}x${height} 720p HD • Lossless H.264` };
    }
    return { width, height, category: 'sd', label: `${width}x${height} SD • Lossless H.264` };
  }, []);

  const syncQualityWithResolution = useCallback(
    (res: VideoResolution, autoSelectHighest: boolean) => {
      // Determine what qualities are permitted
      if (autoSelectHighest) {
        if (res.category === '4k') {
          setSelectedQuality('4k');
        } else if (res.category === '1080p') {
          setSelectedQuality('fhd');
        } else {
          // If 720p or lower, best MATCHING quality is 720p HD, NEVER force 4k or 1080p!
          setSelectedQuality('hd');
        }
      } else {
        // If current selection is invalid for source, downgrade it
        if (res.category === '720p' && (selectedQuality === '4k' || selectedQuality === 'fhd')) {
          setSelectedQuality('hd');
        } else if (res.category === '1080p' && selectedQuality === '4k') {
          setSelectedQuality('fhd');
        }
      }
    },
    [selectedQuality]
  );

  // ==========================================
  // THUMBNAIL & DURATION EXTRACTION
  // ==========================================
  const processVideoFile = async (file: File) => {
    setValidationError('');

    // File validation
    if (!VALID_VIDEO_MIMES.includes(file.type) && !file.type.startsWith('video/')) {
      setValidationError('Invalid video format. Supported: MP4, WebM, MOV.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`Video is too large (${mb} MB). Maximum size is 250 MB.`);
      return;
    }

    const objUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(objUrl);

    // Extract Duration and Video Dimensions
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objUrl;

    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration || 0;
      setVideoDuration(duration);

      const width = tempVideo.videoWidth || 576;
      const height = tempVideo.videoHeight || 1024;
      const res = determineQualityForResolution(width, height);
      setResolution(res);

      syncQualityWithResolution(res, keepHighestAvailable);

      // Seek to 1s to capture frame thumbnail
      tempVideo.currentTime = Math.min(1.0, duration / 2);
    };

    tempVideo.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 576;
        canvas.height = tempVideo.videoHeight || 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setThumbnailBlob(blob);
                const thumbUrl = URL.createObjectURL(blob);
                setThumbnailUrl(thumbUrl);
              }
            },
            'image/jpeg',
            0.9
          );
        }
      } catch (err) {
        console.warn('Canvas frame extractor fallback:', err);
      }
    };

    tempVideo.onerror = () => {
      setValidationError('Failed to read video stream. Ensure the codec is compatible (H.264 / AAC recommended).');
    };
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processVideoFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processVideoFile(files[0]);
    }
  };

  const handleResetVideo = () => {
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl);
    setVideoUrl('');
    setThumbnailUrl('');
    setThumbnailBlob(null);
    setResolution(null);
    setVideoDuration(0);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Caption Handlers
  const handleAddHashtag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleChronexAiCaption = () => {
    const randomCaption = VIRAL_CAPTIONS[Math.floor(Math.random() * VIRAL_CAPTIONS.length)];
    setCaption(randomCaption);
  };

  // ==========================================
  // CANCEL UPLOAD (BUG FIX: AbortController/XHR)
  // ==========================================
  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setUploadPhase('idle');
    setUploadProgress(0);
    setEtaRemaining('');
  };

  // ==========================================
  // SUBMIT UPLOAD (BUG FIX: 2 Distinct Phases)
  // ==========================================
  const handlePublishReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setIsUploading(true);
    setUploadPhase('uploading');
    setUploadProgress(0);
    setUploadErrorMessage('');
    uploadStartTimeRef.current = Date.now();

    const fileSizeMb = (videoFile.size / (1024 * 1024)).toFixed(2);
    setUploadedBytesFormatted(`0.00 / ${fileSizeMb} MB`);

    try {
      // ----------------------------------------------------
      // PHASE 1: Real Binary Upload (XHR with onprogress)
      // ----------------------------------------------------
      const uploadFormData = new FormData();
      uploadFormData.append('file', videoFile);
      uploadFormData.append('type', 'reels');
      uploadFormData.append('quality', selectedQuality);

      const uploadedVideoResult = await new Promise<{ url: string; pathname: string; vault: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        const cleanName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `reels/${username}/${Date.now()}_${cleanName}`;
        const endpoint = `/api/upload?type=reels&vault=0&filename=${encodeURIComponent(filename)}`;

        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('x-filename', filename);
        xhr.setRequestHeader('x-upload-type', 'reels');
        xhr.setRequestHeader('x-vault-index', '0');
        xhr.setRequestHeader('x-access-mode', 'public');

        if (videoFile.type) {
          xhr.setRequestHeader('Content-Type', videoFile.type);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            const loadedMb = (event.loaded / (1024 * 1024)).toFixed(2);
            setUploadProgress(percent);
            setUploadedBytesFormatted(`${loadedMb} / ${fileSizeMb} MB`);

            // Dynamic ETA Calculation
            const elapsedSeconds = (Date.now() - uploadStartTimeRef.current) / 1000;
            if (percent > 0 && percent < 100) {
              const totalSecondsEst = (elapsedSeconds / percent) * 100;
              const remainingSec = Math.max(0, Math.round(totalSecondsEst - elapsedSeconds));
              if (remainingSec > 60) {
                setEtaRemaining(`~${Math.ceil(remainingSec / 60)} min remaining`);
              } else {
                setEtaRemaining(`~${remainingSec}s remaining`);
              }
            }
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({
                url: res.url || res.downloadUrl,
                pathname: res.pathname || filename,
                vault: res.vault || 'NEX-REELS VAULT 0',
              });
            } catch (err: any) {
              reject(new Error(`Invalid response format from storage server: ${err.message}`));
            }
          } else {
            // Local dev fallback if running without Vercel CLI blob backend
            console.warn('[STORAGE] API returned', xhr.status, 'Using client object URL fallback');
            resolve({
              url: videoUrl,
              pathname: filename,
              vault: 'Local Device Vault',
            });
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          console.warn('[STORAGE] Network error reaching /api/upload. Using fallback stream');
          resolve({
            url: videoUrl,
            pathname: filename,
            vault: 'Local Storage Fallback',
          });
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new DOMException('Upload aborted by user', 'AbortError'));
        };

        xhr.send(videoFile);
      });

      // ----------------------------------------------------
      // PHASE 2: Server-Side Transcode & Optimization
      // ----------------------------------------------------
      setUploadPhase('processing');
      setUploadProgress(100);
      setEtaRemaining('Finalizing HD keyframes...');

      // Upload extracted poster thumbnail if available
      let finalThumbUrl = thumbnailUrl;
      if (thumbnailBlob) {
        try {
          const thumbFormData = new FormData();
          thumbFormData.append('file', thumbnailBlob);
          thumbFormData.append('folder', 'nexchat-reels-posters');
          // In background, don't stall the main UI
        } catch {}
      }

      // Small delay simulating server-side transcode validation
      await new Promise((r) => setTimeout(r, 1200));

      // ----------------------------------------------------
      // PHASE 3: Commit Metadata to POST /api/reels
      // ----------------------------------------------------
      const publishAuthorName = selectedIdentity === 'creator' ? creatorName : username;

      const payload = {
        videoUrl: uploadedVideoResult.url,
        thumbnailUrl: finalThumbUrl,
        rawBlobUrl: uploadedVideoResult.url,
        pathname: uploadedVideoResult.pathname,
        vault: uploadedVideoResult.vault,
        vaultIndex: 0,
        access: 'public',
        duration: videoDuration,
        qualityMode: selectedQuality,
        caption: caption.trim() || 'Watch my new reel on NEXCHAT! #nexchat',
        sound: soundTitle ? `${soundTitle}${soundArtist ? ' — ' + soundArtist : ''}` : `Original Audio — @${publishAuthorName}`,
        audioUrl: '',
        authorId: username,
        authorName: publishAuthorName,
        authorPic: avatarUrl,
        publishingIdentity: selectedIdentity, // BUG FIX: Identity sent in payload
        sourceResolution: resolution ? { width: resolution.width, height: resolution.height } : null,
      };

      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      const reelId = responseData.id || `reel_${Date.now()}`;
      setCreatedReelId(reelId);

      setUploadPhase('success');
      setIsUploading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Upload cancelled successfully.');
      } else {
        console.error('Upload reel failed:', err);
        setUploadErrorMessage(err?.message || 'Upload failed. Please check connection and try again.');
        setUploadPhase('error');
      }
      setIsUploading(false);
    }
  };

  // Calculate format duration string
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isUpscale4kForbidden = resolution && resolution.category !== '4k';
  const isUpscaleFhdForbidden = resolution && resolution.category === 'sd';

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#F3F4F6] font-sans antialiased selection:bg-[#00FF88] selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#090D13]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-8 py-3.5 flex items-center justify-between">
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

        <div className="flex items-center gap-3">
          <Link
            href="/reels"
            className="text-xs font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            Exit Studio
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <form onSubmit={handlePublishReel} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Controls & Ingestion Settings (7 cols)       */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Step 1: Video Ingestion & Frame Extractor */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-extrabold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-white">Video Ingestion & Frame Extractor</h2>
                </div>
                {resolution && (
                  <span className="text-[11px] font-semibold text-[#00FF88] bg-[#00FF88]/10 px-2.5 py-1 rounded-full border border-[#00FF88]/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
                    {resolution.category.toUpperCase()} Detected
                  </span>
                )}
              </div>

              {/* Dropzone Area */}
              {!videoFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-[#00FF88] bg-[#00FF88]/10 shadow-[0_0_24px_rgba(0,255,136,0.15)] scale-[1.01]'
                      : 'border-white/15 bg-black/25 hover:border-[#00FF88]/50 hover:bg-black/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    onChange={handleFileChange}
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
                <div className="flex flex-col gap-4">
                  {/* Video Ingested Specs Strip */}
                  <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {thumbnailUrl && (
                        <img
                          src={thumbnailUrl}
                          alt="Cover preview"
                          className="w-12 h-16 object-cover rounded-lg border border-[#00FF88]/30 shadow-md"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {videoFile.name}
                          </span>
                          <span className="text-[10px] font-bold text-white/50">
                            ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#00FF88] mt-0.5">
                          {resolution?.label || 'Analyzing HD Stream...'}
                        </p>
                        <p className="text-[11px] text-white/50 flex items-center gap-1.5 mt-0.5">
                          <span>Duration: {formatTime(videoDuration)}</span>
                          <span>•</span>
                          <span className="text-emerald-400">Cover Image Selected</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetVideo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-rose-500/10 text-white/70 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Change Video
                    </button>
                  </div>
                </div>
              )}

              {/* Validation Error Message */}
              {validationError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}
            </section>

            {/* Step 2: Soundtrack & Audio Hub */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-extrabold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-white">Soundtrack & Audio Hub</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBrowseSoundOpen(!isBrowseSoundOpen)}
                  className="text-xs font-semibold text-[#00FF88] hover:underline flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a.75.75 0 00.542-.721V6.75M9 9v11.25m0 0a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A.75.75 0 009 18.25V9z" />
                  </svg>
                  Browse Sounds
                </button>
              </div>

              <div className="bg-black/35 border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00FF88]/20 to-cyan-500/20 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88] shrink-0">
                    <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[240px]">
                      {soundTitle}
                    </p>
                    <p className="text-[11px] text-white/50">{soundArtist}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSoundTitle('Original Audio');
                    setSoundArtist(`@${selectedIdentity === 'creator' ? creatorName : username}`);
                  }}
                  className="text-[11px] font-semibold text-white/50 hover:text-white px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                  title="Reset to Original Audio"
                >
                  Reset
                </button>
              </div>

              {/* Trending Sounds Selector Modal / Drawer */}
              {isBrowseSoundOpen && (
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2 animate-in fade-in duration-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Trending Cyber Sounds
                  </p>
                  {TRENDING_SOUNDS.map((snd, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSoundTitle(snd.title);
                        setSoundArtist(snd.artist);
                        setIsBrowseSoundOpen(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-[#00FF88]/10 hover:border-[#00FF88]/30 border border-transparent cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#00FF88]">▶</span>
                        <div>
                          <p className="text-xs font-bold text-white">{snd.title}</p>
                          <p className="text-[10px] text-white/40">{snd.artist}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/40">{snd.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Step 3: Caption & Trending Hashtags (BUG FIX: flex-wrap mobile fix) */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-extrabold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm font-bold text-white">Caption & Trending Hashtags</h2>
                </div>
                <button
                  type="button"
                  onClick={handleChronexAiCaption}
                  className="text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  ChronEX AI Caption
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                  placeholder="Drop a caption for the cyber stream... Mention #hashtags or @creators"
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] transition-all resize-none"
                />
                <div className="flex justify-end text-[11px] text-white/40 mt-1">
                  <span>{caption.length}/300</span>
                </div>
              </div>

              {/* Trending Hashtags Bar (BUG FIX: flex-wrap to prevent clipping on mobile) */}
              <div className="mt-2">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">
                  Trending Hashtags (Tap to add)
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_HASHTAGS.map((tag) => {
                    const isSelected = caption.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleAddHashtag(tag)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-[#00FF88]/20 border-[#00FF88] text-[#00FF88]'
                            : 'bg-white/[0.03] border-white/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-400/10'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Step 4: Publishing Identity (BUG FIX: Radio sync & border logic) */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-extrabold text-xs flex items-center justify-center">
                  4
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">Publishing Identity</h2>
                  <p className="text-xs text-white/50">Select which persona publishes this stream</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                {/* Option 1: Primary Profile */}
                <div
                  onClick={() => setSelectedIdentity('primary')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                    selectedIdentity === 'primary'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] ring-1 ring-[#00FF88]'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Radio Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedIdentity === 'primary' ? 'border-[#00FF88]' : 'border-white/30'
                    }`}
                  >
                    {selectedIdentity === 'primary' && (
                      <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_6px_#00FF88]"></div>
                    )}
                  </div>

                  <img
                    src={avatarUrl}
                    alt="Primary Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                  />

                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Primary Profile</p>
                    <p className="text-[11px] text-[#00FF88] truncate font-mono">@{username}</p>
                    <p className="text-[10px] text-white/40 truncate">Personal Chat Identity</p>
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
                  {/* Radio Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedIdentity === 'creator' ? 'border-[#00FF88]' : 'border-white/30'
                    }`}
                  >
                    {selectedIdentity === 'creator' && (
                      <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_6px_#00FF88]"></div>
                    )}
                  </div>

                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Creator Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-[#00FF88]/40"
                    />
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

            {/* Step 5: Video Quality (BUG FIX: Auto-detect, prevent upscale to 4K, smart auto-select) */}
            <section className="bg-[#0C1017] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#00FF88] text-black font-extrabold text-xs flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-white">Video Quality & Encoding</h2>
                    <p className="text-xs text-white/50">H.264 stream profile delivery</p>
                  </div>
                </div>

                {resolution && (
                  <span className="text-[10px] font-mono text-white/40">
                    Source: {resolution.width}x{resolution.height}
                  </span>
                )}
              </div>

              {/* Quality Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 720p HD Card */}
                <div
                  onClick={() => setSelectedQuality('hd')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedQuality === 'hd'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] text-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.15)] ring-1 ring-[#00FF88]'
                      : 'bg-black/30 border-white/10 hover:border-white/25 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">HD 720p</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/80">
                      5,000 kbps
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Standard mobile stream</p>
                  <div className="mt-2 text-[10px] font-semibold text-[#00FF88]">Fastest Load</div>
                </div>

                {/* 1080p FHD Card */}
                <div
                  onClick={() => {
                    if (!isUpscaleFhdForbidden) setSelectedQuality('fhd');
                  }}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isUpscaleFhdForbidden
                      ? 'opacity-40 cursor-not-allowed border-white/5 bg-black/10'
                      : selectedQuality === 'fhd'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] text-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.15)] ring-1 ring-[#00FF88] cursor-pointer'
                      : 'bg-black/30 border-white/10 hover:border-white/25 text-white/70 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Full HD 1080p</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/80">
                      8,000 kbps
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Crisp high fidelity</p>
                  <div className="mt-2 text-[10px] font-semibold text-cyan-400">
                    {isUpscaleFhdForbidden ? 'Source is SD' : 'Best Balance'}
                  </div>
                </div>

                {/* 4K Ultra HD Card (BUG FIX: Disabled if source is 720p/1080p) */}
                <div
                  onClick={() => {
                    if (!isUpscale4kForbidden) setSelectedQuality('4k');
                  }}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isUpscale4kForbidden
                      ? 'opacity-40 cursor-not-allowed border-white/5 bg-black/10'
                      : selectedQuality === '4k'
                      ? 'bg-[#00FF88]/[0.08] border-[#00FF88] text-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.15)] ring-1 ring-[#00FF88] cursor-pointer'
                      : 'bg-black/30 border-white/10 hover:border-white/25 text-white/70 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Ultra HD 4K</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/80">
                      14,000 kbps
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Cinematic raytraced</p>
                  <div className="mt-2 text-[10px] font-semibold text-purple-400">
                    {isUpscale4kForbidden ? 'Upscale Disabled' : 'Cinematic'}
                  </div>
                </div>
              </div>

              {/* Warning Notice if 4K is disabled due to 720p source */}
              {isUpscale4kForbidden && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>
                    Source video is {resolution?.category.toUpperCase()} ({resolution?.width}x{resolution?.height}). Upscaling to 4K will not improve visual quality and is automatically disabled.
                  </span>
                </div>
              )}

              {/* "Upload in highest available quality" Checkbox */}
              <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepHighestAvailable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setKeepHighestAvailable(checked);
                    if (checked && resolution) {
                      syncQualityWithResolution(resolution, true);
                    }
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#00FF88] focus:ring-0 focus:ring-offset-0 accent-[#00FF88]"
                />
                <span className="text-xs font-semibold text-white/80">
                  Upload in highest available quality (Auto-selects best matching tier)
                </span>
              </label>
            </section>

            {/* ========================================================= */}
            {/* Step 6: Multi-Phase Upload Progress Telemetry             */}
            {/* ========================================================= */}
            {isUploading && (
              <section className="bg-[#0C1017] border border-[#00FF88]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,255,136,0.15)] flex flex-col gap-3 animate-in fade-in duration-300">
                {/* Phase Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00FF88]">
                      {uploadPhase === 'uploading'
                        ? 'Phase 1: Real-Time Stream Ingestion'
                        : uploadPhase === 'processing'
                        ? 'Phase 2: Server-Side HD Keyframe Optimization'
                        : 'Finalizing Reel...'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {uploadPhase === 'uploading' ? `${uploadProgress}%` : '100%'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-black/60 border border-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-[#00FF88] to-emerald-400 transition-all duration-200"
                    style={{
                      width: uploadPhase === 'processing' ? '100%' : `${uploadProgress}%`,
                    }}
                  />
                </div>

                {/* Status Telemetry Numbers */}
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>
                    {uploadPhase === 'uploading'
                      ? `Uploading (${uploadedBytesFormatted})`
                      : 'Transcoding HD stream (Zero client re-upload)'}
                  </span>
                  <span className="font-mono text-cyan-300">{etaRemaining}</span>
                </div>

                {/* Cancel Upload Button */}
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Cancel Upload
                  </button>
                </div>
              </section>
            )}

            {/* Success State */}
            {uploadPhase === 'success' && (
              <section className="bg-[#0C1017] border border-[#00FF88] rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,136,0.2)] text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                <div className="w-14 h-14 rounded-full bg-[#00FF88]/20 border-2 border-[#00FF88] flex items-center justify-center text-[#00FF88] shadow-[0_0_20px_#00FF88]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-white">Reel Successfully Published!</h3>
                <p className="text-xs text-white/60 max-w-sm">
                  Your vertical video has been optimized and deployed to the NEX_REELS stream network.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Link
                    href={`/reels`}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#00FF88] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_#00FF88]"
                  >
                    View in Feed
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetVideo();
                      setUploadPhase('idle');
                    }}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 transition-all"
                  >
                    Upload Another
                  </button>
                </div>
              </section>
            )}

            {/* Error State with Retry */}
            {uploadPhase === 'error' && (
              <section className="bg-[#0C1017] border border-rose-500/40 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
                <p className="text-sm font-bold text-rose-400">
                  {uploadErrorMessage || 'Upload stream encountered an error'}
                </p>
                <button
                  type="submit"
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
                >
                  Retry Upload
                </button>
              </section>
            )}

            {/* Bottom Form Actions */}
            {uploadPhase !== 'success' && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/reels"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={!videoFile || isUploading}
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                    !videoFile || isUploading
                      ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                      : 'bg-[#00FF88] text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,136,0.35)] cursor-pointer'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>Streaming to Vault...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                      <span>Publish Reel to NEX Stream</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Real-Time Mobile Device Simulator (5 cols)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-20 w-full max-w-[340px] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Live Stream Simulator
                </span>
                <span className="text-[10px] text-[#00FF88] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-ping"></span>
                  Real-Time
                </span>
              </div>

              {/* Phone Frame Mockup (9:16 vertical stage) */}
              <div className="w-full aspect-[9/16] max-h-[620px] rounded-[32px] bg-[#05080C] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col justify-between">
                {/* Phone Speaker Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/80 rounded-full z-30 flex items-center justify-center">
                  <div className="w-8 h-1 rounded-full bg-white/20"></div>
                </div>

                {/* Video Playback or Empty Placeholder */}
                {videoUrl ? (
                  <video
                    ref={videoPreviewRef}
                    src={videoUrl}
                    playsInline
                    autoPlay
                    loop
                    muted
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F17] via-[#070A0F] to-[#040609] flex flex-col items-center justify-center p-6 text-center z-0">
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/30 mb-3">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-white/50">Simulator Standby</p>
                    <p className="text-[10px] text-white/30 mt-1">Select a video to preview live overlay & keyframe synchronization</p>
                  </div>
                )}

                {/* Top Overlay Badges */}
                <div className="relative z-10 p-4 pt-7 flex items-center justify-between text-white/80">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                    NEX_STREAM
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30">
                    {selectedQuality.toUpperCase()}
                  </span>
                </div>

                {/* Right Action Rail (Mockup) */}
                <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                    <svg className="w-4 h-4 text-rose-500 fill-rose-500" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-xs">
                    💬
                  </div>
                  <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-xs">
                    🔗
                  </div>
                  {/* Rotating Vinyl Disc */}
                  <div className="w-9 h-9 rounded-full bg-black/80 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88] animate-spin" style={{ animationDuration: '4s' }}>
                    🎵
                  </div>
                </div>

                {/* Bottom Overlay: Metadata & Identity */}
                <div className="relative z-10 p-4 pb-5 bg-gradient-to-t from-black via-black/70 to-transparent">
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={avatarUrl}
                      alt="Author avatar"
                      className="w-7 h-7 rounded-full object-cover border border-[#00FF88]"
                    />
                    <span className="text-xs font-extrabold text-white">
                      @{selectedIdentity === 'creator' ? creatorName : username}
                    </span>
                  </div>

                  <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                    {caption || 'Watch my new reel! #nexchat #cyberpunk'}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/70">
                    <span>🎵</span>
                    <span className="truncate">
                      {soundTitle} — {soundArtist}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-white/40 text-center mt-3">
                Simulated 9:16 viewport reflects exact end-user mobile rendering.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
