using UnityEngine;

namespace AstroShift.Environment
{
    public class ProceduralWorldBuilder : MonoBehaviour
    {
        public bool buildOnStart = true;

        void Awake()
        {
            if (buildOnStart && transform.childCount == 0)
            {
                BuildCompleteWorld();
            }
        }

        [ContextMenu("Build World Now")]
        public void BuildCompleteWorld()
        {
            Debug.Log("[AstroShift] Building Complete Metropolis & Space Realm...");

            // 1. Master Ground & City Grid
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Metropolis_Ground";
            ground.transform.parent = transform;
            ground.transform.position = Vector3.zero;
            ground.transform.localScale = new Vector3(80f, 1f, 80f);
            var gRenderer = ground.GetComponent<MeshRenderer>();
            gRenderer.material.color = new Color(0.08f, 0.11f, 0.16f);

            // 2. Skyscrapers Grid (Optimized with GPU Instancing & Static Batching)
            GameObject cityGroup = new GameObject("Skyscrapers_District");
            cityGroup.transform.parent = transform;

            Material towerMatA = new Material(Shader.Find("Standard"));
            towerMatA.color = new Color(0.06f, 0.12f, 0.22f);
            towerMatA.enableInstancing = true;

            Material towerMatB = new Material(Shader.Find("Standard"));
            towerMatB.color = new Color(0.12f, 0.15f, 0.24f);
            towerMatB.enableInstancing = true;

            for (int x = -4; x <= 4; x++)
            {
                for (int z = -4; z <= 4; z++)
                {
                    if (Mathf.Abs(x) <= 1 && Mathf.Abs(z) <= 1) continue; // Clear central plaza / launch corridor

                    float bWidth = Random.Range(18f, 32f);
                    float bDepth = Random.Range(18f, 32f);
                    float bHeight = Random.Range(45f, 130f);

                    GameObject b = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    b.name = $"Tower_{x}_{z}";
                    b.transform.parent = cityGroup.transform;
                    b.transform.position = new Vector3(x * 55f, bHeight / 2f, z * 55f);
                    b.transform.localScale = new Vector3(bWidth, bHeight, bDepth);

                    b.isStatic = true;
                    var bRenderer = b.GetComponent<MeshRenderer>();
                    bRenderer.sharedMaterial = (x + z) % 2 == 0 ? towerMatA : towerMatB;
                }
            }

            // 3. Launchpad & Mechazilla Tower
            GameObject launchpad = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            launchpad.name = "Mechazilla_Launchpad";
            launchpad.transform.parent = transform;
            launchpad.transform.position = new Vector3(0, 1f, 80f);
            launchpad.transform.localScale = new Vector3(28f, 2f, 28f);
            launchpad.GetComponent<MeshRenderer>().material.color = new Color(0.18f, 0.22f, 0.28f);

            GameObject tower = GameObject.CreatePrimitive(PrimitiveType.Cube);
            tower.name = "Mechazilla_Catch_Tower";
            tower.transform.parent = transform;
            tower.transform.position = new Vector3(-22f, 75f, 80f);
            tower.transform.localScale = new Vector3(8f, 150f, 8f);
            tower.GetComponent<MeshRenderer>().material.color = new Color(0.24f, 0.28f, 0.35f);

            // 4. SpaceX Starship Rocket Stack
            BuildStarship(new Vector3(0, 2f, 80f));

            // 5. Tesla Roadster Supercar
            BuildTeslaSupercar(new Vector3(12f, 1f, 25f));

            // 6. Deep Space Realm & Celestial Bodies
            BuildDeepSpaceRealm();

            // 7. Player Character & HUD
            BuildPlayer(new Vector3(0, 2f, 15f));

            // 8. Airspace Combat Target Sentry Drones
            BuildTargetSentryDrones();

            // 9. Procedural Audio Synthesizer Engine
            if (Object.FindAnyObjectByType<Audio.ProceduralAudioSynth>() == null)
            {
                GameObject audioRoot = new GameObject("Procedural_Audio_Synth_Engine");
                audioRoot.transform.parent = transform;
                audioRoot.AddComponent<Audio.ProceduralAudioSynth>();
            }

            // 10. Autonomous Metropolis Cyber Traffic System
            GameObject trafficRoot = new GameObject("Autonomous_Cyber_Traffic_System");
            trafficRoot.transform.parent = transform;
            trafficRoot.AddComponent<ProceduralTrafficSystem>();

            // 11. Celestial 24-Hour Day/Night Lighting Cycle
            GameObject celestialCycle = new GameObject("Celestial_DayNight_Cycle");
            celestialCycle.transform.parent = transform;
            celestialCycle.AddComponent<CelestialDayNightCycle>();

            Debug.Log("[AstroShift] Complete World Built Successfully!");
        }

