using UnityEngine;

namespace AstroShift.Environment
{
    public class ThermalOptimizationManager : MonoBehaviour
    {
        public static ThermalOptimizationManager Instance { get; private set; }

        [Header("Thermal & Battery Protection")]
        public bool limitFrameRate = true;
        public int desktopTargetFPS = 60;
        public int mobileTargetFPS = 30;
        public int unfocusedBackgroundFPS = 15;

        [Header("Low-End & Mobile Optimization")]
        public bool isMobileDevice = false;
        public bool lowPowerEcoMode = false;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            isMobileDevice = Application.isMobilePlatform || 
                             SystemInfo.deviceType == DeviceType.Handheld || 
                             (SystemInfo.systemMemorySize > 0 && SystemInfo.systemMemorySize < 4096);

            ApplyThermalThrottlingProtection();
        }

        public void ApplyThermalThrottlingProtection()
        {
            // 1. Frame Rate Cap (Silences cooling fans & stops GPU 100% wattage spikes)
            int target = isMobileDevice || lowPowerEcoMode ? mobileTargetFPS : desktopTargetFPS;
            Application.targetFrameRate = target;
            QualitySettings.vSyncCount = 1;

            // 2. Mobile & Low-End GPU Fill-Rate Reductions
            if (isMobileDevice || lowPowerEcoMode)
            {
                QualitySettings.shadowDistance = 25f;
                QualitySettings.shadowResolution = ShadowResolution.Low;
                QualitySettings.shadowCascades = 1;
                QualitySettings.pixelLightCount = 1;
                QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
                QualitySettings.antiAliasing = 0;
            }
            else
            {
                QualitySettings.shadowDistance = 65f;
                QualitySettings.shadowResolution = ShadowResolution.Medium;
                QualitySettings.shadowCascades = 2;
                QualitySettings.pixelLightCount = 2;
                QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
            }

            Debug.Log($"[AstroShift] Thermal Protection Active. Target FPS: {target}, Mobile/Eco: {isMobileDevice || lowPowerEcoMode}");
        }

        [Header("Adaptive Performance Guardian")]
        public float currentFPS = 60f;
        private float frameTimeAccumulator = 0f;
        private int frameCount = 0;

        void Update()
        {
            frameCount++;
            frameTimeAccumulator += Time.unscaledDeltaTime;

            if (frameTimeAccumulator >= 0.5f)
            {
                currentFPS = frameCount / frameTimeAccumulator;
                frameCount = 0;
                frameTimeAccumulator = 0f;

                // Zero-Lag Adaptive Guardian: If frame pacing drops under 40, dynamically shed load to maintain 60 FPS
                if (currentFPS < 38f && !lowPowerEcoMode)
                {
                    QualitySettings.shadowDistance = Mathf.Max(15f, QualitySettings.shadowDistance * 0.75f);
                    QualitySettings.pixelLightCount = 1;
                    QualitySettings.shadowCascades = 1;
                    QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
                }
                else if (currentFPS >= 58f && !isMobileDevice && QualitySettings.shadowDistance < 65f)
                {
                    QualitySettings.shadowDistance = Mathf.Min(65f, QualitySettings.shadowDistance + 5f);
                    QualitySettings.pixelLightCount = 2;
                }
            }
        }

        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                // When tab or window is minimized, throttle to 15 FPS to keep GPU completely silent and cold
                Application.targetFrameRate = unfocusedBackgroundFPS;
            }
            else
            {
                int target = isMobileDevice || lowPowerEcoMode ? mobileTargetFPS : desktopTargetFPS;
                Application.targetFrameRate = target;
            }
        }

        public void ToggleEcoMode()
        {
            lowPowerEcoMode = !lowPowerEcoMode;
            ApplyThermalThrottlingProtection();
        }
    }
}
