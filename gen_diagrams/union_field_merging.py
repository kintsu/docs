from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from gen_diagrams.common import OPTS, diag_path


def union_field_merging():
    # Example: Base & Extended

    with Cluster("Base Struct"):
        base_fields = Storage("Fields:\nid: i64\nversion: i32\nname: str")

    with Cluster("Extended Struct"):
        extended_fields = Storage(
            "Fields:\nversion: i32\ndescription: str\ntags: str[]"
        )

    merge_op = Action("Union Operator\nBase & Extended")

    with Cluster("Field Merging"):
        working_set = Storage("Working Set\n(left-to-right)")
        add_base = Action("Add: id, version, name")
        check_version = Action("Check: version\n(already in set)")
        skip_version = Storage("Skip\n(leftmost wins)")
        add_extended = Action("Add: description, tags")

    with Cluster("Merged Result"):
        merged_struct = Rust("Generated Struct\nMerged")
        merged_fields = Storage(
            "Fields:\nid: i64\nversion: i32 (from Base)\nname: str\ndescription: str\ntags: str[]"
        )

    # Flow
    base_fields >> Edge(label="operand 1") >> merge_op
    extended_fields >> Edge(label="operand 2") >> merge_op
    merge_op >> Edge(label="process") >> working_set

    working_set >> Edge(label="Base") >> add_base
    add_base >> Edge(label="Extended") >> check_version
    check_version >> Edge(label="conflict") >> skip_version
    skip_version >> Edge(label="continue") >> add_extended
    add_extended >> Edge(label="synthesize") >> merged_struct
    merged_struct >> Edge(label="contains") >> merged_fields


if __name__ == "__main__":
    with Diagram(
        "Union Field Merging",
        filename=diag_path("union_field_merging"),
        direction="TB",
        **OPTS,
    ):
        union_field_merging()
