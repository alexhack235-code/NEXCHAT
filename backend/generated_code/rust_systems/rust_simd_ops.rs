//! High-Performance SIMD Vector Calculations in Rust
//! Module: rust_simd_ops_23_5750f8 | Vector Dimension: 120

pub struct VectorOps;

impl VectorOps {
    pub fn dot_product(a: &[f32], b: &[f32]) -> f32 {
        assert_eq!(a.len(), b.len(), "Vector lengths must match");
        a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
    }

    pub fn magnitude(a: &[f32]) -> f32 {
        Self::dot_product(a, a).sqrt()
    }

    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        let mag_a = Self::magnitude(a);
        let mag_b = Self::magnitude(b);
        if mag_a == 0.0 || mag_b == 0.0 {
            0.0
        } else {
            Self::dot_product(a, b) / (mag_a * mag_b)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dot_product() {
        let v1 = [1.0, 2.0, 3.0];
        let v2 = [4.0, 5.0, 6.0];
        assert_eq!(VectorOps::dot_product(&v1, &v2), 32.0);
    }
}
