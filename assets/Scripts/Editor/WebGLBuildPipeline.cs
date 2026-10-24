#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using System.IO;

namespace AstroShift.Editor
{
    public static class WebGLBuildPipeline
    {
        [MenuItem("AstroShift/Create & Setup Complete Game Scene")]
        public static void CreateGameScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            // Add Master Procedural World Builder
            GameObject worldRoot = new GameObject("AstroShift_WorldRoot");
            var builder = worldRoot.AddComponent<Environment.ProceduralWorldBuilder>();
            builder.BuildCompleteWorld();

            // Setup Lighting
            RenderSettings.ambientLight = new Color(0.25f, 0.35f, 0.48f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.04f, 0.08f, 0.16f);
            RenderSettings.fogDensity = 0.002f;

            string sceneDir = Path.Combine(Application.dataPath, "Scenes");
            if (!Directory.Exists(sceneDir))
            {
                Directory.CreateDirectory(sceneDir);
            }
            string scenePath = "Assets/Scenes/MetropolisSpaceRealm.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log($"[AstroShift] Complete Game Scene saved to {scenePath}");

            // Set Build Settings
            EditorBuildSettingsScene[] scenes = new EditorBuildSettingsScene[]
            {
                new EditorBuildSettingsScene(scenePath, true)
            };
            EditorBuildSettings.scenes = scenes;
        }

        [MenuItem("AstroShift/Build WebGL Game")]
        public static void BuildWebGL()
        {
            CreateGameScene();

            string buildPath = "Builds/WebGL";
            if (!Directory.Exists(buildPath))
            {
                Directory.CreateDirectory(buildPath);
            }

            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = new string[] { "Assets/Scenes/MetropolisSpaceRealm.unity" },
                locationPathName = buildPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            Debug.Log("[AstroShift] Starting Unity WebGL Compilation & Build...");
            var report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            Debug.Log($"[AstroShift] WebGL Build Result: {report.summary.result}");
        }

        [MenuItem("AstroShift/Build Windows Standalone Game")]
        public static void BuildWindows()
        {
            CreateGameScene();

            string buildDir = "Builds/Windows";
            if (!Directory.Exists(buildDir))
            {
                Directory.CreateDirectory(buildDir);
            }

            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = new string[] { "Assets/Scenes/MetropolisSpaceRealm.unity" },
                locationPathName = Path.Combine(buildDir, "AstroShift.exe"),
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            Debug.Log("[AstroShift] Starting Unity Windows Standalone 64-bit Compilation...");
            var report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            Debug.Log($"[AstroShift] Windows Standalone Build Result: {report.summary.result}");
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
