using UnityEngine;
using System.Collections.Generic;

namespace AstroShift.Combat
{
    public class TargetingComputer : MonoBehaviour
    {
        [Header("Targeting Config")]
        public float scanRadius = 350f;
        public LayerMask targetMask = ~0;
        public Transform currentTarget;
        public bool hasLock = false;
        public float lockAngle = 18f;

        [Header("Telemetry")]
        public float targetDistance = 0f;
        public Vector3 predictedLeadPoint = Vector3.zero;

        private List<Transform> detectedTargets = new List<Transform>();
        private int currentTargetIndex = 0;
        private float scanInterval = 0.5f;
        private float nextScanTime = 0f;

        void Update()
        {
            if (Time.time >= nextScanTime)
            {
                ScanForTargets();
                nextScanTime = Time.time + scanInterval;
            }

            // Cycle target with [Tab]
            if (Input.GetKeyDown(KeyCode.Tab))
            {
                CycleNextTarget();
            }

            UpdateLockTelemetry();
        }

        void ScanForTargets()
        {
            detectedTargets.Clear();
            Collider[] hits = Physics.OverlapSphere(transform.position, scanRadius, targetMask);

            foreach (var hit in hits)
            {
                if (hit.transform == transform || hit.transform.IsChildOf(transform)) continue;

                // Look for TargetDrone or vehicles
                if (hit.GetComponentInParent<Environment.TargetDrone>() != null ||
                    hit.GetComponentInParent<VehicleShieldSystem>() != null)
                {
                    Transform rootT = hit.transform.root;
                    if (!detectedTargets.Contains(rootT) && rootT != transform.root)
                    {
                        detectedTargets.Add(rootT);
                    }
                }
            }

            if (currentTarget == null && detectedTargets.Count > 0)
            {
                currentTarget = detectedTargets[0];
            }
        }

        public void CycleNextTarget()
        {
            if (detectedTargets.Count == 0)
            {
                currentTarget = null;
                hasLock = false;
                return;
            }

            currentTargetIndex = (currentTargetIndex + 1) % detectedTargets.Count;
            currentTarget = detectedTargets[currentTargetIndex];
        }

        void UpdateLockTelemetry()
        {
            if (currentTarget == null)
            {
                hasLock = false;
                targetDistance = 0f;
                predictedLeadPoint = Vector3.zero;
                return;
            }

            Vector3 toTarget = currentTarget.position - transform.position;
            targetDistance = toTarget.magnitude;

            float angle = Vector3.Angle(transform.forward, toTarget);
            hasLock = (angle <= lockAngle && targetDistance <= scanRadius);

            // Calculate lead point based on typical 180 m/s plasma velocity
            float projectileSpeed = 180f;
            float timeToHit = targetDistance / projectileSpeed;

            Rigidbody targetRb = currentTarget.GetComponent<Rigidbody>();
            Vector3 targetVel = (targetRb != null) ? targetRb.linearVelocity : Vector3.zero;

            predictedLeadPoint = currentTarget.position + targetVel * timeToHit;
        }

        public Vector3 GetAimDirection()
        {
            if (hasLock && currentTarget != null)
            {
                return (predictedLeadPoint - transform.position).normalized;
            }
            return transform.forward;
        }
    }
}
