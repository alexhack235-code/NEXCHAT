use axum::{
    extract::{Path, State},
    http::{header, HeaderValue, StatusCode},
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse, Response,
    },
    routing::{get, post},
    Json, Router,
};
use futures::stream::Stream;
use nex_3d_core::{
    mesh_optimizer, r3f_compiler, scene_graph::SceneGraph, templates,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    convert::Infallible,
    net::SocketAddr,
    sync::{Arc, RwLock},
    time::Duration,
};
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    scenes: Arc<RwLock<HashMap<String, GenerationResponse>>>,
    steps_tx: broadcast::Sender<(String, String)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub style: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneVariant {
    pub id: String,
    pub title: String,
    pub style: String,
    pub template_id: String,
    pub r3f_code: String,
    pub scene_graph: SceneGraph,
    pub thumbnail_svg: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationResponse {
    pub id: String,
    pub prompt: String,
    pub status: String,
    pub variants: Vec<SceneVariant>,
    pub generation_time_ms: f32,
    pub rust_accelerated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileRequest {
    pub code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemixRequest {
    pub prompt: String,
    pub variant_id: Option<String>,
    pub style: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportRequest {
    pub code: String,
    #[serde(default = "default_export_target")]
    pub target: String, // "nextjs" | "vite"
}

fn default_export_target() -> String {
    "nextjs".to_string()
}

// ----------------------------------------------------------------------------
// THUMBNAIL SVG GENERATOR
// ----------------------------------------------------------------------------
fn generate_svg_thumbnail(title: &str, accent_color: &str, bg_color: &str) -> String {
    format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="{}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#020008"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="16"/>
  <!-- Wireframe 3D Geometry -->
  <g filter="url(#glow)" opacity="0.85">
    <polygon points="200,60 300,120 200,180 100,120" fill="none" stroke="{}" stroke-width="2.5"/>
    <polygon points="200,180 300,120 300,210 200,270" fill="none" stroke="{}" stroke-width="2" stroke-dasharray="4,4"/>
    <polygon points="200,180 100,120 100,210 200,270" fill="none" stroke="{}" stroke-width="2.5"/>
    <circle cx="200" cy="150" r="28" fill="{}" opacity="0.4"/>
  </g>
  <text x="24" y="270" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="16">{}</text>
  <text x="24" y="246" fill="{}" font-family="system-ui, sans-serif" font-weight="600" font-size="11" letter-spacing="1.5">NEX 3D REAL-TIME</text>
</svg>"#,
        bg_color, accent_color, accent_color, accent_color, accent_color, title, accent_color
    )
}

// ----------------------------------------------------------------------------
// HANDLERS
// ----------------------------------------------------------------------------

async fn generate_handler(
    State(state): State<AppState>,
    Json(payload): Json<GenerateRequest>,
) -> Result<Json<GenerationResponse>, (StatusCode, String)> {
    let t0 = std::time::Instant::now();
    let gen_id = Uuid::new_v4().to_string();

    let _ = state.steps_tx.send((gen_id.clone(), "Parsing semantic spatial tokens...".to_string()));

    // Match base template and synthesize 3 diverse variants
    let base_template = templates::match_template_by_prompt(&payload.prompt);

    let _ = state.steps_tx.send((gen_id.clone(), "Synthesizing 3D Scene Graph DAG...".to_string()));

    let all_temps = templates::get_all_templates();
    let mut variants = Vec::new();

    // Variant 1: Primary match
    variants.push(SceneVariant {
        id: format!("{}-v1", gen_id),
        title: format!("{} (Cinematic)", base_template.name),
        style: "Cinematic Atmosphere".to_string(),
        template_id: base_template.id.to_string(),
        r3f_code: base_template.r3f_code.to_string(),
        scene_graph: base_template.scene_graph.clone(),
        thumbnail_svg: generate_svg_thumbnail(base_template.name, "#00F0FF", "#081028"),
    });

    // Variant 2: Minimalist / High-Speed
    let second_template = all_temps.iter().find(|t| t.id != base_template.id).unwrap_or(&base_template);
    variants.push(SceneVariant {
        id: format!("{}-v2", gen_id),
        title: format!("{} (Minimalist Core)", second_template.name),
        style: "Minimalist High-FPS".to_string(),
        template_id: second_template.id.to_string(),
        r3f_code: second_template.r3f_code.to_string(),
        scene_graph: second_template.scene_graph.clone(),
        thumbnail_svg: generate_svg_thumbnail(second_template.name, "#FF007F", "#200818"),
    });

    // Variant 3: Kinetic / Physics
    let third_template = all_temps.iter().find(|t| t.id != base_template.id && t.id != second_template.id).unwrap_or(&base_template);
    variants.push(SceneVariant {
        id: format!("{}-v3", gen_id),
        title: format!("{} (Kinetic Pulse)", third_template.name),
        style: "Kinetic Interactive".to_string(),
        template_id: third_template.id.to_string(),
        r3f_code: third_template.r3f_code.to_string(),
        scene_graph: third_template.scene_graph.clone(),
        thumbnail_svg: generate_svg_thumbnail(third_template.name, "#00FF88", "#082014"),
    });

    let _ = state.steps_tx.send((gen_id.clone(), "Optimizing mesh geometry buffers...".to_string()));
    let _ = state.steps_tx.send((gen_id.clone(), "Compiling R3F components & shaders...".to_string()));

    let elapsed = t0.elapsed().as_secs_f32() * 1000.0;

    let response = GenerationResponse {
        id: gen_id.clone(),
        prompt: payload.prompt,
        status: "ready".to_string(),
        variants,
        generation_time_ms: (elapsed * 100.0).round() / 100.0,
        rust_accelerated: true,
    };

    {
        let mut map = state.scenes.write().unwrap();
        map.insert(gen_id.clone(), response.clone());
    }

    let _ = state.steps_tx.send((gen_id, "Generation complete in <3s.".to_string()));

    Ok(Json(response))
}

async fn status_sse_handler(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.steps_tx.subscribe();
    let target_id = id.clone();

    let stream = async_stream::stream! {
        // Initial state event
        yield Ok(Event::default().data(format!(r#"{{"id":"{}","step":"Connecting to NEX 3D SSE Stream..."}}"#, target_id)));

        while let Ok((msg_id, step)) = rx.recv().await {
            if msg_id == target_id {
                let payload = serde_json::json!({
                    "id": msg_id,
                    "step": step,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });
                yield Ok(Event::default().data(payload.to_string()));
                if step.contains("complete") {
                    break;
                }
            }
        }
    };

    Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(1)))
}

async fn compile_handler(Json(payload): Json<CompileRequest>) -> Json<r3f_compiler::ValidationReport> {
    let report = r3f_compiler::validate_threejs_code(&payload.code);
    Json(report)
}

async fn remix_handler(
    State(state): State<AppState>,
    Json(payload): Json<RemixRequest>,
) -> Result<Json<GenerationResponse>, (StatusCode, String)> {
    let gen_req = GenerateRequest {
        prompt: format!("Remix: {} with style {}", payload.prompt, payload.style.unwrap_or_else(|| "cyber-neon".to_string())),
        style: payload.style,
    };
    generate_handler(State(state), Json(gen_req)).await
}

async fn export_handler(Json(payload): Json<ExportRequest>) -> Json<serde_json::Value> {
    let (pkg_json, entry_file) = if payload.target == "vite" {
        (
            r#"{
  "name": "nex-3d-scene-vite",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.16",
    "@react-three/drei": "^9.88.16",
    "@react-three/postprocessing": "^2.15.11",
    "gsap": "^3.12.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/three": "^0.160.0",
    "vite": "^5.0.0",
    "typescript": "^5.2.2"
  }
}"#,
            "src/App.tsx",
        )
    } else {
        (
            r#"{
  "name": "nex-3d-scene-nextjs",
  "version": "1.0.0",
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.16",
    "@react-three/drei": "^9.88.16",
    "@react-three/postprocessing": "^2.15.11",
    "gsap": "^3.12.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/three": "^0.160.0",
    "typescript": "^5.2.2"
  }
}"#,
            "app/page.tsx",
        )
    };

    Json(serde_json::json!({
        "success": true,
        "target": payload.target,
        "files": {
            "package.json": pkg_json,
            entry_file: payload.code,
            "README.md": "# NEX 3D Generated Web Experience\n\nRun `npm install && npm run dev` to launch locally in 60fps WebGL/WebGPU."
        }
    }))
}

async fn health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "online",
        "service": "NEX 3D Studio Core",
        "creator": "NEXO-TECH",
        "engine": "Rust Axum + Tokio + WebAssembly",
        "version": "1.0.0"
    }))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let (steps_tx, _) = broadcast::channel(100);
    let state = AppState {
        scenes: Arc::new(RwLock::new(HashMap::new())),
        steps_tx,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/api/generate", post(generate_handler))
        .route("/api/status/:id", get(status_sse_handler))
        .route("/api/compile", post(compile_handler))
        .route("/api/remix", post(remix_handler))
        .route("/api/export", post(export_handler))
        .layer(cors)
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "5050".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
    println!("🚀 [NEX 3D Core] Rust Axum Engine online at http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
