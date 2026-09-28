extends Node3D

class_name LuxuryFPSWeapon

## AURUM-IX Luxury Plasma Railgun Controller for Godot 4.x
## Implements weapon sway, procedural spring recoil, and Aim Down Sights (ADS).

@export_category("Weapon Sockets")
@export var weapon_mesh: Node3D
@export var camera: Camera3D
@export var raycast: RayCast3D
@export var muzzle_flash: GPUParticles3D

@export_category("ADS Positioning")
@export var hip_pos: Vector3 = Vector3(0.24, -0.22, -0.5)
@export var ads_pos: Vector3 = Vector3(0.0, -0.12, -0.38)
@export var normal_fov: float = 75.0
@export var ads_fov: float = 45.0
@export var ads_speed: float = 14.0

@export_category("Recoil & Sway")
@export var recoil_amount: Vector3 = Vector3(0.08, 0.02, 0.12)
@export var sway_amount: float = 0.001
@export var sway_smoothness: float = 8.0

var is_aiming: bool = false
var recoil_pos: Vector3 = Vector3.ZERO
var recoil_rot: Vector3 = Vector3.ZERO
var mouse_input: Vector2 = Vector2.ZERO

func _ready() -> void:
	if weapon_mesh:
		weapon_mesh.position = hip_pos

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		mouse_input = event.relative

	if event.is_action_pressed("fire"):
		shoot()

	if event.is_action_pressed("ads"):
		is_aiming = true
	elif event.is_action_released("ads"):
		is_aiming = false

func _process(delta: float) -> void:
	# ADS Interpolation
	var target_pos = ads_pos if is_aiming else hip_pos
	var target_fov = ads_fov if is_aiming else normal_fov

	if camera:
		camera.fov = lerp(camera.fov, target_fov, ads_speed * delta)

	# Sway
	var sway_x = clamp(-mouse_input.x * sway_amount, -0.05, 0.05)
	var sway_y = clamp(-mouse_input.y * sway_amount, -0.05, 0.05)
	mouse_input = Vector2.ZERO

	# Recoil decay
	recoil_pos = recoil_pos.lerp(Vector3.ZERO, 10.0 * delta)
	recoil_rot = recoil_rot.lerp(Vector3.ZERO, 12.0 * delta)

	if weapon_mesh:
		var final_pos = target_pos + Vector3(sway_x, sway_y, 0.0) + recoil_pos
		weapon_mesh.position = weapon_mesh.position.lerp(final_pos, 16.0 * delta)
		weapon_mesh.rotation = weapon_mesh.rotation.lerp(recoil_rot, 16.0 * delta)

func shoot() -> void:
	var mult = 0.4 if is_aiming else 1.0
	recoil_pos.z += recoil_amount.z * mult
	recoil_rot.x += recoil_amount.x * mult

	if muzzle_flash:
		muzzle_flash.restart()

	if raycast and raycast.is_colliding():
		var collider = raycast.get_collider()
		print("[AURUM-IX] Hit: ", collider)
