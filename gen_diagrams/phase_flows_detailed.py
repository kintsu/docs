from diagrams.generic.storage import Storage
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

with Diagram(
    "Detailed Phase Flows",
    filename=diag_path("phase_flows_detailed"),
    show=False,
    direction="TB",
):
    with Cluster("Phase 1: Anonymous Struct Extraction"):
        p1_input = Storage("Input:\nRaw types with\ninline structs")
        p1_process = Rust("Extract &\nName Structs")
        p1_output = Storage("Output:\nVec<StructDef>")

        (
            p1_input
            >> Edge(label="traverse")
            >> p1_process
            >> Edge(label="generate")
            >> p1_output
        )

    with Cluster("Phase 3: Type Alias Resolution"):
        p3_input = Storage("Input:\nType aliases")
        p3_process = Rust("Build Graph\nTopological Sort")
        p3_output = Storage("Output:\nBTreeMap<Name, Type>")

        (
            p3_input
            >> Edge(label="analyze")
            >> p3_process
            >> Edge(label="resolve")
            >> p3_output
        )

    with Cluster("Phase 5: Union Merging"):
        p5_input = Storage("Input:\nValidated unions")
        p5_process = Rust("Merge Fields\nLeft-to-Right")
        p5_output = Storage("Output:\nVec<StructDef>")

        (
            p5_input
            >> Edge(label="collect")
            >> p5_process
            >> Edge(label="generate")
            >> p5_output
        )

    with Cluster("Phase 6: Version Metadata Resolution"):
        p6_input = Storage("Input:\nTypes + metadata")
        p6_process = Rust("Apply Precedence\nItem > Namespace")
        p6_output = Storage("Output:\nBTreeMap<Name, Version>")

        (
            p6_input
            >> Edge(label="resolve")
            >> p6_process
            >> Edge(label="store")
            >> p6_output
        )

    with Cluster("Phase 8: Type Reference Validation"):
        p8_input = Storage("Input:\nAll type refs")
        p8_process = Rust("Check Registry\nValidate Exists")
        p8_output = Storage("Output:\nValidation Result")

        (
            p8_input
            >> Edge(label="validate")
            >> p8_process
            >> Edge(label="result")
            >> p8_output
        )

print("Generated phase_flows_detailed.png")
