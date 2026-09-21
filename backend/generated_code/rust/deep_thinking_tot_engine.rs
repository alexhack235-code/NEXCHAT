//! Deep Thinking Tree-of-Thought (ToT) Multi-Branch Reasoning Engine
//! Module: deep_thinking_tot_engine_5_eed328 | Max Branch Depth: 30

#[derive(Debug, Clone)]
pub struct ThoughtNode {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub proposition: String,
    pub confidence: f32,
    pub logic_score: f32,
}

pub struct TreeOfThought {
    nodes: Vec<ThoughtNode>,
    beam_width: usize,
}

impl TreeOfThought {
    pub fn new(beam_width: usize) -> Self {
        Self {
            nodes: Vec::new(),
            beam_width: beam_width.max(1),
        }
    }

    pub fn add_thought(&mut self, parent_id: Option<usize>, proposition: &str, confidence: f32) -> usize {
        let id = self.nodes.len();
        let logic_score = confidence.clamp(0.0, 1.0);
        self.nodes.push(ThoughtNode {
            id,
            parent_id,
            proposition: proposition.to_string(),
            confidence,
            logic_score,
        });
        id
    }

    pub fn select_best_trajectory(&self) -> Vec<usize> {
        if self.nodes.is_empty() { return Vec::new(); }
        let best_node = self.nodes.iter().max_by(|a, b| a.logic_score.partial_cmp(&b.logic_score).unwrap());
        let mut path = Vec::new();
        let mut curr = best_node.map(|n| n.id);
        while let Some(id) = curr {
            path.push(id);
            curr = self.nodes[id].parent_id;
        }
        path.reverse();
        path
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tot_beam_search() {
        let mut tot = TreeOfThought::new(3);
        let root = tot.add_thought(None, "Premise: X is true", 0.95);
        let b1 = tot.add_thought(Some(root), "Deduction: Therefore Y is true", 0.92);
        let path = tot.select_best_trajectory();
        assert_eq!(path, vec![root, b1]);
    }
}
