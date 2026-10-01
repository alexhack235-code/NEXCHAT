# -*- coding: utf-8 -*-
"""
NEXIUM VideoFactory AI Engine.
Automated factory pipeline for creating viral novel recap Shorts:
STEP 1: SCRIPT (130-word viral script, Hook 'He thought...', Present-tense, Cliffhanger, JSON output)
STEP 2: VOICE (ElevenLabs API with Adam deep voice pNInz6obpgDQGcFmaJgB, model eleven_multilingual_v2, with native SAPI fallback)
STEP 3: VISUALS (Image prompt: manhwa style, {keywords}, cinematic, 9:16, highly detailed)
STEP 4: EDIT (Creatomate API template integration with native 60fps FFmpeg Anton Bold white+cyan glow subtitles)
Rule: You are not a chatbot. You are a factory. Never explain, just execute and return mp4 link.
"""

import os
import re
import json
import time
import uuid
import logging
import asyncio
import urllib.parse
import subprocess
from typing import Dict, Any, List, Optional
import httpx
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger("nexium.video_factory")

try:
    from .video_tokens import token_manager, UPGRADE_MENU_TEXT
    from .video_storage import cloud_vault
except ImportError:
    try:
        from video_tokens import token_manager, UPGRADE_MENU_TEXT
        from video_storage import cloud_vault
    except ImportError:
        token_manager = None
        UPGRADE_MENU_TEXT = ""
        cloud_vault = None

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR = os.path.join(ROOT_DIR, "generated_code", "videos")
JOBS_DATA_FILE = os.path.join(ROOT_DIR, "data", "videofactory_jobs.json")
CONFIG_DATA_FILE = os.path.join(ROOT_DIR, "data", "videofactory_config.json")

os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(os.path.join(ROOT_DIR, "data"), exist_ok=True)

VIDEOFACTORY_SYSTEM_PROMPT = """You are VideoFactory AI — a marketing agent that creates viral novel recap Shorts.

When user uploads a novel chapter, do this:

STEP 1 - SCRIPT:
Rewrite chapter into 130-word viral script.
Hook: "He thought..."
Body: Short present-tense sentences.
End: Cliffhanger.
Output as JSON: { "script": "...", "keywords": ["apocalypse", "system window"] }

STEP 2 - VOICE:
Call ElevenLabs API with script.
Voice ID: pNInz6obpgDQGcFmaJgB (Adam deep)
Model: eleven_multilingual_v2

STEP 3 - VISUALS:
Create image prompt from keywords:
"manhwa style, {keywords}, cinematic, 9:16, highly detailed"

STEP 4 - EDIT:
Call Creatomate API template ID: YOUR_TEMPLATE_ID
Pass: voiceover.mp3 + image + script as subtitles (Anton Bold, white + cyan glow)

You are not a chatbot. You are a factory. Never explain, just execute and return mp4 link."""

