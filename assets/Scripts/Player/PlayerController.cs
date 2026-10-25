using UnityEngine;

namespace AstroShift.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        public static PlayerController Instance { get; private set; }

        [Header("Movement Dynamics")]
        public float walkSpeed = 7.2f;
        public float sprintSpeed = 13.5f;
        public float crouchSpeed = 3.6f;
        public float slideSpeed = 16.5f;
        public float jumpForce = 8.5f;
        public float gravity = 22.0f;
        public float groundAcceleration = 38.0f;
        public float groundDeceleration = 44.0f;
        public float airAcceleration = 18.0f;

        [Header("Jetpack Propulsion")]
        public float jetpackForce = 26.0f;
        public float maxJetpackAscentSpeed = 16.0f;
        public float terminalVelocity = -32.0f;
        public float maxJetpackFuel = 100f;
        public float jetpackFuel = 100f;
        public float fuelDrainRate = 14f;
        public float fuelRechargeRate = 22f;

        [Header("Camera & Mouse Look")]
        public Camera playerCamera;
        public Transform firstPersonAnchor;
        public Transform thirdPersonPivot;
        public float mouseSensitivity = 2.4f;
        public float lookSmoothTime = 0.035f;
        public bool isFirstPerson = false;
        public float thirdPersonDistance = 3.8f;
        public float shoulderOffset = 0.65f;
        public float cameraPositionSmoothTime = 0.08f;
        public float cameraRotationSmoothSpeed = 18.0f;

        [Header("Visual Meshes")]
        public GameObject thirdPersonModel;
        public GameObject firstPersonHands;

        [Header("State Status")]
        public bool isGrounded;
        public bool isSprinting;
        public bool isCrouching;
        public bool isSliding;
        public bool isJetpacking;
        public bool inVehicle;
        public bool inStarship;

        private CharacterController controller;
        private Vector3 currentPlanarVelocity = Vector3.zero;
        private float verticalVelocity = 0f;

        private float targetYaw;
        private float targetPitch;
        private float currentYaw;
        private float currentPitch;
        private float yawVelocity;
        private float pitchVelocity;

        private float slideTimer;
        private Vector3 slideDirection;
        private float groundedGraceTimer;
        private Vector3 camSmoothDampVelocity;

        void Awake()
        {
            Instance = this;
            controller = GetComponent<CharacterController>();

            targetYaw = transform.eulerAngles.y;
            currentYaw = targetYaw;
            targetPitch = 0f;
            currentPitch = 0f;

            if (playerCamera == null) playerCamera = Camera.main;
        }

        void Start()
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            UpdateCameraMode();

            // Link to CinematicFollowCamera if active in scene
            if (playerCamera != null)
            {
                var followCam = playerCamera.GetComponent<Vehicles.CinematicFollowCamera>();
                if (followCam != null)
                {
                    followCam.SetTarget(transform, null, firstPersonAnchor);
                    followCam.SetProfile(Vehicles.CinematicFollowCamera.CameraProfile.Player);
                }
            }
        }

        void Update()
        {
            if (inVehicle || inStarship)
            {
                if (thirdPersonModel != null) thirdPersonModel.SetActive(false);
                if (firstPersonHands != null) firstPersonHands.SetActive(false);
                return;
            }

            HandleMouseLook();
            HandleMovementInput();
            HandleJetpackAndGravity();
            HandleInteractions();

            // Toggle Camera Perspective with [V]
            if (Input.GetKeyDown(KeyCode.V))
            {
                isFirstPerson = !isFirstPerson;
                UpdateCameraMode();

                if (playerCamera != null)
                {
                    var followCam = playerCamera.GetComponent<Vehicles.CinematicFollowCamera>();
                    if (followCam != null)
                    {
                        followCam.isFirstPerson = isFirstPerson;
                    }
                }
            }

            UpdateCameraTransform();
        }

        void HandleMouseLook()
        {
            float mouseX = Input.GetAxisRaw("Mouse X") * mouseSensitivity;
            float mouseY = Input.GetAxisRaw("Mouse Y") * mouseSensitivity;

            // Touch look delta support
            if (UI.MobileTouchControls.Instance != null && UI.MobileTouchControls.Instance.lookDelta.sqrMagnitude > 0.001f)
            {
                mouseX += UI.MobileTouchControls.Instance.lookDelta.x * 0.12f;
                mouseY += UI.MobileTouchControls.Instance.lookDelta.y * 0.12f;
            }

            targetYaw += mouseX;
            targetPitch -= mouseY;
            targetPitch = Mathf.Clamp(targetPitch, -85f, 85f);

            // Silky-smooth second-order angular damping to eliminate mouse stutter
            if (lookSmoothTime > 0.001f)
            {
                currentYaw = Mathf.SmoothDampAngle(currentYaw, targetYaw, ref yawVelocity, lookSmoothTime);
                currentPitch = Mathf.SmoothDampAngle(currentPitch, targetPitch, ref pitchVelocity, lookSmoothTime);
            }
            else
            {
                currentYaw = targetYaw;
                currentPitch = targetPitch;
            }

            transform.rotation = Quaternion.Euler(0f, currentYaw, 0f);
        }

        void HandleMovementInput()
        {
            // Robust ground detection combining CharacterController with spherecast and coyote time
            bool rawControllerGrounded = controller.isGrounded;
            bool sphereGrounded = false;

            if (controller != null)
            {
                Vector3 sphereOrigin = transform.position + Vector3.up * (controller.radius + 0.08f);
                float checkDistance = controller.radius + 0.16f;
                sphereGrounded = Physics.SphereCast(sphereOrigin, controller.radius * 0.85f, Vector3.down, out RaycastHit _, checkDistance, ~0, QueryTriggerInteraction.Ignore);
            }

            bool rawGrounded = rawControllerGrounded || (sphereGrounded && verticalVelocity <= 0.05f);
            if (rawGrounded)
            {
                groundedGraceTimer = 0.12f; // Coyote time grace window
                isGrounded = true;
                if (verticalVelocity < 0f)
                {
                    verticalVelocity = -2.5f; // Smooth ground adherence stick
                }
            }
            else
            {
                groundedGraceTimer -= Time.deltaTime;
                isGrounded = groundedGraceTimer > 0f;
            }

            float inputX = Input.GetAxisRaw("Horizontal");
            float inputZ = Input.GetAxisRaw("Vertical");

            if (UI.MobileTouchControls.Instance != null && UI.MobileTouchControls.Instance.joystickInput.sqrMagnitude > 0.01f)
            {
                inputX = UI.MobileTouchControls.Instance.joystickInput.x;
                inputZ = UI.MobileTouchControls.Instance.joystickInput.y;
            }

            Vector3 inputDir = (transform.forward * inputZ + transform.right * inputX);
            if (inputDir.sqrMagnitude > 1f) inputDir.Normalize();

            isSprinting = Input.GetKey(KeyCode.LeftShift) && inputZ > 0.1f && !isCrouching;
            bool wantsCrouch = Input.GetKey(KeyCode.C);

            // Tactical Knee Slide Trigger
            if (isSprinting && wantsCrouch && isGrounded && !isSliding)
            {
                isSliding = true;
                slideTimer = 0.85f;
                slideDirection = inputDir.sqrMagnitude > 0.01f ? inputDir : transform.forward;
            }

            float targetSpeed = walkSpeed;
            if (isSliding)
            {
                slideTimer -= Time.deltaTime;
                if (!isGrounded || slideTimer <= 0 || !wantsCrouch)
                {
                    isSliding = false;
                }
                else
                {
                    float prog = Mathf.Clamp01(slideTimer / 0.85f);
                    targetSpeed = Mathf.Lerp(walkSpeed, slideSpeed, prog);
                }
            }
            else if (wantsCrouch)
            {
                isCrouching = true;
                targetSpeed = crouchSpeed;
            }
            else
            {
                isCrouching = false;
                targetSpeed = isSprinting ? sprintSpeed : walkSpeed;
            }

            Vector3 targetPlanarVelocity = (isSliding ? slideDirection : inputDir) * targetSpeed;

            // Responsive acceleration / deceleration damping with Time.deltaTime
            float accelRate;
            if (isGrounded)
            {
                accelRate = (targetPlanarVelocity.sqrMagnitude > 0.001f) ? groundAcceleration : groundDeceleration;
            }
            else
            {
                accelRate = airAcceleration;
            }

            currentPlanarVelocity = Vector3.MoveTowards(currentPlanarVelocity, targetPlanarVelocity, accelRate * Time.deltaTime);

            // Jump handling
            if (Input.GetKeyDown(KeyCode.Space) && isGrounded)
            {
                verticalVelocity = Mathf.Sqrt(jumpForce * 2f * gravity);
                groundedGraceTimer = 0f;
                isGrounded = false;
            }

            Vector3 finalMove = (currentPlanarVelocity + Vector3.up * verticalVelocity) * Time.deltaTime;
            controller.Move(finalMove);
        }

        void HandleJetpackAndGravity()
        {
            isJetpacking = Input.GetKey(KeyCode.Space) && !isGrounded && jetpackFuel > 0f;

            if (isJetpacking)
            {
                // Smooth upward propulsion damping towards maxJetpackAscentSpeed
                verticalVelocity = Mathf.MoveTowards(verticalVelocity, maxJetpackAscentSpeed, jetpackForce * Time.deltaTime);
                jetpackFuel = Mathf.Max(0f, jetpackFuel - fuelDrainRate * Time.deltaTime);
            }
            else
            {
                // Smooth gravitational acceleration towards terminal velocity
                verticalVelocity = Mathf.MoveTowards(verticalVelocity, terminalVelocity, gravity * Time.deltaTime);

                if (isGrounded && jetpackFuel < maxJetpackFuel)
                {
                    jetpackFuel = Mathf.Min(maxJetpackFuel, jetpackFuel + fuelRechargeRate * Time.deltaTime);
                }
                else if (!isGrounded && jetpackFuel < maxJetpackFuel)
                {
                    jetpackFuel = Mathf.Min(maxJetpackFuel, jetpackFuel + (fuelRechargeRate * 0.35f) * Time.deltaTime);
                }
            }
        }

        void HandleInteractions()
        {
            if (Input.GetKeyDown(KeyCode.E))
            {
                // Try boarding vehicle nearby
                Vehicles.SupercarController car = FindNearestSupercar();
                if (car != null)
                {
                    car.EnterVehicle(this);
                    return;
                }

                // Try boarding Starship nearby
                Space.StarshipController ship = FindNearestStarship();
                if (ship != null)
                {
                    ship.EnterStarship(this);
                    return;
                }
            }
        }

        Vehicles.SupercarController FindNearestSupercar()
        {
            Vehicles.SupercarController[] cars = Object.FindObjectsByType<Vehicles.SupercarController>(FindObjectsSortMode.None);
            foreach (var car in cars)
            {
                if (Vector3.Distance(transform.position, car.transform.position) < 5.5f)
                    return car;
            }
            return null;
        }

        Space.StarshipController FindNearestStarship()
        {
            Space.StarshipController[] ships = Object.FindObjectsByType<Space.StarshipController>(FindObjectsSortMode.None);
            foreach (var ship in ships)
            {
                if (Vector3.Distance(transform.position, ship.transform.position) < 25.0f)
                    return ship;
            }
            return null;
        }

        public void UpdateCameraMode()
        {
            if (thirdPersonModel != null)
                thirdPersonModel.SetActive(!isFirstPerson);
            if (firstPersonHands != null)
                firstPersonHands.SetActive(isFirstPerson);
        }

        void UpdateCameraTransform()
        {
            if (playerCamera == null) return;

            // If CinematicFollowCamera is active on the camera and targeting the player, let it handle the follow
            var followCam = playerCamera.GetComponent<Vehicles.CinematicFollowCamera>();
            if (followCam != null && followCam.enabled && followCam.target == transform)
            {
                followCam.isFirstPerson = isFirstPerson;
                return;
            }

            Quaternion camRot = Quaternion.Euler(currentPitch, currentYaw, 0f);

            if (isFirstPerson)
            {
                Vector3 eyePos = (firstPersonAnchor != null) ? firstPersonAnchor.position : transform.position + Vector3.up * 1.65f;
                playerCamera.transform.position = eyePos;
                playerCamera.transform.rotation = camRot;
            }
            else
            {
                Vector3 pivot = (thirdPersonPivot != null) ? thirdPersonPivot.position : transform.position + Vector3.up * 1.45f;
                Vector3 camOffset = new Vector3(shoulderOffset, 0.25f, -thirdPersonDistance);
                Vector3 targetCamPos = pivot + camRot * camOffset;

                // Anti-Clip Raycast check
                if (Physics.Linecast(pivot, targetCamPos, out RaycastHit hit, ~0, QueryTriggerInteraction.Ignore))
                {
                    targetCamPos = hit.point + hit.normal * 0.18f;
                }

                playerCamera.transform.position = Vector3.SmoothDamp(playerCamera.transform.position, targetCamPos, ref camSmoothDampVelocity, cameraPositionSmoothTime);
                playerCamera.transform.rotation = Quaternion.Slerp(playerCamera.transform.rotation, camRot, 1f - Mathf.Exp(-cameraRotationSmoothSpeed * Time.deltaTime));
            }
        }
    }
}