        void BuildTargetSentryDrones()
        {
            GameObject droneGroup = new GameObject("Combat_Sentry_Drones_Sector");
            droneGroup.transform.parent = transform;

            Vector3[] dronePositions = new Vector3[]
            {
                new Vector3(25f, 16f, 45f),
                new Vector3(-35f, 22f, 60f),
                new Vector3(65f, 28f, -40f),
                new Vector3(-50f, 18f, -70f),
                new Vector3(0f, 35f, 120f),
                new Vector3(-80f, 25f, 30f)
            };

            Material droneMat = new Material(Shader.Find("Standard"));
            droneMat.color = new Color(0.2f, 0.25f, 0.35f);
            droneMat.EnableKeyword("_EMISSION");
            droneMat.SetColor("_EmissionColor", new Color(1f, 0.1f, 0.2f) * 0.8f);

            for (int i = 0; i < dronePositions.Length; i++)
            {
                GameObject d = new GameObject($"SentryDrone_{i + 1}");
                d.transform.parent = droneGroup.transform;
                d.transform.position = dronePositions[i];

                // Central Hull
                GameObject hull = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                hull.transform.parent = d.transform;
                hull.transform.localPosition = Vector3.zero;
                hull.transform.localScale = new Vector3(1.8f, 0.7f, 1.8f);
                hull.GetComponent<MeshRenderer>().sharedMaterial = droneMat;

                // Glowing Optic Eye
                GameObject eye = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                eye.transform.parent = d.transform;
                eye.transform.localPosition = new Vector3(0f, 0f, 0.9f);
                eye.transform.localScale = Vector3.one * 0.45f;
                var eyeR = eye.GetComponent<MeshRenderer>();
                Material eyeMat = new Material(Shader.Find("Standard"));
                eyeMat.color = Color.red;
                eyeMat.EnableKeyword("_EMISSION");
                eyeMat.SetColor("_EmissionColor", Color.red * 3f);
                eyeR.material = eyeMat;

                // Rotor Pods
                for (int r = 0; r < 4; r++)
                {
                    float ang = r * 90f * Mathf.Deg2Rad;
                    GameObject pod = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    pod.transform.parent = d.transform;
                    pod.transform.localPosition = new Vector3(Mathf.Cos(ang) * 1.5f, 0.1f, Mathf.Sin(ang) * 1.5f);
                    pod.transform.localScale = new Vector3(0.5f, 0.1f, 0.5f);
                    pod.GetComponent<MeshRenderer>().sharedMaterial = droneMat;
                }

                d.AddComponent<TargetDrone>();
            }
        }

