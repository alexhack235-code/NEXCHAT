using UnityEngine;

namespace AstroShift.Vehicles
{
    public class SupercarController : MonoBehaviour
    {
        [Header("Car Identity")]
        public string carName = "Tesla Roadster Cyber GT";
        public bool isTesla = true;

        [Header("Engine & Speed")]
        public float maxSpeed = 48f;
        public float nitroMaxSpeed = 82f;
        public float acceleration = 32f;
        public float steerSpeed = 65f;
        public float brakePower = 40f;
        public float currentSpeed;

        [Header("Nitrous System")]
        public float maxNitro = 100f;
        public float nitro = 100f;
        public float nitroDrainRate = 28f;
        public float nitroRechargeRate = 12f;
        public bool isBoosting;

        [Header("Cameras & Seating")]
        public Camera mainCamera;
        public Transform cockpitCamPivot;
        public Transform chaseCamPivot;
        public bool isCockpitView = false;
        public Transform seatedDriverAvatar;

        [Header("Tesla Flight Support")]
        public TeslaFlightController teslaFlight;

        private Player.PlayerController activeDriver;
        private Rigidbody rb;

        void Awake()
        {
            rb = GetComponent<Rigidbody>();
            if (rb == null)
            {
                rb = gameObject.AddComponent<Rigidbody>();
                rb.mass = 1600f;
                rb.centerOfMass = new Vector3(0, -0.4f, 0);
            }
            teslaFlight = GetComponent<TeslaFlightController>();
        }

        void Start()
        {
            if (mainCamera == null) mainCamera = Camera.main;
            if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(false);
        }

        void Update()
        {
            if (activeDriver == null) return;

            // Toggle Tesla Aero-Gravity Flight with [X]
            if (isTesla && teslaFlight != null && Input.GetKeyDown(KeyCode.X))
            {
                teslaFlight.ToggleFlightMode();
            }

            // Toggle 1P Cockpit vs 3P Chase Camera with [V]
            if (Input.GetKeyDown(KeyCode.V))
            {
                isCockpitView = !isCockpitView;
            }

            // Exit vehicle with [E]
            if (Input.GetKeyDown(KeyCode.E))
            {
                ExitVehicle();
                return;
            }

            // Dual Laser Blaster Firing with [F] or [Left Click]
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

            // If flying Tesla, let TeslaFlightController manage physics
            if (teslaFlight != null && teslaFlight.isFlying)
            {
                UpdateCamera();
                return;
            }

            HandleDriving();
            UpdateCamera();
        }

        void HandleDriving()
        {
            float steerInput = Input.GetAxis("Horizontal");
            float throttleInput = Input.GetAxis("Vertical");

            if (UI.MobileTouchControls.Instance != null && UI.MobileTouchControls.Instance.joystickInput.sqrMagnitude > 0.01f)
            {
                steerInput = UI.MobileTouchControls.Instance.joystickInput.x;
                throttleInput = UI.MobileTouchControls.Instance.joystickInput.y;
            }

            bool wantsNitro = (Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.N)) && throttleInput > 0.1f && nitro > 0;
            if (wantsNitro && !isBoosting)
            {
                if (Audio.ProceduralAudioSynth.Instance != null)
                {
                    Audio.ProceduralAudioSynth.Instance.PlayPurgeAt(transform.position);
                }
            }
            isBoosting = wantsNitro;

            float targetMaxSpeed = isBoosting ? nitroMaxSpeed : maxSpeed;
            if (isBoosting)
            {
                nitro = Mathf.Max(0, nitro - nitroDrainRate * Time.deltaTime);
            }
            else
            {
                nitro = Mathf.Min(maxNitro, nitro + nitroRechargeRate * Time.deltaTime);
            }

            float targetSpeed = throttleInput * (throttleInput >= 0 ? targetMaxSpeed : 16f);
            currentSpeed = Mathf.Lerp(currentSpeed, targetSpeed, Time.deltaTime * (isBoosting ? 5.5f : 3.2f));

            // Forward movement & turning
            transform.Translate(Vector3.forward * (currentSpeed * Time.deltaTime));
            if (Mathf.Abs(currentSpeed) > 0.5f)
            {
                float turn = steerInput * steerSpeed * Time.deltaTime * Mathf.Sign(currentSpeed);
                transform.Rotate(0, turn, 0);
            }
        }

        void UpdateCamera()
        {
            if (mainCamera == null) return;

            if (isCockpitView && cockpitCamPivot != null)
            {
                mainCamera.transform.position = cockpitCamPivot.position;
                mainCamera.transform.rotation = cockpitCamPivot.rotation;
                if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(false);
            }
            else
            {
                if (chaseCamPivot != null)
                {
                    mainCamera.transform.position = Vector3.Lerp(mainCamera.transform.position, chaseCamPivot.position, Time.deltaTime * 12f);
                    mainCamera.transform.LookAt(transform.position + Vector3.up * 1.1f);
                }
                else
                {
                    Vector3 camBack = transform.position - transform.forward * (7.5f + Mathf.Abs(currentSpeed) * 0.08f) + Vector3.up * 3.2f;
                    mainCamera.transform.position = Vector3.Lerp(mainCamera.transform.position, camBack, Time.deltaTime * 12f);
                    mainCamera.transform.LookAt(transform.position + Vector3.up * 1.1f);
                }

                if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(true);
            }

            // Nitro FOV kick
            float targetFov = isBoosting ? 78f : 60f;
            mainCamera.fieldOfView = Mathf.Lerp(mainCamera.fieldOfView, targetFov, Time.deltaTime * 4f);
        }

        public void EnterVehicle(Player.PlayerController player)
        {
            activeDriver = player;
            player.inVehicle = true;
            player.gameObject.SetActive(false);

            if (seatedDriverAvatar != null)
                seatedDriverAvatar.gameObject.SetActive(!isCockpitView);
        }

        public void ExitVehicle()
        {
            if (activeDriver == null) return;

            if (teslaFlight != null && teslaFlight.isFlying)
            {
                teslaFlight.SetFlightMode(false);
            }

            activeDriver.gameObject.SetActive(true);
            activeDriver.transform.position = transform.position + transform.right * 2.5f + Vector3.up * 0.2f;
            activeDriver.inVehicle = false;
            activeDriver.UpdateCameraMode();

            activeDriver = null;
            if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(false);
        }
    }
}
