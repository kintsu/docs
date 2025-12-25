"""
Diagram: Namespace compilation flow showing discovery → loading → ordering → compilation

Shows the complete pipeline from discovering namespace files to executing
type resolution stages.
"""

from diagrams.generic.blank import Blank

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

graph_attr = {
    "fontsize": "14",
    "bgcolor": "white",
    "pad": "0.5",
}

with Diagram(
    "Namespace Compilation Flow",
    filename=diag_path("namespace_compilation_flow"),
    direction="LR",
    graph_attr=graph_attr,
    outformat="png",
    show=False,
):
    with Cluster("1. Discovery"):
        discovery = Blank("Scan workspace\nfor .ks files")
        grouping = Blank("Group files by\nnamespace")

    with Cluster("2. Loading"):
        parallel_read = Blank("Parallel file\nreading (async I/O)")
        merging = Blank("Merge files\ninto namespaces")

    with Cluster("3. Ordering"):
        dep_graph = Blank("Build dependency\ngraph (imports)")
        depth_calc = Blank("Calculate depth\n(parent-child)")
        bfs_order = Blank("Breadth-first\nordering")

    with Cluster("4. Compilation"):
        depth0 = Blank("Depth 0\n(parallel)")
        depth1 = Blank("Depth 1\n(parallel)")
        depth2 = Blank("Depth 2\n(parallel)")

    with Cluster("Type Resolution (per namespace)"):
        stages = Blank(
            "8 Stages:\n1. Anonymous Structs\n2. Union Identification\n3. Type Aliases\n4. Union Validation\n5. Union Resolution\n6. Version Resolution\n7. Error Resolution\n8. Reference Validation"
        )

    # Flow
    discovery >> Edge(label="discover files") >> grouping
    grouping >> Edge(label="file groups") >> parallel_read
    parallel_read >> Edge(label="file contents") >> merging
    merging >> Edge(label="namespaces") >> dep_graph
    dep_graph >> Edge(label="dependencies") >> depth_calc
    depth_calc >> Edge(label="depth levels") >> bfs_order

    bfs_order >> Edge(label="depth 0") >> depth0
    depth0 >> Edge(label="depth 1") >> depth1
    depth1 >> Edge(label="depth 2") >> depth2

    [depth0, depth1, depth2] >> Edge(label="execute stages") >> stages

print("Generated namespace_compilation_flow.png")
