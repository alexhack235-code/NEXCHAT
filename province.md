# All Province Realms: Realism and Performance Plan

This plan applies to **every province and territory realm**, not just one pilot location. Make shared improvements consistently across all 14 realm pages, while preserving each location's own recognizable landscape and landmark.

## Realms in Scope

- [British Columbia](./province-british-columbia.html)
- [Alberta](./province-alberta.html)
- [Saskatchewan](./province-saskatchewan.html)
- [Manitoba](./province-manitoba.html)
- [Ontario](./province-ontario.html)
- [Quebec](./province-quebec.html)
- [New Brunswick](./province-new-brunswick.html)
- [Nova Scotia](./province-nova-scotia.html)
- [Prince Edward Island](./province-prince-edward-island.html)
- [Newfoundland and Labrador](./province-newfoundland.html)

- [Yukon](./province-yukon.html)
- [Northwest Territories](./province-northwest-territories.html)
- [Nunavut](./province-nunavut.html)
- [National Capital Region](./province-national-capital.html)

## Changes to Apply Across All Realms

1. **Replace primitive placeholder scenery.** Upgrade the most visible buildings, vehicles, trees, terrain, and landmarks from basic boxes, cones, and cylinders to optimized GLB/glTF assets. Reuse shared models where appropriate, but vary placement and materials so environments do not feel copied.
2. **Use believable scale and composition.** Give roads, vehicles, buildings, trees, mountains, and shorelines more natural proportions. Avoid empty flat ground with a few isolated props; use layered foreground, midground, and background scenery.
3. **Improve materials and lighting.** Distinguish concrete, asphalt, glass, water, snow, vegetation, and metal through appropriate textures and roughness. Use consistent daylight or a deliberate time-of-day palette, with softer ambient lighting.
4. **Keep neon as an accent.** Retain the cyberpunk identity in HUDs, signs, and selected effects, but use more natural colors for ordinary scenery so the whole world does not look toy-like.
5. **Improve avatars and animation.** Use proportioned, rigged character models with idle, walk, and run animations. Ensure other players' visible avatars use the same standard; a first-person camera alone does not solve the appearance of multiplayer characters.
6. **Ground movement in the world.** Add collision with terrain and major objects. Tune walking, sprinting, jumping, and vehicle speeds to believable world scale, and connect character animation to movement.
7. **Protect low-end performance.** Use compressed models and textures, reuse geometry and materials, avoid excessive real-time lights and shadows, and set pixel ratio and detail according to device capability. Provide Low, Medium, and High quality options with a usable low-end default.
8. **Give each realm meaningful exploration.** Provide at least one recognizable landmark and a meaningful activity or interaction in every realm, rather than relying only on token collection.
9. **Test every realm.** Check all 14 pages for loading failures, visual consistency, movement/collision issues, and acceptable performance on a low-end phone. Do not consider the plan complete after improving only one realm.

## Preserve Each Realm's Identity

Shared improvements should not make the provinces interchangeable. Keep the main environment and landmark specific to each realm:

| Realm | Preserve or emphasize |
| --- | --- |
| British Columbia | Pacific coastline, temperate rainforest, mountain backdrop, and coastal city/bridge |
| Alberta | Rocky Mountains, foothills, prairie transition, and a recognizable city landmark |
| Saskatchewan | Open prairie, farmland, big skies, and prairie-town details |
| Manitoba | Prairie meeting boreal forest, lakes, and Winnipeg-area identity |
| Ontario | Great Lakes shoreline, Toronto skyline/CN Tower, and highway corridor |
| Quebec | St. Lawrence River, distinct historic urban architecture, and regional landscape |
| New Brunswick | Appalachian forest, Bay of Fundy coastline, and dramatic tides |
| Nova Scotia | Atlantic shoreline, working harbour, and coastal highlands |
| Prince Edward Island | Red-sand coast, rolling farmland, and Confederation Bridge |
| Newfoundland and Labrador | Rugged Atlantic cliffs, fishing communities, and iceberg/rocky northern scenery |
| Yukon | Vast mountain wilderness, boreal forest, and gold-rush heritage |
| Northwest Territories | Subarctic terrain, Great Slave Lake, tundra, and aurora |
| Nunavut | Arctic tundra, rocky coast, Inuit community context, and polar light |
| National Capital Region | Ottawa River, Parliament precinct, Rideau Canal, and civic architecture |

