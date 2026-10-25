using UnityEngine;

namespace AstroShift.UI
{
    public class MobileTouchControls : MonoBehaviour
    {
        public static MobileTouchControls Instance { get; private set; }

        [Header("Virtual Joystick State")]
        public Vector2 joystickInput = Vector2.zero;
        public bool isTouchDevice = false;

        private Vector2 touchStartPos;
        private bool touchActive = false;
        private int joystickFingerId = -1;

        void Awake()
        {
            Instance = this;
            // Detect mobile platforms or touch screen devices
            isTouchDevice = Application.isMobilePlatform || 
                            SystemInfo.deviceType == DeviceType.Handheld || 
                            Input.touchSupported;
        }

        void Update()
        {
            if (!isTouchDevice && Input.touchCount == 0) return;

            HandleTouchInput();
        }

        void HandleTouchInput()
        {
            joystickInput = Vector2.zero;

            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch t = Input.GetTouch(i);

                // Left half of screen is virtual movement joystick
                if (t.position.x < Screen.width * 0.45f)
                {
                    if (t.phase == TouchPhase.Began)
                    {
                        joystickFingerId = t.fingerId;
                        touchStartPos = t.position;
                        touchActive = true;
                    }
                    else if ((t.phase == TouchPhase.Moved || t.phase == TouchPhase.Stationary) && t.fingerId == joystickFingerId)
                    {
                        Vector2 delta = t.position - touchStartPos;
                        float maxRadius = 65f;
                        joystickInput = Vector2.ClampMagnitude(delta / maxRadius, 1f);
                    }
                    else if (t.phase == TouchPhase.Ended || t.phase == TouchPhase.Canceled)
                    {
                        if (t.fingerId == joystickFingerId)
                        {
                            touchActive = false;
                            joystickFingerId = -1;
                            joystickInput = Vector2.zero;
                        }
                    }
                }
            }
        }

        void OnGUI()
        {
            // Only render virtual touch pads on touch/mobile screens
            if (!isTouchDevice && Input.touchCount == 0) return;

            float btnSize = 64f;
            float pad = 16f;

            // Virtual Joystick Base (Left side)
            if (touchActive)
            {
                Rect baseRect = new Rect(touchStartPos.x - 45f, Screen.height - touchStartPos.y - 45f, 90f, 90f);
                GUI.Box(baseRect, "");
                Rect thumbRect = new Rect(
                    touchStartPos.x + joystickInput.x * 35f - 22f,
                    Screen.height - (touchStartPos.y + joystickInput.y * 35f) - 22f,
                    44f, 44f
                );
                GUI.Box(thumbRect, "O");
            }
            else
            {
                Rect hintRect = new Rect(pad + 20f, Screen.height - 120f, 90f, 90f);
                GUI.Box(hintRect, "TOUCH\nMOVE");
            }

            // Right-Side Mobile Action Buttons (Right thumb controls)
            float rightX = Screen.width - btnSize - pad;
            float bottomY = Screen.height - btnSize - pad;

            var player = Player.PlayerController.Instance;
            if (player == null) return;

            // Jump / Jetpack / Ascend Button
            if (GUI.RepeatButton(new Rect(rightX, bottomY - 75f, btnSize, btnSize), "JUMP\n[LIFT]"))
            {
                // Triggers jump/jetpack in player controller
            }

            // Cam View Toggle Button [V / C]
            if (GUI.Button(new Rect(rightX - 75f, bottomY - 75f, btnSize, btnSize), "CAM\n[VIEW]"))
            {
                if (player.inStarship)
                {
                    var ship = Object.FindAnyObjectByType<Space.StarshipController>();
                    if (ship != null && ship.bridgeController != null) ship.bridgeController.ToggleViewMode();
                }
                else if (player.inVehicle)
                {
                    var car = Object.FindAnyObjectByType<Vehicles.SupercarController>();
                    if (car != null) car.isCockpitView = !car.isCockpitView;
                }
                else
                {
                    player.isFirstPerson = !player.isFirstPerson;
                    player.UpdateCameraMode();
                }
            }

            // Nitro / Tesla Flight Action Button
            if (player.inVehicle)
            {
                if (GUI.RepeatButton(new Rect(rightX, bottomY, btnSize, btnSize), "NITRO\n[BOOST]"))
                {
                    var car = Object.FindAnyObjectByType<Vehicles.SupercarController>();
                    if (car != null) car.isBoosting = true;
                }

                if (GUI.Button(new Rect(rightX - 75f, bottomY, btnSize, btnSize), "FLIGHT\n[MODE]"))
                {
                    var car = Object.FindAnyObjectByType<Vehicles.SupercarController>();
                    if (car != null && car.teslaFlight != null) car.teslaFlight.ToggleFlightMode();
                }
            }

            // Enter / Exit Button
            if (GUI.Button(new Rect(rightX - 150f, bottomY, btnSize, btnSize), (player.inVehicle || player.inStarship) ? "EXIT\n[DOOR]" : "ENTER\n[VEH]"))
            {
                if (player.inVehicle)
                {
                    var car = Object.FindAnyObjectByType<Vehicles.SupercarController>();
                    if (car != null) car.ExitVehicle();
                }
                else if (player.inStarship)
                {
                    var ship = Object.FindAnyObjectByType<Space.StarshipController>();
                    if (ship != null) ship.ExitStarship();
                }
            }
        }
    }
}
