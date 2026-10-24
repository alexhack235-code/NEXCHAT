using UnityEngine;

namespace AstroShift.Space
{
    public class StarshipController : MonoBehaviour
    {
        [Header("Flight Dynamics")]
        public bool isPiloted = false;
        public float throttle = 0f;
        public float maxThrust = 160f;
        public float pitchRate = 28f;
        public float yawRate = 24f;
        public float rollRate = 32f;
        public float currentVelocity;
        public float altitude;

        [Header("Booster & Staging")]
        public bool isStaged = false;
        public GameObject superHeavyBooster;
        public ParticleSystem boosterExhaust;
        public ParticleSystem starshipExhaust;

        [Header("Bridge & Realm Controller")]
        public CommandBridgeController bridgeController;

        [Header("Space Environment Transition")]
        public GameObject curvedEarthMesh;
        public GameObject spaceRealmGroup;
        public Material skyboxMaterial;

        private Player.PlayerController activeCommander;
        private float pitch;
        private float yaw;
        private float roll;
        private bool isWarping;

        void Awake()
        {
            if (bridgeController == null) bridgeController = GetComponentInChildren<CommandBridgeController>();
            yaw = transform.eulerAngles.y;
        }

        void Update()
        {
            if (!isPiloted) return;

            HandleFlightInputs();
            UpdateFlightPhysics();

            // Toggle Inside Command Bridge / Outside Space Realm View with [V] or [C]
            if (Input.GetKeyDown(KeyCode.V) || Input.GetKeyDown(KeyCode.C))
            {
                if (bridgeController != null)
                {
                    bridgeController.ToggleViewMode();
                }
            }

            // Staging Super Heavy Booster with [Space]
            if (Input.GetKeyDown(KeyCode.Space) && !isStaged && altitude > 120f)
            {
                SeparateBooster();
            }

            // Hyperspace Space Warp with [P]
            if (Input.GetKeyDown(KeyCode.P))
            {
                EngageHyperspaceWarp();
            }

            // Dual Heavy Plasma Firing with [F] or [Left Click]
            if (Input.GetKey(KeyCode.F) || Input.GetMouseButton(0))
            {
                var blaster = GetComponent<Combat.LaserBlasterSystem>();
                if (blaster != null)
                {
                    var targeting = GetComponent<Combat.TargetingComputer>();
                    Vector3 aimDir = (targeting != null) ? targeting.GetAimDirection() : transform.forward;
                    blaster.TryFire(aimDir);
                }
            }

            // Exit Starship with [B]
            if (Input.GetKeyDown(KeyCode.B))
            {
                ExitStarship();
                return;
            }

            // Update Camera via Bridge Controller
            if (bridgeController != null)
            {
                bridgeController.UpdateCameraPosition(transform, yaw, pitch, roll);
            }
        }

        void HandleFlightInputs()
        {
            // Throttle W / S
            if (Input.GetKey(KeyCode.W)) throttle = Mathf.Min(100f, throttle + Time.deltaTime * 35f);
            else if (Input.GetKey(KeyCode.S)) throttle = Mathf.Max(0f, throttle - Time.deltaTime * 40f);

            // Roll A / D
            float rollInput = Input.GetAxis("Horizontal");
            roll -= rollInput * rollRate * Time.deltaTime;

            // Pitch & Yaw via mouse or arrow keys
            float pitchInput = Input.GetAxis("Mouse Y") * 1.5f;
            float yawInput = Input.GetAxis("Mouse X") * 1.5f;

            pitch -= pitchInput;
            pitch = Mathf.Clamp(pitch, -85f, 85f);
            yaw += yawInput;

            transform.rotation = Quaternion.Euler(pitch, yaw, roll);
        }

        void UpdateFlightPhysics()
        {
            float targetVel = (throttle / 100f) * (isWarping ? 800f : maxThrust);
            currentVelocity = Mathf.Lerp(currentVelocity, targetVel, Time.deltaTime * 2.5f);

            transform.position += transform.up * (currentVelocity * Time.deltaTime);
            altitude = transform.position.y;

            // Deep Space transition at high altitude
            if (altitude > 350f)
            {
                if (spaceRealmGroup != null && !spaceRealmGroup.activeSelf)
                    spaceRealmGroup.SetActive(true);
                if (curvedEarthMesh != null && !curvedEarthMesh.activeSelf)
                    curvedEarthMesh.SetActive(true);
            }
        }

        public void SeparateBooster()
        {
            if (isStaged) return;
            isStaged = true;

            if (superHeavyBooster != null)
            {
                superHeavyBooster.transform.parent = null;
                Rigidbody bRb = superHeavyBooster.GetComponent<Rigidbody>();
                if (bRb == null) bRb = superHeavyBooster.AddComponent<Rigidbody>();
                bRb.linearVelocity = transform.up * (currentVelocity * 0.8f);
                Destroy(superHeavyBooster, 25f);
            }

            if (boosterExhaust != null) boosterExhaust.Stop();
            if (starshipExhaust != null) starshipExhaust.Play();
        }

        public void EngageHyperspaceWarp()
        {
            isWarping = !isWarping;
            throttle = isWarping ? 100f : 50f;
        }

        public void EnterStarship(Player.PlayerController player)
        {
            activeCommander = player;
            isPiloted = true;
            player.inStarship = true;
            player.gameObject.SetActive(false);

            if (bridgeController != null)
            {
                bridgeController.SetOutsideView(false); // Default to Inside Command Bridge
            }

            if (boosterExhaust != null) boosterExhaust.Play();
        }

        public void ExitStarship()
        {
            if (activeCommander == null) return;

            isPiloted = false;
            throttle = 0f;
            currentVelocity = 0f;

            activeCommander.gameObject.SetActive(true);
            activeCommander.transform.position = transform.position + transform.right * 12f + Vector3.up * 1.5f;
            activeCommander.inStarship = false;
            activeCommander.UpdateCameraMode();

            activeCommander = null;

            if (bridgeController != null)
            {
                bridgeController.SetOutsideView(true);
            }
        }
    }
}
