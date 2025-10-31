from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.compute import Server

from gen_diagrams.common import diag_path

with Diagram(
    "Phase Ordering",
    filename=diag_path("phase_ordering"),
    show=False,
    direction="LR",
):
    phases = []

    with Cluster("Sequential Execution"):
        phase1 = Server("Phase 1\nAnonymous\nStructs")
        phase2 = Server("Phase 2\nUnion\nIdentification")
        phase3 = Server("Phase 3\nAlias\nResolution")
        phase4 = Server("Phase 4\nUnion\nValidation")
        phase5 = Server("Phase 5\nUnion\nMerging")
        phase6 = Server("Phase 6\nVersion\nMetadata")
        phase7 = Server("Phase 7\nError\nMetadata")
        phase8 = Server("Phase 8\nReference\nValidation")

        phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8]

    # Sequential flow
    for i in range(len(phases) - 1):
        phases[i] >> Edge(label="→") >> phases[i + 1]

print("Generated phase_ordering.png")
