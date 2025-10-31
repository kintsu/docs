from diagrams import Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from docs.diagrams.common import OPTS, diag_path


def enum_variants():
    src = Rust("enum <Name> { ... }")
    ast = Rust("Parser AST:\nEnum (Int | Str)")
    variants = Storage("TypedEnum.variants\n(Repeated<EnumVariant>)")

    unit = Rust("Unit Variant:\nVariantName")
    int_val = Action("Integer Variant:\nVariantName = <i64>")
    str_val = Storage('String Variant:\nVariantName = "..."')

    comments = Rust("EnumVariant.comments")

    src >> ast >> variants
    variants >> Edge(label="unit") >> unit
    variants >> Edge(label="integer") >> int_val
    variants >> Edge(label="string") >> str_val
    variants >> comments


if __name__ == "__main__":
    with Diagram(
        "Enum Variant Types",
        filename=diag_path("enum_variants"),
        direction="TB",
        **OPTS,
    ):
        enum_variants()
