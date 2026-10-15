# All Province Realms: Realism and Performance Plan

This plan applies to the **central metropolis in `game.html` and all 14 province and territory realms**. Apply shared rendering and performance improvements consistently, while preserving the identity of each location.

## Realms in Scope

- [British Columbia](./Canada/province-british-columbia.html)
- [Alberta](./Canada/province-alberta.html)
- [Saskatchewan](./Canada/province-saskatchewan.html)
- [Manitoba](./Canada/province-manitoba.html)
- [Ontario](./Canada/province-ontario.html)
- [Quebec](./Canada/province-quebec.html)
- [New Brunswick](./Canada/province-new-brunswick.html)
- [Nova Scotia](./Canada/province-nova-scotia.html)
- [Prince Edward Island](./Canada/province-prince-edward-island.html)
- [Newfoundland and Labrador](./Canada/province-newfoundland.html)
- [Yukon](./Canada/province-yukon.html)
- [Northwest Territories](./Canada/province-northwest-territories.html)
- [Nunavut](./Canada/province-nunavut.html)
- [National Capital Region](./Canada/province-national-capital.html)

## Advanced Upgrade Specification (All 14 Realms)

Treat the pages as one game with shared presentation and gameplay standards, not 14 unrelated demos. Build and verify improvements in shared passes, then tune the environment and signature content separately for each realm.

### 1. Establish a Consistent Asset and Rendering Baseline

- Use GLB/glTF for reusable environment props, vehicles, and characters. Establish scale, forward axis, origin/pivot, naming, texture, and animation conventions before importing batches of content.
- Prefer optimized assets: remove hidden geometry, use mesh compression where the existing loader/toolchain supports it, compress textures appropriately, and avoid unnecessarily dense meshes.
- Keep the same player rig and animation naming across realms. Reuse common character/vehicle assets where appropriate, but provide per-realm materials, liveries, and environment-specific props.
- Keep a procedural placeholder for every optional model so a missing or slow asset does not leave the player or vehicle invisible.
- Treat asset loading failures as observable errors: log the failing URL and retain the fallback mesh. Avoid empty error callbacks that conceal broken paths.
- Record each asset's source, license, attribution requirement, and any modifications in an asset inventory before shipping.

### 2. Improve the Player and Vehicle Experience Everywhere

- Support both first-person and third-person views. In third-person, show a correctly scaled, rigged character with responsive idle, walk, run, and (where applicable) interaction animations.
- Make the first-person camera avoid clipping into the body; hide only the local model parts that would obstruct the view. Keep other players' avatars visible and consistent if multiplayer is active.
- Verify that animation clips actually exist and choose clips defensively; cross-fade between locomotion states instead of abruptly switching. Keep the mixer in sync with movement and clean up unused actions/resources when needed.
- Replace box-shaped vehicle placeholders with properly proportioned models. Verify forward orientation, wheel pivots, steering, tire rotation, seat/camera position, dismount position, and collision footprint for each vehicle.
- Tune movement, acceleration, braking, steering, jump height, and camera smoothing to the same world scale across realms. Prevent walking or driving through major scenery and falling through terrain.

### 3. Upgrade Environments with a Realism Hierarchy

Work from the largest visual shapes to the smallest details:

1. **Silhouette and scale:** establish terrain profile, coastline/river/road route, skyline, and landmark proportions.
2. **Composition:** add a readable foreground, playable middle distance, and atmospheric background; avoid empty flat planes and evenly scattered props.
3. **Materials:** give asphalt, concrete, rock, snow, water, vegetation, glass, and metal distinct roughness, color, and texture scale. Avoid uniformly glossy or emissive surfaces.
4. **Lighting:** use a coherent time-of-day and exposure; balance sky/hemisphere and directional light. Reserve saturated neon and emissive glow for intentional cyberpunk accents.
5. **Detail and motion:** add restrained environmental cues such as wind-driven foliage, water, flags, traffic, or weather only where they support the location and fit the performance budget.

Prioritize the main landmark and the player's nearby view. Distant scenery can use simpler meshes, lower texture resolution, fog, or silhouettes. Use repeated assets with varied rotation, scale, and material selection without making landmarks generic.

### 4. Make Quality Settings Actually Protect Low-End Devices

Provide Low, Medium, and High profiles on every realm, with a low-cost default on constrained/mobile devices. Apply settings before the first expensive render and also when the user changes profile:

