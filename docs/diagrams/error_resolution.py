from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from docs.diagrams.common import OPTS, diag_path


def error_resolution():
    parse_error = Rust("Parse Error\nDeclaration")

    with Cluster("Variant Processing"):
        lookahead = Action("Lookahead\n(peek { or ()")
        struct_variant = Storage("Struct Variant\n(with fields)")
        tuple_variant = Storage("Tuple Variant\n(with Type)")
        unit_variant = Storage("Unit Variant\n(name only)")

    with Cluster("Extraction & Validation"):
        extract_struct = Rust("Extract Struct\nVariants")
        generate_name = Action("Generate Name\n(ErrorName + VariantName)")
        synthesize = Storage("Synthesize\nStructDef")
        validate_tuple = Rust("Validate Tuple\nType References")
        check_uniqueness = Action("Check Variant\nName Uniqueness")

    with Cluster("Association Resolution"):
        resolve_metadata = Rust("Resolve #[err(...)]\nMetadata")
        check_result_type = Action("Verify Result Type\n(return_type!)")
        associate_operation = Storage("Associate with\nOperation")

    register = Rust("Register in\nType Registry")

    # Main flow
    parse_error >> Edge(label="parse") >> lookahead
    lookahead >> Edge(label="{ found") >> struct_variant
    lookahead >> Edge(label="( found") >> tuple_variant
    lookahead >> Edge(label="neither") >> unit_variant

    # Struct variant flow
    struct_variant >> Edge(label="extract") >> extract_struct
    extract_struct >> Edge(label="generate") >> generate_name
    generate_name >> Edge(label="synthesize") >> synthesize
    synthesize >> Edge(label="validate") >> check_uniqueness

    # Tuple variant flow
    tuple_variant >> Edge(label="validate") >> validate_tuple
    validate_tuple >> Edge(label="check") >> check_uniqueness

    # Unit variant flow
    unit_variant >> Edge(label="check") >> check_uniqueness

    # Association flow
    check_uniqueness >> Edge(label="resolve") >> resolve_metadata
    resolve_metadata >> Edge(label="verify") >> check_result_type
    check_result_type >> Edge(label="associate") >> associate_operation
    associate_operation >> Edge(label="register") >> register


if __name__ == "__main__":
    with Diagram(
        "Error Resolution Flow",
        filename=diag_path("error_resolution"),
        direction="LR",
        **OPTS,
    ):
        error_resolution()
