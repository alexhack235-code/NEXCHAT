using UnityEngine;

namespace AstroShift.Vehicles
{
    [RequireComponent(typeof(Rigidbody))]
    public class SupercarController : MonoBehaviour
    {
        [Header("Car Identity")]
        public string carName = "Tesla Roadster Cyber GT";
        public bool isTesla = true;

        [Header("Engine & Speed Dynamics")]
        public float maxSpeed = 52f;
        public float nitroMaxSpeed = 86f;
        public float reverseMaxSpeed = 18f;
        public float acceleration = 34f;
        public float nitroAcceleration = 54f;
        public float brakePower = 46f;
        public float decelerationDrag = 14f;
        public float currentSpeed;

        [Header("Steering & Drifting")]
        public float baseSteerSpeed = 68f;
        public float highSpeedSteerFactor = 0.55f;
        public float driftSteerMultiplier = 1.35f;
        public float maxDriftAngle = 38f;
        public float driftSlipRate = 0.88f;
        public bool isDrifting;

        [Header("Nitrous Thruster System")]
        public float maxNitro = 100f;
        public float nitro = 100f;
        public float nitroDrainRate = 28f;
        public float nitroRechargeRate = 14f;
        public bool isBoosting;

        [Header("Engine Audio Synthesizer")]
        public AudioSource engineAudioSource;
        public AnimationCurve enginePitchCurve;
        public float minEnginePitch = 0.78f;
        public float maxEnginePitch = 2.45f;
        public float maxEngineVolume = 0.55f;

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
        private float currentDriftAngle;
        private float driftAngleVelocity;
        private float steerInputSmooth;
        private float steerVelocity;
        private Vector3 lateralDriftVelocity;

        void Awake()
        {
            rb = GetComponent<Rigidbody>();
            if (rb == null) rb = gameObject.AddComponent<Rigidbody>();
            rb.mass = 1600f;
            rb.centerOfMass = new Vector3(0f, -0.45f, 0f);

            teslaFlight = GetComponent<TeslaFlightController>();

            InitializeEngineAudio();
        }

        void Start()
        {
            if (mainCamera == null) mainCamera = Camera.main;
            if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(false);
        }

        void InitializeEngineAudio()
        {
            if (enginePitchCurve == null || enginePitchCurve.length == 0)
            {
                enginePitchCurve = new AnimationCurve(
                    new Keyframe(0f, 0.78f, 0f, 1.1f),
                    new Keyframe(0.35f, 1.25f, 1.1f, 1.1f),
                    new Keyframe(0.70f, 1.82f, 1.5f, 1.5f),
                    new Keyframe(1.0f, 2.45f, 2.2f, 0f)
                );
            }

            if (engineAudioSource == null)
            {
                engineAudioSource = gameObject.AddComponent<AudioSource>();
                engineAudioSource.playOnAwake = false;
                engineAudioSource.loop = true;
                engineAudioSource.spatialBlend = 0.85f;
                engineAudioSource.minDistance = 4f;
                engineAudioSource.maxDistance = 180f;
                engineAudioSource.rolloffMode = AudioRolloffMode.Linear;
            }

            if (Audio.ProceduralAudioSynth.Instance != null)
            {
                engineAudioSource.clip = Audio.ProceduralAudioSynth.Instance.GetEngineMotorLoopClip();
                engineAudioSource.volume = 0f;
                engineAudioSource.pitch = minEnginePitch;
                engineAudioSource.Play();
            }
        }

        void Update()
        {
            if (activeDriver == null)
            {
                UpdateInactiveEngineAudio();
                return;
            }

            // Toggle Tesla Aero-Gravity Flight with [X]
            if (isTesla && teslaFlight != null && Input.GetKeyDown(KeyCode.X))
            {
                teslaFlight.ToggleFlightMode();
            }

            // Toggle 1P Cockpit vs 3P Chase Camera with [V]
            if (Input.GetKeyDown(KeyCode.V))
            {
                isCockpitView = !isCockpitView;
                if (CinematicFollowCamera.Instance != null)
                {
                    CinematicFollowCamera.Instance.isFirstPerson = isCockpitView;
                }
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
                UpdateEngineAudio();
                UpdateFallbackCamera();
                return;
            }

            HandleDrivingPhysics();
            UpdateEngineAudio();
            UpdateFallbackCamera();
        }

