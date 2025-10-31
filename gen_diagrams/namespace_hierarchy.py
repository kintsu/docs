"""
Diagram: Namespace hierarchy showing package → namespace → types organization

Shows how packages contain namespaces which contain type definitions.
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.generic.blank import Blank

from gen_diagrams.common import diag_path

graph_attr = {
    "fontsize": "14",
    "bgcolor": "white",
    "pad": "0.5",
}

with Diagram(
    "Namespace Hierarchy",
    filename=diag_path("namespace_hierarchy"),
    direction="TB",
    graph_attr=graph_attr,
    outformat="png",
    show=False,
):
    with Cluster("Package: company"):
        root_ns = Blank("namespace company\n(depth 0)")

        with Cluster("Child Namespaces"):
            api_ns = Blank("namespace api\n(depth 1)")
            common_ns = Blank("namespace common\n(depth 1)")

        with Cluster("api Types"):
            api_types = Blank("struct User\nstruct Request\noperation get_user()")

        with Cluster("api::v1 Namespace"):
            v1_ns = Blank("namespace v1\n(depth 2)")
            v1_types = Blank("operation handle_v1()")

        with Cluster("common Types"):
            common_types = Blank("struct Config\nenum Status\nerror ApiError")

    # Hierarchy flow
    root_ns >> Edge(label="contains") >> [api_ns, common_ns]
    api_ns >> Edge(label="defines") >> api_types
    api_ns >> Edge(label="contains") >> v1_ns
    v1_ns >> Edge(label="defines") >> v1_types
    common_ns >> Edge(label="defines") >> common_types

print("Generated namespace_hierarchy.png")
