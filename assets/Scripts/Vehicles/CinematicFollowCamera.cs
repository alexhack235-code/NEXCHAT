using UnityEngine;

namespace AstroShift.Vehicles
{
    public class CinematicFollowCamera : MonoBehaviour
    {
        [Header("Target & Offsets")]
        public Transform target;
        public Rigidbody targetRigidbody;
        public Vector3 defaultOffset = new Vector3(0f, 2.6f, -6.5f);
        public float lookAheadDistance = 4.0f;
        public float positionSmoothSpeed = 12.0f;
        public float rotationSmoothSpeed = 8.0f;

        [Header("Dynamic FOV")]
        public float baseFOV = 62f;
        public float maxSpeedFOV = 84f;
        public float fovMaxSpeedThreshold = 65f; // m/s
        public float fovLerpSpeed = 4.0f;

        [Header("Trauma Screen Shake")]
        public float trauma = 0f;
        public float traumaDecayRate = 1.6f;
        public float maxShakePitch = 3.5f;
        public float maxShakeYaw = 3.5f;

        [Header("Camera Modes")]
        public bool isFirstPerson = false;
        public Transform cockpitPivot;

        private Camera cam;

        void Awake()
        {
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
        }

        public void AddTrauma(float amount)
        {
            trauma = Mathf.Clamp01(trauma + amount);
        }

        void LateUpdate()
        {
            if (target == null) return;

            // 1. First-Person Cockpit View
            if (isFirstPerson && cockpitPivot != null)
            {
                transform.position = cockpitPivot.position;
                transform.rotation = cockpitPivot.rotation;
                ApplyShake();
                return;
            }

            // 2. Third-Person Dynamic Chase View
            Vector3 targetVel = (targetRigidbody != null) ? targetRigidbody.linearVelocity : Vector3.zero;
            float currentSpeed = targetVel.magnitude;

            // Target positioning
            Vector3 desiredPos = target.position + target.rotation * defaultOffset;
            transform.position = Vector3.Lerp(transform.position, desiredPos, Time.deltaTime * positionSmoothSpeed);

            // Look-ahead target point
            Vector3 lookTarget = target.position + target.forward * lookAheadDistance + Vector3.up * 1.0f;
            Quaternion desiredRot = Quaternion.LookRotation(lookTarget - transform.position);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRot, Time.deltaTime * rotationSmoothSpeed);

            // Speed-based dynamic FOV kick
            if (cam != null)
            {
                float targetFOV = Mathf.Lerp(baseFOV, maxSpeedFOV, Mathf.Clamp01(currentSpeed / fovMaxSpeedThreshold));
                cam.fieldOfView = Mathf.Lerp(cam.fieldOfView, targetFOV, Time.deltaTime * fovLerpSpeed);
            }

            // Screen shake
            ApplyShake();
        }

        void ApplyShake()
        {
            if (trauma <= 0f) return;

            trauma = Mathf.Max(0f, trauma - Time.deltaTime * traumaDecayRate);
            float shakeIntensity = trauma * trauma; // Non-linear shake curve

            float pitchShake = (Mathf.PerlinNoise(Time.time * 28f, 0f) * 2f - 1f) * maxShakePitch * shakeIntensity;
            float yawShake = (Mathf.PerlinNoise(0f, Time.time * 28f) * 2f - 1f) * maxShakeYaw * shakeIntensity;

            transform.rotation *= Quaternion.Euler(pitchShake, yawShake, 0f);
        }
    }
}