        void BuildStarship(Vector3 padPos)
        {
            GameObject shipRoot = new GameObject("SpaceX_Starship_Stack");
            shipRoot.transform.parent = transform;
            shipRoot.transform.position = padPos;

            var shipCtrl = shipRoot.AddComponent<Space.StarshipController>();

            // Combat & Shields
            var blaster = shipRoot.AddComponent<Combat.LaserBlasterSystem>();
            blaster.damage = 75f;
            blaster.laserColor = new Color(0f, 0.95f, 1f);
            var shield = shipRoot.AddComponent<Combat.VehicleShieldSystem>();
            shield.maxShield = 300f;
            shield.currentShield = 300f;
            shield.maxArmor = 500f;
            shield.currentArmor = 500f;
            shipRoot.AddComponent<Combat.TargetingComputer>();

            // Super Heavy Booster (Stage 1)
            GameObject booster = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            booster.name = "SuperHeavy_Booster";
            booster.transform.parent = shipRoot.transform;
            booster.transform.localPosition = new Vector3(0, 35f, 0);
            booster.transform.localScale = new Vector3(9f, 35f, 9f);
            booster.GetComponent<MeshRenderer>().material.color = new Color(0.85f, 0.88f, 0.92f);
            shipCtrl.superHeavyBooster = booster;

            // Starship Upper Stage (Stage 2)
            GameObject starshipUpper = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            starshipUpper.name = "Starship_Orbital_Ship";
            starshipUpper.transform.parent = shipRoot.transform;
            starshipUpper.transform.localPosition = new Vector3(0, 95f, 0);
            starshipUpper.transform.localScale = new Vector3(9f, 25f, 9f);
            starshipUpper.GetComponent<MeshRenderer>().material.color = new Color(0.92f, 0.94f, 0.98f);

            // Nosecone (Opaque exterior mesh)
            GameObject nose = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            nose.name = "Starship_Nosecone";
            nose.transform.parent = starshipUpper.transform;
            nose.transform.localPosition = new Vector3(0, 1.2f, 0);
            nose.transform.localScale = new Vector3(1f, 1.8f, 1f);
            nose.GetComponent<MeshRenderer>().material.color = new Color(0.92f, 0.94f, 0.98f);

            // Forward Panoramic Viewport Band
            GameObject viewportBand = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            viewportBand.name = "Forward_Observation_Viewport";
            viewportBand.transform.parent = nose.transform;
            viewportBand.transform.localPosition = new Vector3(0, -0.1f, 0.25f);
            viewportBand.transform.localScale = new Vector3(0.98f, 0.22f, 0.98f);
            var vpMat = viewportBand.GetComponent<MeshRenderer>().material;
            vpMat.color = new Color(0f, 0.85f, 1f, 0.45f);

            // Command Bridge Interior Group
            GameObject bridgeGroup = new GameObject("Starship_Command_Bridge");
            bridgeGroup.transform.parent = starshipUpper.transform;
            bridgeGroup.transform.localPosition = new Vector3(0, 0.65f, 0);

            var bridgeCtrl = shipRoot.AddComponent<Space.CommandBridgeController>();
            bridgeCtrl.exteriorOpaqueNosecone = nose;
            bridgeCtrl.interiorBridgeCabinGroup = bridgeGroup;
            shipCtrl.bridgeController = bridgeCtrl;

            // Bridge Floor Deck
            GameObject bFloor = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            bFloor.name = "Bridge_Deck_Floor";
            bFloor.transform.parent = bridgeGroup.transform;
            bFloor.transform.localPosition = Vector3.zero;
            bFloor.transform.localScale = new Vector3(8.5f, 0.2f, 8.5f);
            bFloor.GetComponent<MeshRenderer>().material.color = new Color(0.06f, 0.08f, 0.12f);

            // 5 MFD Avionics Displays
            for (int m = -2; m <= 2; m++)
            {
                GameObject mfd = GameObject.CreatePrimitive(PrimitiveType.Quad);
                mfd.name = $"MFD_Display_{m + 2}";
                mfd.transform.parent = bridgeGroup.transform;
                mfd.transform.localPosition = new Vector3(m * 1.6f, 1.4f, 3.2f - Mathf.Abs(m) * 0.2f);
                mfd.transform.localRotation = Quaternion.Euler(-18f, m * 12f, 0);
                mfd.transform.localScale = new Vector3(1.3f, 0.75f, 1f);
                var mMat = mfd.GetComponent<MeshRenderer>().material;
                mMat.color = (m == 0) ? new Color(0f, 0.95f, 1f) : ((m % 2 == 0) ? new Color(0f, 1f, 0.5f) : new Color(1f, 0.7f, 0f));
            }

            // Central Holographic Solar System Orrey Table
            GameObject holoTable = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            holoTable.name = "Holographic_Orrey_Pedestal";
            holoTable.transform.parent = bridgeGroup.transform;
            holoTable.transform.localPosition = new Vector3(0, 0.5f, 0.8f);
            holoTable.transform.localScale = new Vector3(1.4f, 0.5f, 1.4f);
            holoTable.GetComponent<MeshRenderer>().material.color = new Color(0.12f, 0.18f, 0.26f);

            GameObject orreyRoot = new GameObject("HoloOrrey_Projector");
            orreyRoot.transform.parent = holoTable.transform;
            orreyRoot.transform.localPosition = new Vector3(0, 1.2f, 0);
            var orrey = orreyRoot.AddComponent<Space.HolographicOrrey>();
            bridgeCtrl.holographicOrrey = orrey;

            GameObject holoSun = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            holoSun.name = "Holo_Sun";
            holoSun.transform.parent = orreyRoot.transform;
            holoSun.transform.localPosition = Vector3.zero;
            holoSun.transform.localScale = Vector3.one * 0.35f;
            holoSun.GetComponent<MeshRenderer>().material.color = new Color(1f, 0.85f, 0f);

            // Co-Pilot Astronaut Figure
            GameObject coPilot = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            coPilot.name = "Astronaut_CoPilot";
            coPilot.transform.parent = bridgeGroup.transform;
            coPilot.transform.localPosition = new Vector3(1.4f, 1.1f, 1.2f);
            coPilot.transform.localScale = new Vector3(0.6f, 0.7f, 0.6f);
            coPilot.GetComponent<MeshRenderer>().material.color = new Color(0.95f, 0.95f, 0.98f);

            // 1P Bridge Eyepoint Pivot
            GameObject eyePivot = new GameObject("Bridge_1P_Camera_Pivot");
            eyePivot.transform.parent = bridgeGroup.transform;
            eyePivot.transform.localPosition = new Vector3(-1.1f, 1.75f, 1.1f);
            bridgeCtrl.bridgeFirstPersonPivot = eyePivot.transform;

            // Cockpit Cyan Light
            GameObject cLight = new GameObject("Bridge_Cyan_Light");
            cLight.transform.parent = bridgeGroup.transform;
            cLight.transform.localPosition = new Vector3(0, 2.5f, 0.8f);
            var lComp = cLight.AddComponent<Light>();
            lComp.type = LightType.Point;
            lComp.color = new Color(0f, 0.95f, 1f);
            lComp.range = 14f;
            lComp.intensity = 2.2f;
            bridgeCtrl.cabinCyanLight = lComp;
        }

