using UnityEngine;

namespace AstroShift.Environment
{
    public class CelestialDayNightCycle : MonoBehaviour
    {
        [Header("Cycle Configuration")]
        public float dayDurationSeconds = 180f; // 3 minutes full day-night loop
        public float timeOfDay = 0.25f; // 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
        public bool isCycleActive = true;

        [Header("Sun & Lighting")]
        public Light directionalSun;
        public Gradient sunColorGradient;
        public AnimationCurve sunIntensityCurve;

        [Header("Ambient & Fog")]
        public Gradient ambientColorGradient;
        public Gradient fogColorGradient;

        void Awake()
        {
            if (directionalSun == null)
            {
                var lights = Object.FindObjectsByType<Light>(FindObjectsSortMode.None);
                foreach (var l in lights)
                {
                    if (l.type == LightType.Directional)
                    {
                        directionalSun = l;
                        break;
                    }
                }
            }

            SetupGradientsIfNull();
        }

        void SetupGradientsIfNull()
        {
            // Sun Color Gradient
            sunColorGradient = new Gradient();
            GradientColorKey[] sKeys = new GradientColorKey[]
            {
                new GradientColorKey(new Color(0.1f, 0.15f, 0.3f), 0.0f),   // Midnight blue
                new GradientColorKey(new Color(1.0f, 0.65f, 0.35f), 0.25f), // Golden dawn
                new GradientColorKey(new Color(1.0f, 0.98f, 0.92f), 0.5f),  // Bright noon
                new GradientColorKey(new Color(1.0f, 0.35f, 0.15f), 0.75f), // Crimson sunset
                new GradientColorKey(new Color(0.1f, 0.15f, 0.3f), 1.0f)    // Midnight blue
            };
            GradientAlphaKey[] aKeys = new GradientAlphaKey[]
            {
                new GradientAlphaKey(1f, 0f),
                new GradientAlphaKey(1f, 1f)
            };
            sunColorGradient.SetKeys(sKeys, aKeys);

            // Sun Intensity Curve
            sunIntensityCurve = new AnimationCurve(
                new Keyframe(0.0f, 0.05f),
                new Keyframe(0.2f, 0.4f),
                new Keyframe(0.5f, 1.35f),
                new Keyframe(0.8f, 0.4f),
                new Keyframe(1.0f, 0.05f)
            );
        }

        void Update()
        {
            // Advance celestial time with [K] key
            if (Input.GetKeyDown(KeyCode.K))
            {
                timeOfDay = (timeOfDay + 0.25f) % 1.0f;
            }

            if (isCycleActive)
            {
                timeOfDay += (Time.deltaTime / dayDurationSeconds);
                if (timeOfDay >= 1.0f) timeOfDay -= 1.0f;
            }

            ApplyCelestialLighting();
        }

        void ApplyCelestialLighting()
        {
            float sunAngle = (timeOfDay * 360f) - 90f;

            if (directionalSun != null)
            {
                directionalSun.transform.rotation = Quaternion.Euler(sunAngle, 170f, 0f);
                directionalSun.color = sunColorGradient.Evaluate(timeOfDay);
                directionalSun.intensity = sunIntensityCurve.Evaluate(timeOfDay);
            }

            // Adjust Ambient and Fog
            RenderSettings.ambientLight = Color.Lerp(
                new Color(0.06f, 0.08f, 0.16f), // Night ambient
                new Color(0.35f, 0.42f, 0.55f), // Day ambient
                sunIntensityCurve.Evaluate(timeOfDay) / 1.35f
            );
        }
    }
}
