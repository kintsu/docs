from diagrams import Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from docs.diagrams.common import OPTS, diag_path


def alias_resolution_chain():
    # Example: type C = B; type B = A; type A = i64;

    alias_c = Rust("Type Alias C\ntype C = B")
    alias_b = Rust("Type Alias B\ntype B = A")
    alias_a = Rust("Type Alias A\ntype A = i64")

    resolve_c = Action("Resolve C\n(lookup B)")
    resolve_b = Action("Resolve B\n(lookup A)")
    resolve_a = Action("Resolve A\n(concrete: i64)")

    concrete = Storage("Concrete Type\ni64")

    # Resolution chain
    alias_c >> Edge(label="references") >> alias_b
    alias_b >> Edge(label="references") >> alias_a
    alias_a >> Edge(label="resolves to") >> concrete

    # Resolution flow
    alias_c >> Edge(label="resolve") >> resolve_c
    resolve_c >> Edge(label="chain to") >> resolve_b
    resolve_b >> Edge(label="chain to") >> resolve_a
    resolve_a >> Edge(label="result") >> concrete


if __name__ == "__main__":
    with Diagram(
        "Type Alias Resolution Chain",
        filename=diag_path("alias_resolution_chain"),
        direction="LR",
        **OPTS,
    ):
        alias_resolution_chain()
