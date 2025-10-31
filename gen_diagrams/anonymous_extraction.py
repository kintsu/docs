from diagrams import Diagram
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from gen_diagrams.common import OPTS, diag_path


def anonymous_extraction():
    scan = Rust("Scan type positions\n(structs, operations, oneofs)")
    detect = Action("Detect AnonymousStruct\nin field/return/variant type")
    nested = Action("Recursively extract\nnested anonymous structs\n(depth-first)")
    context = Storage("Context Stack:\n[namespace, parent, field]")
    namegen = Rust("Generate name:\nstack.join('_') -> PascalCase")
    synthesize = Action("Synthesize StructDef\n(name, fields, empty metadata)")
    register = Storage("Add to namespace children\n(available for registration)")

    scan >> detect >> nested >> context
    context >> namegen >> synthesize >> register


if __name__ == "__main__":
    with Diagram(
        "Anonymous Struct Extraction",
        filename=diag_path("anonymous_extraction"),
        direction="LR",
        **OPTS,
    ):
        anonymous_extraction()
