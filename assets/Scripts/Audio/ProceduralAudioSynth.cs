using UnityEngine;
using System.Collections.Generic;

namespace AstroShift.Audio
{
    public class ProceduralAudioSynth : MonoBehaviour
    {
        public static ProceduralAudioSynth Instance { get; private set; }

        private AudioClip laserZapClip;
        private AudioClip shieldImpactClip;
        private AudioClip explosionClip;
        private AudioClip boostPurgeClip;
        private AudioClip warpSweepClip;

        private AudioSource sfxAudioSource;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }

            sfxAudioSource = gameObject.AddComponent<AudioSource>();
            sfxAudioSource.spatialBlend = 0f; // 2D fallback
            sfxAudioSource.playOnAwake = false;

            GenerateProceduralAudioClips();
        }

        void GenerateProceduralAudioClips()
        {
            laserZapClip = CreateLaserClip();
            shieldImpactClip = CreateShieldImpactClip();
            explosionClip = CreateExplosionClip();
            boostPurgeClip = CreatePurgeClip();
            warpSweepClip = CreateWarpSweepClip();
        }

        AudioClip CreateLaserClip()
        {
            int sampleRate = 44100;
            float duration = 0.18f;
            int sampleCount = (int)(sampleRate * duration);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float t = (float)i / sampleRate;
                float progress = t / duration;
                // Frequency drops rapidly from 2200 Hz down to 240 Hz
                float freq = Mathf.Lerp(2200f, 240f, Mathf.Pow(progress, 0.4f));
                float wave = Mathf.Sin(2f * Mathf.PI * freq * t);
                // Sharp attack, exponential decay
                float envelope = Mathf.Exp(-progress * 6.5f);
                samples[i] = Mathf.Clamp(wave * envelope * 0.75f, -1f, 1f);
            }

            AudioClip clip = AudioClip.Create("Proc_LaserZap", sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        AudioClip CreateShieldImpactClip()
        {
            int sampleRate = 44100;
            float duration = 0.28f;
            int sampleCount = (int)(sampleRate * duration);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float t = (float)i / sampleRate;
                float progress = t / duration;
                float freq = Mathf.Lerp(380f, 65f, progress);
                float sine = Mathf.Sin(2f * Mathf.PI * freq * t);
                float noise = (Random.value * 2f - 1f) * 0.35f;
                float envelope = (1f - progress) * Mathf.Exp(-progress * 4f);
                samples[i] = Mathf.Clamp((sine * 0.7f + noise * 0.3f) * envelope, -1f, 1f);
            }

            AudioClip clip = AudioClip.Create("Proc_ShieldImpact", sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        AudioClip CreateExplosionClip()
        {
            int sampleRate = 44100;
            float duration = 0.75f;
            int sampleCount = (int)(sampleRate * duration);
            float[] samples = new float[sampleCount];

            float lastSample = 0f;
            for (int i = 0; i < sampleCount; i++)
            {
                float progress = (float)i / sampleCount;
                float whiteNoise = Random.value * 2f - 1f;
                // Simple low-pass filter for deep explosion rumble
                lastSample = Mathf.Lerp(lastSample, whiteNoise, 0.12f);
                float envelope = Mathf.Pow(1f - progress, 1.8f);
                samples[i] = Mathf.Clamp(lastSample * envelope * 0.85f, -1f, 1f);
            }

            AudioClip clip = AudioClip.Create("Proc_Explosion", sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        AudioClip CreatePurgeClip()
        {
            int sampleRate = 44100;
            float duration = 0.35f;
            int sampleCount = (int)(sampleRate * duration);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float progress = (float)i / sampleCount;
                float noise = Random.value * 2f - 1f;
                float envelope = Mathf.Sin(progress * Mathf.PI) * 0.6f;
                samples[i] = Mathf.Clamp(noise * envelope, -1f, 1f);
            }

            AudioClip clip = AudioClip.Create("Proc_BoostPurge", sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        AudioClip CreateWarpSweepClip()
        {
            int sampleRate = 44100;
            float duration = 1.2f;
            int sampleCount = (int)(sampleRate * duration);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float t = (float)i / sampleRate;
                float progress = t / duration;
                float freq = Mathf.Lerp(80f, 1600f, Mathf.Pow(progress, 2f));
                float wave = Mathf.Sin(2f * Mathf.PI * freq * t);
                float envelope = Mathf.Sin(progress * Mathf.PI);
                samples[i] = Mathf.Clamp(wave * envelope * 0.7f, -1f, 1f);
            }

            AudioClip clip = AudioClip.Create("Proc_WarpSweep", sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        public void PlayLaserAt(Vector3 position, float pitch = 1f)
        {
            PlaySpatial(laserZapClip, position, 0.85f, pitch);
        }

        public void PlayShieldImpactAt(Vector3 position)
        {
            PlaySpatial(shieldImpactClip, position, 1.0f, 1.0f);
        }

        public void PlayExplosionAt(Vector3 position)
        {
            PlaySpatial(explosionClip, position, 1.1f, Random.Range(0.85f, 1.15f));
        }

        public void PlayPurgeAt(Vector3 position)
        {
            PlaySpatial(boostPurgeClip, position, 0.75f, 1.1f);
        }

        public void PlayWarpSound()
        {
            if (sfxAudioSource != null && warpSweepClip != null)
            {
                sfxAudioSource.PlayOneShot(warpSweepClip, 1.0f);
            }
        }

        private void PlaySpatial(AudioClip clip, Vector3 position, float volume, float pitch)
        {
            if (clip == null) return;

            GameObject tempGO = new GameObject("Temp_Spatial_SFX");
            tempGO.transform.position = position;

            AudioSource aSrc = tempGO.AddComponent<AudioSource>();
            aSrc.clip = clip;
            aSrc.volume = volume;
            aSrc.pitch = pitch;
            aSrc.spatialBlend = 0.85f;
            aSrc.minDistance = 3f;
            aSrc.maxDistance = 250f;
            aSrc.rolloffMode = AudioRolloffMode.Linear;
            aSrc.Play();

            Destroy(tempGO, clip.length / Mathf.Max(0.1f, pitch) + 0.1f);
        }
    }
}
