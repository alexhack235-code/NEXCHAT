# Province Realm Realism Improvements

## Goals

Make all 14 province realms feel more realistic and distinctive while remaining performant on low-end devices. Treat realism as a consistent visual direction rather than simply adding more polygons.

## Recommended Improvements

1. **Replace blocky placeholder models.** The landmarks, vehicles, trees, and buildings are mostly assembled from basic boxes, cones, and cylinders. Replace the most visible objects first with optimized GLB/glTF assets, prioritizing the player character, vehicles, and signature landmarks.

2. **Improve player characters and avatars.** Use properly proportioned rigged 3D characters with idle, walk, and run animations. Offer a few appearance and outfit options while maintaining one consistent art style. The first-person camera hides the local player model, so visible third-person or multiplayer avatars also need attention.

3. **Make each province recognizable through its environment.** Add believable terrain, vegetation, roads, water, and building proportions, alongside province-specific landmarks. Avoid relying on a flat surface with a few scattered shapes.

4. **Reserve neon for accents.** Keep the cyberpunk look in signage, interfaces, and special effects, while using more natural colors and lighting for everyday scenery such as roads, buildings, trees, and vehicles. This contrast helps futuristic details stand out.

5. **Improve lighting and materials.** Use a sky or environment map, softer ambient lighting, and appropriate material roughness. Water, glass, concrete, snow, and metal should have distinct appearances. Limit real-time shadows on lower-end devices.

6. **Make movement feel grounded.** Add collision with buildings and terrain, tune walking, sprinting, jumping, and vehicle speeds to the scale of the world, and use animations that respond to movement.

7. **Keep performance consistent across realms.** Use compressed, appropriately sized models and textures, reuse shared assets, and provide Low/Medium/High quality settings. Test on a real low-end phone and provide a quality fallback for heavier scenes.

8. **Give exploration a purpose.** Add meaningful activities to each realm, such as short missions, landmark interactions, or discoverable routes, so provinces feel like places to explore rather than themed maps with token pickups alone.

## Free Asset Sources

- [Poly Haven](https://polyhaven.com/) — CC0 models, materials, and HDRIs.
- [Kenney](https://kenney.nl/assets) — free CC0 game assets; check that the style fits the realism target.
- [Quaternius](https://quaternius.com/) — free game-ready assets under its asset license.
- [Mixamo](https://www.mixamo.com/) — rigged characters and animations; check Adobe's current terms.
- [Sketchfab](https://sketchfab.com/) — licenses vary by asset; check each model's license and attribution requirements.

Prefer optimized GLB/glTF assets where practical. Check and record each asset's source and license before including it in the project.

## Suggested Rollout

Choose one province as the visual target. Improve its character, vehicle, ground, lighting, and one signature landmark, then test the result on a low-end device. Reuse the proven asset and performance approach across the other 13 realms.