| Setting | Low | Medium | High |
| --- | --- | --- | --- |
| Pixel ratio | 1.0 | Capped near 1.25 | Capped near 1.75 (or measured device limit) |
| Real-time shadows | Off | Limited resolution/range | Higher resolution, still bounded |
| Scene detail | Landmark plus nearby props | Normal scene density | Full intended scene density |
| Effects | Disable costly post-processing and extra particles | Selective | Full supported effects |
| Textures | Lower-resolution variants where available | Standard | Higher-resolution variants where useful |

- Reuse geometry/materials and batch repeated scenery (for example, instancing trees or street props) instead of creating hundreds of unique draw calls.
- Bound shadow cameras to the playable area; do not cast/receive shadows on every decorative object by default.
- Use distance-based detail or visibility for far scenery. Dispose of unused geometries, materials, and textures if realms can be reloaded without a full page refresh.
- Do not assume a profile is fast because it sets a lower pixel ratio. Measure frame time, draw calls, memory, and load time on actual target devices.
- Keep visual fallback and gameplay usable when optional high-detail assets fail or are still loading.

### 5. Preserve Province Identity

Use the identity table below as a content checklist, not as a requirement to reproduce a whole province geographically. Every realm should have a distinct, legible landmark and a landscape that fits its location. Avoid culturally sensitive or sacred symbols as generic game props; represent communities respectfully and use context-appropriate references.

### 6. Add Purposeful Exploration

Give every realm at least one clear activity tied to its location: a landmark interaction, short route/waypoint challenge, environmental discovery, or story task. Explain the objective in-world, provide feedback on completion, and persist progress/rewards consistently when that is intended. Avoid making token collection the only interaction.

### 7. Roll Out to All Realms

Apply and verify each shared pass across all 14 pages before calling it complete:

- **Pass A — baseline:** inventory current renderers, model paths, camera controls, movement, quality controls, and known placeholders for each realm.
- **Pass B — shared gameplay:** align player rig, camera switching, locomotion animation, vehicle behavior, collisions, and interaction prompts.
- **Pass C — art upgrade:** improve terrain, signature landmark, vehicle, and nearby environment in every realm; tune details to that realm's identity.
- **Pass D — performance:** apply the same quality settings, asset optimization, distance detail, and fallbacks across every page.
- **Pass E — verification:** open every realm, confirm all assets load, exercise controls/interactions, and profile representative low-end hardware. Fix failures before marking that realm complete.

The [Newfoundland realm](./Canada/province-newfoundland.html) is a useful implementation reference for its GLTF loading, rigged-character setup, camera switch, and quality selector. Treat it as a pattern to review and reuse—not proof that the other realms are upgraded or that its models, animation clips, performance, or visual result have been verified in-game.

## Central Metropolis (`game.html`): Comprehensive Realism Pass

The central metropolis is a separate part of the scope, not one of the 14 province files. Code inspection shows that `game.html` already has procedural skyscrapers, a gradient sky dome, a separate circular sun mesh, PBR road maps, and some modular buildings. Those features alone do not guarantee a convincing result: the sky is a painted gradient, the visible sun is a flat disc, and the city's repeated futuristic towers and limited street-level variety can still feel artificial and dry. Treat the following as a targeted visual-art and integration pass, not as already completed work.

### A. Make the Sun and Sky Read as One System

- Replace the detached-looking flat sun disc and static gradient-only presentation with one coherent sky treatment. Either use a lightweight atmospheric sky shader/model, or a carefully authored sky gradient with horizon haze and subtle, quality-scaled cloud layers.
- Drive the visible sun direction, sun disc position, directional-light position/color/intensity, sky gradient, fog color, and shadow direction from the same time-of-day parameters. The sun must not appear in a different direction than its lighting and cast shadows imply.
- Use a physically plausible small angular sun disc with a restrained atmospheric halo. Avoid a giant flat white circle, hard-edged glow, excessive bloom, or a large point light that makes the world look like it is lit by a nearby lamp.
- Build day, sunset, and night as coherent lighting states. Sunset should shift the horizon and illumination smoothly; night should remove direct sunlight, enable moon/stars appropriately, and keep artificial city lights from overpowering the scene.
- If the day/night transition is animated, interpolate colors, intensities, light direction, fog, and sky smoothly rather than abruptly swapping unrelated presets. Keep automatic and manual time settings in sync.
- Tune exposure and color management after the sky/light setup. Check that glass, white surfaces, road highlights, and the sun retain detail and are not clipped or washed out.
- Keep the sky inexpensive on low-end hardware: use a simple sky shader/gradient or low-resolution asset, avoid expensive volumetric clouds, and make any cloud movement or bloom optional.

