use crate::scene_graph::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub severity: String, // "error" | "warning" | "info"
    pub message: String,
    pub line: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationReport {
    pub valid: bool,
    pub errors_count: usize,
    pub warnings_count: usize,
    pub issues: Vec<ValidationIssue>,
    pub loc: usize,
    pub features_detected: Vec<String>,
}

pub fn validate_threejs_code(code: &str) -> ValidationReport {
    let mut issues = Vec::new();
    let mut features = Vec::new();

    // 1. Canvas presence
    if code.contains("<Canvas") {
        features.push("Canvas Component".to_string());
    } else {
        issues.push(ValidationIssue {
            severity: "error".to_string(),
            message: "Missing essential <Canvas> root container from @react-three/fiber".to_string(),
            line: None,
        });
    }

    // 2. Lighting detection
    if code.contains("ambientLight") || code.contains("directionalLight") || code.contains("pointLight") || code.contains("SpotLight") {
        features.push("3D Lighting".to_string());
    } else {
        issues.push(ValidationIssue {
            severity: "warning".to_string(),
            message: "No lighting found in scene; 3D meshes may render completely black".to_string(),
            line: None,
        });
    }

    // 3. Post-processing
    if code.contains("EffectComposer") {
        features.push("Post-Processing Pipeline".to_string());
        if code.contains("Bloom") {
            features.push("Bloom Shaders".to_string());
        }
    }

    // 4. OrbitControls
    if code.contains("OrbitControls") {
        features.push("OrbitControls Navigation".to_string());
    }

    // 5. Basic JSX tag balance check
    let open_count = code.matches('<').count();
    let close_count = code.matches('>').count();
    if open_count != close_count {
        issues.push(ValidationIssue {
            severity: "warning".to_string(),
            message: format!("Potential unbalanced JSX angle brackets: {} open, {} close", open_count, close_count),
            line: None,
        });
    }

    // 6. Check for disallowed raw HTML script injections
    if code.to_lowercase().contains("<script") {
        issues.push(ValidationIssue {
            severity: "error".to_string(),
            message: "Disallowed <script> tag detected inside 3D scene".to_string(),
            line: None,
        });
    }

    let errors_count = issues.iter().filter(|i| i.severity == "error").count();
    let warnings_count = issues.iter().filter(|i| i.severity == "warning").count();

    ValidationReport {
        valid: errors_count == 0,
        errors_count,
        warnings_count,
        issues,
        loc: code.lines().count(),
        features_detected: features,
    }
}

pub fn compile_scene_graph_to_r3f(sg: &SceneGraph) -> String {
    let mut objects_jsx = String::new();

    for (idx, obj) in sg.objects.iter().enumerate() {
        let geom_tag = match obj.geometry.as_str() {
            "box" => "<boxGeometry args={[2, 2, 2]} />",
            "sphere" => "<sphereGeometry args={[1.5, 32, 32]} />",
            "torus" => "<torusGeometry args={[2, 0.4, 16, 64]} />",
            "plane" => "<planeGeometry args={[20, 20]} />",
            _ => "<boxGeometry args={[1.5, 1.5, 1.5]} />",
        };

        let material_jsx = format!(
            r#"<meshStandardMaterial color="{}" metalness={{{:.2}}} roughness={{{:.2}}} emissive="{}" />"#,
            obj.material.color, obj.material.metalness, obj.material.roughness, obj.material.emissive
        );

        let mesh_body = format!(
            r#"      <mesh key="{}" position={{{:?}}} rotation={{{:?}}}>
        {}
        {}
      </mesh>"#,
            idx, obj.position, obj.rotation, geom_tag, material_jsx
        );

        if obj.animation.anim_type == "float" {
            objects_jsx.push_str(&format!(
                r#"      <Float speed={{{:.1}}} rotationIntensity={{{:.1}}}>
{}
      </Float>
"#,
                obj.animation.duration, obj.animation.intensity, mesh_body
            ));
        } else {
            objects_jsx.push_str(&mesh_body);
            objects_jsx.push('\n');
        }
    }

    let postprocessing_jsx = if sg.postprocessing.contains(&"bloom".to_string()) {
        r#"        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={1.8} />
        </EffectComposer>"#
    } else {
        ""
    };

    let interaction_jsx = if sg.interactions.contains(&"orbitControls".to_string()) {
        "        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />"
    } else {
        ""
    };

    format!(
        r#"import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function GeneratedScene() {{
  return (
    <div style={{{{ width: '100%', height: '100%', background: '{}', position: 'relative' }}}}>
      <Canvas camera={{{{ position: {:?}, fov: {} }}}}>
        <color attach="background" args={{{:?}}} />
        <ambientLight intensity={{0.5}} />
        <directionalLight position={{[10, 10, 5]}} intensity={{1.2}} />
        <pointLight position={{[-10, -10, -5]}} intensity={{0.8}} />

{}
{}
{}
      </Canvas>
    </div>
  );
}}
"#,
        sg.scene.background,
        sg.camera.position,
        sg.camera.fov,
        [sg.scene.background.clone()],
        objects_jsx,
        interaction_jsx,
        postprocessing_jsx
    )
}
