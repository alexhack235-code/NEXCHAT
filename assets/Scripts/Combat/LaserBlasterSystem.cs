using UnityEngine;

namespace AstroShift.Combat
{
    public class LaserBlasterSystem : MonoBehaviour
    {
        [Header("Weapon Config")]
        public string weaponName = "Dual Photon Plasma Blaster";
        public float fireRate = 0.12f; // Seconds between shots
        public float damage = 25f;
        public float projectileSpeed = 180f;
        public float projectileLifetime = 3.5f;
        public float heatPerShot = 8f;
        public float maxHeat = 100f;
        public float coolingRate = 30f;
        public float overheatCooldown = 2.0f;

        [Header("State Telemetry")]
        public float currentHeat = 0f;
        public bool isOverheated = false;
        public bool isFiring = false;

        [Header("Muzzle Sockets")]
        public Transform[] muzzleSockets;
        public Color laserColor = new Color(0f, 1f, 0.9f); // Cyan plasma

        private float nextFireTime = 0f;
        private int currentMuzzleIndex = 0;
        private Light muzzleFlashLight;

        void Awake()
        {
            // Create default muzzle sockets if none assigned
            if (muzzleSockets == null || muzzleSockets.Length == 0)
            {
                CreateDefaultMuzzles();
            }

            // Create muzzle flash light
            GameObject flashObj = new GameObject("MuzzleFlash_Light");
            flashObj.transform.parent = transform;
            flashObj.transform.localPosition = Vector3.forward * 2f;
            muzzleFlashLight = flashObj.AddComponent<Light>();
            muzzleFlashLight.type = LightType.Point;
            muzzleFlashLight.color = laserColor;
            muzzleFlashLight.range = 12f;
            muzzleFlashLight.intensity = 0f;
        }

        void CreateDefaultMuzzles()
        {
            GameObject mLeft = new GameObject("Muzzle_L");
            mLeft.transform.parent = transform;
            mLeft.transform.localPosition = new Vector3(-0.85f, 0.45f, 1.9f);

            GameObject mRight = new GameObject("Muzzle_R");
            mRight.transform.parent = transform;
            mRight.transform.localPosition = new Vector3(0.85f, 0.45f, 1.9f);

            muzzleSockets = new Transform[] { mLeft.transform, mRight.transform };
        }

        void Update()
        {
            // Heat Dissipation
            if (currentHeat > 0f)
            {
                currentHeat -= coolingRate * Time.deltaTime;
                if (currentHeat <= 0f)
                {
                    currentHeat = 0f;
                    isOverheated = false;
                }
            }

            if (muzzleFlashLight != null && muzzleFlashLight.intensity > 0f)
            {
                muzzleFlashLight.intensity = Mathf.Max(0f, muzzleFlashLight.intensity - Time.deltaTime * 24f);
            }
        }

        public bool TryFire(Vector3 forwardAimDirection)
        {
            if (isOverheated) return false;
            if (Time.time < nextFireTime) return false;

            nextFireTime = Time.time + fireRate;
            currentHeat += heatPerShot;

            if (currentHeat >= maxHeat)
            {
                currentHeat = maxHeat;
                isOverheated = true;
                nextFireTime = Time.time + overheatCooldown;
            }

            // Alternate between muzzles
            Transform activeMuzzle = (muzzleSockets != null && muzzleSockets.Length > 0)
                ? muzzleSockets[currentMuzzleIndex % muzzleSockets.Length]
                : transform;
            currentMuzzleIndex++;

            SpawnProjectile(activeMuzzle.position, forwardAimDirection);

            // Muzzle flash
            if (muzzleFlashLight != null)
            {
                muzzleFlashLight.transform.position = activeMuzzle.position;
                muzzleFlashLight.intensity = 3.5f;
            }

            return true;
        }

        void SpawnProjectile(Vector3 spawnPos, Vector3 direction)
        {
            GameObject bolt = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            bolt.name = "Plasma_Bolt";
            bolt.transform.position = spawnPos;
            bolt.transform.rotation = Quaternion.LookRotation(direction) * Quaternion.Euler(90f, 0, 0);
            bolt.transform.localScale = new Vector3(0.12f, 0.75f, 0.12f);

            // Glowing emissive material
            var renderer = bolt.GetComponent<MeshRenderer>();
            Material mat = new Material(Shader.Find("Standard"));
            mat.color = laserColor;
            mat.EnableKeyword("_EMISSION");
            mat.SetColor("_EmissionColor", laserColor * 2.5f);
            renderer.material = mat;

            // Non-physical trigger collider
            var col = bolt.GetComponent<Collider>();
            if (col != null) col.isTrigger = true;

            var boltScript = bolt.AddComponent<PlasmaBoltProjectile>();
            boltScript.Initialize(direction * projectileSpeed, damage, projectileLifetime, laserColor);
        }
    }

    public class PlasmaBoltProjectile : MonoBehaviour
    {
        private Vector3 velocity;
        private float damage;
        private float lifeTimer;
        private Color boltColor;

        public void Initialize(Vector3 vel, float dmg, float lifetime, Color col)
        {
            velocity = vel;
            damage = dmg;
            lifeTimer = lifetime;
            boltColor = col;
            Destroy(gameObject, lifetime);
        }

        void Update()
        {
            float step = velocity.magnitude * Time.deltaTime;
            Vector3 startPos = transform.position;

            // Raycast forward to prevent tunnelling at high velocities
            if (Physics.Raycast(startPos, velocity.normalized, out RaycastHit hit, step))
            {
                OnHit(hit);
                return;
            }

            transform.position += velocity * Time.deltaTime;
        }

        void OnTriggerEnter(Collider other)
        {
            var hitShield = other.GetComponentInParent<VehicleShieldSystem>();
            if (hitShield != null)
            {
                hitShield.TakeDamage(damage, transform.position);
                CreateImpactEffect(transform.position, -velocity.normalized);
                Destroy(gameObject);
                return;
            }

            var hitDrone = other.GetComponentInParent<Environment.TargetDrone>();
            if (hitDrone != null)
            {
                hitDrone.TakeDamage(damage);
                CreateImpactEffect(transform.position, -velocity.normalized);
                Destroy(gameObject);
                return;
            }

            CreateImpactEffect(transform.position, -velocity.normalized);
            Destroy(gameObject);
        }

        void OnHit(RaycastHit hit)
        {
            var hitShield = hit.collider.GetComponentInParent<VehicleShieldSystem>();
            if (hitShield != null)
            {
                hitShield.TakeDamage(damage, hit.point);
            }

            var hitDrone = hit.collider.GetComponentInParent<Environment.TargetDrone>();
            if (hitDrone != null)
            {
                hitDrone.TakeDamage(damage);
            }

            CreateImpactEffect(hit.point, hit.normal);
            Destroy(gameObject);
        }

        void CreateImpactEffect(Vector3 pos, Vector3 normal)
        {
            GameObject spark = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            spark.name = "Plasma_Impact_Sparks";
            spark.transform.position = pos;
            spark.transform.localScale = Vector3.one * 0.45f;

            var renderer = spark.GetComponent<MeshRenderer>();
            Material mat = new Material(Shader.Find("Standard"));
            mat.color = boltColor;
            mat.EnableKeyword("_EMISSION");
            mat.SetColor("_EmissionColor", boltColor * 3.0f);
            renderer.material = mat;

            var col = spark.GetComponent<Collider>();
            if (col != null) Destroy(col);

            Destroy(spark, 0.18f);
        }
    }
}
