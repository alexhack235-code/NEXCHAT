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

        [Header("Jetpack Propulsion")]
        public float jetpackForce = 24.0f;
        public float maxJetpackFuel = 100f;
        public float jetpackFuel = 100f;
        public float fuelDrainRate = 12f;
        public float fuelRechargeRate = 22f;

        [Header("Camera & View Modes")]
        public Camera playerCamera;
        public Transform firstPersonAnchor;
        public Transform thirdPersonPivot;
        public float mouseSensitivity = 2.4f;
        public bool isFirstPerson = false;
        public float thirdPersonDistance = 3.8f;
        public float shoulderOffset = 0.65f;

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
        private Vector3 velocity;
        private float pitch;
        private float yaw;
        private float slideTimer;
        private Vector3 slideDirection;

        void Awake()
        {
            Instance = this;
            controller = GetComponent<CharacterController>();
            yaw = transform.eulerAngles.y;
            if (playerCamera == null) playerCamera = Camera.main;
        }

        void Start()
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            UpdateCameraMode();
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
            }

            UpdateCameraTransform();
        }

        void HandleMouseLook()
        {
            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

            yaw += mouseX;
            pitch -= mouseY;
            pitch = Mathf.Clamp(pitch, -85f, 85f);

            transform.rotation = Quaternion.Euler(0, yaw, 0);
        }

        void HandleMovementInput()
        {
            isGrounded = controller.isGrounded;
            if (isGrounded && velocity.y < 0)
            {
                velocity.y = -2f;
            }

            float inputX = Input.GetAxisRaw("Horizontal");
            float inputZ = Input.GetAxisRaw("Vertical");

            if (UI.MobileTouchControls.Instance != null && UI.MobileTouchControls.Instance.joystickInput.sqrMagnitude > 0.01f)
            {
                inputX = UI.MobileTouchControls.Instance.joystickInput.x;
                inputZ = UI.MobileTouchControls.Instance.joystickInput.y;
            }

            Vector3 inputDir = (transform.forward * inputZ + transform.right * inputX).normalized;

            isSprinting = Input.GetKey(KeyCode.LeftShift) && inputZ > 0.1f && !isCrouching;
            bool wantsCrouch = Input.GetKey(KeyCode.C);

            // Tactical Knee Slide Trigger
            if (isSprinting && wantsCrouch && isGrounded && !isSliding)
            {
                isSliding = true;
                slideTimer = 0.85f;
                slideDirection = inputDir.magnitude > 0.1f ? inputDir : transform.forward;
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
                    float prog = slideTimer / 0.85f;
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

            Vector3 move = (isSliding ? slideDirection : inputDir) * targetSpeed;
            controller.Move(move * Time.deltaTime);

            // Jump
            if (Input.GetKeyDown(KeyCode.Space) && isGrounded)
            {
                velocity.y = Mathf.Sqrt(jumpForce * 2f * gravity);
            }
        }

        void HandleJetpackAndGravity()
        {
            isJetpacking = Input.GetKey(KeyCode.Space) && !isGrounded && jetpackFuel > 0;

            if (isJetpacking)
            {
                velocity.y += jetpackForce * Time.deltaTime;
                velocity.y = Mathf.Min(velocity.y, 16.0f);
                jetpackFuel = Mathf.Max(0, jetpackFuel - fuelDrainRate * Time.deltaTime);
            }
            else
            {
                velocity.y -= gravity * Time.deltaTime;
                if (jetpackFuel < maxJetpackFuel)
                {
                    jetpackFuel = Mathf.Min(maxJetpackFuel, jetpackFuel + fuelRechargeRate * Time.deltaTime);
                }
            }

            controller.Move(velocity * Time.deltaTime);
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
            Vehicles.SupercarController[] cars = Object.FindObjectsByType<Vehicles.SupercarController>();
            foreach (var car in cars)
            {
                if (Vector3.Distance(transform.position, car.transform.position) < 5.5f)
                    return car;
            }
            return null;
        }

        Space.StarshipController FindNearestStarship()
        {
            Space.StarshipController[] ships = Object.FindObjectsByType<Space.StarshipController>();
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

            if (isFirstPerson)
            {
                Vector3 eyePos = (firstPersonAnchor != null) ? firstPersonAnchor.position : transform.position + Vector3.up * 1.65f;
                playerCamera.transform.position = eyePos;
                playerCamera.transform.rotation = Quaternion.Euler(pitch, yaw, 0);
            }
            else
            {
                Vector3 pivot = (thirdPersonPivot != null) ? thirdPersonPivot.position : transform.position + Vector3.up * 1.45f;
                Quaternion camRot = Quaternion.Euler(pitch, yaw, 0);
                Vector3 camOffset = new Vector3(shoulderOffset, 0.25f, -thirdPersonDistance);
                Vector3 targetCamPos = pivot + camRot * camOffset;

                // Anti-Clip Raycast check
                if (Physics.Linecast(pivot, targetCamPos, out RaycastHit hit))
                {
                    targetCamPos = hit.point + hit.normal * 0.18f;
                }

                playerCamera.transform.position = Vector3.Lerp(playerCamera.transform.position, targetCamPos, Time.deltaTime * 18f);
                playerCamera.transform.rotation = camRot;
            }
        }
    }
}