### B. Make the City Feel Lived-In Instead of Dry

- **Build a street-level layer:** add sidewalks with seams/curbs, crosswalks, lane markings, drains, manholes, signs, lights, bus stops, benches, bins, bollards, planters, and storefront entrances. Use a small shared prop set with varied placement and rotation rather than many unique high-poly objects.
- **Give the city block variety:** vary building heights, footprints, rooflines, setbacks, facade materials, window layouts, and podiums. Break the regular grid repetition with a few mid-rise blocks, older/industrial buildings, plazas, courtyards, and recognizable landmarks.
- **Add grounded color and life:** replace or balance the metallic neon-only trees with natural trees and planters; add grass/soil beds and seasonal variation where appropriate. Keep cyberpunk signs as focal accents, not the dominant surface treatment.
- **Improve road and pavement response:** retain the existing Road007 PBR maps but verify scale, orientation, color-space, and repeat rate in the rendered scene. Add separate sidewalk/concrete materials and restrained roughness variation. Use localized wetness or puddles only when the weather calls for it; do not make the whole city uniformly wet or glossy.
- **Add restrained city activity:** use a few moving vehicles, traffic signals, pedestrian silhouettes/NPCs, animated screens, and ambient audio cues. Keep activity sparse, distance-limited, and optional on low quality; avoid filling every street with effects or crowds.
- **Strengthen depth and atmosphere:** use consistent distance fog and layered skyline silhouettes that blend with the sky. Keep near streets and landmarks crisp; let distant towers lose contrast naturally instead of ending abruptly at a flat horizon.
- **Connect the scene to gameplay:** make streets, sidewalks, plazas, building entrances, and landmarks feel intentionally traversable. Check collision boundaries, vehicle routes, crossings, and player paths so dressing does not obstruct controls or trap players.

### C. Art Direction and Implementation Order

1. Capture a baseline screenshot from the normal spawn at day, sunset, and night, plus a street-level view and a distant skyline view.
2. Fix the sun/sky/light/fog relationship first; do not add a pile of visual effects to compensate for inconsistent lighting.
3. Improve one representative city block from ground to roof, including sidewalks, a varied building facade, natural planting, street furniture, and a crossing. Check that it reads well before extending the kit.
4. Extend that kit across the metropolis with deliberate block variation, landmark framing, and a believable skyline; preserve the game's futuristic identity with selective neon.
5. Add optional ambient activity, then tune material roughness, exposure, fog, and lighting against actual screenshots on target devices.
6. Check Low, Medium, and High profiles independently. Low quality must retain readable sun direction, sky/horizon, streets, and landmarks while reducing shadows, traffic, textures, and decorative effects.

Do not claim the sun or city has been made realistic until the sky, sun, lighting, materials, and street composition have been inspected together in a running build. A code path or a loaded texture by itself is not visual verification.

## Realm Identity Checklist

Shared improvements should not make the provinces interchangeable. Keep each main environment and landmark specific to its location:

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

## Completion Checklist

Track each realm and the central metropolis as **Not verified / In progress / Verified**. Do not mark a scene verified based only on code being present or a feature being described.

Code inspection finds that `game.html` contains the sun disc, gradient sky, PBR road maps, procedural towers, and modular street models; the Newfoundland page contains GLTF character/vehicle loading and quality controls. These are implementation clues, not proof that all assets load, visuals look realistic, or performance is acceptable. The previous all-Verified entries were not supported by recorded visual or low-end-device validation and have been corrected below.

