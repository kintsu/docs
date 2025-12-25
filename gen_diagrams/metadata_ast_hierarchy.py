#!/usr/bin/env python3
"""
Metadata AST Hierarchy Diagram

Shows the logical AST structure for metadata (ignoring spans and tokens).
"""

from diagrams.generic.storage import Storage
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

with Diagram(
    "Metadata AST Hierarchy",
    filename=diag_path("metadata_ast_hierarchy"),
    show=False,
    direction="TB",
):
    with Cluster("ItemMeta"):
        item_meta = Rust("ItemMeta")
        meta_vec = Storage("Vec<ItemMetaItem>")

    with Cluster("ItemMetaItem (enum)"):
        version_variant = Rust("Version(VersionMeta)")
        error_variant = Rust("Error(ErrorMeta)")

    with Cluster("VersionMeta"):
        version_meta = Rust("Meta<IntToken>")
        version_name = Storage("name: 'version'")
        version_value = Storage("value: i32")
        version_inner = Storage("inner: Option<BangToken>")

    with Cluster("ErrorMeta"):
        error_meta = Rust("Meta<PathOrIdent>")
        error_name = Storage("name: 'err'")
        error_value = Storage("value: PathOrIdent")
        error_inner = Storage("inner: Option<BangToken>")

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
