use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizedMeshOutput {
    pub vertex_count_before: usize,
    pub vertex_count_after: usize,
    pub compression_ratio: f32,
    pub indices_count: usize,
    pub quantized_bytes_size: usize,
    pub execution_time_ms: f32,
}

/// Quantizes and deduplicates vertex buffer (Draco-style coordinate quantization)
pub fn optimize_mesh_data(positions: &[f32], indices: &[u32], quantize_bits: u32) -> (Vec<f32>, Vec<u32>, OptimizedMeshOutput) {
    let t0 = std::time::Instant::now();
    let num_verts = positions.len() / 3;

    if num_verts == 0 {
        return (Vec::new(), Vec::new(), OptimizedMeshOutput {
            vertex_count_before: 0,
            vertex_count_after: 0,
            compression_ratio: 1.0,
            indices_count: 0,
            quantized_bytes_size: 0,
            execution_time_ms: 0.0,
        });
    }

    // Find bounding box
    let mut min = [f32::MAX, f32::MAX, f32::MAX];
    let mut max = [f32::MIN, f32::MIN, f32::MIN];
    for chunk in positions.chunks_exact(3) {
        for i in 0..3 {
            if chunk[i] < min[i] { min[i] = chunk[i]; }
            if chunk[i] > max[i] { max[i] = chunk[i]; }
        }
    }

    let scale = [
        if max[0] > min[0] { (1 << quantize_bits) as f32 / (max[0] - min[0]) } else { 1.0 },
        if max[1] > min[1] { (1 << quantize_bits) as f32 / (max[1] - min[1]) } else { 1.0 },
        if max[2] > min[2] { (1 << quantize_bits) as f32 / (max[2] - min[2]) } else { 1.0 },
    ];

    // Quantize and deduplicate
    let mut unique_map: HashMap<[i32; 3], u32> = HashMap::new();
    let mut new_positions = Vec::new();
    let mut index_remap = vec![0u32; num_verts];

    for (v_idx, chunk) in positions.chunks_exact(3).enumerate() {
        let q = [
            ((chunk[0] - min[0]) * scale[0]) as i32,
            ((chunk[1] - min[1]) * scale[1]) as i32,
            ((chunk[2] - min[2]) * scale[2]) as i32,
        ];

        if let Some(&existing_idx) = unique_map.get(&q) {
            index_remap[v_idx] = existing_idx;
        } else {
            let new_idx = (new_positions.len() / 3) as u32;
            unique_map.insert(q, new_idx);
            new_positions.push(chunk[0]);
            new_positions.push(chunk[1]);
            new_positions.push(chunk[2]);
            index_remap[v_idx] = new_idx;
        }
    }

    let new_indices: Vec<u32> = indices.iter().map(|&idx| {
        if (idx as usize) < index_remap.len() {
            index_remap[idx as usize]
        } else {
            idx
        }
    }).collect();

    let before_bytes = positions.len() * 4 + indices.len() * 4;
    let after_bytes = new_positions.len() * 4 + new_indices.len() * 4;
    let ratio = if before_bytes > 0 { after_bytes as f32 / before_bytes as f32 } else { 1.0 };
    let elapsed = t0.elapsed().as_secs_f32() * 1000.0;

    let meta = OptimizedMeshOutput {
        vertex_count_before: num_verts,
        vertex_count_after: new_positions.len() / 3,
        compression_ratio: (ratio * 100.0).round() / 100.0,
        indices_count: new_indices.len(),
        quantized_bytes_size: after_bytes,
        execution_time_ms: (elapsed * 100.0).round() / 100.0,
    };

    (new_positions, new_indices, meta)
}

// ============================================================================
// WASM Bindings for In-Browser / Node Preview Compilation
// ============================================================================

#[wasm_bindgen]
pub fn wasm_validate_r3f(code: &str) -> String {
    let report = crate::r3f_compiler::validate_threejs_code(code);
    serde_json::to_string(&report).unwrap_or_else(|_| "{}".to_string())
}

#[wasm_bindgen]
pub fn wasm_compile_scene_graph(json_str: &str) -> String {
    match serde_json::from_str::<crate::scene_graph::SceneGraph>(json_str) {
        Ok(sg) => crate::r3f_compiler::compile_scene_graph_to_r3f(&sg),
        Err(e) => format!("// Error parsing SceneGraph: {}", e),
    }
}
