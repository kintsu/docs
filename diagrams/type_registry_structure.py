#!/usr/bin/env python3
"""
Type Registry Structure Diagram

Shows hierarchical organization of the type registry:
- Global TypeRegistry with thread-safe HashMap
- Mapping from qualified names (package::namespace::Type) to ResolvedTypes
- Each ResolvedType contains kind (Struct/Enum/etc) and source location
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.onprem.database import Cassandra
from diagrams.programming.language import Rust

from docs.diagrams.common import diag_path

graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
}

with Diagram(
    "Type Registry Structure",
    filename=diag_path("type_registry_structure"),
    outformat="png",
    graph_attr=graph_attr,
    direction="TB",
):
    registry = Rust("TypeRegistry\n(Arc<Mutex<HashMap>>)")

    with Cluster("Qualified Names → ResolvedTypes"):
        with Cluster("shapes package"):
            shapes_point = Storage("shapes::geometry::Point\n→ Struct")
            shapes_circle = Storage("shapes::geometry::Circle\n→ Struct")

        with Cluster("graphics package"):
            graphics_drawable = Storage("graphics::rendering::Drawable\n→ Struct")
            graphics_color = Storage("graphics::types::Color\n→ Enum")

        with Cluster("errors package"):
            errors_notfound = Storage("errors::NotFoundError\n→ Error")

    types_map = Cassandra("HashMap<NamedItemContext,\nResolvedType>")

    registry >> Edge(label="contains") >> types_map

    types_map >> Edge(style="dashed") >> shapes_point
    types_map >> Edge(style="dashed") >> shapes_circle
    types_map >> Edge(style="dashed") >> graphics_drawable
    types_map >> Edge(style="dashed") >> graphics_color
    types_map >> Edge(style="dashed") >> errors_notfound
