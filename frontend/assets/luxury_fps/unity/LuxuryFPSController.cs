using System.Collections;
using UnityEngine;

/// <summary>
/// AURUM-IX Luxury Plasma Railgun Controller for Unity 3D (Universal RP / HDRP).
/// Implements procedural weapon sway, spring-based recoil physics, ADS zoom, and audio effects.
/// </summary>
public class LuxuryFPSController : MonoBehaviour
{
    [Header("Weapon Transforms")]
    [SerializeField] private Transform weaponTransform;
    [SerializeField] private Vector3 hipPosition = new Vector3(0.24f, -0.22f, 0.5f);
    [SerializeField] private Vector3 adsPosition = new Vector3(0f, -0.12f, 0.38f);
    [SerializeField] private Camera playerCamera;

    [Header("ADS & Sway Settings")]
    [SerializeField] private float adsSpeed = 14f;
    [SerializeField] private float normalFov = 75f;
    [SerializeField] private float adsFov = 45f;
    [SerializeField] private float swayAmount = 0.02f;
    [SerializeField] private float maxSwayAmount = 0.06f;
    [SerializeField] private float swaySmoothness = 6f;

    [Header("Procedural Recoil Physics")]
    [SerializeField] private Vector3 recoilKickback = new Vector3(0f, 0.04f, -0.12f);
    [SerializeField] private Vector3 recoilRotation = new Vector3(8f, 2f, 0f);
    [SerializeField] private float recoilSnappiness = 20f;
    [SerializeField] private float recoilReturnSpeed = 10f;

    [Header("Weapon Stats")]
    [SerializeField] private int maxAmmo = 24;
    [SerializeField] private float fireRate = 0.15f;
    [SerializeField] private float damage = 85f;
    [SerializeField] private float range = 150f;

    [Header("VFX & Audio")]
    [SerializeField] private ParticleSystem muzzleFlash;
    [SerializeField] private Light muzzleLight;
    [SerializeField] private AudioSource audioSource;
    [SerializeField] private AudioClip fireSound;
    [SerializeField] private AudioClip hitSound;

    private int currentAmmo;
    private bool isAiming = false;
    private float nextFireTime = 0f;

    // Recoil vectors
    private Vector3 currentRecoilPos;
    private Vector3 targetRecoilPos;
    private Vector3 currentRecoilRot;
    private Vector3 targetRecoilRot;

    void Start()
    {
        currentAmmo = maxAmmo;
        if (playerCamera == null) playerCamera = Camera.main;
        if (weaponTransform != null) weaponTransform.localPosition = hipPosition;
    }

    void Update()
    {
        HandleInput();
        HandleSway();
        HandleRecoilPhysics();
        HandleADS();
    }

    private void HandleInput()
    {
        // ADS Toggle
        isAiming = Input.GetMouseButton(1);

        // Fire
        if (Input.GetMouseButton(0) && Time.time >= nextFireTime)
        {
            if (currentAmmo > 0)
            {
                Fire();
            }
        }

        // Reload
        if (Input.GetKeyDown(KeyCode.R) && currentAmmo < maxAmmo)
        {
            StartCoroutine(ReloadRoutine());
        }
    }

    private void Fire()
    {
        nextFireTime = Time.time + fireRate;
        currentAmmo--;

        // Apply Recoil Kick
        float mult = isAiming ? 0.45f : 1.0f;
        targetRecoilPos += new Vector3(
            Random.Range(-recoilKickback.x, recoilKickback.x) * mult,
            recoilKickback.y * mult,
            recoilKickback.z * mult
        );
        targetRecoilRot += new Vector3(
            -recoilRotation.x * mult,
            Random.Range(-recoilRotation.y, recoilRotation.y) * mult,
            recoilRotation.z * mult
        );

        // VFX
        if (muzzleFlash != null) muzzleFlash.Play();
        if (muzzleLight != null) StartCoroutine(MuzzleFlashLight());

        // SFX
        if (audioSource != null && fireSound != null)
        {
            audioSource.PlayOneShot(fireSound);
        }

        // Raycast
        if (Physics.Raycast(playerCamera.transform.position, playerCamera.transform.forward, out RaycastHit hit, range))
        {
            Debug.Log($"[AURUM-IX] Hit: {hit.collider.name} at {hit.point}");
            if (audioSource != null && hitSound != null)
            {
                audioSource.PlayOneShot(hitSound, 0.7f);
            }
        }
    }

    private void HandleSway()
    {
        float mouseX = Input.GetAxisRaw("Mouse X") * swayAmount;
        float mouseY = Input.GetAxisRaw("Mouse Y") * swayAmount;

        mouseX = Mathf.Clamp(mouseX, -maxSwayAmount, maxSwayAmount);
        mouseY = Mathf.Clamp(mouseY, -maxSwayAmount, maxSwayAmount);

        Vector3 swayTarget = new Vector3(-mouseX, -mouseY, 0);
        weaponTransform.localPosition = Vector3.Lerp(weaponTransform.localPosition, GetTargetPos() + swayTarget, Time.deltaTime * swaySmoothness);
    }

    private void HandleRecoilPhysics()
    {
        targetRecoilPos = Vector3.Lerp(targetRecoilPos, Vector3.zero, Time.deltaTime * recoilReturnSpeed);
        currentRecoilPos = Vector3.Slerp(currentRecoilPos, targetRecoilPos, Time.deltaTime * recoilSnappiness);

        targetRecoilRot = Vector3.Lerp(targetRecoilRot, Vector3.zero, Time.deltaTime * recoilReturnSpeed);
        currentRecoilRot = Vector3.Slerp(currentRecoilRot, targetRecoilRot, Time.deltaTime * recoilSnappiness);

        weaponTransform.localPosition += currentRecoilPos;
        weaponTransform.localRotation = Quaternion.Euler(currentRecoilRot);
    }

    private void HandleADS()
    {
        float targetFov = isAiming ? adsFov : normalFov;
        playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, targetFov, Time.deltaTime * adsSpeed);
    }

    private Vector3 GetTargetPos()
    {
        return isAiming ? adsPosition : hipPosition;
    }

    private IEnumerator MuzzleFlashLight()
    {
        muzzleLight.enabled = true;
        yield return new WaitForSeconds(0.04f);
        muzzleLight.enabled = false;
    }

    private IEnumerator ReloadRoutine()
    {
        yield return new WaitForSeconds(1.2f);
        currentAmmo = maxAmmo;
    }
}
