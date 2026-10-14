-- Recursive Common Table Expression (CTE) for Tree/Graph Traversal
-- Module: hierarchical_recursive_cte_12_5f884f | Recursion Max Depth: 65

WITH RECURSIVE org_hierarchy AS (
    -- Anchor member: root organizational units
    SELECT 
        id, 
        parent_id, 
        name, 
        1 AS depth, 
        ARRAY[id] AS path
    FROM departments
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive member: child departments
    SELECT 
        d.id, 
        d.parent_id, 
        d.name, 
        h.depth + 1, 
        h.path || d.id
    FROM departments d
    INNER JOIN org_hierarchy h ON d.parent_id = h.id
    WHERE h.depth < 65 AND NOT (d.id = ANY(h.path)) -- Cycle avoidance
)
SELECT 
    id, 
    REPEAT('  ', depth - 1) || name AS indented_tree, 
    depth, 
    path
FROM org_hierarchy
ORDER BY path;
