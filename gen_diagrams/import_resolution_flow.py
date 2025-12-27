"""
Diagram: Import resolution flow showing use statement -> path resolution -> type lookup

Shows how import statements are parsed, paths resolved through namespace
hierarchy, and types validated.
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
    "Import Resolution Flow",
    filename=diag_path("import_resolution_flow"),
    direction="LR",
    graph_attr=graph_attr,
    outformat="png",
    show=False,
):
    with Cluster("Use Statement"):
        use_stmt = Blank("use abc::types::User;")

    with Cluster("Path Parsing"):
        path_split = Blank("Split by ::\n['abc', 'types', 'User']")
        root_segment = Blank("Root: 'abc'")
        child_segments = Blank("Path: ['types', 'User']")

    with Cluster("Dependency Check"):
        dep_check = Blank("Check dependencies\nin schema.toml")
        dep_result = Blank("'abc' found ✓\nor\npackage not found ✗")

    with Cluster("Namespace Traversal"):
        namespace_lookup = Blank("Lookup 'abc'\n(schema or namespace)")
        child_lookup = Blank("Enter 'types'\n(child namespace)")

    with Cluster("Type Resolution"):
        type_lookup = Blank("Find 'User' in\n'abc::types'")
        validation = Blank("Validate type exists")

    with Cluster("Result"):
        success = Blank("Import resolved ✓\nUser available")
        error = Blank("Error:\npackage/namespace/\ntype not found ✗")

    # Flow
    use_stmt >> Edge(label="parse") >> path_split
    path_split >> Edge(label="extract segments") >> root_segment
    root_segment >> Edge(label="root segment") >> dep_check
    dep_check >> Edge(label="validated") >> dep_result

    dep_result >> Edge(label="if cross-schema") >> namespace_lookup
    root_segment >> Edge(label="if within-schema") >> namespace_lookup

    path_split >> Edge(label="remaining") >> child_segments
    namespace_lookup >> Edge(label="traverse") >> child_lookup
    child_segments >> Edge(label="segments") >> child_lookup

    child_lookup >> Edge(label="final segment") >> type_lookup
    type_lookup >> Edge(label="validate") >> validation

    validation >> Edge(label="success") >> success
    validation >> Edge(label="failure") >> error
    dep_result >> Edge(label="missing dep") >> error

print("Generated import_resolution_flow.png")
