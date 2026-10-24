using UnityEngine;

namespace AstroShift.UI
{
    public class GameHUD : MonoBehaviour
    {
        private GUIStyle titleStyle;
        private GUIStyle labelStyle;
        private GUIStyle badgeStyle;
        private GUIStyle boxStyle;
        private GUIStyle combatStyle;
        private GUIStyle alertStyle;
        private bool stylesInitialized = false;

        void InitStyles()
        {
            if (stylesInitialized) return;

            titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 14,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0f, 0.95f, 1f) }
            };

            labelStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 12,
                normal = { textColor = new Color(0.85f, 0.9f, 0.95f) }
            };

            badgeStyle = new GUIStyle(GUI.skin.box)
            {
                fontSize = 11,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(0f, 1f, 0.6f) }
            };

            combatStyle = new GUIStyle(GUI.skin.box)
            {
                fontSize = 11,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(1f, 0.35f, 0.1f) }
            };

            alertStyle = new GUIStyle(GUI.skin.box)
            {
                fontSize = 11,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(1f, 0.1f, 0.2f) }
            };

            boxStyle = new GUIStyle(GUI.skin.box);
            stylesInitialized = true;
        }

        void OnGUI()
        {
            InitStyles();

            Player.PlayerController player = Player.PlayerController.Instance;
            if (player == null) return;

            // 1. STARSHIP TELEMETRY HUD (When inside Starship)
            if (player.inStarship)
            {
                Space.StarshipController ship = Object.FindAnyObjectByType<Space.StarshipController>();
                if (ship != null)
                {
                    DrawStarshipHUD(ship);
                }
                return;
            }

            // 2. SUPERCAR / TESLA COCKPIT HUD (When inside Vehicle)
            if (player.inVehicle)
            {
                Vehicles.SupercarController car = Object.FindAnyObjectByType<Vehicles.SupercarController>();
                if (car != null)
                {
                    DrawCarHUD(car);
                }
                return;
            }

            // 3. ON-FOOT TACTICAL HUD
            DrawOnFootHUD(player);

            // 4. TOP-LEFT LIVE GPS MINIMAP
            DrawMinimap(player.transform);
        }

        void DrawStarshipHUD(Space.StarshipController ship)
        {
            float width = 340f;
            float height = 280f;
            Rect hudRect = new Rect(Screen.width - width - 20, 20, width, height);
            GUI.Box(hudRect, "", boxStyle);

            GUILayout.BeginArea(hudRect);
            GUILayout.Space(8);
            GUILayout.Label("[STARSHIP] RAPTOR FLIGHT TELEMETRY", titleStyle);
            GUILayout.Space(4);

            float mach = (ship.currentVelocity / 14f);
            GUILayout.Label($"VELOCITY: MACH {mach:F1} ({ship.currentVelocity * 3.6f:F0} KM/H)", labelStyle);
            GUILayout.Label($"ALTITUDE: {ship.altitude:F1} M ({(ship.altitude / 1000f):F2} KM)", labelStyle);
            GUILayout.Label($"RAPTOR THROTTLE: {ship.throttle:F0}%", labelStyle);

            // Shields & Weapons
            var shield = ship.GetComponent<Combat.VehicleShieldSystem>();
            if (shield != null)
            {
                GUILayout.Label($"DEFLECTOR SHIELDS: {shield.currentShield:F0} / {shield.maxShield:F0} HP", labelStyle);
            }

            var blaster = ship.GetComponent<Combat.LaserBlasterSystem>();
            if (blaster != null)
            {
                string weaponStatus = blaster.isOverheated ? "[OVERHEATED - COOLING DOWNS]" : $"PLASMA HEAT: {blaster.currentHeat:F0}%";
                GUILayout.Label(weaponStatus, blaster.isOverheated ? alertStyle : combatStyle);
            }

            string camMode = (ship.bridgeController != null && ship.bridgeController.isOutsideRealmView)
                ? "3P OUTSIDE SPACE REALM"
                : "1P INSIDE COMMAND BRIDGE";
            GUILayout.Label($"CAMERA VIEW: {camMode}", badgeStyle);

            GUILayout.Space(4);
            GUILayout.Label("[W/S] Throttle | [A/D] Roll | [MOUSE] Pitch/Yaw", labelStyle);
            GUILayout.Label("[F/CLICK] Fire Plasma | [TAB] Cycle Lock", labelStyle);
            GUILayout.Label("[SPACE] Booster | [P] Warp | [B] Exit", labelStyle);

            if (GUILayout.Button("[BRIDGE] TOGGLE INSIDE BRIDGE / OUTSIDE REALM [V/C]"))
            {
                if (ship.bridgeController != null) ship.bridgeController.ToggleViewMode();
            }

            GUILayout.EndArea();
        }

        void DrawCarHUD(Vehicles.SupercarController car)
        {
            float width = 340f;
            float height = 210f;
            Rect hudRect = new Rect(Screen.width / 2f - width / 2f, Screen.height - height - 20, width, height);
            GUI.Box(hudRect, "", boxStyle);

            GUILayout.BeginArea(hudRect);
            GUILayout.Space(6);
            GUILayout.Label($"[CYBER-GT] {car.carName.ToUpper()}", titleStyle);

            float speedKmh = Mathf.Abs(car.currentSpeed) * 3.6f;
            GUILayout.Label($"SPEED: {speedKmh:F0} KM/H ({(speedKmh * 0.621371f):F0} MPH)", labelStyle);
            GUILayout.Label($"NITRO: {car.nitro:F0}% {(car.isBoosting ? "[NITRO ACTIVE!]" : "")}", labelStyle);

            var shield = car.GetComponent<Combat.VehicleShieldSystem>();
            if (shield != null)
            {
                GUILayout.Label($"SHIELD: {shield.currentShield:F0}/{shield.maxShield:F0} | ARMOR: {shield.currentArmor:F0}/{shield.maxArmor:F0}", labelStyle);
            }

            var blaster = car.GetComponent<Combat.LaserBlasterSystem>();
            if (blaster != null)
            {
                string weaponStatus = blaster.isOverheated ? "[BLASTER OVERHEATED]" : $"HEAT: {blaster.currentHeat:F0}% [F/CLICK]";
                GUILayout.Label(weaponStatus, blaster.isOverheated ? alertStyle : combatStyle);
            }

            if (car.isTesla && car.teslaFlight != null)
            {
                string flightStatus = car.teslaFlight.isFlying ? "AERO-GRAVITY FLIGHT ACTIVE [X]" : "ROAD DRIVE MODE [X]";
                GUILayout.Label(flightStatus, badgeStyle);
            }

            GUILayout.Label("[W/S] Drive | [A/D] Steer | [F] Fire Plasma | [TAB] Lock", labelStyle);
            GUILayout.EndArea();
        }

        void DrawOnFootHUD(Player.PlayerController player)
        {
            float width = 280f;
            float height = 135f;
            Rect hudRect = new Rect(20, Screen.height - height - 20, width, height);
            GUI.Box(hudRect, "", boxStyle);

            GUILayout.BeginArea(hudRect);
            GUILayout.Space(6);
            GUILayout.Label("[OPERATIVE] CYBERNETIC OPERATIVE", titleStyle);
            GUILayout.Label($"JETPACK FUEL: {player.jetpackFuel:F0}%", labelStyle);
            GUILayout.Label($"PERSPECTIVE: {(player.isFirstPerson ? "1P FIRST PERSON" : "3P THIRD PERSON")} [V]", badgeStyle);
            GUILayout.Label("[WASD] Move | [SHIFT] Sprint | [C] Slide | [SPACE] Jetpack", labelStyle);
            GUILayout.EndArea();
        }

        void DrawMinimap(Transform target)
        {
            float mapSize = 130f;
            Rect mapRect = new Rect(20, 20, mapSize, mapSize);
            GUI.Box(mapRect, "[GPS] RADAR", boxStyle);

            Vector2 center = new Vector2(mapRect.x + mapSize / 2f, mapRect.y + mapSize / 2f);
            GUI.Label(new Rect(center.x - 12, center.y - 12, 24, 24), "^", titleStyle);
            GUI.Label(new Rect(mapRect.x + 8, mapRect.yMax - 22, 115, 20), $"X:{target.position.x:F0} Z:{target.position.z:F0}", labelStyle);
        }
    }
}
