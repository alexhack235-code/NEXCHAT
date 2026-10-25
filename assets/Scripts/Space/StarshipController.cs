using UnityEngine;

namespace AstroShift.Space
{
    public class StarshipController : MonoBehaviour
    {
        [Header("Flight Dynamics")]
        public bool isPiloted = false;
        public float throttle = 0f;
        public float targetThrottle = 0f;
        public float throttleRampRate = 45f;

        [Header("Thrust & Propulsion")]
        public float stageOneThrust = 220f;
        public float stageTwoThrust = 145f;
        public float warpThrust = 850f;
        public float thrustAcceleration = 35f;
        public float currentVelocity;
        public float altitude;

        [Header("Flight Maneuvering")]
        public float pitchRate = 28f;
        public float yawRate = 24f;
        public float rollRate = 34f;
        public float angularSmoothTime = 0.08f;

        [Header("Space Inertia & Drifting")]
        public float spaceDriftFactor = 0.95f;
        public Vector3 orbitalDriftVelocity = Vector3.zero;

        [Header("Booster & Staging")]
        public bool isStaged = false;
        public GameObject superHeavyBooster;
        public ParticleSystem boosterExhaust;
        public ParticleSystem starshipExhaust;

        [Header("Engine Audio Synthesizer")]
        public AudioSource rocketAudioSource;
        public AnimationCurve rocketPitchCurve;
        public float minRocketPitch = 0.65f;
        public float maxRocketPitch = 1.95f;
        public float maxRocketVolume = 0.75f;

        [Header("Bridge & Realm Controller")]
        public CommandBridgeController bridgeController;

        [Header("Space Environment Transition")]
        public GameObject curvedEarthMesh;
        public GameObject spaceRealmGroup;
        public Material skyboxMaterial;

        private Player.PlayerController activeCommander;
        private float targetPitch;
        private float targetYaw;
        private float targetRoll;
        private float currentPitch;
        private float currentYaw;
        private float currentRoll;
        private float pitchVelocity;
        private float yawVelocity;
        private float rollVelocity;
        private bool isWarping;
        private Rigidbody rb;

        void Awake()
        {
            rb = GetComponent<Rigidbody>();
            if (bridgeController == null) bridgeController = GetComponentInChildren<CommandBridgeController>();

            Vector3 currentEuler = transform.eulerAngles;
            targetYaw = currentEuler.y;
            currentYaw = targetYaw;
            targetPitch = currentEuler.x;
            currentPitch = targetPitch;
            targetRoll = currentEuler.z;
            currentRoll = targetRoll;

            InitializeRocketAudio();
        }

        void InitializeRocketAudio()
        {
            if (rocketPitchCurve == null || rocketPitchCurve.length == 0)
            {
                rocketPitchCurve = new AnimationCurve(
                    new Keyframe(0f, 0.65f, 0f, 0.8f),
                    new Keyframe(0.4f, 0.95f, 0.9f, 0.9f),
                    new Keyframe(0.8f, 1.45f, 1.3f, 1.3f),
                    new Keyframe(1.0f, 1.95f, 1.8f, 0f)
                );
            }

            if (rocketAudioSource == null)
            {
                rocketAudioSource = gameObject.AddComponent<AudioSource>();
                rocketAudioSource.playOnAwake = false;
                rocketAudioSource.loop = true;
                rocketAudioSource.spatialBlend = 0.8f;
                rocketAudioSource.minDistance = 15f;
                rocketAudioSource.maxDistance = 500f;
                rocketAudioSource.rolloffMode = AudioRolloffMode.Linear;
            }

            if (Audio.ProceduralAudioSynth.Instance != null)
            {
                rocketAudioSource.clip = Audio.ProceduralAudioSynth.Instance.GetRocketRumbleLoopClip();
                rocketAudioSource.volume = 0f;
                rocketAudioSource.pitch = minRocketPitch;
                rocketAudioSource.Play();
            }
        }

