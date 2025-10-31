from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from gen_diagrams.common import OPTS, diag_path


def alias_resolution_flow():
    parse_aliases = Rust("Parse All\nType Aliases")

    with Cluster("Dependency Analysis"):
        extract_deps = Action("Extract\nDependencies")
        build_graph = Storage("Build Alias\nDependency Graph")

    with Cluster("Cycle Detection"):
        dfs_check = Action("DFS Cycle\nDetection")
        report_cycle = Storage("Report Cycle\nPath (if found)")

    with Cluster("Topological Ordering"):
        compute_indegree = Action("Compute\nIn-Degrees")
        kahns_algorithm = Storage("Kahn's Algorithm\n(Topological Sort)")
        topo_order = Rust("Resolution Order\n[A, B, D, C]")

    with Cluster("Resolution"):
        resolve_in_order = Action("Resolve Each Alias\n(in topo order)")
        store_resolved = Storage("Store Resolved\nTypes")

    register = Rust("Register in\nType Registry")

    # Main flow
    parse_aliases >> Edge(label="extract") >> extract_deps
    extract_deps >> Edge(label="build") >> build_graph
    build_graph >> Edge(label="check") >> dfs_check
    dfs_check >> Edge(label="if cycle") >> report_cycle
    dfs_check >> Edge(label="no cycle") >> compute_indegree
    compute_indegree >> Edge(label="sort") >> kahns_algorithm
    kahns_algorithm >> Edge(label="produce") >> topo_order
    topo_order >> Edge(label="resolve") >> resolve_in_order
    resolve_in_order >> Edge(label="store") >> store_resolved
    store_resolved >> Edge(label="register") >> register


if __name__ == "__main__":
    with Diagram(
        "Alias Resolution Flow",
        filename=diag_path("alias_resolution_flow"),
        direction="LR",
        **OPTS,
    ):
        alias_resolution_flow()
