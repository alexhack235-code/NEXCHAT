using UnityEngine;

namespace AstroShift.Combat
{
    public class VehicleShieldSystem : MonoBehaviour
    {
        [Header("Shield & Armor Stats")]
        public float maxShield = 150f;
        public float currentShield = 150f;
        public float maxArmor = 200f;
        public float currentArmor = 200f;

        [Header("Recharge Dynamics")]
        public float rechargeRate = 25f; // Shield points per sec
        public float rechargeDelay = 3.5f; // Delay after last hit before recharging
        public bool isShieldActive = true;

        [Header("Visual Dome Feedback")]
        public Color shieldColor = new Color(0f, 0.75f, 1f, 0.35f);
        public Color shieldHitColor = new Color(1f, 0.9f, 0.2f, 0.7f);

        private float lastDamageTime = 0f;
        private GameObject shieldDomeObj;
        private Material shieldMat;
        private float flashTimer = 0f;

        void Awake()
        {
            CreateShieldDomeVisual();
        }

        void CreateShieldDomeVisual()
        {
            shieldDomeObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            shieldDomeObj.name = "Deflector_Shield_Dome";
            shieldDomeObj.transform.parent = transform;
            shieldDomeObj.transform.localPosition = new Vector3(0, 0.5f, 0);
            shieldDomeObj.transform.localScale = new Vector3(3.4f, 2.2f, 5.6f);

            var col = shieldDomeObj.GetComponent<Collider>();
            if (col != null) Destroy(col); // Visual only, collider handled by root/vehicle

            var renderer = shieldDomeObj.GetComponent<MeshRenderer>();
            shieldMat = new Material(Shader.Find("Standard"));
            shieldMat.color = new Color(shieldColor.r, shieldColor.g, shieldColor.b, 0.1f);
            shieldMat.EnableKeyword("_EMISSION");
            shieldMat.SetColor("_EmissionColor", shieldColor * 0.4f);
            renderer.material = shieldMat;

            shieldDomeObj.SetActive(false);
        }

        void Update()
        {
            // Shield Recharge Loop
            if (Time.time - lastDamageTime > rechargeDelay && currentShield < maxShield)
            {
                currentShield = Mathf.Min(maxShield, currentShield + rechargeRate * Time.deltaTime);
                if (!isShieldActive && currentShield > 10f)
                {
                    isShieldActive = true;
                }
            }

            // Shield Flash Decay
            if (flashTimer > 0f)
            {
                flashTimer -= Time.deltaTime;
                if (flashTimer <= 0f && shieldDomeObj != null)
                {
                    shieldDomeObj.SetActive(false);
                }
            }
        }

        public void TakeDamage(float amount, Vector3 hitPoint)
        {
            lastDamageTime = Time.time;

            if (currentShield > 0f)
            {
                currentShield -= amount;
                if (currentShield < 0f)
                {
                    float overflow = -currentShield;
                    currentShield = 0f;
                    isShieldActive = false;
                    currentArmor = Mathf.Max(0f, currentArmor - overflow);
                }

                FlashShield(shieldHitColor);
            }
            else
            {
                // Direct armor damage
                currentArmor = Mathf.Max(0f, currentArmor - amount);
                FlashShield(new Color(1f, 0.2f, 0.1f, 0.8f));
            }
        }

        void FlashShield(Color col)
        {
            if (shieldDomeObj == null || shieldMat == null) return;

            shieldDomeObj.SetActive(true);
            shieldMat.color = col;
            shieldMat.SetColor("_EmissionColor", col * 1.8f);
            flashTimer = 0.14f;
        }

        public float GetShieldPercentage() => (maxShield > 0f) ? (currentShield / maxShield) : 0f;
        public float GetArmorPercentage() => (maxArmor > 0f) ? (currentArmor / maxArmor) : 0f;
    }
}
