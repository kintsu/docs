#!/usr/bin/env python3
"""
Metadata Inheritance Diagram

Shows how metadata (version and error) flows from namespace level to items.
"""

from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

with Diagram(
    "Metadata Inheritance Flow",
    filename=diag_path("metadata_inheritance"),
    show=False,
    direction="TB",
):
    with Cluster("Namespace Level"):
        namespace = Action("namespace api")
        inner_version = Storage("#![version(1)]")
        inner_error = Storage("#![err(ApiError)]")

    with Cluster("Type Level"):
        with Cluster("User (inherits)"):
            user_struct = Rust("struct User")
            user_version = Storage("version: 1 (inherited)")

        with Cluster("Account (overrides)"):
            account_outer = Storage("#[version(2)]")
            account_struct = Rust("struct Account")
            account_version = Storage("version: 2 (explicit)")

    with Cluster("Operation Level"):
        with Cluster("getUser (inherits)"):
            get_op = Action("operation getUser()")
            get_error = Storage("error: ApiError (inherited)")

        with Cluster("createUser (overrides)"):
            create_outer = Storage("#[err(ValidationError)]")
            create_op = Action("operation createUser()")
            create_error = Storage("error: ValidationError (explicit)")

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
