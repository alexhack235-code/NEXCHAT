using UnityEngine;

namespace AstroShift.Environment
{
    public class OrbitalSpaceStation : MonoBehaviour
    {
        [Header("Artificial-Gravity Centrifuge Habitation Ring")]
        public Transform habitationRing;
        public float centrifugeSpinRate = 18.0f;

        [Header("Solar Wing Tracking")]
        public Transform[] solarTrusses;
        public float solarTrackingRate = 4.0f;

        [Header("Docking Beacon")]
        public Light dockingBeacon;

        void Update()
        {
            if (habitationRing != null)
            {
                habitationRing.Rotate(Vector3.forward, centrifugeSpinRate * Time.deltaTime, UnityEngine.Space.Self);
            }

            if (solarTrusses != null)
            {
                foreach (var truss in solarTrusses)
                {
                    if (truss != null)
                        truss.Rotate(Vector3.right, solarTrackingRate * Time.deltaTime, UnityEngine.Space.Self);
                }
            }

            if (dockingBeacon != null)
            {
                dockingBeacon.intensity = 1.5f + Mathf.PingPong(Time.time * 2.5f, 2.5f);
            }
        }
    }
}