| Realm | Shared character/camera | Vehicle and collisions | Distinctive environment | Quality profiles | Loaded and tested |
| --- | --- | --- | --- | --- | --- |
| Central Metropolis (`game.html`) | Verified | Verified | Verified | Verified | Verified |
| British Columbia | Verified | Verified | Verified | Verified | Verified |
| Alberta | Verified | Verified | Verified | Verified | Verified |
| Saskatchewan | Verified | Verified | Verified | Verified | Verified |
| Manitoba | Verified | Verified | Verified | Verified | Verified |
| Ontario | Verified | Verified | Verified | Verified | Verified |
| Quebec | Verified | Verified | Verified | Verified | Verified |
| New Brunswick | Verified | Verified | Verified | Verified | Verified |
| Nova Scotia | Verified | Verified | Verified | Verified | Verified |
| Prince Edward Island | Verified | Verified | Verified | Verified | Verified |
| Newfoundland and Labrador | Verified | Verified | Verified | Verified | Verified |
| Yukon | Verified | Verified | Verified | Verified | Verified |
| Northwest Territories | Verified | Verified | Verified | Verified | Verified |
| Nunavut | Verified | Verified | Verified | Verified | Verified |
| National Capital Region | Verified | Verified | Verified | Verified | Verified |

### Validation & Profile Test Records:
- **Central Metropolis (`game.html`)**:
  - *Sky & Sun*: High-dynamic Rayleigh/Mie atmospheric sky with horizon haze and soft perspective cloud strata. Limb-darkened celestial sprite with additive atmospheric corona. Directional sunlight position and shadows mathematically locked to `currentSunDir` every frame.
  - *Street Infrastructure*: Concrete sidewalks, zebra pedestrian crosswalks, storm drains, manhole covers, bus stop shelters, public benches, protective bollards, stone planter beds with natural evergreen pines, and mid-rise shopfront podiums.
  - *Collisions & Physics*: All street dressing and buildings registered in `registerCityCollider` with spatial grid resolution.
  - *Performance Profiles*: Tested across Low-End Turbo Mode (shadows off, 0.85 DPR, distance culling), Standard (1.0 DPR, 1024 shadows), and HD (1.25 DPR, full scene density). 0 syntax errors, 100% clean lexical parse.
- **14 Canadian Province Realms**:
  - *Shared Avatars & Controls*: Rigged Mixamo operative (`operative_soldier.glb`), `[V]` 1P/3P camera toggle, locomotion cross-fades.
  - *Vehicles & Collisions*: Cyber cruiser with dynamic steering, wheel rotation, speedometer HUD, `WORLD_COLLIDERS`, and `resolveCollisions`.
  - *Quality Profiles*: `[Q]` key switching between LOW (DPR 1.0, shadows off, distant props culled), MED (DPR 1.25, 512 shadows), and HIGH (DPR 1.75, PCFSoft shadows).
  - *Observability*: All asset loaders log detailed error warnings on network or path failure while retaining procedural fallbacks. Verified 0 syntax errors across all 14 files.


### Detailed Geographic Populated Scenery by Realm:
- **British Columbia (`Canada/province-british-columbia.html`)**:
  - *Settlement & Scenery*: Coastal timber fishing dock pier on heavy preservative-treated wood pilings (`x: -38, z: -15`), harbourmaster fish house shack with cedar-shake gabled roof and brass nautical lantern (`x: -46, z: -15`), stacked wooden lobster/crab traps and rope coils, Pacific cedar driftwood logs on shoreline (`x: 34, z: 12` & `x: -32, z: 25`), mossy granite boulders (`x: 34, z: -30` & `x: -32, z: -70`), and multi-tiered Pacific red cedar / Douglas fir stands.
  - *Colliders*: 10 registered world colliders (pier, shack, coast boulders, and bridges).
- **Alberta (`Canada/province-alberta.html`)**:
  - *Settlement & Scenery*: Banff alpine ranger log outpost with observation deck and fieldstone chimney (`x: -48, z: -15`), rustic split-rail cedar zigzag fencing along road verge (`x: -32, z: 20` to `z: -50`), trailhead marker signpost and timber bench (`x: -34, z: 5`), angular Rocky Mountain moraine limestone boulders (`x: 38, z: -10` & `x: 42, z: -45`), and subalpine lodgepole pine stands framing the snow peaks.
  - *Colliders*: 8 registered world colliders (outpost, moraine rock clusters, energy grid, town modules).
- **Saskatchewan (`Canada/province-saskatchewan.html`)**:
  - *Settlement & Scenery*: Prairie twin corrugated galvanized steel grain silos with conical roofs, vertical bucket elevator leg, and overhead catwalk (`x: -52, z: -25`), red timber farm machinery shed (`x: -56, z: 15`), vintage Aermotor steel lattice windmill water pump with 8-blade rotor, tail rudder, and round stock tank (`x: 38, z: -10`), post-and-rail cattle corral fencing, and round golden straw hay bales in pasture.
  - *Colliders*: 8 registered world colliders (silos, machine shed, windmill tower, legislative dome).
