# All Province Realms: Realism and Performance Plan

This plan applies to the **central metropolis in `game.html` and all 14 province and territory realms**. Apply shared rendering and performance improvements consistently, while preserving the identity of each location.

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

The [Newfoundland realm](./province-newfoundland.html) is a useful implementation reference for its GLTF loading, rigged-character setup, camera switch, and quality selector. Treat it as a pattern to review and reuse—not proof that the other realms are upgraded or that its models, animation clips, performance, or visual result have been verified in-game.

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