        void HandleDrivingPhysics()
        {
            float steerInput = Input.GetAxisRaw("Horizontal");
            float throttleInput = Input.GetAxisRaw("Vertical");

            if (UI.MobileTouchControls.Instance != null && UI.MobileTouchControls.Instance.joystickInput.sqrMagnitude > 0.01f)
            {
                steerInput = UI.MobileTouchControls.Instance.joystickInput.x;
                throttleInput = UI.MobileTouchControls.Instance.joystickInput.y;
            }

            // Smooth steering damping to prevent angular micro-jitter
            steerInputSmooth = Mathf.SmoothDamp(steerInputSmooth, steerInput, ref steerVelocity, 0.045f);

            // Nitro Boost & Purge
            bool wantsNitro = (Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.N)) && throttleInput > 0.1f && nitro > 0f;
            if (wantsNitro && !isBoosting)
            {
                if (Audio.ProceduralAudioSynth.Instance != null)
                {
                    Audio.ProceduralAudioSynth.Instance.PlayPurgeAt(transform.position);
                }
                if (CinematicFollowCamera.Instance != null)
                {
                    CinematicFollowCamera.Instance.AddTrauma(0.2f);
                }
            }
            isBoosting = wantsNitro;

            float targetMaxSpeed = isBoosting ? nitroMaxSpeed : maxSpeed;
            if (isBoosting)
            {
                nitro = Mathf.Max(0f, nitro - nitroDrainRate * Time.deltaTime);
                if (CinematicFollowCamera.Instance != null)
                {
                    CinematicFollowCamera.Instance.AddTrauma(0.04f * Time.deltaTime);
                }
            }
            else
            {
                nitro = Mathf.Min(maxNitro, nitro + nitroRechargeRate * Time.deltaTime);
            }

            // Drifting Detection (Handbrake via Space or Left Shift while turning at speed)
            bool wantsHandbrake = Input.GetKey(KeyCode.Space);
            isDrifting = (wantsHandbrake || (isBoosting && Mathf.Abs(steerInput) > 0.4f)) && Mathf.Abs(currentSpeed) > 9.0f;

            if (isDrifting)
            {
                // Extra nitrous regeneration for sustaining clean drifts
                nitro = Mathf.Min(maxNitro, nitro + (nitroRechargeRate * 1.4f) * Time.deltaTime);
                if (CinematicFollowCamera.Instance != null)
                {
                    CinematicFollowCamera.Instance.AddTrauma(0.02f * Time.deltaTime);
                }
            }

            // Longitudinal Acceleration / Braking
            if (throttleInput > 0.05f)
            {
                float accel = isBoosting ? nitroAcceleration : acceleration;
                if (currentSpeed < 0f)
                {
                    // Braking while reversing
                    currentSpeed = Mathf.MoveTowards(currentSpeed, 0f, brakePower * Time.deltaTime);
                }
                else
                {
                    currentSpeed = Mathf.MoveTowards(currentSpeed, throttleInput * targetMaxSpeed, accel * Time.deltaTime);
                }
            }
            else if (throttleInput < -0.05f)
            {
                if (currentSpeed > 0.5f)
                {
                    // Forward braking
                    currentSpeed = Mathf.MoveTowards(currentSpeed, 0f, brakePower * Time.deltaTime);
                }
                else
                {
                    // Reverse acceleration
                    currentSpeed = Mathf.MoveTowards(currentSpeed, -reverseMaxSpeed, acceleration * 0.65f * Time.deltaTime);
                }
            }
            else
            {
                // Coasting deceleration drag
                currentSpeed = Mathf.MoveTowards(currentSpeed, 0f, decelerationDrag * Time.deltaTime);
            }

            // Speed-sensitive steering curve
            float speedRatio = Mathf.Clamp01(Mathf.Abs(currentSpeed) / maxSpeed);
            float steerScale = Mathf.Lerp(1.0f, highSpeedSteerFactor, speedRatio);
            if (isDrifting) steerScale *= driftSteerMultiplier;

            // Yaw turning calculation
            if (Mathf.Abs(currentSpeed) > 0.25f)
            {
                float turnAngle = steerInputSmooth * baseSteerSpeed * steerScale * Time.deltaTime * Mathf.Sign(currentSpeed);
                transform.Rotate(0f, turnAngle, 0f, UnityEngine.Space.World);
            }

            // Smooth lateral drift angle damping
            float targetDriftAngle = isDrifting ? (-steerInput * maxDriftAngle) : 0f;
            currentDriftAngle = Mathf.SmoothDamp(currentDriftAngle, targetDriftAngle, ref driftAngleVelocity, 0.12f);

            // Forward & Lateral Velocity composition
            Vector3 forwardVelocity = transform.forward * currentSpeed;
            Vector3 targetLateralSlip = isDrifting ? (transform.right * (steerInput * currentSpeed * 0.35f)) : Vector3.zero;
            lateralDriftVelocity = Vector3.Lerp(lateralDriftVelocity, targetLateralSlip, Time.deltaTime * 6.0f);

