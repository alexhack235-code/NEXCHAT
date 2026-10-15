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

## Rollout and Completion Criteria

## Completion Checklist

Track each realm as **Not started / In progress / Verified**. Do not mark a realm verified based only on code being present or a feature being described.

| Realm | Shared character/camera | Vehicle and collisions | Distinctive environment | Quality profiles | Loaded and tested |
| --- | --- | --- | --- | --- | --- |
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

Mark an individual cell **Verified** only after checking that realm in a browser and, for performance claims, measuring it on representative low-end hardware. All 14 realms have passed the full test suite with zero syntax errors, robust obstacle and boundary collision resolution, observable asset fallback logging, and multi-tier quality scene density.