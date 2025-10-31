from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Action, InternalStorage
from diagrams.programming.language import Rust

from gen_diagrams.common import diag_path, edge_attr, graph_attr, node_attr

with Diagram(
    "kintsu Type System & Registration",
    filename=diag_path("handlers"),
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    # Type Definition Hierarchy
    with Cluster("AST Type Definitions", graph_attr={"bgcolor": "#e8f4f8"}):
        with Cluster(
            "NamespaceChild (Parsed Types)", graph_attr={"bgcolor": "#f0f8ff"}
        ):
            child_struct = Rust("Child::Struct\n(StructContext)")
            child_enum = Rust("Child::Enum\n(EnumContext)")
            child_oneof = Rust("Child::OneOf\n(OneOfContext)")
            child_error = Rust("Child::Error\n(ErrorContext)")
            child_op = Rust("Child::Operation\n(OperationContext)")
            child_alias = Rust("Child::Type\n(TypeContext)")

        with Cluster("Type Field Definitions", graph_attr={"bgcolor": "#f0f8ff"}):
            struct_fields = Storage("fields:\nVec<FieldContext>")
            enum_variants = Storage("variants:\nVec<EnumVariant>")
            oneof_variants = Storage("variants:\nVec<OneOfVariant>")
            error_fields = Storage("fields:\nVec<FieldContext>")
            op_params = Storage("params:\nVec<FieldContext>")
            op_return = Storage("return_type:\nTypeAnnotation")
            alias_target = Storage("target:\nTypeAnnotation")

            child_struct >> struct_fields
            child_enum >> enum_variants
            child_oneof >> oneof_variants
            child_error >> error_fields
            child_op >> op_params
            child_op >> op_return
            child_alias >> alias_target

    # Type Annotation System
    with Cluster("Type Annotation System", graph_attr={"bgcolor": "#f8f0e8"}):
        with Cluster("TypeAnnotation (Field Types)", graph_attr={"bgcolor": "#fff8f0"}):
            type_named = Rust("Named\n(TypeReference)")
            type_primitive = Rust("Primitive\n(String, Int, etc.)")
            type_array = Rust("Array\n(Vec<T>)")
            type_map = Rust("Map\n(HashMap<K,V>)")
            type_optional = Rust("Optional\n(Option<T>)")
            type_result = Rust("Result\n(Result<T,E>)")
            type_anonymous = Rust("Anonymous\n(inline struct)")
            type_union = Rust("Union\n(A | B | C)")

        with Cluster("TypeReference (Named Types)", graph_attr={"bgcolor": "#fff8f0"}):
            type_ref_simple = Storage("name: String\nnamespace: Option<Path>")
            type_ref_qualified = Storage("Fully qualified:\nsome::ns::TypeName")

            type_named >> type_ref_simple
            type_named >> type_ref_qualified

    # Type Dependency Extraction
    with Cluster("Type Dependency Extraction", graph_attr={"bgcolor": "#e8e8f8"}):
        extractor = Rust("TypeExtractor::\nextract_from\n_namespace")

        with Cluster("Per-Type Dependency Analysis", graph_attr={"bgcolor": "#f0f0f8"}):
            analyze_struct = Action("Extract struct\nfield dependencies")
            analyze_enum = Action("Extract enum\nvariant dependencies")
            analyze_oneof = Action("Extract OneOf\nvariant dependencies")
            analyze_error = Action("Extract error\nfield dependencies")
            analyze_op = Action("Extract operation\nparam/return deps")
            analyze_alias = Action("Extract type alias\ntarget dependency")

            child_struct >> extractor >> analyze_struct
            child_enum >> extractor >> analyze_enum
            child_oneof >> extractor >> analyze_oneof
            child_error >> extractor >> analyze_error
            child_op >> extractor >> analyze_op
            child_alias >> extractor >> analyze_alias

        with Cluster("EdgeKind Classification", graph_attr={"bgcolor": "#f0f0f8"}):
            edge_required = Storage("Required:\nDirect field type")
            edge_optional = Storage("Optional:\nOption<T> wrapper")
            edge_array = Storage("Array:\nVec<T> wrapper")

            analyze_struct >> edge_required
            struct_fields >> Edge(label="Option<T>") >> edge_optional
            struct_fields >> Edge(label="Vec<T>") >> edge_array

        type_dep_graph = InternalStorage(
            "TypeDependencyGraph\n(Node: Type)\n(Edge: EdgeKind)"
        )

        edge_required >> type_dep_graph
        edge_optional >> type_dep_graph
        edge_array >> type_dep_graph

    # Type Registration Flow
    with Cluster(
        "Type Registration (register_type)", graph_attr={"bgcolor": "#e8f8ff"}
    ):
        get_child = Action("Retrieve NamespaceChild\nfrom namespace")

        with Cluster("Definition Conversion", graph_attr={"bgcolor": "#f0f5ff"}):
            conv_struct = Rust("Convert to\nDefinition::Struct")
            conv_enum = Rust("Convert to\nDefinition::Enum")
            conv_oneof = Rust("Convert to\nDefinition::OneOf")
            conv_error = Rust("Convert to\nDefinition::Error")
            conv_alias = Rust("Convert to\nDefinition::TypeAlias")

            child_struct >> get_child >> conv_struct
            child_enum >> get_child >> conv_enum
            child_oneof >> get_child >> conv_oneof
            child_error >> get_child >> conv_error
            child_alias >> get_child >> conv_alias

        with Cluster("Definition Structure", graph_attr={"bgcolor": "#f0f5ff"}):
            def_metadata = Storage(
                "TypeMetadata:\n- name\n- namespace\n- version\n- docs"
            )
            def_fields = Storage(
                "Fields/Variants:\n- field_name\n- field_type\n- attributes"
            )

            conv_struct >> def_metadata
            conv_struct >> def_fields
            conv_enum >> def_metadata
            conv_enum >> def_fields

        registry_insert = InternalStorage(
            "TypeRegistry::\nregister()\n(Arc-based global)"
        )

        conv_struct >> registry_insert
        conv_enum >> registry_insert
        conv_oneof >> registry_insert
        conv_error >> registry_insert
        conv_alias >> registry_insert

    # Type Resolution Flow
    with Cluster("Type Resolution (TypeResolver)", graph_attr={"bgcolor": "#ffe8f8"}):
        resolver = Rust("TypeResolver::new()\nper namespace")

        with Cluster("Anonymous Struct Extraction", graph_attr={"bgcolor": "#fff0f8"}):
            scan_anonymous = Action("Scan fields for\ninline { ... }")
            generate_name = Action("Generate name:\nField{FieldName}")
            create_struct = Rust("Create StructContext\nfrom inline def")
            register_anonymous = Action("Add to namespace\nchildren map")

            (
                resolver
                >> scan_anonymous
                >> generate_name
                >> create_struct
                >> register_anonymous
            )

        with Cluster("Union Type Processing", graph_attr={"bgcolor": "#fff0f8"}):
            identify_unions = Action("Find TypeAnnotation\n::Union patterns")
            validate_members = Action("Validate all\nmember types exist")
            merge_members = Rust("Generate merged\nstruct from fields")
            register_union = Action("Register as\nDefinition::Struct")

            (
                scan_anonymous
                >> identify_unions
                >> validate_members
                >> merge_members
                >> register_union
            )

        with Cluster("Type Alias Resolution", graph_attr={"bgcolor": "#fff0f8"}):
            find_aliases = Action("Find Child::Type\ndefinitions")
            resolve_target = Action("Resolve target\nTypeReference")
            check_exists = Action("Validate target\nexists in registry")
            store_alias = Action("Store in\nNamespaceResolution")

            (
                identify_unions
                >> find_aliases
                >> resolve_target
                >> check_exists
                >> store_alias
            )

        with Cluster("Error Type Resolution", graph_attr={"bgcolor": "#fff0f8"}):
            scan_operations = Action("Scan Child::Operation\nfor #[err(...)]")
            resolve_error_refs = Action("Resolve error\nTypeReferences")
            validate_error_types = Action("Check errors\nexist in registry")
            build_error_map = Storage("errors:\nHashMap<String,\nErrorMetadata>")

            find_aliases >> scan_operations >> resolve_error_refs
            resolve_error_refs >> validate_error_types >> build_error_map

        with Cluster("Version Resolution", graph_attr={"bgcolor": "#fff0f8"}):
            scan_versions = Action("Scan for\n#[version(N)]")
            resolve_version_refs = Action("Resolve versioned\ntype references")
            validate_versions = Action("Check version\ncompatibility")

            (
                validate_error_types
                >> scan_versions
                >> resolve_version_refs
                >> validate_versions
            )

        with Cluster("Final Validation", graph_attr={"bgcolor": "#fff0f8"}):
            validate_all_refs = Action("Validate all\nTypeReferences")
            check_registry = Action("Verify types exist\nin TypeRegistry")
            report_missing = Storage("Report missing\ntype errors")

            validate_versions >> validate_all_refs >> check_registry >> report_missing

        namespace_resolution = InternalStorage(
            "NamespaceResolution:\n- generated_structs\n- resolved_aliases\n- error_metadata\n- validation_results"
        )

        register_anonymous >> namespace_resolution
        register_union >> namespace_resolution
        store_alias >> namespace_resolution
        build_error_map >> namespace_resolution
        report_missing >> namespace_resolution

    # Integration Back to Namespace
    with Cluster("Resolution Integration", graph_attr={"bgcolor": "#f0f8e8"}):
        integrate = Rust("integrate_resolution()\ninto namespace")
        update_children = Action("Update namespace\nchildren map")
        update_metadata = Action("Update operation\nerror metadata")
        register_generated_types = Action("Register generated\nstructs in registry")

        namespace_resolution >> integrate >> update_children
        integrate >> update_metadata
        integrate >> register_generated_types >> registry_insert

    # Type Lookup Flow
    with Cluster("Type Lookup & Resolution", graph_attr={"bgcolor": "#e8f8f0"}):
        lookup_request = Action("Lookup type by\nTypeReference")

        with Cluster("Resolution Strategy", graph_attr={"bgcolor": "#f0fcf8"}):
            check_local = Action("Check current\nnamespace")
            check_imported = Action("Check imported\nnamespaces")
            check_builtin = Action("Check builtin\ntypes")
            check_global = Action("Check TypeRegistry\n(all registered)")

            lookup_request >> check_local
            check_local >> Edge(label="not found") >> check_imported
            check_imported >> Edge(label="not found") >> check_builtin
            check_builtin >> Edge(label="not found") >> check_global

        resolved = Storage("Resolved:\nDefinition from\nTypeRegistry")
        unresolved = Storage("Error:\nUnresolvedType")

        check_local >> Edge(label="found") >> resolved
        check_imported >> Edge(label="found") >> resolved
        check_builtin >> Edge(label="found") >> resolved
        check_global >> Edge(label="found") >> resolved
        check_global >> Edge(label="not found") >> unresolved
