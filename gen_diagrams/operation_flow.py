"""
Diagram: Operation flow showing parameters -> processing -> return type/error

Shows how operation definitions flow through the system with
parameter types, processing, and result/error returns.
"""

from diagrams.generic.blank import Blank

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

graph_attr = {
    "fontsize": "14",
    "bgcolor": "white",
    "pad": "0.5",
}

with Diagram(
    "Operation Flow",
    filename=diag_path("operation_flow"),
    direction="LR",
    graph_attr=graph_attr,
    outformat="png",
    show=False,
):
    with Cluster("Operation Definition"):
        op_def = Blank("operation fetch_user(\n  id: i64\n) -> User!")

    with Cluster("Parameters"):
        param_validation = Blank("Parameter Type\nValidation\n\ni64 exists ✓")
        param_types = Blank("Resolved Types\n\nid: i64")

    with Cluster("Processing"):
        fallibility = Blank("Fallibility Detection\n\nType::Result -> fallible")
        error_resolution = Blank(
            "Error Type Resolution\n\n#[err(ApiError)]\n-> ApiError"
        )

    with Cluster("Return Types"):
        success_path = Blank("Success Type\n\nUser")
        error_path = Blank("Error Type\n\nApiError")

    with Cluster("Generated Code"):
        result_type = Blank("Result<User, ApiError>")

    # Flow
    op_def >> Edge(label="parse params") >> param_validation
    param_validation >> Edge(label="resolve") >> param_types
    op_def >> Edge(label="check return type") >> fallibility
    fallibility >> Edge(label="resolve error") >> error_resolution

    param_types >> Edge(label="inputs") >> result_type
    error_resolution >> Edge(label="success") >> success_path
    error_resolution >> Edge(label="error") >> error_path

    success_path >> Edge(label="Ok variant") >> result_type
    error_path >> Edge(label="Err variant") >> result_type

print("Generated operation_flow.png")
