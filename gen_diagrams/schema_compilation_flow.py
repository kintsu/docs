from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action, PredefinedProcess
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
    "rankdir": "TB",
}

with Diagram(
    "Schema Compilation Flow",
    filename=diag_path("schema_compilation_flow"),
    outformat="png",
    graph_attr=graph_attr,
    direction="TB",
    show=False,
):
    with Cluster("Phase 1: Dependency Loading"):
        load_root = Rust("Load Root Schema")
        load_deps = PredefinedProcess("Load Dependencies\n(parallel worker pool)")
        load_root >> Edge(label="discover\nimports") >> load_deps

    with Cluster("Phase 2: Graph Construction"):
        build_graph = Action("Build Dependency Graph\n(BTreeMap)")
        detect_cycles = Action("Detect Circular\nDependencies (SCC)")
        topo_sort = Action("Topological Sort\n(custom BFS)")

        load_deps >> Edge(label="all schemas\nloaded") >> build_graph
        build_graph >> Edge(label="schema graph") >> detect_cycles
        detect_cycles >> Edge(label="no cycles") >> topo_sort
        (
            detect_cycles
            >> Edge(label="cycle found", color="red", style="dashed")
            >> Storage("Error:\nCircular Dependency")
        )

    with Cluster("Phase 3: Schema Compilation"):
        compile_levels = PredefinedProcess("Compile Schemas\n(sequential within level)")
        register_types = Action("Register Types\n(in TypeRegistry)")

        topo_sort >> Edge(label="topological\nlevels") >> compile_levels
        compile_levels >> Edge(label="all types") >> register_types

    with Cluster("Phase 4: Type Resolution"):
        resolve_levels = PredefinedProcess("Resolve Types\n(sequential within level)")
        integrate = Action("Integrate Resolution\n(8 phases per namespace)")

        register_types >> Edge(label="all types\nregistered") >> resolve_levels
        resolve_levels >> Edge(label="per namespace") >> integrate

    complete = Storage("Compilation Complete")
    integrate >> Edge(label="all namespaces\nresolved") >> complete
