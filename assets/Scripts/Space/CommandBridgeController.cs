using UnityEngine;

namespace AstroShift.Space
{
    public class CommandBridgeController : MonoBehaviour
    {
        [Header("Camera & View Modes")]
        public Camera mainCamera;
        public Transform bridgeFirstPersonPivot;
        public Transform exteriorChasePivot;
        public bool isOutsideRealmView = false;

        [Header("Structural & Window Meshes")]
        public GameObject exteriorOpaqueNosecone;
        public GameObject interiorBridgeCabinGroup;
        public HolographicOrrey holographicOrrey;

        [Header("Cockpit Atmosphere")]
        public Light cabinCyanLight;
        public Light dashboardLight;

        void Start()
        {
            if (mainCamera == null) mainCamera = Camera.main;
            UpdateBridgeVisibility();
        }

        public void ToggleViewMode()
        {
            isOutsideRealmView = !isOutsideRealmView;
            UpdateBridgeVisibility();
        }

        public void SetOutsideView(bool outside)
        {
            isOutsideRealmView = outside;
            UpdateBridgeVisibility();
        }

        public void UpdateBridgeVisibility()
        {
            // When inside bridge (1P), hide exterior opaque nosecone so view out window into space is 100% crystal clear!
            if (exteriorOpaqueNosecone != null)
            {
                exteriorOpaqueNosecone.SetActive(isOutsideRealmView);
            }

            if (interiorBridgeCabinGroup != null)
            {
                interiorBridgeCabinGroup.SetActive(true);
            }

            if (cabinCyanLight != null) cabinCyanLight.enabled = true;
            if (dashboardLight != null) dashboardLight.enabled = true;
        }

        public void UpdateCameraPosition(Transform starshipTransform, float yaw, float pitch, float roll)
        {
            if (mainCamera == null) return;

            if (isOutsideRealmView)
            {
                // 3P Outside Space Realm View
                if (exteriorChasePivot != null)
                {
                    mainCamera.transform.position = Vector3.Lerp(mainCamera.transform.position, exteriorChasePivot.position, Time.deltaTime * 10f);
                    mainCamera.transform.LookAt(starshipTransform.position + starshipTransform.up * 45f);
                }
                else
                {
                    Vector3 camBack = starshipTransform.position - starshipTransform.forward * 65f + starshipTransform.up * 25f;
                    mainCamera.transform.position = Vector3.Lerp(mainCamera.transform.position, camBack, Time.deltaTime * 10f);
                    mainCamera.transform.LookAt(starshipTransform.position + starshipTransform.up * 45f);
                }
            }
            else
            {
                // 1P Inside Starship Command Bridge View
                if (bridgeFirstPersonPivot != null)
                {
                    mainCamera.transform.position = bridgeFirstPersonPivot.position;
                    mainCamera.transform.rotation = bridgeFirstPersonPivot.rotation;
                }
                else
                {
                    Vector3 bridgePos = starshipTransform.position + starshipTransform.up * 38f + starshipTransform.forward * 1.5f;
                    mainCamera.transform.position = bridgePos;
                    mainCamera.transform.rotation = starshipTransform.rotation;
                }
            }
        }
    }
}