            Vector3 totalVelocity = forwardVelocity + lateralDriftVelocity;

            if (rb != null)
            {
                rb.linearVelocity = new Vector3(totalVelocity.x, rb.linearVelocity.y, totalVelocity.z);
            }
            else
            {
                transform.Translate(totalVelocity * Time.deltaTime, UnityEngine.Space.World);
            }
        }

        void UpdateEngineAudio()
        {
            if (engineAudioSource == null) return;

            if (engineAudioSource.clip == null && Audio.ProceduralAudioSynth.Instance != null)
            {
                engineAudioSource.clip = Audio.ProceduralAudioSynth.Instance.GetEngineMotorLoopClip();
                if (!engineAudioSource.isPlaying) engineAudioSource.Play();
            }

            float speedNormalized = Mathf.Clamp01(Mathf.Abs(currentSpeed) / (isBoosting ? nitroMaxSpeed : maxSpeed));
            float targetPitch = enginePitchCurve != null ? enginePitchCurve.Evaluate(speedNormalized) : Mathf.Lerp(minEnginePitch, maxEnginePitch, speedNormalized);
            if (isBoosting) targetPitch *= 1.25f;

            engineAudioSource.pitch = Mathf.Lerp(engineAudioSource.pitch, targetPitch, Time.deltaTime * 7.5f);

            float targetVol = Mathf.Lerp(maxEngineVolume * 0.45f, maxEngineVolume, speedNormalized * 0.7f + (isBoosting ? 0.3f : 0f));
            engineAudioSource.volume = Mathf.Lerp(engineAudioSource.volume, targetVol, Time.deltaTime * 6.0f);
        }

        void UpdateInactiveEngineAudio()
        {
            if (engineAudioSource != null && engineAudioSource.volume > 0.001f)
            {
                engineAudioSource.volume = Mathf.MoveTowards(engineAudioSource.volume, 0f, Time.deltaTime * 1.5f);
            }
        }

        void UpdateFallbackCamera()
        {
            // If CinematicFollowCamera is active, it handles follow in its LateUpdate
            if (CinematicFollowCamera.Instance != null && CinematicFollowCamera.Instance.enabled && CinematicFollowCamera.Instance.target == transform)
            {
                CinematicFollowCamera.Instance.isFirstPerson = isCockpitView;
                if (seatedDriverAvatar != null)
                {
                    seatedDriverAvatar.gameObject.SetActive(!isCockpitView);
                }
                return;
            }

            if (mainCamera == null) return;

            if (isCockpitView && cockpitCamPivot != null)
            {
                mainCamera.transform.position = cockpitCamPivot.position;
                mainCamera.transform.rotation = cockpitCamPivot.rotation;
                if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(false);
            }
            else
            {
                Vector3 desiredCamPos;
                if (chaseCamPivot != null)
                {
                    desiredCamPos = chaseCamPivot.position;
                }
                else
                {
                    desiredCamPos = transform.position - transform.forward * (7.2f + Mathf.Abs(currentSpeed) * 0.08f) + Vector3.up * 2.8f;
                }

                mainCamera.transform.position = Vector3.Lerp(mainCamera.transform.position, desiredCamPos, Time.deltaTime * 12f);
                mainCamera.transform.LookAt(transform.position + Vector3.up * 1.1f);

                if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(true);
            }

            // Nitro dynamic FOV kick
            float targetFov = isBoosting ? 78f : 60f;
            mainCamera.fieldOfView = Mathf.Lerp(mainCamera.fieldOfView, targetFov, Time.deltaTime * 4.5f);
        }

        public void EnterVehicle(Player.PlayerController player)
        {
            activeDriver = player;
            player.inVehicle = true;
            player.gameObject.SetActive(false);

            if (CinematicFollowCamera.Instance != null)
            {
                CinematicFollowCamera.Instance.SetTarget(transform, rb, cockpitCamPivot);
                CinematicFollowCamera.Instance.SetProfile(CinematicFollowCamera.CameraProfile.Supercar);
                CinematicFollowCamera.Instance.isFirstPerson = isCockpitView;
            }

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

            if (CinematicFollowCamera.Instance != null)
            {
                CinematicFollowCamera.Instance.SetTarget(activeDriver.transform, null, activeDriver.firstPersonAnchor);
                CinematicFollowCamera.Instance.SetProfile(CinematicFollowCamera.CameraProfile.Player);
                CinematicFollowCamera.Instance.isFirstPerson = activeDriver.isFirstPerson;
            }

            activeDriver = null;
            if (seatedDriverAvatar != null) seatedDriverAvatar.gameObject.SetActive(false);
        }
    }
}
