from diagrams.generic.compute import Rack
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import InputOutput
from diagrams.programming.language import Rust

from diagrams import Cluster, Diagram, Edge
from gen_diagrams.common import diag_path

graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
}

with Diagram(
    "Parallel Compilation Architecture",
    filename=diag_path("parallel_compilation_architecture"),
    outformat="png",
    graph_attr=graph_attr,
    direction="TB",
    show=False,
):
    with Cluster("CompileCtx"):
        scheduler = Rust("Task Scheduler\n(seed queue)")

        with Cluster("Tokio Channels"):
            task_queue = InputOutput("Task Channel\n(mpsc::unbounded)")
            result_queue = InputOutput("Result Channel\n(mpsc::unbounded)")
            completion = InputOutput("Completion Channel\n(mpsc::unbounded)")

        with Cluster("Worker Pool"):
            workers = [Rack(f"Worker {i}\n(tokio::spawn)") for i in range(1, 5)]

        coordinator = Rust("CoordinatorState\n(pending, errors)")

        state = Storage("SharedCompilationState\n(BTreeMap)")

    # Flow: scheduler → task queue → workers
    scheduler >> Edge(label="enqueue\ninitial tasks") >> task_queue

    for i, worker in enumerate(workers):
        task_queue >> Edge(label="recv()" if i == 0 else "") >> worker
        worker >> Edge(label="send()" if i == 0 else "") >> result_queue
        worker >> Edge(label="load\nschema", style="dashed") >> state
        (
            worker
            >> Edge(label="completion" if i == 0 else "", style="dashed")
            >> completion
        )

    # Flow: workers → result queue → coordinator
    result_queue >> Edge(label="recv()") >> coordinator
    completion >> Edge(label="track pending") >> coordinator

    # Flow: coordinator → state
    coordinator >> Edge(label="register\ndependencies") >> state
