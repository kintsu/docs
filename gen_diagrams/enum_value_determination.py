from diagrams import Diagram
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from gen_diagrams.common import OPTS, diag_path


def enum_value_determination():
    parse_enum = Rust("Parse 'enum' keyword\nand name")
    fork = Action("Fork token stream\nat opening brace")
    try_int = Rust("Try parse first variant\nas EnumVariant<i64>")
    int_success = Storage("Success:\nParse as TypedEnum<i64>\n(integer enum)")
    str_fallback = Action("Failure:\nParse as TypedEnum<string>\n(string enum)")
    register = Rust("Register enum\nin type registry")

    parse_enum >> fork >> try_int
    try_int >> int_success >> register
    try_int >> str_fallback >> register


if __name__ == "__main__":
    with Diagram(
        "Enum Value Type Determination",
        filename=diag_path("enum_value_determination"),
        direction="LR",
        **OPTS,
    ):
        enum_value_determination()
