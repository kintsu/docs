from diagrams.generic.blank import Blank
from diagrams.generic.storage import Storage

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import OPTS, diag_path

with Diagram(
    "OneOf Discriminated Union Structure",
    filename=diag_path("oneof_structure"),
    direction="TB",
    **OPTS,
):
    with Cluster("Source Schema"):
        source = Storage(
            "OneOf Declaration\n\ntype Response =\n  oneof Success\n    | Error\n    | Timeout"
        )

    with Cluster("Variant Types"):
        variant1 = Blank("Success\n(variant 0)")
        variant2 = Blank("Error\n(variant 1)")
        variant3 = Blank("Timeout\n(variant 2)")

    with Cluster("Generated Discriminated Union"):
        discriminant = Blank("Discriminant Field\n(tag/enum)")
        union_type = Blank(
            "Response Union\n{\n  discriminant: enum,\n  Success | Error | Timeout\n}"
        )

    with Cluster("Runtime Representation"):
        active_variant = Blank(
            "Active Variant\n(one at a time)\n\n+ discriminant value"
        )

    # Flow
    source >> Edge(label="declares 3 variants") >> [variant1, variant2, variant3]
    (
        [variant1, variant2, variant3]
        >> Edge(label="assigned discriminants\n0, 1, 2")
        >> discriminant
    )
    discriminant >> Edge(label="identifies active variant") >> union_type
    union_type >> Edge(label="runtime: one active") >> active_variant

print("Generated oneof_structure.png")
