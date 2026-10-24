using UnityEngine;

namespace AstroShift.Environment
{
    public class CelestialRealm : MonoBehaviour
    {
        [Header("Planetary Bodies")]
        public Transform earthSphere;
        public float earthSpinSpeed = 1.2f;

        public Transform marsSphere;
        public float marsSpinSpeed = 1.5f;

        public Transform chronosRingedGiant;
        public float chronosSpinSpeed = 0.8f;

        void Update()
        {
            if (earthSphere != null)
                earthSphere.Rotate(Vector3.up, earthSpinSpeed * Time.deltaTime, UnityEngine.Space.Self);

            if (marsSphere != null)
                marsSphere.Rotate(Vector3.up, marsSpinSpeed * Time.deltaTime, UnityEngine.Space.Self);

            if (chronosRingedGiant != null)
                chronosRingedGiant.Rotate(Vector3.up, chronosSpinSpeed * Time.deltaTime, UnityEngine.Space.Self);
        }
    }
}
