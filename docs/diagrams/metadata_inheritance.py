#!/usr/bin/env python3
"""
Metadata Inheritance Diagram

Shows how metadata (version and error) flows from namespace level to items.
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.custom import Custom
from diagrams.onprem.compute import Server
from diagrams.programming.language import Rust

from docs.diagrams.common import diag_path

with Diagram(
    "Metadata Inheritance Flow",
    filename=diag_path("metadata_inheritance"),
    show=False,
    direction="TB",
):
    with Cluster("Namespace Level"):
        namespace = Server("namespace api")
        inner_version = Custom("#![version(1)]", "./blank.png")
        inner_error = Custom("#![err(ApiError)]", "./blank.png")

    with Cluster("Type Level"):
        with Cluster("User (inherits)"):
            user_struct = Rust("struct User")
            user_version = Custom("version: 1 (inherited)", "./blank.png")

        with Cluster("Account (overrides)"):
            account_outer = Custom("#[version(2)]", "./blank.png")
            account_struct = Rust("struct Account")
            account_version = Custom("version: 2 (explicit)", "./blank.png")

    with Cluster("Operation Level"):
        with Cluster("getUser (inherits)"):
            get_op = Server("operation getUser()")
            get_error = Custom("error: ApiError (inherited)", "./blank.png")

        with Cluster("createUser (overrides)"):
            create_outer = Custom("#[err(ValidationError)]", "./blank.png")
            create_op = Server("operation createUser()")
            create_error = Custom("error: ValidationError (explicit)", "./blank.png")

    # Inheritance flows
    namespace >> Edge(label="declares") >> inner_version
    namespace >> Edge(label="declares") >> inner_error

    inner_version >> Edge(label="inherits", style="dotted") >> user_version
    inner_version >> Edge(label="default", style="dashed") >> account_outer
    account_outer >> Edge(label="overrides") >> account_version

    inner_error >> Edge(label="inherits", style="dotted") >> get_error
    inner_error >> Edge(label="default", style="dashed") >> create_outer
    create_outer >> Edge(label="overrides") >> create_error

print("Generated metadata_inheritance.png")
