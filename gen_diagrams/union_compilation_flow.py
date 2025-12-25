from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import OPTS, diag_path


def union_compilation_flow():
    scan_types = Rust("Scan Type\nPositions")

    with Cluster("Identification"):
        detect_union = Action("Detect Union\n(A & B)")
        capture_context = Storage("Capture Context\n(namespace, parent, field)")
        record_union = Rust(
            "UnionRecord {\\nunion_ref: Arc<Union>,\\ncontext_stack,\\nin_oneof}"
        )

    with Cluster("Validation"):
        check_operands = Action("Check Each\\nOperand")
        lookup_type = Storage("Lookup Type\\nin Registry")
        validate_struct = Action("resolve_to_struct_type()\\n(recursive async)")
        reject_non_struct = Storage("Reject Enum/\\nError/OneOf")

    with Cluster("Field Merging"):
        init_working_set = Rust("UnionWorkingSet {\\nfields: BTreeMap}")
        process_left_to_right = Action("Process Operands\n(left-to-right)")
        merge_fields = Storage("Merge Fields\n(leftmost wins)")

    with Cluster("Struct Generation"):
        generate_name = Action("Generate Name\n(from context)")
        synthesize_struct = Rust("Synthesize\nStructDef")
        register = Storage("Register in\nType Registry")

    # Flow
    scan_types >> Edge(label="find") >> detect_union
    detect_union >> Edge(label="capture") >> capture_context
    capture_context >> Edge(label="record") >> record_union

    record_union >> Edge(label="validate") >> check_operands
    check_operands >> Edge(label="lookup") >> lookup_type
    lookup_type >> Edge(label="check") >> validate_struct
    validate_struct >> Edge(label="if not struct") >> reject_non_struct
    validate_struct >> Edge(label="if struct") >> init_working_set

    init_working_set >> Edge(label="process") >> process_left_to_right
    process_left_to_right >> Edge(label="merge") >> merge_fields
    merge_fields >> Edge(label="generate") >> generate_name
    generate_name >> Edge(label="synthesize") >> synthesize_struct
    synthesize_struct >> Edge(label="register") >> register


if __name__ == "__main__":
    with Diagram(
        "Union Compilation Flow",
        filename=diag_path("union_compilation_flow"),
        direction="LR",
        **OPTS,
    ):
        union_compilation_flow()