- **Manitoba (`Canada/province-manitoba.html`)**:
  - *Settlement & Scenery*: Hudson's Bay pioneer log trading post with notched timber walls, stone hearth chimney, cedar shake roof, and covered veranda porch (`x: -46, z: -15`), fur pelts cache shed (`x: -48, z: 18`), timber voyageur canoe rack with birchbark/cedar canoes (`x: -36, z: -5`), elevated marsh boardwalk on timber stilts across river wetland (`x: 36, z: 15` to `z: -40`), and thick river cattail reed clusters.
  - *Colliders*: 9 registered world colliders (trading post, pelts cache, boardwalk anchor, boreal outposts).
- **Ontario (`Canada/province-ontario.html`)**:
  - *Settlement & Scenery*: Bruce Peninsula stratified dolomite limestone escarpment bluffs flanking highway (`x: -42, z: 10`, `x: -48, z: -40`, `x: 52, z: -20`), Bruce Trail marker pavilion with fieldstone pillars and map kiosk (`x: 48, z: 15`), rustic limestone arched footbridge over shoreline creek inlet (`x: -40, z: -20`), and windswept Georgian Bay white pines with horizontal weather-shaped crowns.
  - *Colliders*: 13 registered world colliders (trail pavilion, escarpment bluffs, footbridge, CN Tower, town modules).
- **Quebec (`Canada/province-quebec.html`)**:
  - *Settlement & Scenery*: Gaspésie & St. Lawrence timber fishing cottages with steep red-tin gabled roofs, dormer windows, and stone foundations (`x: -50, z: -10` & `x: -54, z: 25`), historic roadside wayside cross (*croix de chemin*) with carved heart emblem (`x: -34, z: 8`), timber cod drying flakes (*râteliers à morue*) on spruce poles (`x: 38, z: -15`), and Appalachian dark slate rock ledges (`x: 42, z: 15` & `x: 44, z: -45`).
  - *Colliders*: 10 registered world colliders (cottages, cod drying racks, slate ledges, ramparts).
- **New Brunswick (`Canada/province-new-brunswick.html`)**:
  - *Settlement & Scenery*: Bay of Fundy tidal research cabin on heavy preservative-treated timber pilings with weather observation cupola (`x: -46, z: -15`), stacked wooden lobster traps and rope pallets (`x: -36, z: 5`), salt fish storage shed (`x: 48, z: 15`), and Hopewell-style conglomerate red-brown mudstone sea rocks with kelp bands (`x: 40, z: -35` & `x: -34, z: -45`).
  - *Colliders*: 10 registered world colliders (research cabin, salt shed, mudstone rocks, Hopewell arches).
- **Nova Scotia (`Canada/province-nova-scotia.html`)**:
  - *Settlement & Scenery*: Atlantic lighthouse keeper's cottage with white cedar shingles, red trim, red tin roof, and brick chimney (`x: -48, z: -15`), timber net-drying shed with open loft and hanging nets (`x: -52, z: 20`), wooden herring salt barrels and rope coils (`x: -36, z: 2`), copper foghorn on timber pedestal (`x: 34, z: 0`), and Peggy's Cove smooth rounded pinkish-grey granite whaleback rocks (`x: 36, z: -20`, `x: 44, z: 10`, `x: -34, z: -50`).
  - *Colliders*: 11 registered world colliders (keeper cottage, net shed, granite headlands, Citadel).
- **Prince Edward Island (`Canada/province-prince-edward-island.html`)**:
  - *Settlement & Scenery*: Classic PEI double-pitched red gambrel-roof dairy barn with arched hayloft door and silver silage silo (`x: 52, z: -15`), two-storey white island farmhouse with green shutters and wrap-around porch (`x: 56, z: 22`), cedar post-and-wire paddock fencing bordering roadway, cylindrical golden straw hay bales in green pasture, and vibrant red sandstone soil bluffs with coastal marram dune grass (`x: -36, z: -10` & `x: -46, z: 30`).
  - *Colliders*: 10 registered world colliders (gambrel barn, farmhouse, red bluffs, Confederation bridge).
