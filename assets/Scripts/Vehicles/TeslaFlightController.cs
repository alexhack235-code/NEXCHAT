using UnityEngine;

namespace AstroShift.Vehicles
{
    public class TeslaFlightController : MonoBehaviour
    {
        [Header("Flight Dynamics")]
        public bool isFlying = false;
        public float maxFlightSpeed = 110f;
        public float verticalClimbSpeed = 28f;
        public float flightAcceleration = 45f;
        public float bankingRate = 42f;

        [Header("Anti-Gravity Thruster Glow")]
        public Light[] thrusterGlowLights;
        public ParticleSystem[] thrusterParticles;

        private float currentFlightSpeed;
        private float currentVerticalVel;
        private float bankAngle;
        private Rigidbody rb;

        void Awake()
        {
            rb = GetComponent<Rigidbody>();
        }

        void Update()
        {
            if (!isFlying) return;

            HandleFlightPhysics();
        }

        public void ToggleFlightMode()
        {
            SetFlightMode(!isFlying);
        }

        public void SetFlightMode(bool active)
        {
            isFlying = active;
            if (rb != null)
            {
                rb.useGravity = !isFlying;
                if (isFlying)
                {
                    rb.linearVelocity = Vector3.zero;
                    rb.angularVelocity = Vector3.zero;
                    // Initial lift-off burst
                    transform.position += Vector3.up * 1.5f;
                }
            }

            if (thrusterGlowLights != null)
            {
                foreach (var light in thrusterGlowLights)
                {
                    if (light != null) light.enabled = isFlying;
                }
            }

            if (thrusterParticles != null)
            {
                foreach (var ps in thrusterParticles)
                {
                    if (ps != null)
                    {
                        if (isFlying) ps.Play();
                        else ps.Stop();
                    }
                }
            }
        }

        void HandleFlightPhysics()
        {
            float throttle = Input.GetAxis("Vertical");
            float steer = Input.GetAxis("Horizontal");

            // Vertical Altitude Control: Space = Climb, C = Dive
            float targetVertVel = 0;
            if (Input.GetKey(KeyCode.Space)) targetVertVel = verticalClimbSpeed;
            else if (Input.GetKey(KeyCode.C)) targetVertVel = -verticalClimbSpeed;

            currentVerticalVel = Mathf.Lerp(currentVerticalVel, targetVertVel, Time.deltaTime * 6f);

            // Forward flight speed
            float targetSpeed = throttle * (throttle >= 0 ? maxFlightSpeed : 25f);
            currentFlightSpeed = Mathf.Lerp(currentFlightSpeed, targetSpeed, Time.deltaTime * 4f);

            // Turning & dynamic aerodynamic banking
            float turn = steer * 45f * Time.deltaTime;
            transform.Rotate(0, turn, 0, UnityEngine.Space.World);

            float targetBank = -steer * bankingRate;
            bankAngle = Mathf.Lerp(bankAngle, targetBank, Time.deltaTime * 6f);

            // Apply orientation (pitch based on throttle, roll based on steer)
            Vector3 currentEuler = transform.eulerAngles;
            currentEuler.z = bankAngle;
            currentEuler.x = Mathf.LerpAngle(currentEuler.x, -throttle * 12f, Time.deltaTime * 5f);
            transform.eulerAngles = currentEuler;

            // Translation
            Vector3 forwardMove = transform.forward * (currentFlightSpeed * Time.deltaTime);
            Vector3 verticalMove = Vector3.up * (currentVerticalVel * Time.deltaTime);
            transform.position += (forwardMove + verticalMove);

            // Hard floor constraint
            if (transform.position.y < 1.2f)
            {
                transform.position = new Vector3(transform.position.x, 1.2f, transform.position.z);
            }
        }
    }
}
