using UnityEngine;
using System.Collections.Generic;

namespace AstroShift.Environment
{
    public class ProceduralTrafficSystem : MonoBehaviour
    {
        [Header("Traffic Settings")]
        public int vehicleCount = 10;
        public float roadGridExtent = 220f;
        public float cruiseSpeed = 16f;

        private List<AutonomousTrafficVehicle> activeVehicles = new List<AutonomousTrafficVehicle>();

        void Start()
        {
            SpawnTrafficGrid();
        }

        public void SpawnTrafficGrid()
        {
            // Clear existing
            foreach (var v in activeVehicles)
            {
                if (v != null) Destroy(v.gameObject);
            }
            activeVehicles.Clear();

            // Distinct neon vehicle colors
            Color[] colors = new Color[]
            {
                new Color(0f, 0.85f, 1f),    // Cyan
                new Color(1f, 0.4f, 0.05f),  // Amber
                new Color(0.9f, 0.1f, 0.4f),  // Magenta
                new Color(0.1f, 1f, 0.5f),   // Neon Green
                new Color(0.7f, 0.2f, 1f)    // Violet
            };

            // Road avenues along X and Z axes (avenue offsets: -110, -55, 55, 110)
            float[] avenues = new float[] { -110f, -55f, 55f, 110f };

            for (int i = 0; i < vehicleCount; i++)
            {
                float avenue = avenues[i % avenues.Length];
                bool isXAxis = (i % 2 == 0);
                float coord = Random.Range(-roadGridExtent, roadGridExtent);

                Vector3 spawnPos = isXAxis
                    ? new Vector3(coord, 0.5f, avenue)
                    : new Vector3(avenue, 0.5f, coord);

                Vector3 moveDir = isXAxis
                    ? (Random.value > 0.5f ? Vector3.right : Vector3.left)
                    : (Random.value > 0.5f ? Vector3.forward : Vector3.back);

                GameObject carGO = new GameObject($"Autonomous_Traffic_{i + 1}");
                carGO.transform.parent = transform;
                carGO.transform.position = spawnPos;
                carGO.transform.rotation = Quaternion.LookRotation(moveDir);

                // Body Chassis
                GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
                body.transform.parent = carGO.transform;
                body.transform.localPosition = new Vector3(0, 0.45f, 0);
                body.transform.localScale = new Vector3(1.9f, 0.7f, 4.2f);
                var bMat = new Material(Shader.Find("Standard"));
                bMat.color = colors[i % colors.Length];
                bMat.EnableKeyword("_EMISSION");
                bMat.SetColor("_EmissionColor", colors[i % colors.Length] * 0.4f);
                body.GetComponent<MeshRenderer>().material = bMat;

                // Headlights
                GameObject hL = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                hL.transform.parent = carGO.transform;
                hL.transform.localPosition = new Vector3(-0.7f, 0.4f, 2.1f);
                hL.transform.localScale = Vector3.one * 0.25f;
                var hlMat = new Material(Shader.Find("Standard"));
                hlMat.color = Color.white;
                hlMat.EnableKeyword("_EMISSION");
                hlMat.SetColor("_EmissionColor", Color.white * 3f);
                hL.GetComponent<MeshRenderer>().material = hlMat;
                Destroy(hL.GetComponent<Collider>());

                GameObject hR = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                hR.transform.parent = carGO.transform;
                hR.transform.localPosition = new Vector3(0.7f, 0.4f, 2.1f);
                hR.transform.localScale = Vector3.one * 0.25f;
                hR.GetComponent<MeshRenderer>().material = hlMat;
                Destroy(hR.GetComponent<Collider>());

                // Taillights
                GameObject tL = GameObject.CreatePrimitive(PrimitiveType.Cube);
                tL.transform.parent = carGO.transform;
                tL.transform.localPosition = new Vector3(0f, 0.45f, -2.1f);
                tL.transform.localScale = new Vector3(1.6f, 0.15f, 0.1f);
                var tlMat = new Material(Shader.Find("Standard"));
                tlMat.color = Color.red;
                tlMat.EnableKeyword("_EMISSION");
                tlMat.SetColor("_EmissionColor", Color.red * 2.5f);
                tL.GetComponent<MeshRenderer>().material = tlMat;
                Destroy(tL.GetComponent<Collider>());

                // Add autonomous controller
                var trafficCtrl = carGO.AddComponent<AutonomousTrafficVehicle>();
                trafficCtrl.Initialize(cruiseSpeed, roadGridExtent, isXAxis);

                // Add Shield system so it can take laser hits
                var shield = carGO.AddComponent<Combat.VehicleShieldSystem>();
                shield.maxShield = 80f;
                shield.currentShield = 80f;
                shield.maxArmor = 100f;
                shield.currentArmor = 100f;

                activeVehicles.Add(trafficCtrl);
            }
        }
    }

    public class AutonomousTrafficVehicle : MonoBehaviour
    {
        private float speed = 16f;
        private float boundary = 220f;
        private bool travelsOnXAxis = true;
        private Rigidbody rb;

        public void Initialize(float baseSpeed, float bounds, bool isXAxis)
        {
            speed = baseSpeed;
            boundary = bounds;
            travelsOnXAxis = isXAxis;

            rb = GetComponent<Rigidbody>();
            if (rb == null)
            {
                rb = gameObject.AddComponent<Rigidbody>();
                rb.mass = 1200f;
                rb.linearDamping = 0.5f;
                rb.angularDamping = 2.0f;
            }
        }

        void FixedUpdate()
        {
            // Raycast forward for obstacle / pedestrian / vehicle avoidance
            bool obstacleAhead = Physics.Raycast(transform.position + Vector3.up * 0.4f, transform.forward, out RaycastHit hit, 12f);

            float currentTargetSpeed = obstacleAhead ? 0f : speed;

            // Drive forward smoothly
            Vector3 targetVel = transform.forward * currentTargetSpeed;
            targetVel.y = rb.linearVelocity.y; // Preserve gravity
            rb.linearVelocity = Vector3.MoveTowards(rb.linearVelocity, targetVel, 18f * Time.fixedDeltaTime);

            // Wrap around world grid boundaries
            Vector3 pos = transform.position;
            if (travelsOnXAxis)
            {
                if (pos.x > boundary) pos.x = -boundary;
                else if (pos.x < -boundary) pos.x = boundary;
            }
            else
            {
                if (pos.z > boundary) pos.z = -boundary;
                else if (pos.z < -boundary) pos.z = boundary;
            }
            transform.position = pos;
        }
    }
}