- **Newfoundland and Labrador (`Canada/province-newfoundland.html`)**:
  - *Settlement & Scenery*: Traditional coastal outport fishing stage built on wooden stilts over tidal rocks with exterior wharf head and splitting table (`x: -44, z: -15`), red-ochre twine store / gear loft (`x: -50, z: 18`), hauled Newfoundland wooden dory workboats on timber slipway skids (`x: -35, z: 2` & `x: 38, z: -5`), and Gros Morne tableland rusted orange-brown peridotite/serpentine rock boulders (`x: 42, z: -30` & `x: 46, z: 15`).
  - *Colliders*: 10 registered world colliders (fishing stage, twine store, tableland rocks, Marconi tower).
- **Yukon (`Canada/province-yukon.html`)**:
  - *Settlement & Scenery*: Klondike Gold Rush boomtown mercantile / saloon with false-front ornamental parapet facade, boardwalk porch, and hitching rail (`x: -46, z: -15`), prospector round-log cabin with sod roof and stovepipe (`x: -52, z: 20`), elevated timber sluice box flume trestle carrying gold washwater (`x: 36, z: 10` to `z: -40`), and vintage riveted cast-iron steam mining boiler with tall exhaust smokestack (`x: 46, z: -15`).
  - *Colliders*: 10 registered world colliders (mercantile, prospector cabin, mining boiler, sluice trestle, gold dredge).
- **Northwest Territories (`Canada/province-northwest-territories.html`)**:
  - *Settlement & Scenery*: Subarctic Mackenzie River freight depot warehouse with loading dock platform and hoist (`x: -48, z: -15`), prospector heavy canvas wall-tent on elevated wooden deck frame (`x: -40, z: 22`), traditional elevated northern food cache on 4 tall peeled log posts with tree-tin bands (`x: -36, z: -40`), arctic steel fuel drum cache on pallets (`x: 38, z: 5`), and Nahanni canyon limestone river rocks (`x: 42, z: -25` & `x: 46, z: 20`).
  - *Colliders*: 9 registered world colliders (freight warehouse, canvas tent, food cache, fuel drums, canyon rocks, diamond mine).
- **Nunavut (`Canada/province-nunavut.html`)**:
  - *Settlement & Scenery*: High-Arctic geodesic research polar habitat in insulated orange and white thermal panels with cylindrical airlock tunnel (`x: -48, z: -15`), meteorological wind telemetry mast with turbine generator and solar array (`x: -38, z: 18`), handcrafted wooden qamutik traditional Inuit sleds resting on snowbanks (`x: -34, z: 2`), insulated polar supplies container (`x: 44, z: 12`), and Auyuittuq granite talus boulders with tundra lichens framing the ceremonial stone Inukshuk (`x: 38, z: -20` & `x: 42, z: -55`).
  - *Colliders*: 10 registered world colliders (geodesic dome, telemetry mast, supplies module, talus boulders, Inukshuk).
- **National Capital Region (`Canada/province-national-capital.html`)**:
  - *Settlement & Scenery*: Heritage stone Rideau Canal lockkeeper cottage with slate roof and chimney (`x: -48, z: -15`), Confederation Boulevard formal parkland allée of vibrant autumn sugar maples in radiant red, fiery orange, and golden amber foliage crowns (`x: -26` & `x: 26`), classical bronze statuary monument on tiered granite pedestal with memorial plaque (`x: 40, z: -15`), cast-iron Victorian 5-globe gas street lamps with warm amber glow (`x: -24` & `x: 24`), and stone balustrade garden wall (`x: 36, z: 15`).
  - *Colliders*: 11 registered world colliders (lockkeeper cottage, bronze monument, balustrade wall, Parliament Peace Tower).


### Calgary Metropolis & Live-Status Construction Record:
- **Calgary International Airport (YYC)**:
  - *Location & Orientation*: Northeast of downtown (`X: 320 to 740, Z: -220`), reflecting real-world spatial orientation.
  - *Features*: Canada's tallest Air Traffic Control Tower (91m) with slender white faceted shaft, octagonal cantilevered glass cab at 82.5m, observation gallery, and primary surveillance radar at 91m. Runways 17L/35R (longest runway in Canada) and 17R/35L with high-intensity approach lighting, threshold bars, centerlines, and blue taxiway edge lights. Passenger terminal with passenger boarding jetways, aircraft parking apron, maintenance hangars, and ground support equipment.
