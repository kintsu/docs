from diagrams import Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from docs.diagrams.common import OPTS, diag_path


def struct_types():
    src = Rust("struct <Name> { ... }")
    ast = Rust("Parser AST:\nStruct")
    fields = Storage("Struct.args\n(Repeated<Arg>)")

    idn = Rust("Arg: identifier")
    sep = Action("Arg: separator (Sep)\n(Required | Optional)")
    typ = Rust("Arg: type expression")
    meta = Storage("Arg: comments / metadata")

    src >> ast >> fields
    fields >> idn
    fields >> Edge(label="sep") >> sep
    fields >> typ
    fields >> meta


if __name__ == "__main__":
    with Diagram(
        "Struct Types",
        filename=diag_path("struct_types"),
        direction="TB",
        **OPTS,
    ):
        struct_types()
