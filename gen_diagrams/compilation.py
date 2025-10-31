from diagrams import Cluster, Diagram, Edge
from diagrams.generic.storage import Storage
from diagrams.onprem.vcs import Git
from diagrams.programming.flowchart import Action, Decision, InternalStorage
from diagrams.programming.language import Rust

from gen_diagrams.common import diag_path, edge_attr, graph_attr, node_attr

with Diagram(
    "kintsu Compilation Pipeline",
    filename=diag_path("compilation"),
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    # Entry Point
    entry = Rust("CompileCtx::\nfrom_entry_point\n_with_progress")

    with Cluster("Initialization", graph_attr={"bgcolor": "#e8f4f8"}):
        progress_init = InternalStorage("CompilationProgress\n::new(show_progress)")
        registry_init = InternalStorage("TypeRegistry\n::new()")

        with Cluster("Root Schema Loading", graph_attr={"bgcolor": "#f0f8ff"}):
            resolver_init = Rust("PackageResolver\n::new()")
            schema_parse = Rust("SchemaCtx::\nfrom_path()")

            with Cluster("Schema Parsing", graph_attr={"bgcolor": "#f8fcff"}):
                load_manifest = Storage("Load schema.toml\n(PackageManifest)")
                parse_lib = Rust("Parse lib.ks\n(namespace + use stmts)")

                with Cluster("Per-Use Statement", graph_attr={"bgcolor": "#fcfeff"}):
                    find_files = Action("Find *.ks files\n(single file or dir)")
                    tokenize = Rust("Tokenize source\n(crate::tokens)")
                    build_ast = Rust("Build AST\n(AstStream::from_tokens)")
                    create_ns = Rust("NamespaceCtx::\nload_files()")

                    find_files >> tokenize >> build_ast >> create_ns

                load_manifest >> parse_lib >> find_files

        cache_init = Storage("SchemaCache\n::new()")
        lockfile_check = Decision("Check for\nschema.lock")
        state_init = InternalStorage("SharedCompilationState\n::new() + Arc<RwLock>")

        entry >> progress_init
        entry >> registry_init
        entry >> resolver_init >> schema_parse
        entry >> cache_init
        schema_parse >> load_manifest
        cache_init >> lockfile_check >> state_init

    with Cluster("Dependency Loading (Parallel)", graph_attr={"bgcolor": "#f8f0e8"}):
        dep_loader = Rust("DependencyLoader::\nload_dependencies\n_parallel")

        with Cluster("Channel-Based Task Queue", graph_attr={"bgcolor": "#fff8f0"}):
            discover_initial = Action("Scan root namespaces\nfor imports")
            task_channel = Storage("async_channel\n(unbounded)")
            result_channel = Storage("async_channel\n(unbounded)")

            discover_initial >> task_channel

        with Cluster("Worker Pool (Parallel)", graph_attr={"bgcolor": "#fff8f0"}):
            worker1 = Rust("Worker 1\n(tokio::spawn)")
            worker2 = Rust("Worker 2\n(tokio::spawn)")
            worker_n = Rust("Worker N\n(max_concurrent)")

            task_channel >> Edge(label="recv()") >> worker1
            task_channel >> Edge(label="recv()") >> worker2
            task_channel >> Edge(label="recv()") >> worker_n

        with Cluster("Per-Dependency Processing", graph_attr={"bgcolor": "#fcf0f0"}):
            check_processing = Decision("Already in\nprocessing_set?")
            resolve_location = Rust("PackageResolver::\nresolve()")

            with Cluster(
                "Dependency Source Resolution", graph_attr={"bgcolor": "#fef8f8"}
            ):
                path_dep = Storage("Path: Local\nfilesystem")
                git_dep = Git("Git: Clone/fetch\nrepository")
                registry_dep = Storage("Registry: Download\npackage")

                resolve_location >> path_dep
                resolve_location >> git_dep
                resolve_location >> registry_dep

            check_cache = Decision("Cached?\n(CacheKey)")
            load_schema = Rust("SchemaCtx::\nfrom_path()")
            compute_hash = Action("Compute content\nhash (mutable)")
            validate_lock = Decision("Matches\nlockfile?")

            discover_transitive = Action("Scan namespace\nimports")
            enqueue_tasks = Action("Send to\ntask_channel")
            send_result = Action("Send DependencyResult\nto result_channel")

            worker1 >> check_processing >> resolve_location
            worker2 >> check_processing
            worker_n >> check_processing

            check_processing >> Edge(label="no") >> resolve_location
            (
                check_processing
                >> Edge(label="yes\n(skip)", style="dashed")
                >> result_channel
            )

            path_dep >> check_cache
            git_dep >> check_cache
            registry_dep >> check_cache

            check_cache >> Edge(label="miss") >> load_schema >> compute_hash
            check_cache >> Edge(label="hit", style="dashed") >> validate_lock
            compute_hash >> validate_lock

            validate_lock >> discover_transitive
            (
                discover_transitive
                >> enqueue_tasks
                >> Edge(label="recursive", color="red")
                >> task_channel
            )
            discover_transitive >> send_result >> result_channel

        with Cluster("Result Collector", graph_attr={"bgcolor": "#f0f0f8"}):
            collector = Rust("Result Collector\n(tokio::spawn)")
            update_state = Action("Update\nSharedCompilationState")
            mark_complete = Storage("dependencies:\nBTreeMap<String,\nArc<SchemaCtx>>")

            result_channel >> collector >> update_state >> mark_complete

        state_init >> dep_loader >> discover_initial

    with Cluster(
        "Schema Compilation (SchemaCompiler::compile_all)",
        graph_attr={"bgcolor": "#e8e8f8"},
    ):
        build_dep_graph = Rust("Build Schema\nDependency Graph")

        with Cluster("Schema Graph Construction", graph_attr={"bgcolor": "#f0f0f8"}):
            extract_imports = Action("Extract imports\nfrom all schemas")
            build_edges = Action("Build dependency\nedges between schemas")

            build_dep_graph >> extract_imports >> build_edges

        detect_cycles = Action("SCC Detection\n(strongly_connected\n_components)")
        check_cycle_size = Decision("Cycle\nfound?")
        error_circular = Storage("Error:\nCircularDependency")

        topo_sort = Rust("Topological Sort\n(topological_sort\n_into_groups)")
        schema_groups = Storage("Vec<Vec<CacheKey>>\n(dependency levels)")

        build_edges >> detect_cycles >> check_cycle_size
        check_cycle_size >> Edge(label="yes\n(len > 1)") >> error_circular
        check_cycle_size >> Edge(label="no") >> topo_sort >> schema_groups

        mark_complete >> build_dep_graph

    with Cluster(
        "Schema Level - Parallel per Group (Sequential Between Groups)",
        graph_attr={"bgcolor": "#e8f8e8"},
    ):
        with Cluster(
            "For Each Schema Group (try_join_all)", graph_attr={"bgcolor": "#f0f0f8"}
        ):
            schema_group = Storage("Schema Group N\n(parallel execution)")
            compile_schema = Rust("compile_schema()\nper schema")

            schema_groups >> Edge(label="for each level") >> schema_group
            schema_group >> Edge(label="futures::try_join_all") >> compile_schema

    with Cluster(
        "Per-Schema Compilation (compile_schema)", graph_attr={"bgcolor": "#e8f8ff"}
    ):
        resolve_schema_ref = Action("Resolve SchemaCtx\n(root or dependency)")
        ns_bfs = Rust("namespace_levels()\n(BFS + topological sort)")
        ns_depth_groups = Storage("Vec<Vec<String>>\n(namespace depths)")

        compile_schema >> resolve_schema_ref >> ns_bfs >> ns_depth_groups

        with Cluster(
            "Namespace Level - Parallel per Depth (Sequential Between Depths)",
            graph_attr={"bgcolor": "#f0f5ff"},
        ):
            with Cluster(
                "For Each Namespace Depth (try_join_all)",
                graph_attr={"bgcolor": "#f5faff"},
            ):
                ns_depth = Storage("Namespace Depth N\n(parallel execution)")
                register_types = Rust("register_types\n_recursive()\nper namespace")

                ns_depth_groups >> Edge(label="for each depth") >> ns_depth
                ns_depth >> Edge(label="futures::try_join_all") >> register_types

    with Cluster(
        "Per-Namespace Type Registration (register_types_recursive)",
        graph_attr={"bgcolor": "#f0f5ff"},
    ):
        get_ns = Action("Get NamespaceCtx\nfrom schema")
        extract_type_graph = Rust("TypeExtractor::\nextract_from\n_namespace")
        type_dep_graph = Storage("TypeDependencyGraph\n(with EdgeKinds)")

        register_types >> get_ns >> extract_type_graph >> type_dep_graph

        with Cluster("Type Dependency Analysis", graph_attr={"bgcolor": "#f5f8ff"}):
            detect_type_cycles = Action("SCC Detection\n(required edges only)")
            check_terminating = Decision("Has terminating\nedge?\n(optional/array)")
            error_type_cycle = Storage("Error:\nTypeCircular\nDependency")
            allow_cycle = Action("Allow terminating\ncycle")

            type_dep_graph >> detect_type_cycles >> check_terminating
            check_terminating >> Edge(label="no") >> error_type_cycle
            check_terminating >> Edge(label="yes") >> allow_cycle

        type_topo_sort = Rust("Topological Sort\n(all edges)")
        type_groups = Storage("Vec<Vec<Named\nItemContext>>\n(dependency order)")

        allow_cycle >> type_topo_sort >> type_groups

        with Cluster(
            "Type Level - Parallel per Group (Sequential Between Groups)",
            graph_attr={"bgcolor": "#f8faff"},
        ):
            with Cluster(
                "For Each Type Group (try_join_all)", graph_attr={"bgcolor": "#fcfeff"}
            ):
                type_group = Storage("Type Group N\n(parallel execution)")
                register_single = Rust("register_type()\nper type")

                type_groups >> Edge(label="for each group") >> type_group
                type_group >> Edge(label="futures::try_join_all") >> register_single

        with Cluster(
            "Type Registration (register_type)", graph_attr={"bgcolor": "#fcfeff"}
        ):
            get_child = Action("Get NamespaceChild\nfrom children map")
            match_type = Decision("Type kind?")

            reg_struct = Action("registry.register()\nDefinition::Struct")
            reg_enum = Action("registry.register()\nDefinition::Enum")
            reg_oneof = Action("registry.register()\nDefinition::OneOf")
            reg_error = Action("registry.register()\nDefinition::Error")
            reg_alias = Action("registry.register()\nDefinition::TypeAlias")

            registry = InternalStorage("Global TypeRegistry\n(Arc-based)")

            register_single >> get_child >> match_type
            match_type >> Edge(label="Struct") >> reg_struct >> registry
            match_type >> Edge(label="Enum") >> reg_enum >> registry
            match_type >> Edge(label="OneOf") >> reg_oneof >> registry
            match_type >> Edge(label="Error") >> reg_error >> registry
            match_type >> Edge(label="Type") >> reg_alias >> registry

        process_nested = Action("Find nested namespaces\n(depth + 1)")
        recurse = Rust("register_types\n_recursive()\n(recursive call)")

        registry >> process_nested >> Edge(label="parallel", style="dashed") >> recurse

    # Type Resolution Phase (NEW - After All Compilation)
    with Cluster(
        "Type Resolution Phase (After All Schemas Compiled)",
        graph_attr={"bgcolor": "#ffe8f8"},
    ):
        calc_total_ns = Action("Calculate total\nnamespaces\nacross schemas")
        resolution_bar = InternalStorage("Progress Bar:\nResolving N\nnamespaces")

        registry >> calc_total_ns >> resolution_bar

        with Cluster(
            "Schema Level - Type Resolution (Parallel per Group)",
            graph_attr={"bgcolor": "#fff0f8"},
        ):
            resolve_schema_group = Storage("Schema Group N\n(same as compile)")
            resolve_schema_types = Rust("resolve_schema\n_types()\nper schema")

            resolution_bar >> Edge(label="for each level") >> resolve_schema_group
            (
                resolve_schema_group
                >> Edge(label="futures::try_join_all")
                >> resolve_schema_types
            )

        with Cluster(
            "Per-Schema Resolution (resolve_schema_types)",
            graph_attr={"bgcolor": "#fff5fc"},
        ):
            resolve_ns_levels = Action("namespace_levels()\n(same BFS)")
            resolution_depth_groups = Storage("Vec<Vec<String>>\n(namespace depths)")

            resolve_schema_types >> resolve_ns_levels >> resolution_depth_groups

            with Cluster(
                "Namespace Level - Resolution (Parallel per Depth)",
                graph_attr={"bgcolor": "#fffafe"},
            ):
                resolution_depth = Storage("Namespace Depth N\n(parallel execution)")
                resolve_ns_types = Rust("resolve_namespace\n_types()\nper namespace")

                (
                    resolution_depth_groups
                    >> Edge(label="for each depth")
                    >> resolution_depth
                )
                (
                    resolution_depth
                    >> Edge(label="futures::try_join_all")
                    >> resolve_ns_types
                )

        with Cluster(
            "Per-Namespace Type Resolution (resolve_namespace_types)",
            graph_attr={"bgcolor": "#fffcfe"},
        ):
            create_resolver = Rust("TypeResolver::new()\nwith namespace")
            run_resolver = Rust("resolver.resolve()\n(8 sequential phases)")

            resolve_ns_types >> create_resolver >> run_resolver

            with Cluster(
                "TypeResolver 8 Phases (Sequential)", graph_attr={"bgcolor": "#fefeff"}
            ):
                p1_anonymous = Rust("anonymous_structs()\nExtract inline structs")
                p2_identify = Rust("identify_unions()\nFind union types")
                p3_aliases = Rust("resolve_type_aliases()\nResolve type aliases")
                p4_validate = Rust("validate_unions()\nCheck union validity")
                p5_merge = Rust("merge_unions()\nGenerate union structs")
                p6_versions = Rust("resolve_versions()\nResolve type versions")
                p7_errors = Rust("resolve_error_types()\nResolve operation errors")
                p8_validate_refs = Rust(
                    "validate_all\n_references()\nCheck type references"
                )

                run_resolver >> p1_anonymous >> p2_identify >> p3_aliases
                p3_aliases >> p4_validate >> p5_merge >> p6_versions
                p5_merge >> p7_errors
                p6_versions >> p8_validate_refs
                p7_errors >> p8_validate_refs

            integrate = Rust("integrate_resolution()\nMerge results\ninto namespace")
            register_generated = Action("Register generated\nstructs\nin TypeRegistry")
            update_progress = Action("resolution_bar.inc(1)\nUpdate progress")

            p8_validate_refs >> integrate >> register_generated >> update_progress

    with Cluster("Finalization", graph_attr={"bgcolor": "#f0f8e8"}):
        check_invalidated = Decision("Lockfile\ninvalidated?")
        collect_versions = Action("Collect loaded\nversions from state")
        generate_lockfile = Git("LockfileManager::\nwrite_lockfile()")
        write_lock = Storage("Write schema.lock\nto filesystem")

        update_progress >> check_invalidated
        check_invalidated >> Edge(label="yes or missing") >> collect_versions
        (
            check_invalidated
            >> Edge(label="no", style="dashed")
            >> Edge(label="skip write")
        )
        collect_versions >> generate_lockfile >> write_lock

        finish_progress = Action("progress.finish()\nDisplay completion time")

        write_lock >> finish_progress