## Free Asset Sources

- [Poly Haven](https://polyhaven.com/) — CC0 models, materials, and HDRIs.
- [Kenney](https://kenney.nl/assets) — CC0 game assets; choose packs that match the intended visual style.
- [Quaternius](https://quaternius.com/) — game-ready assets under the Quaternius Asset License.
- [Mixamo](https://www.mixamo.com/) — rigged characters and animations; review Adobe's current terms.
- [Sketchfab](https://sketchfab.com/) — licenses vary by asset; verify each model's permissions and attribution requirements.

Prefer optimized GLB/glTF assets when suitable. Track each asset's source and license, and do not redistribute asset files as standalone content unless the license permits it.

## Rollout and Completion Criteria

Apply the work in shared passes across all 14 realms: first avatars and movement, then terrain/landmarks/vehicles, then lighting/materials, then performance tuning. One realm can be used to validate a shared technique, but it is **not** the finished scope; carry the approved changes through every realm and tailor its scenery to the identity table above.

The work is complete only when every realm has a coherent visual style, an improved player/vehicle/landmark presentation, working interactions and collisions, a low-end quality path, and has been checked on a low-end device.

## Completion Status (14 of 14 Realms Complete)

All 14 Canadian provinces and territories have been fully upgraded and verified to meet all realism, performance, and gameplay standards:

| Realm | Signature Landmark | Vehicle | Missions & Objectives | PBR & Lighting Theme |
| --- | --- | --- | --- | --- |
| **Ontario** | CN Tower (with rideable glass elevator to 350m SkyPod), Lake Ontario wave vertex shaders, Rogers Centre | OPP Cyber Cruiser (`cyber_car.glb`) | 1. 401 Corridor Speed Trial<br>2. SkyPod Elevator Transit<br>3. Tech Core Synchronization | Asphalt PBR (`Road007`), Great Lakes water shader, golden dusk lighting |
| **British Columbia** | Lions Gate suspension bridge, Burrard Inlet ocean waves, North Shore snow peaks | Cascadia Patrol Cruiser (`cyber_car.glb`) | 1. Lions Gate Bridge Transit<br>2. Whistler Mountain Waypoint<br>3. Pacific Seaplane Uplink | Rain-slicked asphalt PBR, dynamic inlet waves, coastal emerald lighting |
| **Alberta** | Calgary Stampede Saddledome, Calgary Tower Olympic flame torch, Rocky Mountains wall | Heavy Hauler Cruiser (`cyber_car.glb`) | 1. Stampede Trail Highway<br>2. Calgary Tower Torch Sync<br>3. Energy Grid Uplink | PBR road, mountain foothill fog, prairie sunset amber lighting |
| **Saskatchewan** | Wascana Legislative Dome, grain elevator complexes, rotating wind turbines, solar array fields | Prairie Rover Cruiser (`cyber_car.glb`) | 1. Yellowhead Highway Sprint<br>2. Legislative Dome Sync<br>3. Potash Terminal Uplink | Living skies gradient, solar field reflections, golden prairie daylight |
| **Manitoba** | Esplanade Riel cable-stayed bridge, Canadian Museum for Human Rights spire, Red River frozen ice shelf | Boreal Patrol Cruiser (`cyber_car.glb`) | 1. Red River Ice Crossing<br>2. Esplanade Riel Bridge Link<br>3. Rights Spire Resonator | Ice blue reflection, winter tundra fog, boreal turquoise lighting |
| **Quebec** | Château Frontenac citadel with sovereign cross beacon, St. Lawrence River waterway, Hydro-Québec terminal | Sûreté du Québec Cruiser (`cyber_car.glb`) | 1. Champlain Corridor Transit<br>2. Frontenac Citadel Spire Sync<br>3. Hydro-Grid Uplink | Historic slate stone PBR, St. Lawrence water shimmer, royal azure lighting |
| **New Brunswick** | Hopewell Rocks flowerpot sea stacks, Bay of Fundy tidal water surge, tidal energy terminal | Fundy Cyber Cruiser (`cyber_car.glb`) | 1. Fundy Coastal Highway<br>2. Hopewell Sea Stack Sync<br>3. Tidal Energy Matrix Link | Red sandstone shoreline, tidal surge animation, maritime ocean blue |
| **Nova Scotia** | Halifax Star Citadel fortress, Peggy's Cove rotating lighthouse beacon, Bluenose schooner moored in harbour | Bluenose Patrol Cruiser (`cyber_car.glb`) | 1. Lighthouse Route Speed Run<br>2. Peggy's Cove Beacon Sync<br>3. Citadel Fortress Array Link | Deep Atlantic fog, lighthouse rotation beam, navy ocean lighting |
| **Prince Edward Island** | Confederation Bridge 13km causeway piers, red sandstone coastal dunes, green rolling farmland, wind turbines | Island Roadster Cruiser (`cyber_car.glb`) | 1. Confederation Bridge Transit<br>2. Red Sand Dunes Waypoint<br>3. Causeway Core Link | Red clay sand PBR, rolling green dunes, vibrant gulf sunlight |
| **Newfoundland & Labrador** | Signal Hill Cabot Tower, Marconi transatlantic wireless radio waves, Iceberg Alley floating bergs | Cabot Interceptor Cruiser (`cyber_car.glb`) | 1. Cabot Highway Sprint<br>2. Signal Hill Marconi Sync<br>3. Iceberg Radar Link | Rugged sea cliff granite, floating iceberg reflections, North Atlantic light |
| **Yukon** | Mount Logan glacial summit wall, Klondike Dredge No. 4 gold sluice trommel, boreal conifers | Prospector Cyber Cruiser (`cyber_car.glb`) | 1. Alaska Highway High-Pass<br>2. Dredge No. 4 Sluice Sync<br>3. Mount Logan Summit Link | Gold rush timber, subarctic glacial snowpack, Yukon wilderness dawn |
| **Northwest Territories** | Great Slave Lake ice road corridor, Diavik diamond mine pit with glowing kimberlite crystal, aurora ribbons | Arctic Hauler Cruiser (`cyber_car.glb`) | 1. Slave Lake Ice Road Run<br>2. Diavik Diamond Pit Sync<br>3. Aurora Resonator Link | Polar ice road sheen, emerald aurora curtains, diamond crystal glow |
| **Nunavut** | Monumental stone Inukshuk navigation landmark with purple waypoint core, Igloo Assembly Dome, polar sea ice shelf | Tundra Rover Cruiser (`cyber_car.glb`) | 1. Polar Sea Ice Shelf Dash<br>2. Sacred Inukshuk Waypoint Sync<br>3. High-Arctic Observatory Link | High Arctic snowpack, violet aurora curtains, high-latitude polar twilight |
| **National Capital Region** | Parliament Hill Centre Block with verdigris copper roofs, 95m Peace Tower & clocks, Centennial Flame, Rideau Canal | Royal Diplomatic Cruiser (`cyber_car.glb`) | 1. Confederation Blvd Transit<br>2. Peace Tower Spire Sync<br>3. Centennial Flame Link | Neo-Gothic masonry PBR, Rideau Canal water, ceremonial red/gold lighting |

### Shared Standard Features Implemented Across All 14 Realms:
1. **Rigged 3D Character**: Mixamo `operative_soldier.glb` with AnimationMixer cross-fading (`Idle`, `Walk`, `Run` with sprint acceleration).
2. **Dual-Perspective Camera**: Smooth toggle between First-Person (1P) and Third-Person (3P) via `[V]` key with pitch/yaw mouse tracking.
3. **Cyber Cruiser Vehicle**: Realistic physics vehicle with nitro boost (`[Shift]`), turning front wheels, spinning tires, dismount (`[E]`), and speedometer HUD.
4. **3-Tier Quality Switcher**: `[Q]` toggle between LOW (DPR 1.0, shadows off for low-end devices), MED (DPR 1.25, BasicShadowMap), and HIGH (DPR 1.75, PCFSoftShadowMap, high-res shadow maps).
5. **Procedural Web Audio Engine**: `ProvinceAudio` class synthesizing chime and loot notifications with 0 external network dependencies.
6. **Kenney Modular Architecture**: High-efficiency modular buildings and pine trees seamlessly integrated into each environment.
7. **PBR Surface Textures**: Authentic PBR road materials (`Road007_1K`) with repeat wrapping and proper roughness/metalness parameters.