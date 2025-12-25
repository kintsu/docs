from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from diagrams import Diagram
from gen_diagrams.common import OPTS, diag_path


def struct_compilation():
    ns = Rust("Namespace Context")
    extractor = Rust("TypeExtractor::\nextract_from_namespace")
    graph = Storage("Type Dependency Graph\n(with EdgeKinds)")
    scc = Action("SCC Detection\n(required edges only)")
    topo = Rust("Topological Sort\n(groups for registration)")
    register = Action("Register groups\n-> TypeRegistry.register(...)")
    done = Storage("Types registered\n(in TypeRegistry)")
    err = Storage("Error:\nTypeCircularDependency")

    ns >> extractor >> graph >> scc
    scc >> topo >> register >> done
    # non-terminating path
    scc >> err


if __name__ == "__main__":
    with Diagram(
        "Struct Compilation",
        filename=diag_path("struct_compilation"),
        direction="LR",
        **OPTS,
    ):
        struct_compilation()
