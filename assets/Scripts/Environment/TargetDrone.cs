using UnityEngine;

namespace AstroShift.Environment
{
    public class TargetDrone : MonoBehaviour
    {
        [Header("Drone Health")]
        public float maxHealth = 100f;
        public float currentHealth = 100f;
        public bool isDestroyed = false;

        [Header("Hover Flight Dynamics")]
        public float hoverHeight = 12f;
        public float bobSpeed = 1.8f;
        public float bobAmount = 1.4f;
        public float patrolRadius = 25f;
        public float moveSpeed = 6f;

        private Vector3 originPos;
        private float angleOffset;
        private MeshRenderer[] childRenderers;
        private Collider col;

        void Awake()
        {
            originPos = transform.position;
            angleOffset = Random.Range(0f, Mathf.PI * 2f);
            childRenderers = GetComponentsInChildren<MeshRenderer>();
            col = GetComponent<Collider>();
            if (col == null)
            {
                var box = gameObject.AddComponent<BoxCollider>();
                box.size = new Vector3(2.5f, 1.2f, 2.5f);
            }
        }

        void Update()
        {
            if (isDestroyed) return;

            // Hover motion
            float newY = originPos.y + Mathf.Sin(Time.time * bobSpeed + angleOffset) * bobAmount;
            float patrolX = originPos.x + Mathf.Cos(Time.time * (moveSpeed / 10f) + angleOffset) * patrolRadius;
            float patrolZ = originPos.z + Mathf.Sin(Time.time * (moveSpeed / 10f) + angleOffset) * patrolRadius;

            transform.position = new Vector3(patrolX, newY, patrolZ);
            transform.Rotate(Vector3.up, 24f * Time.deltaTime, UnityEngine.Space.World);
        }

        public void TakeDamage(float dmg)
        {
            if (isDestroyed) return;

            currentHealth -= dmg;
            if (currentHealth <= 0f)
            {
                ExplodeAndRespawn();
            }
        }

        void ExplodeAndRespawn()
        {
            isDestroyed = true;

            // Visual explosion flash
            GameObject explosion = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            explosion.name = "Drone_Explosion_Flash";
            explosion.transform.position = transform.position;
            explosion.transform.localScale = Vector3.one * 4.2f;

            var r = explosion.GetComponent<MeshRenderer>();
            Material mat = new Material(Shader.Find("Standard"));
            mat.color = new Color(1f, 0.5f, 0f);
            mat.EnableKeyword("_EMISSION");
            mat.SetColor("_EmissionColor", new Color(1f, 0.6f, 0f) * 3f);
            r.material = mat;

            var c = explosion.GetComponent<Collider>();
            if (c != null) Destroy(c);
            Destroy(explosion, 0.35f);

            // Hide drone
            SetVisibility(false);

            // Schedule respawn in 8 seconds
            Invoke(nameof(Respawn), 8f);
        }

        void SetVisibility(bool visible)
        {
            foreach (var r in childRenderers)
            {
                if (r != null) r.enabled = visible;
            }
            if (col != null) col.enabled = visible;
        }

        void Respawn()
        {
            currentHealth = maxHealth;
            isDestroyed = false;
            SetVisibility(true);
        }
    }
}