        void Update()
        {
            if (!isPiloted)
            {
                UpdateInactiveAudio();
                return;
            }

            HandleFlightInputs();
            UpdateFlightPhysics();
            UpdateRocketAudio();

            // Toggle Inside Command Bridge / Outside Space Realm View with [V] or [C]
            if (Input.GetKeyDown(KeyCode.V) || Input.GetKeyDown(KeyCode.C))
            {
                if (bridgeController != null)
                {
                    bridgeController.ToggleViewMode();
                    if (Vehicles.CinematicFollowCamera.Instance != null)
                    {
                        Vehicles.CinematicFollowCamera.Instance.isFirstPerson = !bridgeController.isOutsideRealmView;
                    }
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

            // Update Bridge Camera fallback if CinematicFollowCamera not active
            if (bridgeController != null)
            {
                bridgeController.UpdateCameraPosition(transform, currentYaw, currentPitch, currentRoll);
            }
        }

        void HandleFlightInputs()
        {
            // Smooth throttle adjustment: W increases, S decreases
            if (Input.GetKey(KeyCode.W))
            {
                targetThrottle = Mathf.Min(100f, targetThrottle + Time.deltaTime * 40f);
            }
            else if (Input.GetKey(KeyCode.S))
            {
                targetThrottle = Mathf.Max(0f, targetThrottle - Time.deltaTime * 45f);
            }

            throttle = Mathf.MoveTowards(throttle, targetThrottle, throttleRampRate * Time.deltaTime);

            // Roll via A / D
            float rollInput = Input.GetAxisRaw("Horizontal");
            targetRoll -= rollInput * rollRate * Time.deltaTime;

            // Pitch & Yaw via mouse or directional keys
            float pitchInput = Input.GetAxisRaw("Mouse Y") * 1.6f;
            float yawInput = Input.GetAxisRaw("Mouse X") * 1.6f;

            targetPitch -= pitchInput;
            targetPitch = Mathf.Clamp(targetPitch, -85f, 85f);
            targetYaw += yawInput;

            // Fluid second-order angular damping for starship inertia
            currentPitch = Mathf.SmoothDampAngle(currentPitch, targetPitch, ref pitchVelocity, angularSmoothTime);
            currentYaw = Mathf.SmoothDampAngle(currentYaw, targetYaw, ref yawVelocity, angularSmoothTime);
            currentRoll = Mathf.SmoothDampAngle(currentRoll, targetRoll, ref rollVelocity, angularSmoothTime);

            transform.rotation = Quaternion.Euler(currentPitch, currentYaw, currentRoll);
        }

        void UpdateFlightPhysics()
        {
            float maxActiveThrust = isWarping ? warpThrust : (isStaged ? stageTwoThrust : stageOneThrust);
            float targetVel = (throttle / 100f) * maxActiveThrust;

            currentVelocity = Mathf.MoveTowards(currentVelocity, targetVel, thrustAcceleration * Time.deltaTime);

            // Forward propulsion
            Vector3 thrustMove = transform.up * (currentVelocity * Time.deltaTime);

            // Space orbital drifting physics above atmosphere
            altitude = transform.position.y;
            if (altitude > 350f)
            {
                if (spaceRealmGroup != null && !spaceRealmGroup.activeSelf)
                    spaceRealmGroup.SetActive(true);
                if (curvedEarthMesh != null && !curvedEarthMesh.activeSelf)
                    curvedEarthMesh.SetActive(true);

                // Zero-drag space drift
                orbitalDriftVelocity = Vector3.Lerp(orbitalDriftVelocity, thrustMove, Time.deltaTime * (1f - spaceDriftFactor));
            }
            else
            {
                orbitalDriftVelocity = Vector3.MoveTowards(orbitalDriftVelocity, Vector3.zero, Time.deltaTime * 15f);
            }

            transform.position += (thrustMove + orbitalDriftVelocity);
            altitude = transform.position.y;

            // Camera screen shake during high throttle launch and warp
            if (throttle > 50f && Vehicles.CinematicFollowCamera.Instance != null)
            {
                float launchTrauma = (throttle / 100f) * (isWarping ? 0.25f : 0.08f) * Time.deltaTime;
                Vehicles.CinematicFollowCamera.Instance.AddTrauma(launchTrauma);
            }
        }

        void UpdateRocketAudio()
        {
            if (rocketAudioSource == null) return;

            if (rocketAudioSource.clip == null && Audio.ProceduralAudioSynth.Instance != null)
            {
                rocketAudioSource.clip = Audio.ProceduralAudioSynth.Instance.GetRocketRumbleLoopClip();
                if (!rocketAudioSource.isPlaying) rocketAudioSource.Play();
            }

            float throttlePct = Mathf.Clamp01(throttle / 100f);
            float targetPitch = rocketPitchCurve != null ? rocketPitchCurve.Evaluate(throttlePct) : Mathf.Lerp(minRocketPitch, maxRocketPitch, throttlePct);
            if (isWarping) targetPitch *= 1.35f;

            rocketAudioSource.pitch = Mathf.Lerp(rocketAudioSource.pitch, targetPitch, Time.deltaTime * 5.0f);

            float targetVolume = throttlePct > 0.02f ? Mathf.Lerp(maxRocketVolume * 0.4f, maxRocketVolume, throttlePct) : 0f;
            rocketAudioSource.volume = Mathf.Lerp(rocketAudioSource.volume, targetVolume, Time.deltaTime * 6.5f);
        }

        void UpdateInactiveAudio()
        {
            if (rocketAudioSource != null && rocketAudioSource.volume > 0.001f)
            {
                rocketAudioSource.volume = Mathf.MoveTowards(rocketAudioSource.volume, 0f, Time.deltaTime * 1.2f);
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
                bRb.linearVelocity = transform.up * (currentVelocity * 0.85f);
                Destroy(superHeavyBooster, 25f);
            }

            if (boosterExhaust != null) boosterExhaust.Stop();
            if (starshipExhaust != null) starshipExhaust.Play();

            if (Vehicles.CinematicFollowCamera.Instance != null)
            {
                Vehicles.CinematicFollowCamera.Instance.AddTrauma(0.35f);
            }
        }

        public void EngageHyperspaceWarp()
        {
            isWarping = !isWarping;
            targetThrottle = isWarping ? 100f : 55f;

            if (isWarping && Audio.ProceduralAudioSynth.Instance != null)
            {
                Audio.ProceduralAudioSynth.Instance.PlayWarpSound();
            }

            if (Vehicles.CinematicFollowCamera.Instance != null)
            {
                Vehicles.CinematicFollowCamera.Instance.AddTrauma(0.5f);
            }
        }

        public void EnterStarship(Player.PlayerController player)
        {
            activeCommander = player;
            isPiloted = true;
            player.inStarship = true;
            player.gameObject.SetActive(false);

            if (bridgeController != null)
            {
                bridgeController.SetOutsideView(false);
            }

            if (Vehicles.CinematicFollowCamera.Instance != null)
            {
                Transform cockpit = (bridgeController != null) ? bridgeController.bridgeFirstPersonPivot : null;
                Vehicles.CinematicFollowCamera.Instance.SetTarget(transform, rb, cockpit);
                Vehicles.CinematicFollowCamera.Instance.SetProfile(Vehicles.CinematicFollowCamera.CameraProfile.Starship);
                Vehicles.CinematicFollowCamera.Instance.isFirstPerson = false;
            }

            if (boosterExhaust != null) boosterExhaust.Play();
        }

        public void ExitStarship()
        {
            if (activeCommander == null) return;

            isPiloted = false;
            targetThrottle = 0f;
            throttle = 0f;
            currentVelocity = 0f;

            activeCommander.gameObject.SetActive(true);
            activeCommander.transform.position = transform.position + transform.right * 12f + Vector3.up * 1.5f;
            activeCommander.inStarship = false;
            activeCommander.UpdateCameraMode();

            if (Vehicles.CinematicFollowCamera.Instance != null)
            {
                Vehicles.CinematicFollowCamera.Instance.SetTarget(activeCommander.transform, null, activeCommander.firstPersonAnchor);
                Vehicles.CinematicFollowCamera.Instance.SetProfile(Vehicles.CinematicFollowCamera.CameraProfile.Player);
                Vehicles.CinematicFollowCamera.Instance.isFirstPerson = activeCommander.isFirstPerson;
            }

            activeCommander = null;

            if (bridgeController != null)
            {
                bridgeController.SetOutsideView(true);
            }
        }
    }
}
