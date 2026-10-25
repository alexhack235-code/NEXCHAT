using UnityEngine;

namespace AstroShift.Vehicles
{
    public class CinematicFollowCamera : MonoBehaviour
    {
        public static CinematicFollowCamera Instance { get; private set; }

        public enum CameraProfile
        {
            Player,
            Supercar,
            Starship,
            Custom
        }

        [Header("Target & Tracking")]
        public Transform target;
        public Rigidbody targetRigidbody;
        public CameraProfile activeProfile = CameraProfile.Supercar;

        [Header("Position & Rotation Damping")]
        public Vector3 defaultOffset = new Vector3(0f, 2.6f, -6.8f);
        public float lookAheadDistance = 5.5f;
        public float lookUpOffset = 1.1f;
        public float positionSmoothTime = 0.11f;
        public float rotationSmoothSpeed = 8.5f;
        public float maxCameraSpeed = 250f;

        [Header("Dynamic FOV")]
        public float baseFOV = 62f;
        public float maxSpeedFOV = 84f;
        public float fovMaxSpeedThreshold = 65f;
        public float fovLerpSpeed = 4.5f;

        [Header("Trauma Screen Shake")]
        public float trauma = 0f;
        public float traumaDecayRate = 1.6f;
        public float maxShakePitch = 3.5f;
        public float maxShakeYaw = 3.5f;

        [Header("Anti-Clip Collision")]
        public bool enableAntiClip = true;
        public float collisionRadius = 0.22f;
        public LayerMask obstacleLayerMask = ~0;

        [Header("Camera Modes")]
        public bool isFirstPerson = false;
        public Transform cockpitPivot;

        private Camera cam;
        private Vector3 currentPositionVelocity = Vector3.zero;
        private Vector3 currentCockpitVelocity = Vector3.zero;

        void Awake()
        {
            Instance = this;
            cam = GetComponent<Camera>();
            if (cam == null) cam = Camera.main;
        }

        void Start()
        {
            if (cam != null) cam.fieldOfView = baseFOV;
        }

        public void SetTarget(Transform newTarget, Rigidbody newRb, Transform cockpit)
        {
            target = newTarget;
            targetRigidbody = newRb;
            cockpitPivot = cockpit;
            currentPositionVelocity = Vector3.zero;

            if (newTarget != null)
            {
                // Auto-detect matching profile if not custom
                if (newTarget.GetComponent<Player.PlayerController>() != null)
                {
                    SetProfile(CameraProfile.Player);
                }
                else if (newTarget.GetComponent<Space.StarshipController>() != null)
                {
                    SetProfile(CameraProfile.Starship);
                }
                else if (newTarget.GetComponent<SupercarController>() != null || newTarget.GetComponent<TeslaFlightController>() != null)
                {
                    SetProfile(CameraProfile.Supercar);
                }
            }
        }

        public void SetProfile(CameraProfile profile)
        {
            activeProfile = profile;

            switch (profile)
            {
                case CameraProfile.Player:
                    defaultOffset = new Vector3(0.65f, 1.55f, -3.8f);
                    lookAheadDistance = 2.0f;
                    lookUpOffset = 0.2f;
                    positionSmoothTime = 0.08f;
                    rotationSmoothSpeed = 16.0f;
                    baseFOV = 68f;
                    maxSpeedFOV = 82f;
                    fovMaxSpeedThreshold = 22f;
                    enableAntiClip = true;
                    break;

                case CameraProfile.Supercar:
                    defaultOffset = new Vector3(0f, 2.6f, -6.8f);
                    lookAheadDistance = 5.5f;
                    lookUpOffset = 1.1f;
                    positionSmoothTime = 0.11f;
                    rotationSmoothSpeed = 8.5f;
                    baseFOV = 62f;
                    maxSpeedFOV = 86f;
                    fovMaxSpeedThreshold = 70f;
                    enableAntiClip = true;
                    break;

                case CameraProfile.Starship:
                    defaultOffset = new Vector3(0f, 28f, -68f);
                    lookAheadDistance = 35.0f;
                    lookUpOffset = 12.0f;
                    positionSmoothTime = 0.16f;
                    rotationSmoothSpeed = 4.5f;
                    baseFOV = 60f;
                    maxSpeedFOV = 92f;
                    fovMaxSpeedThreshold = 180f;
                    enableAntiClip = false;
                    break;

                case CameraProfile.Custom:
                    break;
            }
        }