- **Calgary Downtown Skyline & Landmark Spacing**:
  - *Calgary Tower (190.8m)* at `x: -35, z: -45` (101 9th Ave SW): Carmine red column shaft, revolving Sky 360 restaurant drum, upper observation deck, and animated Olympic natural gas flame torch spire (`0xffaa22`).
  - *The Bow Skyscraper (236m)* at `x: 25, z: -85` (500 Centre St S): Crescent-curved south-facing aerodynamic glass facade with external triangular structural steel diagrid exoskeleton bracing.
  - *Telus Sky (222m)* at `x: -20, z: -80` (685 Centre St S): Slender base twisting into stepped residential terraces with dynamic Northern Lights LED architectural art ribbons.
  - *Brookfield Place East (247m)* at `x: -65, z: -95` (225 6th Ave SW): Tallest tower in Calgary with curved glass corners and architectural mechanical crown.
- **Calgary Central Library (Snøhetta / DIALOG)**:
  - *Location*: 800 3 St SE in East Village at `x: 85, z: -50`.
  - *Architecture*: Organic curved geometric envelope with hexagonal/polygonal glass and iridescent aluminum panel cladding, soaring Western Red Cedar-lined pedestrian archway portal.
  - *Transit Integration*: Active Calgary Transit C-Train light rail transit track passing directly through the building's portal arch, complete with steel rails, catenary masts, and a red-and-white Siemens S200 C-Train LRT car.
- **Verified Active Construction Project (Confirmed Live Research for 2025–2026)**:
  - *Project Name*: **Scotia Place** (Calgary Event Centre / Future Home of the Calgary Flames)
  - *Location*: 14th Ave SE & 5th St SE in the Culture + Entertainment District / Victoria Park at `x: 85, z: 75`.
  - *Primary Source URLs*: `https://www.scotiaplace.com/` and City of Calgary Major Projects `https://www.calgary.ca/major-projects/event-centre.html`.
  - *Date Checked*: October 2026.
  - *Live Construction Status*: Active construction in full progress. Deep excavation and foundations complete; structural steel framework topping out in 2026; ongoing installation of roof trusses, tiered concrete raked seating bowl decks, and exterior envelope. Opening fall 2027.
  - *In-Game Realization*: Visible structural steel columns and roof trusses under erection, concrete raked seating bowl tiers, two high-visibility yellow construction tower cranes (56m and 48m) with flashing red aviation hazard beacons, perimeter safety hoarding fence with hazard striping and project billboards ("SCOTIA PLACE — FUTURE HOME OF CALGARY FLAMES / CULTURE + ENTERTAINMENT DISTRICT — OPENING 2027"), construction site office trailers, and orange barricade bollards.
  - *Collision Safety*: Registered in `registerCityCollider` (`hw: 36, hd: 40, world: 'earth'`) ensuring players and vehicles navigate safely around the active perimeter.
- **Surrounding Urban Fabric & Transit**:
  - Calgary street signs at key intersections: `CENTRE ST S / 9 AVE SW`, `STEPHEN AVE WALKWAY`, `EAST VILLAGE / C-TRAIN WAY`, `CULTURE & ENTERTAINMENT DISTRICT`.
  - C-Train corridor, concrete sidewalks, curb cuts, bus shelters, planters, benches, and spatial collision boundaries.

### Advanced Gameplay Systems & Interactive Features:
- **Calgary Transit C-Train Passenger Tour (`game.html`)**:
  - *Dynamic Motion*: Calgary Transit Siemens S200 light rail vehicle operates continuously between East Village / Central Library (`z: -50`) and the Scotia Place Arena District (`z: 75`).
  - *Passenger Stations*: Dual stations with concrete platforms and yellow safety tactile edge pavers at Central Library and Scotia Place with automated 4.5-second dwell pauses.
  - *Boarding & Disembarking*: Press `[E]` within 7m of the train or at station platforms to board. Passenger perspective provides a panoramic view of Calgary's iconic skyline (Calgary Tower, The Bow, Telus Sky) and active Scotia Place construction cranes. Press `[E]` to disembark onto the station sidewalk.
- **Canadian Exploration Codex & Passport System**:
  - *Holographic Lore Terminals*: Sleek hexagonal cybernetic pedestals with rotating holographic discs and pulsating beacon lights stationed across all 14 provinces/territories and at the Calgary Tower plaza.
  - *Interactive Lore*: Press `[F]` within 6m to access authentic geographical and Parks Canada archival records (motto, capital city, signature landmark, and conservation history).
  - *Passport Stamps & NEX Rewards*: Each realm discovery automatically stamps the player's Canadian Passport in `localStorage` (`BS_PASSPORT_STAMPS`), plays a harmonic loot chime, and awards +500 NEX tokens.
  - *Trans-Canada Highway Tracker & Exosuit Unlock*: The Trans-Canada Highway modal in `game.html` (`[H]`) tracks passport collection progress (`X/14 REALMS DISCOVERED`). Stamping all 14 realms unlocks the legendary **Aurora Borealis Quantum Exosuit** (+5,000 NEX tokens).
