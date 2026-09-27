from hnsw import HnswIndex


def test_add_vector_and_query():
    idx = HnswIndex(dim=3)
    idx.add_vector([0.0, 0.0, 0.0])
    idx.add_vector([1.0, 0.0, 0.0])
    idx.add_vector([0.0, 1.0, 0.0])

    results = idx.query([0.1, 0.1, 0.0], top_k=2)
    assert len(results) == 2
    assert results[0][0] == 0
