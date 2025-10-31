from diagrams import Cluster, Diagram, Edge
from diagrams.custom import Custom
from diagrams.programming.language import Rust

from gen_diagrams.common import diag_path

with Diagram(
    "Detailed Phase Flows",
    filename=diag_path("phase_flows_detailed"),
    show=False,
    direction="TB",
):
    with Cluster("Phase 1: Anonymous Struct Extraction"):
        p1_input = Custom("Input:\nRaw types with\ninline structs", "./blank.png")
        p1_process = Rust("Extract &\nName Structs")
        p1_output = Custom("Output:\nVec<StructDef>", "./blank.png")

        (
            p1_input
            >> Edge(label="traverse")
            >> p1_process
            >> Edge(label="generate")
            >> p1_output
        )

    with Cluster("Phase 3: Type Alias Resolution"):
        p3_input = Custom("Input:\nType aliases", "./blank.png")
        p3_process = Rust("Build Graph\nTopological Sort")
        p3_output = Custom("Output:\nBTreeMap<Name, Type>", "./blank.png")

        (
            p3_input
            >> Edge(label="analyze")
            >> p3_process
            >> Edge(label="resolve")
            >> p3_output
        )

    with Cluster("Phase 5: Union Merging"):
        p5_input = Custom("Input:\nValidated unions", "./blank.png")
        p5_process = Rust("Merge Fields\nLeft-to-Right")
        p5_output = Custom("Output:\nVec<StructDef>", "./blank.png")

        (
            p5_input
            >> Edge(label="collect")
            >> p5_process
            >> Edge(label="generate")
            >> p5_output
        )

    with Cluster("Phase 6: Version Metadata Resolution"):
        p6_input = Custom("Input:\nTypes + metadata", "./blank.png")
        p6_process = Rust("Apply Precedence\nItem > Namespace")
        p6_output = Custom("Output:\nBTreeMap<Name, Version>", "./blank.png")

        (
            p6_input
            >> Edge(label="resolve")
            >> p6_process
            >> Edge(label="store")
            >> p6_output
        )

    with Cluster("Phase 8: Type Reference Validation"):
        p8_input = Custom("Input:\nAll type refs", "./blank.png")
        p8_process = Rust("Check Registry\nValidate Exists")
        p8_output = Custom("Output:\nValidation Result", "./blank.png")

        (
            p8_input
            >> Edge(label="validate")
            >> p8_process
            >> Edge(label="result")
            >> p8_output
        )

print("Generated phase_flows_detailed.png")
