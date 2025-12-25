from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
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
            phase1 = Action("Anonymous Struct\nExtraction")
            phase1_out = Storage("Vec<StructDef>")

        with Cluster("Phase 2"):
            phase2 = Action("Union\nIdentification")
            phase2_out = Storage("Vec<UnionRecord>")

        with Cluster("Phase 3"):
            phase3 = Action("Type Alias\nResolution")
            phase3_out = Storage("BTreeMap<Name, Type>")

        with Cluster("Phase 4"):
            phase4 = Action("Union\nValidation")
            phase4_out = Storage("Validation Result")

        with Cluster("Phase 5"):
            phase5 = Action("Union\nMerging")
            phase5_out = Storage("Vec<StructDef>")

        with Cluster("Phase 6"):
            phase6 = Action("Version Metadata\nResolution")
            phase6_out = Storage("BTreeMap<Name, Version>")

        with Cluster("Phase 7"):
            phase7 = Action("Error Metadata\nResolution")
            phase7_out = Storage("BTreeMap<Name, ErrorType>")

        with Cluster("Phase 8"):
            phase8 = Action("Type Reference\nValidation")
            phase8_out = Storage("Validation Result")

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
