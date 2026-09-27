use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneEnvironment {
    #[serde(default = "default_fog")]
    pub fog: String,
    #[serde(default = "default_background")]
    pub background: String,
    #[serde(default = "default_lighting")]
    pub lighting: String,
}

fn default_fog() -> String { "#0a0a12, 10, 50".to_string() }
fn default_background() -> String { "#05050a".to_string() }
fn default_lighting() -> String { "studio_cyberpunk".to_string() }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraConfig {
    #[serde(default = "default_camera_pos")]
    pub position: [f32; 3],
    #[serde(default = "default_fov")]
    pub fov: f32,
}

fn default_camera_pos() -> [f32; 3] { [0.0, 2.0, 10.0] }
fn default_fov() -> f32 { 50.0 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialConfig {
    #[serde(default = "default_color")]
    pub color: String,
    #[serde(default = "default_metalness")]
    pub metalness: f32,
    #[serde(default = "default_roughness")]
    pub roughness: f32,
    #[serde(default = "default_emissive")]
    pub emissive: String,
}

fn default_color() -> String { "#00FF88".to_string() }
fn default_metalness() -> f32 { 0.8 }
fn default_roughness() -> f32 { 0.2 }
fn default_emissive() -> String { "#003311".to_string() }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    #[serde(rename = "type", default = "default_anim_type")]
    pub anim_type: String, // float | rotate | scrollTrigger | mouseMove
    #[serde(default = "default_anim_duration")]
    pub duration: f32,
    #[serde(default = "default_anim_intensity")]
    pub intensity: f32,
}

fn default_anim_type() -> String { "float".to_string() }
fn default_anim_duration() -> f32 { 2.0 }
fn default_anim_intensity() -> f32 { 1.0 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneObject {
    #[serde(rename = "type")]
    pub object_type: String, // mesh | particles | text | model
    pub geometry: String,    // box | sphere | torus | plane | custom
    pub material: MaterialConfig,
    pub position: [f32; 3],
    pub rotation: [f32; 3],
    pub animation: AnimationConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneGraph {
    pub title: String,
    pub scene: SceneEnvironment,
    pub camera: CameraConfig,
    pub objects: Vec<SceneObject>,
    pub postprocessing: Vec<String>, // bloom | chromatic | glitch | depthOfField
    pub interactions: Vec<String>,   // orbitControls | scroll | pointerLock
}

impl SceneGraph {
    pub fn new_cyberpunk_city() -> Self {
        Self {
            title: "Cyberpunk Metropolis 2099".to_string(),
            scene: SceneEnvironment {
                fog: "#050014, 5, 45".to_string(),
                background: "#030008".to_string(),
                lighting: "neon_dual".to_string(),
            },
            camera: CameraConfig {
                position: [0.0, 3.0, 12.0],
                fov: 55.0,
            },
            objects: vec![
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "box".to_string(),
                    material: MaterialConfig {
                        color: "#00F0FF".to_string(),
                        metalness: 0.9,
                        roughness: 0.1,
                        emissive: "#003344".to_string(),
                    },
                    position: [-4.0, 2.0, -2.0],
                    rotation: [0.0, 0.4, 0.0],
                    animation: AnimationConfig {
                        anim_type: "float".to_string(),
                        duration: 3.0,
                        intensity: 1.2,
                    },
                },
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "torus".to_string(),
                    material: MaterialConfig {
                        color: "#FF007F".to_string(),
                        metalness: 0.85,
                        roughness: 0.15,
                        emissive: "#440022".to_string(),
                    },
                    position: [4.0, 2.5, -1.0],
                    rotation: [1.2, 0.5, 0.0],
                    animation: AnimationConfig {
                        anim_type: "rotate".to_string(),
                        duration: 4.0,
                        intensity: 1.5,
                    },
                },
                SceneObject {
                    object_type: "particles".to_string(),
                    geometry: "sphere".to_string(),
                    material: MaterialConfig {
                        color: "#FFE600".to_string(),
                        metalness: 0.3,
                        roughness: 0.5,
                        emissive: "#FFE600".to_string(),
                    },
                    position: [0.0, 5.0, 0.0],
                    rotation: [0.0, 0.0, 0.0],
                    animation: AnimationConfig {
                        anim_type: "float".to_string(),
                        duration: 1.5,
                        intensity: 2.0,
                    },
                },
                SceneObject {
                    object_type: "mesh".to_string(),
                    geometry: "plane".to_string(),
                    material: MaterialConfig {
                        color: "#111122".to_string(),
                        metalness: 0.95,
                        roughness: 0.05,
                        emissive: "#050510".to_string(),
                    },
                    position: [0.0, -1.0, 0.0],
                    rotation: [-1.5707, 0.0, 0.0],
                    animation: AnimationConfig {
                        anim_type: "none".to_string(),
                        duration: 0.0,
                        intensity: 0.0,
                    },
                },
            ],
            postprocessing: vec!["bloom".to_string(), "chromatic".to_string()],
            interactions: vec!["orbitControls".to_string(), "scroll".to_string()],
        }
    }
}