        void BuildTeslaSupercar(Vector3 spawnPos)
        {
            GameObject car = new GameObject("Tesla_Roadster_CyberGT");
            car.transform.parent = transform;
            car.transform.position = spawnPos;

            var supercar = car.AddComponent<Vehicles.SupercarController>();
            var flight = car.AddComponent<Vehicles.TeslaFlightController>();
            supercar.teslaFlight = flight;

            // Combat & Shields
            var blaster = car.AddComponent<Combat.LaserBlasterSystem>();
            blaster.damage = 35f;
            blaster.laserColor = new Color(1f, 0.2f, 0.15f);
            var shield = car.AddComponent<Combat.VehicleShieldSystem>();
            shield.maxShield = 150f;
            shield.currentShield = 150f;
            shield.maxArmor = 200f;
            shield.currentArmor = 200f;
            car.AddComponent<Combat.TargetingComputer>();

            // Chassis
            GameObject chassis = GameObject.CreatePrimitive(PrimitiveType.Cube);
            chassis.name = "Chassis";
            chassis.transform.parent = car.transform;
            chassis.transform.localPosition = new Vector3(0, 0.5f, 0);
            chassis.transform.localScale = new Vector3(2.1f, 0.65f, 4.4f);
            var cMat = chassis.GetComponent<MeshRenderer>().material;
            cMat.color = new Color(0.85f, 0.05f, 0.15f); // Deep Crimson Red

            // Cockpit Cabin & Windshield
            GameObject cabin = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cabin.name = "Glass_Cockpit";
            cabin.transform.parent = car.transform;
            cabin.transform.localPosition = new Vector3(0, 1.05f, -0.2f);
            cabin.transform.localScale = new Vector3(1.75f, 0.55f, 2.1f);
            var cabMat = cabin.GetComponent<MeshRenderer>().material;
            cabMat.color = new Color(0f, 0.8f, 1f, 0.45f);

            // Cockpit Camera Pivot
            GameObject cockCam = new GameObject("Cockpit_Cam_Pivot");
            cockCam.transform.parent = car.transform;
            cockCam.transform.localPosition = new Vector3(-0.4f, 1.15f, 0.1f);
            supercar.cockpitCamPivot = cockCam.transform;

            // Chase Camera Pivot
            GameObject chaseCam = new GameObject("Chase_Cam_Pivot");
            chaseCam.transform.parent = car.transform;
            chaseCam.transform.localPosition = new Vector3(0f, 2.6f, -6.8f);
            supercar.chaseCamPivot = chaseCam.transform;

            // Seated Driver Avatar
            GameObject driver = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            driver.name = "Seated_Driver";
            driver.transform.parent = car.transform;
            driver.transform.localPosition = new Vector3(-0.4f, 0.85f, -0.1f);
            driver.transform.localScale = new Vector3(0.5f, 0.45f, 0.5f);
            driver.GetComponent<MeshRenderer>().material.color = new Color(0.12f, 0.16f, 0.22f);
            supercar.seatedDriverAvatar = driver.transform;

            // Wheels
            Vector3[] wheelOffsets = new Vector3[]
            {
                new Vector3(-1.15f, 0.35f, 1.4f),
                new Vector3(1.15f, 0.35f, 1.4f),
                new Vector3(-1.15f, 0.35f, -1.4f),
                new Vector3(1.15f, 0.35f, -1.4f)
            };
            foreach (var off in wheelOffsets)
            {
                GameObject wheel = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                wheel.transform.parent = car.transform;
                wheel.transform.localPosition = off;
                wheel.transform.localRotation = Quaternion.Euler(0, 0, 90f);
                wheel.transform.localScale = new Vector3(0.7f, 0.25f, 0.7f);
                wheel.GetComponent<MeshRenderer>().material.color = new Color(0.04f, 0.04f, 0.04f);
            }
        }

