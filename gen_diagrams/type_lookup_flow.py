#!/usr/bin/env python3
"""
Type Lookup Flow Diagram

Shows the process of resolving a type reference:
1. Generate candidates from imports and local context
2. Probe registry for each candidate
3. Return first match or error if not found
"""

from diagrams.generic.compute import Rack
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action
from diagrams.programming.language import Rust

from diagrams import Diagram, Edge
from gen_diagrams.common import OPTS, diag_path

graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
    "rankdir": "TB",
}

with Diagram(
    "Type Lookup Flow",
    filename=diag_path("type_lookup_flow"),
    direction="TB",
    **OPTS,
):
    parse_ref = Rust("Parse Type Reference\n(Point or geometry::Point)")
    check_imports = Action("Check Imports\n(extract imported names)")
    local_context = Action("Add Local Context\n(current_pkg::current_ns)")
    candidates = Storage(
        "Candidate List\n[shapes::geometry::Point,\n graphics::rendering::Point]"
    )

    parse_ref >> Edge(label="simple\nidentifier") >> check_imports
    parse_ref >> Edge(label="qualified\npath") >> check_imports
    check_imports >> Edge(label="imported\ncandidates") >> local_context
    local_context >> Edge(label="all candidates") >> candidates

    acquire_lock = Rack("Acquire Registry Lock")
    probe_first = Action("Probe First Candidate")
    probe_second = Action("Probe Second Candidate")
    found = Storage("Return ResolvedType\n(kind + qualified_path)")
    not_found = Storage("Return Error\n(UndefinedType)")

    candidates >> Edge(label="ordered\nlist") >> acquire_lock
    acquire_lock >> Edge(label="candidate[0]") >> probe_first
    probe_first >> Edge(label="not found", style="dashed") >> probe_second
    probe_first >> Edge(label="found!", color="green") >> found
    probe_second >> Edge(label="found!", color="green") >> found
    probe_second >> Edge(label="not found", color="red", style="dashed") >> not_found
