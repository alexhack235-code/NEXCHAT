#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using System.IO;

namespace AstroShift.Editor
{
    public static class WebGLBuildPipeline
    {
        public const string BuildScenePath = "Assets/Scenes/MetropolisSpaceRealm.unity";
        public const string WebGLBuildOutputPath = "Builds/WebGL";
        public const string WindowsBuildOutputPath = "Builds/Windows/AstroShift.exe";

        [MenuItem("AstroShift/Configure WebGL Player Settings")]
        public static void ConfigureWebGLSettings()
        {
            Debug.Log("[AstroShift] Configuring Unity 6 WebGL Player Settings...");

            // 1. Graphics API: Explicitly enforce WebGL 2.0 (OpenGLES3)
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.WebGL, false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, new GraphicsDeviceType[] { GraphicsDeviceType.OpenGLES3 });

            // 2. WebAssembly Memory Configuration (512MB default allocation, scalable to 1024MB / 2048MB max)
            int targetMemoryMB = 512;
            string[] args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-webglMemorySize" && i + 1 < args.Length)
                {
                    if (int.TryParse(args[i + 1], out int parsedMem))
                    {
                        targetMemoryMB = parsedMem;
                    }
                }
            }
            PlayerSettings.WebGL.memorySize = targetMemoryMB;

            var webglType = typeof(PlayerSettings.WebGL);
            var initialMemProp = webglType.GetProperty("initialMemorySize");
            if (initialMemProp != null && initialMemProp.CanWrite)
            {
                initialMemProp.SetValue(null, targetMemoryMB, null);
            }

            var maxMemProp = webglType.GetProperty("maximumMemorySize");
            if (maxMemProp != null && maxMemProp.CanWrite)
            {
                maxMemProp.SetValue(null, 2048, null);
            }

            // 3. WebAssembly Code Optimization and IL2CPP Configuration (Release / OptimizeSpeed)
            PlayerSettings.SetIl2CppCompilerConfiguration(NamedBuildTarget.WebGL, Il2CppCompilerConfiguration.Release);
            PlayerSettings.SetIl2CppCodeGeneration(NamedBuildTarget.WebGL, Il2CppCodeGeneration.OptimizeSpeed);

            // 4. Exception Support: Explicitly thrown exceptions only (production balance: minimal overhead, catchable errors)
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;

            // 5. Compression Format: Brotli with Decompression Fallback
            WebGLCompressionFormat targetCompression = WebGLCompressionFormat.Brotli;
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-webglCompression" && i + 1 < args.Length)
                {
                    string comp = args[i + 1].ToLowerInvariant();
                    if (comp == "gzip") targetCompression = WebGLCompressionFormat.Gzip;
                    else if (comp == "brotli") targetCompression = WebGLCompressionFormat.Brotli;
                    else if (comp == "disabled" || comp == "none") targetCompression = WebGLCompressionFormat.Disabled;
                }
            }
            PlayerSettings.WebGL.compressionFormat = targetCompression;
            PlayerSettings.WebGL.decompressionFallback = true;

            // 6. IndexedDB Data Caching, Responsive Template, and Single-Threaded WebView Compatibility
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.template = "PROJECT:AstroShiftResponsive";
            PlayerSettings.WebGL.threadsSupport = false;

            // 7. GPU Power Preference: High Performance
            PlayerSettings.WebGL.powerPreference = WebGLPowerPreference.HighPerformance;

            // 8. Emscripten Linker Flags: Enforce --bind for embind runtime symbols
            string currentEmscriptenArgs = PlayerSettings.WebGL.emscriptenArgs ?? "";
            if (!currentEmscriptenArgs.Contains("--bind"))
            {
                PlayerSettings.WebGL.emscriptenArgs = string.IsNullOrEmpty(currentEmscriptenArgs) ? "--bind" : currentEmscriptenArgs + " --bind";
            }

            // Save Project Settings Asset changes
            AssetDatabase.SaveAssets();

            Debug.Log($"[AstroShift] WebGL Player Settings successfully configured: WebGL 2.0 (OpenGLES3), Compression={targetCompression}, Memory={targetMemoryMB}MB, OptimizeSpeed, HighPerformance GPU, Fallback=True.");
        }

        [MenuItem("AstroShift/Create and Setup Complete Game Scene")]
        public static void CreateGameScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            // Add Master Procedural World Builder and Thermal Optimization Manager
            GameObject worldRoot = new GameObject("AstroShift_WorldRoot");
            worldRoot.AddComponent<Environment.ThermalOptimizationManager>();
            var builder = worldRoot.AddComponent<Environment.ProceduralWorldBuilder>();
            builder.BuildCompleteWorld();

            // Setup Atmospheric and Cosmic Lighting
            RenderSettings.ambientLight = new Color(0.25f, 0.35f, 0.48f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.04f, 0.08f, 0.16f);
            RenderSettings.fogDensity = 0.002f;

            string sceneDir = Path.Combine(Application.dataPath, "Scenes");
            if (!Directory.Exists(sceneDir))
            {
                Directory.CreateDirectory(sceneDir);
            }

            EditorSceneManager.SaveScene(scene, BuildScenePath);
            Debug.Log($"[AstroShift] Complete Game Scene saved to {BuildScenePath}");

            // Set Build Settings Scenes
            EditorBuildSettingsScene[] scenes = new EditorBuildSettingsScene[]
            {
                new EditorBuildSettingsScene(BuildScenePath, true)
            };
            EditorBuildSettings.scenes = scenes;
        }

        [MenuItem("AstroShift/Build WebGL Game")]
        public static void BuildWebGL()
        {
            Debug.Log("[AstroShift] Initiating verified WebGL Build Pipeline...");

            // 1. Configure all WebGL player settings
            ConfigureWebGLSettings();

            // 2. Ensure Scene is generated, baked, and configured in build scenes
            CreateGameScene();

            // 3. Prepare output directory
            if (!Directory.Exists(WebGLBuildOutputPath))
            {
                Directory.CreateDirectory(WebGLBuildOutputPath);
            }

            // 4. Configure BuildPlayerOptions
            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = new string[] { BuildScenePath },
                locationPathName = WebGLBuildOutputPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            Debug.Log($"[AstroShift] Starting Unity WebGL Compilation and Build to {WebGLBuildOutputPath}...");
            var report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            Debug.Log($"[AstroShift] WebGL Build Result: {report.summary.result} (Total Errors: {report.summary.totalErrors}, Warnings: {report.summary.totalWarnings})");

            if (report.summary.result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
            {
                throw new System.Exception($"[AstroShift] WebGL Build failed with result: {report.summary.result}");
            }
        }

        [MenuItem("AstroShift/Build Windows Standalone Game")]
        public static void BuildWindows()
        {
            CreateGameScene();

            string buildDir = Path.GetDirectoryName(WindowsBuildOutputPath);
            if (!Directory.Exists(buildDir))
            {
                Directory.CreateDirectory(buildDir);
            }

            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = new string[] { BuildScenePath },
                locationPathName = WindowsBuildOutputPath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            Debug.Log("[AstroShift] Starting Unity Windows Standalone 64-bit Compilation...");
            var report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            Debug.Log($"[AstroShift] Windows Standalone Build Result: {report.summary.result}");

            if (report.summary.result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
            {
                throw new System.Exception($"[AstroShift] Windows Standalone Build failed with result: {report.summary.result}");
            }
        }

        [MenuItem("AstroShift/Build All Platforms")]
        public static void BuildAll()
        {
            BuildWindows();
            BuildWebGL();
        }
    }
}
#endif
