#!/usr/bin/env python3
"""
Metadata AST Hierarchy Diagram

Shows the logical AST structure for metadata (ignoring spans and tokens).
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.compute import Server
from diagrams.programming.language import Rust

from docs.diagrams.common import diag_path

with Diagram(
    "Metadata AST Hierarchy",
    filename=diag_path("metadata_ast_hierarchy"),
    show=False,
    direction="TB",
):
    with Cluster("ItemMeta"):
        item_meta = Rust("ItemMeta")
        meta_vec = Server("Vec<ItemMetaItem>")

    with Cluster("ItemMetaItem (enum)"):
        version_variant = Rust("Version(VersionMeta)")
        error_variant = Rust("Error(ErrorMeta)")

    with Cluster("VersionMeta"):
        version_meta = Rust("Meta<IntToken>")
        version_name = Server("name: 'version'")
        version_value = Server("value: i32")
        version_inner = Server("inner: Option<BangToken>")

    with Cluster("ErrorMeta"):
        error_meta = Rust("Meta<PathOrIdent>")
        error_name = Server("name: 'err'")
        error_value = Server("value: PathOrIdent")
        error_inner = Server("inner: Option<BangToken>")

    # Structure relationships
    item_meta >> Edge(label="contains") >> meta_vec
    meta_vec >> Edge(label="elements") >> version_variant
    meta_vec >> Edge(label="elements") >> error_variant

    version_variant >> Edge(label="wraps") >> version_meta
    version_meta >> Edge(label="has") >> version_name
    version_meta >> Edge(label="has") >> version_value
    version_meta >> Edge(label="has") >> version_inner

    error_variant >> Edge(label="wraps") >> error_meta
    error_meta >> Edge(label="has") >> error_name
    error_meta >> Edge(label="has") >> error_value
    error_meta >> Edge(label="has") >> error_inner

print("Generated metadata_ast_hierarchy.png")
