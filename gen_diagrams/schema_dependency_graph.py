#!/usr/bin/env python3
"""
Schema Dependency Graph Diagram

Shows topological ordering of schemas for compilation:
- Schemas grouped into levels by dependencies
- Level 0: No dependencies (compile first)
- Level N: Depends only on levels 0..N-1
- Within level: compile concurrently
"""

from diagrams.generic.blank import Blank
from diagrams.programming.flowchart import Document

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
    "rankdir": "TB",
}

node_attr = {
    "fontsize": "12",
}

with Diagram(
    "Schema Dependency Graph",
    filename=diag_path("schema_dependency_graph"),
    graph_attr=graph_attr,
    node_attr=node_attr,
    direction="TB",
    show=False,
):
    with Cluster("Level 0 (No Dependencies)\n[Compile Concurrently]"):
        level0_a = Document("Schema A")
        level0_b = Document("Schema B")

    with Cluster("Level 1 (Depends on Level 0)\n[Compile Concurrently]"):
        level1_c = Document("Schema C\n(imports: A, B)")
        level1_d = Document("Schema D\n(imports: A)")

    with Cluster("Level 2 (Depends on Levels 0-1)\n[Compile Concurrently]"):
        level2_e = Document("Schema E\n(imports: C, D)")
        level2_f = Document("Schema F\n(imports: C)")

    # Dependencies (arrows point from dependency to dependent)
    level0_a >> Edge(label="imported by", style="dashed") >> level1_c
    level0_b >> Edge(label="imported by", style="dashed") >> level1_c
    level0_a >> Edge(label="imported by", style="dashed") >> level1_d

    level1_c >> Edge(label="imported by", style="dashed") >> level2_e
    level1_d >> Edge(label="imported by", style="dashed") >> level2_e
    level1_c >> Edge(label="imported by", style="dashed") >> level2_f

    # Compilation order note
    note = Blank("")
    note.label = "Topological Order:\nLevel 0 → Level 1 → Level 2\n\nParallelism:\nWithin each level, compile concurrently"
