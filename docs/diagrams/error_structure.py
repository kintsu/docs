from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from docs.diagrams.common import OPTS, diag_path


def error_structure():
    error_decl = Rust("Error Declaration\n(error keyword)")

    with Cluster("Error Type Components"):
        error_name = Storage("Error Name\n(identifier)")

        with Cluster("Variants"):
            variant_unit = Action("Unit Variant\n(name only)")
            variant_tuple = Action("Tuple Variant\n(name + Type)")
            variant_struct = Action("Struct Variant\n(name + fields)")

    with Cluster("Struct Variant Extraction"):
        anon_struct = Rust("Anonymous Struct\n(inline fields)")
        extraction = Storage("ErrorName +\nVariantName")
        generated_struct = Rust("Generated Struct\n(e.g. NetworkErrorTimeout)")

    with Cluster("Operation Association"):
        operation_meta = Storage("#[err(ErrorName)]\noperation-level")
        namespace_meta = Storage("#![error(ErrorName)]\nnamespace-level")
        result_type = Rust("Result Type\n(return_type!)")

    # Main flow
    error_decl >> Edge(label="defines") >> error_name
    error_name >> Edge(label="contains") >> variant_unit
    error_name >> Edge(label="contains") >> variant_tuple
    error_name >> Edge(label="contains") >> variant_struct

    # Struct variant extraction flow
    variant_struct >> Edge(label="has") >> anon_struct
    anon_struct >> Edge(label="extract via") >> extraction
    extraction >> Edge(label="generates") >> generated_struct

    # Operation association flow
    error_name >> Edge(label="associated via") >> operation_meta
    error_name >> Edge(label="or") >> namespace_meta
    operation_meta >> Edge(label="requires") >> result_type
    namespace_meta >> Edge(label="requires") >> result_type


if __name__ == "__main__":
    with Diagram(
        "Error Type Structure",
        filename=diag_path("error_structure"),
        direction="TB",
        **OPTS,
    ):
        error_structure()
