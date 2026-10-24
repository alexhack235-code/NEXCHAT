using UnityEngine;

namespace AstroShift.Space
{
    public class HolographicOrrey : MonoBehaviour
    {
        [Header("Orrey Rotation Speeds")]
        public float baseRotationSpeed = 22f;
        public Transform earthOrbit;
        public float earthOrbitSpeed = 35f;
        public Transform marsOrbit;
        public float marsOrbitSpeed = 25f;
        public Transform saturnOrbit;
        public float saturnOrbitSpeed = 15f;

        void Update()
        {
            // Rotate central projection table
            transform.Rotate(Vector3.up, baseRotationSpeed * Time.deltaTime, UnityEngine.Space.Self);

            // Orbit individual planetary nodes
            if (earthOrbit != null) earthOrbit.Rotate(Vector3.up, earthOrbitSpeed * Time.deltaTime, UnityEngine.Space.Self);
            if (marsOrbit != null) marsOrbit.Rotate(Vector3.up, marsOrbitSpeed * Time.deltaTime, UnityEngine.Space.Self);
            if (saturnOrbit != null) saturnOrbit.Rotate(Vector3.up, saturnOrbitSpeed * Time.deltaTime, UnityEngine.Space.Self);
        }
    }
}