        void BuildDeepSpaceRealm()
        {
            GameObject spaceRoot = new GameObject("Deep_Space_Realm");
            spaceRoot.transform.parent = transform;
            spaceRoot.transform.position = new Vector3(0, 450f, 0);

            var realm = spaceRoot.AddComponent<CelestialRealm>();

            // Earth Sphere
            GameObject earth = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            earth.name = "Distant_Earth";
            earth.transform.parent = spaceRoot.transform;
            earth.transform.localPosition = new Vector3(650f, 250f, -800f);
            earth.transform.localScale = Vector3.one * 160f;
            earth.GetComponent<MeshRenderer>().material.color = new Color(0.1f, 0.45f, 0.95f);
            realm.earthSphere = earth.transform;

            // Mars Sphere
            GameObject mars = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            mars.name = "Distant_Mars";
            mars.transform.parent = spaceRoot.transform;
            mars.transform.localPosition = new Vector3(-680f, 320f, -850f);
            mars.transform.localScale = Vector3.one * 95f;
            mars.GetComponent<MeshRenderer>().material.color = new Color(0.85f, 0.28f, 0.12f);
            realm.marsSphere = mars.transform;

            // Ringed Gas Giant Chronos Prime
            GameObject chronos = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            chronos.name = "Chronos_Ringed_Gas_Giant";
            chronos.transform.parent = spaceRoot.transform;
            chronos.transform.localPosition = new Vector3(120f, 380f, -950f);
            chronos.transform.localScale = Vector3.one * 130f;
            chronos.GetComponent<MeshRenderer>().material.color = new Color(0.95f, 0.75f, 0.35f);
            realm.chronosRingedGiant = chronos.transform;

            // Planetary Rings
            GameObject rings = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            rings.name = "Chronos_Planetary_Rings";
            rings.transform.parent = chronos.transform;
            rings.transform.localPosition = Vector3.zero;
            rings.transform.localScale = new Vector3(2.4f, 0.02f, 2.4f);
            rings.GetComponent<MeshRenderer>().material.color = new Color(0.85f, 0.65f, 0.25f);

            // International Orbital Space Station
            GameObject station = new GameObject("Orbital_Space_Station_Gateway");
            station.transform.parent = spaceRoot.transform;
            station.transform.localPosition = new Vector3(0, 110f, -120f);

            var stCtrl = station.AddComponent<OrbitalSpaceStation>();

            GameObject stHub = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            stHub.name = "Station_Core_Spine";
            stHub.transform.parent = station.transform;
            stHub.transform.localScale = new Vector3(8f, 35f, 8f);
            stHub.transform.localRotation = Quaternion.Euler(90f, 0, 0);

            // Centrifuge Habitation Ring
            GameObject habRing = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            habRing.name = "Centrifuge_Habitation_Ring";
            habRing.transform.parent = station.transform;
            habRing.transform.localScale = new Vector3(32f, 2.5f, 32f);
            habRing.transform.localRotation = Quaternion.Euler(90f, 0, 0);
            stCtrl.habitationRing = habRing.transform;
        }

