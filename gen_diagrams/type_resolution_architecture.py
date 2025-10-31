from diagrams import Cluster, Diagram, Edge
from diagrams.custom import Custom
from diagrams.onprem.compute import Server
from diagrams.programming.language import Rust

from gen_diagrams.common import diag_path

with Diagram(
    "Type Resolution Architecture",
    filename=diag_path("type_resolution_architecture"),
    show=False,
    direction="TB",
):
    with Cluster("Input"):
        namespace_ctx = Rust("NamespaceCtx")

    with Cluster("TypeResolver Pipeline"):
        with Cluster("Phase 1"):
            phase1 = Server("Anonymous Struct\nExtraction")
            phase1_out = Custom("Vec<StructDef>", "./blank.png")

        with Cluster("Phase 2"):
            phase2 = Server("Union\nIdentification")
            phase2_out = Custom("Vec<UnionRecord>", "./blank.png")

        with Cluster("Phase 3"):
            phase3 = Server("Type Alias\nResolution")
            phase3_out = Custom("BTreeMap<Name, Type>", "./blank.png")

        with Cluster("Phase 4"):
            phase4 = Server("Union\nValidation")
            phase4_out = Custom("Validation Result", "./blank.png")

        with Cluster("Phase 5"):
            phase5 = Server("Union\nMerging")
            phase5_out = Custom("Vec<StructDef>", "./blank.png")

        with Cluster("Phase 6"):
            phase6 = Server("Version Metadata\nResolution")
            phase6_out = Custom("BTreeMap<Name, Version>", "./blank.png")

        with Cluster("Phase 7"):
            phase7 = Server("Error Metadata\nResolution")
            phase7_out = Custom("BTreeMap<Name, ErrorType>", "./blank.png")

        with Cluster("Phase 8"):
            phase8 = Server("Type Reference\nValidation")
            phase8_out = Custom("Validation Result", "./blank.png")

    with Cluster("Output"):
        namespace_resolution = Rust("NamespaceResolution")

    # Pipeline flow
    namespace_ctx >> Edge(label="input") >> phase1
    phase1 >> phase1_out
    phase1_out >> Edge(label="depends on") >> phase2
    phase2 >> phase2_out
    phase2_out >> Edge(label="depends on") >> phase3
    phase3 >> phase3_out
    phase3_out >> Edge(label="depends on") >> phase4
    phase4 >> phase4_out
    phase4_out >> Edge(label="depends on") >> phase5
    phase5 >> phase5_out
    phase5_out >> Edge(label="depends on") >> phase6
    phase6 >> phase6_out
    phase6_out >> Edge(label="depends on") >> phase7
    phase7 >> phase7_out
    phase7_out >> Edge(label="depends on") >> phase8
    phase8 >> phase8_out
    phase8_out >> Edge(label="output") >> namespace_resolution

print("Generated type_resolution_architecture.png")