        public void AddTrauma(float amount)
        {
            trauma = Mathf.Clamp01(trauma + amount);
        }

        void LateUpdate()
        {
            if (target == null) return;

            // 1. First-Person Cockpit / Eye View
            if (isFirstPerson && cockpitPivot != null)
            {
                transform.position = Vector3.SmoothDamp(transform.position, cockpitPivot.position, ref currentCockpitVelocity, 0.02f, maxCameraSpeed, Time.deltaTime);
                float cockpitSlerp = 1f - Mathf.Exp(-24.0f * Time.deltaTime);
                transform.rotation = Quaternion.Slerp(transform.rotation, cockpitPivot.rotation, cockpitSlerp);
                ApplyShake();
                return;
            }

            // 2. Third-Person Dynamic Cinematic Chase View
            Vector3 targetVel = Vector3.zero;
            if (targetRigidbody != null)
            {
                targetVel = targetRigidbody.linearVelocity;
            }
            float currentSpeed = targetVel.magnitude;

            // Target positioning in world space
            Vector3 desiredPos = target.position + target.rotation * defaultOffset;

            // Anti-clip obstacle raycast check (for player and supercar in urban areas)
            if (enableAntiClip)
            {
                Vector3 origin = target.position + Vector3.up * lookUpOffset;
                Vector3 toCam = desiredPos - origin;
                float dist = toCam.magnitude;
                if (dist > 0.1f)
                {
                    if (Physics.SphereCast(origin, collisionRadius, toCam.normalized, out RaycastHit hit, dist, obstacleLayerMask, QueryTriggerInteraction.Ignore))
                    {
                        desiredPos = origin + toCam.normalized * Mathf.Max(0.5f, hit.distance - collisionRadius);
                    }
                }
            }

            // Fluid, jitter-free position damping using Vector3.SmoothDamp
            transform.position = Vector3.SmoothDamp(transform.position, desiredPos, ref currentPositionVelocity, positionSmoothTime, maxCameraSpeed, Time.deltaTime);

            // Look-ahead target calculation and Quaternion.Slerp rotation damping
            Vector3 lookTarget = target.position + target.forward * lookAheadDistance + Vector3.up * lookUpOffset;
            Vector3 lookDirection = lookTarget - transform.position;

            if (lookDirection.sqrMagnitude > 0.001f)
            {
                Quaternion desiredRot = Quaternion.LookRotation(lookDirection, Vector3.up);
                float slerpFactor = 1f - Mathf.Exp(-rotationSmoothSpeed * Time.deltaTime);
                transform.rotation = Quaternion.Slerp(transform.rotation, desiredRot, slerpFactor);
            }

            // Dynamic FOV kick based on velocity
            if (cam != null)
            {
                float targetFOV = Mathf.Lerp(baseFOV, maxSpeedFOV, Mathf.Clamp01(currentSpeed / fovMaxSpeedThreshold));
                float fovFactor = 1f - Mathf.Exp(-fovLerpSpeed * Time.deltaTime);
                cam.fieldOfView = Mathf.Lerp(cam.fieldOfView, targetFOV, fovFactor);
            }

            // Screen shake
            ApplyShake();
        }

        void ApplyShake()
        {
            if (trauma <= 0f) return;

            trauma = Mathf.Max(0f, trauma - Time.deltaTime * traumaDecayRate);
            float shakeIntensity = trauma * trauma;

            float pitchShake = (Mathf.PerlinNoise(Time.time * 28f, 0f) * 2f - 1f) * maxShakePitch * shakeIntensity;
            float yawShake = (Mathf.PerlinNoise(0f, Time.time * 28f) * 2f - 1f) * maxShakeYaw * shakeIntensity;

            transform.rotation *= Quaternion.Euler(pitchShake, yawShake, 0f);
        }
    }
}
