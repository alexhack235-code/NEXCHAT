using UnityEngine;

namespace AstroShift.Environment
{
    public static class WorldBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void OnSceneLoaded()
        {
            if (GameObject.Find("Metropolis_Ground") == null)
            {
                Debug.Log("[AstroShift] Auto-Bootstrapping Metropolis & Space Realm...");
                GameObject root = new GameObject("AstroShift_WorldRoot");
                root.AddComponent<ThermalOptimizationManager>();
                var builder = root.AddComponent<ProceduralWorldBuilder>();
                builder.BuildCompleteWorld();
            }
        }
    }
}