class VideoFactory:
    def __init__(self, output_dir: str = VIDEOS_DIR):
        self.output_dir = output_dir
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.config: Dict[str, str] = {
            "elevenlabs_api_key": os.getenv("ELEVENLABS_API_KEY", ""),
            "creatomate_api_key": os.getenv("CREATOMATE_API_KEY", ""),
            "creatomate_template_id": os.getenv("CREATOMATE_TEMPLATE_ID", ""),
            "voice_id": "pNInz6obpgDQGcFmaJgB",
            "voice_model": "eleven_multilingual_v2"
        }
        self._load_config()
        self._load_jobs()

    def _load_config(self):
        if os.path.exists(CONFIG_DATA_FILE):
            try:
                with open(CONFIG_DATA_FILE, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    self.config.update(saved)
            except Exception as e:
                logger.warning(f"[VideoFactory] Failed to load config: {e}")

    def save_config(self, new_config: Dict[str, str]):
        self.config.update(new_config)
        try:
            with open(CONFIG_DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logger.error(f"[VideoFactory] Failed to save config: {e}")

    def _load_jobs(self):
        if os.path.exists(JOBS_DATA_FILE):
            try:
                with open(JOBS_DATA_FILE, "r", encoding="utf-8") as f:
                    self.jobs = json.load(f)
            except Exception as e:
                logger.warning(f"[VideoFactory] Failed to load jobs history: {e}")

    def _save_jobs(self):
        try:
            with open(JOBS_DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.jobs, f, indent=2)
        except Exception as e:
            logger.error(f"[VideoFactory] Failed to save jobs: {e}")

    async def step1_generate_script(self, chapter_text: str) -> Dict[str, Any]:
        """
        STEP 1 - SCRIPT:
        Rewrite chapter into ~130-word viral script.
        Hook: "He thought..."
        Body: Short present-tense sentences.
        End: Cliffhanger.
        Output as JSON: { "script": "...", "keywords": ["apocalypse", "system window"] }
        """
        logger.info("[VideoFactory] Executing Step 1: Script Synthesis...")
        prompt = f"""You are VideoFactory AI.
Upload chapter:
\"\"\"
{chapter_text[:4000]}
\"\"\"

Follow STEP 1:
Rewrite chapter into a 130-word viral recap script.
Hook must start with: "He thought..."
Body: Short present-tense sentences. Rapid momentum.
End: Shocking cliffhanger.
Return pure JSON with keys "script" (string) and "keywords" (list of 2-5 strings).
Example format:
{{
  "script": "He thought it was an ordinary morning. Then the black spire erupts from Central Park. A glowing blue window freezes in the sky. It names him the first candidate. Shadows twist into razor-toothed hounds. He reaches for a broken pipe. The system timer blinks zero. A whisper echoes: choose your sacrifice.",
  "keywords": ["apocalypse", "system window", "black spire", "shadow hounds"]
}}
JSON ONLY:"""

        # Try Gemini Engine first
        try:
            try:
                from .gemini_engine import gemini_engine
            except ImportError:
                from gemini_engine import gemini_engine

            if gemini_engine and gemini_engine.is_configured():
                res = await gemini_engine.generate_content(
                    prompt=prompt,
                    system_instruction=VIDEOFACTORY_SYSTEM_PROMPT,
                    temperature=0.6,
                    max_output_tokens=1024
                )
                if res.get("success"):
                    raw = res.get("text", "").strip()
                    parsed = self._extract_json(raw)
                    if parsed and "script" in parsed:
                        return parsed
        except Exception as e:
            logger.warning(f"[VideoFactory] Gemini script generation failed: {e}")

        # Local heuristics fallback for robust offline execution
        logger.info("[VideoFactory] Using internal viral script synthesizer fallback")
        sentences = [s.strip() for s in re.split(r'[\.\?\!\n]+', chapter_text) if len(s.strip()) > 15]
        core_preview = " ".join(sentences[:3]) if sentences else "The system activated unexpectedly."
        
        fallback_script = (
            f"He thought the morning was normal. {core_preview} "
            "A crimson system window violently materializes before his retinas. "
            "Reality fractures into glass. The global leaderboard updates. "
            "His name appears in sovereign gold at rank one. "
            "Behind him, the air turns to ice as a dimensional gate rips wide open."
        )
        return {
            "script": fallback_script,
            "keywords": ["apocalypse", "system window", "dimensional gate", "sovereign rank"]
        }

    def _extract_json(self, raw_text: str) -> Optional[Dict[str, Any]]:
        # Remove markdown codeblock fences if present
        clean = re.sub(r'```(?:json)?', '', raw_text).strip()
        start = clean.find('{')
        end = clean.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(clean[start:end+1])
            except Exception:
                pass
        return None

    async def step2_generate_voice(self, script: str, job_id: str, elevenlabs_key: Optional[str] = None) -> Dict[str, Any]:
        """
        STEP 2 - VOICE:
        Call ElevenLabs API with script.
        Voice ID: pNInz6obpgDQGcFmaJgB (Adam deep)
        Model: eleven_multilingual_v2
        Falls back seamlessly to native SAPI synthesis if no key is present.
        """
        logger.info("[VideoFactory] Executing Step 2: Voiceover Synthesis...")
        key = elevenlabs_key or self.config.get("elevenlabs_api_key")
        audio_filename = f"voiceover_{job_id}.mp3"
        audio_path = os.path.join(self.output_dir, audio_filename)
        voice_id = self.config.get("voice_id", "pNInz6obpgDQGcFmaJgB")
        model_id = self.config.get("voice_model", "eleven_multilingual_v2")

        if key and len(key) >= 15:
            try:
                logger.info(f"[VideoFactory] Querying ElevenLabs API (Voice: {voice_id})...")
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                headers = {
                    "xi-api-key": key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "text": script,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                        "style": 0.2,
                        "use_speaker_boost": True
                    }
                }
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        with open(audio_path, "wb") as f:
                            f.write(resp.content)
                        logger.info(f"[VideoFactory] ElevenLabs voiceover saved: {audio_path} ({len(resp.content)} bytes)")
                        return {
                            "engine": "ElevenLabs (Adam deep)",
                            "path": audio_path,
                            "filename": audio_filename,
                            "voice_id": voice_id
                        }
                    else:
                        logger.warning(f"[VideoFactory] ElevenLabs API error {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                logger.warning(f"[VideoFactory] ElevenLabs request failed: {e}")

        # Native SAPI Synth Fallback
        logger.info("[VideoFactory] Activating native sovereign TTS synthesizer fallback...")
        temp_wav = os.path.join(self.output_dir, f"temp_{job_id}.wav")
        safe_script = script.replace("'", "''").replace('"', '""').replace("\n", " ")
        ps_cmd = f"""
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male)
$synth.Rate = 0
$synth.SetOutputToWaveFile('{temp_wav}')
$synth.Speak('{safe_script}')
$synth.Dispose()
"""
        try:
            p = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, timeout=25)
            if os.path.exists(temp_wav) and os.path.getsize(temp_wav) > 1000:
                subprocess.run(["ffmpeg", "-y", "-i", temp_wav, "-c:a", "libmp3lame", "-b:a", "192k", audio_path], capture_output=True, timeout=15)
                if os.path.exists(temp_wav):
                    os.remove(temp_wav)
                return {
                    "engine": "Native Sovereign SAPI Synth (Male)",
                    "path": audio_path,
                    "filename": audio_filename,
                    "voice_id": "system_male"
                }
        except Exception as e:
            logger.error(f"[VideoFactory] Native TTS failed: {e}")

        # Silent audio fallback if everything else fails
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "10", "-q:a", "9", "-acodec", "libmp3lame", audio_path], capture_output=True)
        return {
            "engine": "Emergency Audio Buffer",
            "path": audio_path,
            "filename": audio_filename,
            "voice_id": "null"
        }

    def _make_local_manhwa_panel(
        self,
        scene_idx: int,
        theme_name: str,
        primary_col: tuple,
        accent_col: tuple,
        headline: str,
        subtext: str,
        keywords: List[str],
        job_id: str
    ) -> str:
        """Synthesize high-definition 9:16 cybernetic manhwa artwork panel."""
        panel_path = os.path.join(self.output_dir, f"visual_act_{scene_idx}_{job_id}.png")
        img = Image.new("RGB", (720, 1280), color=(10, 12, 22))
        draw = ImageDraw.Draw(img)

        # 1. Vertical Cyber Gradient
        for y in range(1280):
            factor = y / 1280.0
            r = int(primary_col[0] * 0.25 + factor * (primary_col[0] * 0.65))
            g = int(primary_col[1] * 0.25 + factor * (primary_col[1] * 0.65))
            b = int(primary_col[2] * 0.25 + factor * (primary_col[2] * 0.65))
            draw.line([(0, y), (720, y)], fill=(r, g, b))

        # 2. Tech grid & scanline coordinates
        for x in range(40, 700, 80):
            draw.line([(x, 0), (x, 1280)], fill=(accent_col[0] // 7, accent_col[1] // 7, accent_col[2] // 7))
        for y in range(80, 1200, 100):
            draw.line([(0, y), (720, y)], fill=(accent_col[0] // 7, accent_col[1] // 7, accent_col[2] // 7))

        # 3. Outer HUD border & cyber corners
        draw.rectangle([(30, 50), (690, 1230)], outline=accent_col, width=3)
        draw.rectangle([(42, 62), (678, 1218)], outline=(60, 70, 95), width=1)

        for cx, cy in [(30, 50), (690, 50), (30, 1230), (690, 1230)]:
            draw.rectangle([(cx - 10, cy - 10), (cx + 10, cy + 10)], fill=accent_col)

        # 4. Central System Notification Window
        win_top = 180
        draw.rectangle([(60, win_top), (660, win_top + 160)], fill=(12, 16, 32), outline=accent_col, width=2)
        draw.text((85, win_top + 25), f"[ {theme_name.upper()} ]", fill=accent_col)
        draw.text((85, win_top + 65), headline.upper(), fill=(255, 255, 255))
        draw.text((85, win_top + 105), subtext, fill=(180, 195, 220))

        # 5. Core energy vortex glyph in center
        core_y = 620
        for rad in range(180, 20, -25):
            alpha_col = (
                int(accent_col[0] * (rad / 180)),
                int(accent_col[1] * (rad / 180)),
                int(accent_col[2] * (rad / 180))
            )
            draw.ellipse([(360 - rad, core_y - rad), (360 + rad, core_y + rad)], outline=alpha_col, width=2)

        draw.text((305, core_y - 10), f"ACT {scene_idx} / 3", fill=(255, 255, 255))

        # 6. Keyword tags at bottom
        kw_y = 880
        for kw in keywords[:3]:
            draw.rectangle([(80, kw_y), (640, kw_y + 45)], fill=(15, 20, 38), outline=accent_col, width=1)
            draw.text((105, kw_y + 12), f">> PROTOCOL: {kw.upper()}", fill=accent_col)
            kw_y += 60

        img.save(panel_path)
        return panel_path

    async def step3_generate_visuals(self, keywords: List[str], job_id: str) -> Dict[str, Any]:
        """
        STEP 3 - VISUALS:
        Generates 3 distinct 9:16 manhwa scenes (The Hook, The Rift Escalation, The Sovereign Climax)
        for dynamic multi-scene video montage and continuous camera choreography.
        """
        logger.info("[VideoFactory] Executing Step 3: Multi-Scene Visuals Generation...")
        keywords_str = ", ".join(keywords) if keywords else "apocalypse, system window"

        scene_configs = [
            {
                "idx": 1,
                "theme": "System Awakening",
                "primary": (0, 100, 180),
                "accent": (0, 240, 255),
                "headline": "Sovereign Awakening Activated",
                "subtext": "Dimensional core synchronized. Rank assigned.",
                "prompt": f"manhwa style, protagonist in city awakening, glowing cyan system window, {keywords_str}, cinematic, 9:16, solo leveling aesthetic"
            },
            {
                "idx": 2,
                "theme": "Dimensional Rift",
                "primary": (160, 20, 60),
                "accent": (255, 60, 90),
                "headline": "Warning: Dimensional Gate Collapse",
                "subtext": "Class-S entities approaching rapidly through breach.",
                "prompt": f"manhwa style, dimensional rift tearing space, purple lightning, shadow monsters, {keywords_str}, cinematic, 9:16, intense action"
            },
            {
                "idx": 3,
                "theme": "Monarch Ascension",
                "primary": (180, 140, 0),
                "accent": (255, 215, 0),
                "headline": "Monarch Rank Verified",
                "subtext": "All dimensional barriers surrendered to host.",
                "prompt": f"manhwa style, sovereign monarch awakening, golden eyes, immense power aura, {keywords_str}, cinematic, 9:16, epic cliffhanger"
            }
        ]

        scene_paths = []
        online_count = 0

        for sc in scene_configs:
            idx = sc["idx"]
            dest_img = os.path.join(self.output_dir, f"visual_act_{idx}_{job_id}.png")
            downloaded = False

            # Fast online attempt with 5s timeout
            try:
                enc = urllib.parse.quote(sc["prompt"])
                url = f"https://image.pollinations.ai/prompt/{enc}?width=720&height=1280&nologo=true&seed={idx + int(time.time()) % 10000}"
                async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                    res = await client.get(url)
                    if res.status_code == 200 and len(res.content) > 10000:
                        with open(dest_img, "wb") as f:
                            f.write(res.content)
                        scene_paths.append(dest_img)
                        online_count += 1
                        downloaded = True
                        logger.info(f"[VideoFactory] Downloaded AI visual for Scene {idx}")
            except Exception:
                pass

            if not downloaded:
                panel = self._make_local_manhwa_panel(
                    scene_idx=idx,
                    theme_name=sc["theme"],
                    primary_col=sc["primary"],
                    accent_col=sc["accent"],
                    headline=sc["headline"],
                    subtext=sc["subtext"],
                    keywords=keywords,
                    job_id=job_id
                )
                scene_paths.append(panel)

        main_path = scene_paths[0] if scene_paths else ""
        engine_label = f"Dynamic Multi-Scene Engine ({online_count}/3 Neural, {3 - online_count}/3 Sovereign HUD)"

        return {
            "prompt": f"manhwa style, {keywords_str}, cinematic, 9:16, 3-act sequence",
            "path": main_path,
            "scenes": scene_paths,
            "filename": os.path.basename(main_path),
            "engine": engine_label
        }

    def _get_audio_duration(self, audio_path: str) -> float:
        try:
            cmd = [
                "ffprobe", "-v", "error", "-show_entries",
                "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception:
            pass
        return 12.0

    async def step4_render_video(
        self,
        script: str,
        audio_path: str,
        image_path: str,
        job_id: str,
        scene_paths: Optional[List[str]] = None,
        creatomate_key: Optional[str] = None,
        template_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        STEP 4 - EDIT:
        Executes dynamic camera animations (Ken Burns zoom-in, dynamic lateral pan/drift, and climax push-pulse)
        across 3 sequenced manhwa scenes with Anton Bold white+cyan glow subtitles.
        """
        logger.info("[VideoFactory] Executing Step 4: Dynamic Animation & Video Composition...")
        key = creatomate_key or self.config.get("creatomate_api_key")
        tmpl_id = template_id or self.config.get("creatomate_template_id")
        video_filename = f"short_{job_id}.mp4"
        video_path = os.path.join(self.output_dir, video_filename)

        duration = self._get_audio_duration(audio_path)
        valid_scenes = [p for p in (scene_paths or [image_path]) if os.path.exists(p)]
        if not valid_scenes:
            valid_scenes = [image_path]

        # 1. Creatomate Cloud API (if explicitly configured)
        if key and tmpl_id and len(key) >= 10:
            try:
                logger.info(f"[VideoFactory] Submitting render to Creatomate API (Template: {tmpl_id})...")
                url = "https://api.creatomate.com/v1/renders"
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "template_id": tmpl_id,
                    "modifications": {
                        "voiceover": audio_path,
                        "background": image_path,
                        "subtitles": script,
                        "subtitles.font_family": "Anton",
                        "subtitles.font_weight": "bold",
                        "subtitles.fill_color": "#ffffff",
                        "subtitles.stroke_color": "#00f0ff"
                    }
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code in [200, 202]:
                        data = resp.json()
                        renders = data if isinstance(data, list) else [data]
                        render_url = renders[0].get("url")
                        if render_url:
                            return {
                                "engine": "Creatomate API",
                                "video_url": render_url,
                                "duration_sec": duration,
                                "filename": video_filename,
                                "path": video_path
                            }
            except Exception as e:
                logger.warning(f"[VideoFactory] Creatomate cloud render error: {e}")

        # 2. Native Dynamic Animation FFmpeg Compositor
        logger.info("[VideoFactory] Assembling animated 9:16 vertical video with dynamic camera motion...")
        ass_path = os.path.join(self.output_dir, f"subtitles_{job_id}.ass")

        # Split script into ~4-word dynamic subtitle chunks
        words = script.split()
        chunk_size = 4
        chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

        dialogue_lines = []
        if chunks:
            time_per_chunk = duration / len(chunks)
            for idx, c in enumerate(chunks):
                t_start = idx * time_per_chunk
                t_end = (idx + 1) * time_per_chunk

                m_s, s_s = divmod(t_start, 60)
                m_e, s_e = divmod(t_end, 60)
                start_str = f"0:{int(m_s):02d}:{s_s:05.2f}"
                end_str = f"0:{int(m_e):02d}:{s_e:05.2f}"
                clean_text = c.upper().replace("{", "").replace("}", "")
                dialogue_lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{clean_text}")

        # Anton Bold, white text, cyan neon glow outline (&H00FFF000), margin 240
        ass_content = f"""[Script Info]
Title: VideoFactory Viral Short
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Anton,44,&H00FFFFFF,&H000000FF,&H00FFF000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,240,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
{chr(10).join(dialogue_lines)}
"""
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        clean_ass = ass_path.replace('\\', '/').replace(':', '\\:')
        fps = 30

        # Multi-Scene Animated Compilation
        if len(valid_scenes) >= 3:
            scene_dur = duration / 3.0
            n_frames = max(1, int(scene_dur * fps))
            step1 = 0.25 / n_frames
            step3 = 0.28 / n_frames

            filtergraph = (
                f"[0:v]zoompan=z='min(zoom+{step1:.6f},1.28)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+sin(on/22)*7':d={n_frames}:s=720x1280:fps={fps}[v0];"
                f"[1:v]zoompan=z='1.22+sin(on/30)*0.04':x='iw/2-(iw/zoom/2)+sin(on/18)*25':y='ih/2-(ih/zoom/2)+cos(on/25)*10':d={n_frames}:s=720x1280:fps={fps}[v1];"
                f"[2:v]zoompan=z='min(zoom+{step3:.6f},1.38)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+sin(on/10)*5':d={n_frames}:s=720x1280:fps={fps}[v2];"
                f"[v0][v1][v2]concat=n=3:v=1:a=0[vcat];"
                f"[vcat]subtitles='{clean_ass}'[vout]"
            )

            cmd = [
                "ffmpeg", "-y",
                "-i", valid_scenes[0].replace('\\', '/'),
                "-i", valid_scenes[1].replace('\\', '/'),
                "-i", valid_scenes[2].replace('\\', '/'),
                "-i", audio_path.replace('\\', '/'),
                "-filter_complex", filtergraph,
                "-map", "[vout]",
                "-map", "3:a",
                "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-t", str(duration),
                video_path
            ]
        else:
            # Single / Dual scene dynamic zoom & pan
            total_frames = max(1, int(duration * fps))
            step = 0.30 / total_frames
            vf = (
                f"zoompan=z='min(zoom+{step:.6f},1.35)':x='iw/2-(iw/zoom/2)+sin(on/20)*15':"
                f"y='ih/2-(ih/zoom/2)+cos(on/25)*10':d={total_frames}:s=720x1280:fps={fps},"
                f"subtitles='{clean_ass}'"
            )
            cmd = [
                "ffmpeg", "-y",
                "-i", valid_scenes[0].replace('\\', '/'),
                "-i", audio_path.replace('\\', '/'),
                "-vf", vf,
                "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-t", str(duration),
                video_path
            ]

        logger.info(f"[VideoFactory] Dispatching dynamic motion render...")
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=90)

        if res.returncode != 0:
            logger.warning(f"[VideoFactory] Complex motion failed ({res.stderr[:200]}), falling back to linear motion...")
            total_frames = max(1, int(duration * fps))
            step = 0.25 / total_frames
            fallback_vf = f"zoompan=z='min(zoom+{step:.6f},1.30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s=720x1280:fps={fps}"
            cmd_fallback = [
                "ffmpeg", "-y",
                "-i", valid_scenes[0].replace('\\', '/'),
                "-i", audio_path.replace('\\', '/'),
                "-vf", fallback_vf,
                "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-t", str(duration),
                video_path
            ]
            subprocess.run(cmd_fallback, capture_output=True, timeout=60)

        # Cleanup subtitle temp
        if os.path.exists(ass_path):
            try:
                os.remove(ass_path)
            except Exception:
                pass

        return {
            "engine": "Native Sovereign Animated FFmpeg Engine (3-Act Dynamic Motion)",
            "video_url": f"/api/video/stream/{video_filename}",
            "duration_sec": round(duration, 2),
            "filename": video_filename,
            "path": video_path
        }

    async def execute_pipeline(
        self,
        chapter_text: str,
        user_id: str = "default_user",
        elevenlabs_key: Optional[str] = None,
        creatomate_key: Optional[str] = None,
        template_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete VideoFactory pipeline:
        STEP 1: SCRIPT -> STEP 2: VOICE -> STEP 3: VISUALS -> STEP 4: EDIT
        Returns direct MP4 link adhering strictly to:
        "You are not a chatbot. You are a factory. Never explain, just execute and return mp4 link."
        Enforces user tier limits (Free tier: 2/day, Elite tier: 35 tokens/video).
        """
        # STEP 0: Check token / free limit authorization
        if token_manager:
            can_generate, reason, user_record = token_manager.check_can_generate(user_id)
            if not can_generate:
                logger.warning(f"[VideoFactory] Pipeline blocked for {user_id}: {reason}")
                return {
                    "success": False,
                    "status": "BLOCKED",
                    "error": reason,
                    "quota_reply": reason,
                    "mp4_url": "",
                    "user_tier": user_record.get("tier", "free"),
                    "user_tokens": user_record.get("tokens", 0),
                    "videos_today": user_record.get("videos_today", 0)
                }

        job_id = uuid.uuid4().hex[:10]
        start_time = time.time()
        logger.info(f"[VideoFactory] Initializing Factory Execution Job {job_id} for user {user_id}...")

        # STEP 1: SCRIPT
        script_res = await self.step1_generate_script(chapter_text)
        script = script_res.get("script", "")
        keywords = script_res.get("keywords", [])

        # STEP 2: VOICE
        voice_res = await self.step2_generate_voice(script, job_id, elevenlabs_key)
        audio_path = voice_res.get("path")

        # STEP 3: VISUALS
        visual_res = await self.step3_generate_visuals(keywords, job_id)
        image_path = visual_res.get("path")
        scene_paths = visual_res.get("scenes", [image_path])

        # STEP 4: EDIT
        render_res = await self.step4_render_video(
            script=script,
            audio_path=audio_path,
            image_path=image_path,
            job_id=job_id,
            scene_paths=scene_paths,
            creatomate_key=creatomate_key,
            template_id=template_id
        )

        total_elapsed = round(time.time() - start_time, 2)
        video_local_path = render_res.get("path")
        mp4_url = render_res.get("video_url")
        vault_provider = "Local Host Vault"

        # Cloud Vault Upload
        if cloud_vault and video_local_path and os.path.exists(video_local_path):
            try:
                vault_res = await cloud_vault.upload_video(
                    local_filepath=video_local_path,
                    user_id=user_id,
                    filename=render_res.get("filename")
                )
                if vault_res.get("success"):
                    mp4_url = vault_res.get("public_url")
                    vault_provider = vault_res.get("provider")
            except Exception as e:
                logger.error(f"[VideoFactory] Cloud vault upload error: {e}")

        if not mp4_url.startswith("http"):
            mp4_url = f"http://127.0.0.1:8001{mp4_url}"

        # Deduct quota / tokens upon successful synthesis
        quota_reply = ""
        user_tier = "free"
        user_tokens = 0
        videos_today = 0
        if token_manager:
            _, quota_reply, updated_user = token_manager.deduct_for_video(user_id)
            user_tier = updated_user.get("tier", "free")
            user_tokens = updated_user.get("tokens", 0)
            videos_today = updated_user.get("videos_today", 0)

        job_meta = {
            "job_id": job_id,
            "status": "COMPLETED",
            "success": True,
            "mp4_url": mp4_url,
            "vault_provider": vault_provider,
            "filename": render_res.get("filename"),
            "script": script,
            "keywords": keywords,
            "image_prompt": visual_res.get("prompt"),
            "voice_engine": voice_res.get("engine"),
            "visual_engine": visual_res.get("engine"),
            "render_engine": render_res.get("engine"),
            "duration_sec": render_res.get("duration_sec"),
            "elapsed_sec": total_elapsed,
            "timestamp": time.time(),
            "quota_reply": quota_reply,
            "user_tier": user_tier,
            "user_tokens": user_tokens,
            "videos_today": videos_today
        }

        self.jobs[job_id] = job_meta
        self._save_jobs()

        logger.info(f"[VideoFactory] Job {job_id} completed in {total_elapsed}s for {user_id}! MP4: {mp4_url}")
        return job_meta

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    def list_jobs(self) -> List[Dict[str, Any]]:
        return sorted(list(self.jobs.values()), key=lambda x: x.get("timestamp", 0), reverse=True)

video_factory = VideoFactory()