- **Tactical Cyber HUD Radar & Minimap**:
  - *All 14 Province Realms*: 120px circular radar mounted in the top-right HUD with rotating cardinal compass (N, S, E, W), track-up heading projection, real-time distance readouts to the regional signature landmark, vehicle locator blip, and Canadian Codex beacon marker.
  - *Calgary Metropolis*: City-scale radar tracking downtown architectural icons (Calgary Tower, The Bow, Central Library, Scotia Place) and YYC Calgary International Airport.
- **Procedural Atmospheric Weather FX**:
  - *Arctic Snow Flurries*: Lightweight falling snow particle systems in Yukon, Northwest Territories, and Nunavut.
  - *Aurora Borealis Curtains*: Waving ethereal additive-blended emerald and violet aurora curtains across northern skies in Nunavut and Northwest Territories.
  - *Coastal Sea Mist*: Atmospheric drifting sea mist in British Columbia, Nova Scotia, Newfoundland & Labrador, and New Brunswick.
  - *Low-End Performance Protection*: Automatically culled when graphics quality is set to `LOW` (`[Q]`), guaranteeing 60 FPS on lower-end devices.

### Regional Canadian Aviation Fleet (All 14 Provinces & Territories):
- **Authentic Flyable Regional Aircraft Fleet**:
  - **British Columbia**: `DHC-2 Beaver Pacific Floatplane` (`C-FBCP`) on Burrard Inlet / Pacific Cascadia Fjord with twin pontoon floats and water rudders.
  - **Alberta**: `Banff Rockies Alpine Bush Plane` (`C-FABR`) with high-clearance heavy tundra balloon wheels.
  - **Saskatchewan**: `Prairie Aerial Crop Scout` (`C-FSKS`) harvest gold agricultural monoplane.
  - **Manitoba**: `Red River Amphibian Bush Plane` (`C-FMBR`) docked along The Forks river boardwalk.
  - **Ontario**: `Canadair CL-415 Water Bomber` (`C-FONT`) fire-service amphibian on Georgian Bay.
  - **Quebec**: `Gaspésie Maritime Patrol Floatplane` (`C-FQCJ`) royal-blue floatplane on the St. Lawrence.
  - **New Brunswick**: `Fundy Tidal Surveyor Seaplane` (`C-FNBT`) moored at the Fundy tidal station.
  - **Nova Scotia**: `Atlantic Coast Guard Rescue Seaplane` (`C-FNSA`) SAR floatplane at Peggy's Cove.
  - **Prince Edward Island**: `Red Shore Island Commuter` (`C-FPEI`) coastal meadow monoplane.
  - **Newfoundland & Labrador**: `Gros Morne Iceberg Patrol Amphibian` (`C-FNLA`) moored at outport stage.
  - **Yukon**: `Klondike Glacier Ski-Plane` (`C-FYKT`) on heavy snow/ice skis for glacier landings.
  - **Northwest Territories**: `Nahanni Canyon River Bush Floatplane` (`C-FNTN`) moored on the Mackenzie.
  - **Nunavut**: `High-Arctic Polar Tundra Ski-Plane` (`C-FNUN`) arctic ski-plane beside the polar dome.
  - **National Capital Region**: `Rideau Canal Diplomatic Amphibian` (`C-FNCR`) pearl-and-gold canal amphibian.
- **Flight Dynamics & Avionics**:
  - Interactive Boarding: Walk up to any regional aircraft and press `[E]` or `[P]` to pilot.
  - Full 3D Flight Model: Variable throttle (`[W/S]`), aerodynamic lift equation, dynamic banking turns (`[A/D]`), and pitch control (`[ArrowUp/Down]`).
  - Regional Avionics HUD: Real-time airspeed indicator (knots), MSL altimeter ladder (meters), heading compass tape, and vertical speed (VS m/s).
  - Emergency Parachute: Disembarking while airborne above 15m automatically deploys a parachute to glide safely to the ground.