        void BuildPlayer(Vector3 spawnPos)
        {
            GameObject player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = "Cyber_Operative_Player";
            player.transform.parent = transform;
            player.transform.position = spawnPos;

            // First-person eye anchor & third-person pivot
            GameObject fpAnchor = new GameObject("FP_Eye_Anchor");
            fpAnchor.transform.parent = player.transform;
            fpAnchor.transform.localPosition = new Vector3(0f, 1.65f, 0.1f);

            GameObject tpPivot = new GameObject("TP_Camera_Pivot");
            tpPivot.transform.parent = player.transform;
            tpPivot.transform.localPosition = new Vector3(0f, 1.45f, 0f);

            Camera mainCam = Camera.main;
            if (mainCam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                mainCam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
                camObj.AddComponent<AudioListener>();
            }

            var followCam = mainCam.GetComponent<Vehicles.CinematicFollowCamera>();
            if (followCam == null)
            {
                followCam = mainCam.gameObject.AddComponent<Vehicles.CinematicFollowCamera>();
            }

            var pCtrl = player.AddComponent<Player.PlayerController>();
            pCtrl.thirdPersonModel = player;
            pCtrl.firstPersonAnchor = fpAnchor.transform;
            pCtrl.thirdPersonPivot = tpPivot.transform;
            pCtrl.playerCamera = mainCam;

            followCam.SetTarget(player.transform, null, fpAnchor.transform);
            followCam.SetProfile(Vehicles.CinematicFollowCamera.CameraProfile.Player);

            // Attach HUD & Mobile Touch Controls
            player.AddComponent<UI.GameHUD>();
            player.AddComponent<UI.MobileTouchControls>();
        }
    }
}
