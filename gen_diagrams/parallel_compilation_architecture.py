from diagrams import Cluster, Diagram, Edge
from diagrams.generic.compute import Rack
from diagrams.generic.storage import Storage
from diagrams.onprem.queue import Kafka
from diagrams.programming.language import Rust

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
):
    with Cluster("CompileCtx"):
        scheduler = Rust("Task Scheduler\n(seed queue)")

        with Cluster("Async Channels"):
            task_queue = Kafka("Task Channel\n(unbounded)")
            result_queue = Kafka("Result Channel\n(unbounded)")

        with Cluster("Worker Pool"):
            workers = [Rack(f"Worker {i}\n(tokio::spawn)") for i in range(1, 5)]

        collector = Rust("Result Collector\n(aggregator)")

        state = Storage("Shared State\n(RwLock)")

    # Flow: scheduler → task queue → workers
    scheduler >> Edge(label="enqueue\ninitial tasks") >> task_queue

    for i, worker in enumerate(workers):
        task_queue >> Edge(label="recv()" if i == 0 else "") >> worker
        worker >> Edge(label="send()" if i == 0 else "") >> result_queue
        worker >> Edge(label="load\nschema", style="dashed") >> state

    # Flow: workers → result queue → collector
    result_queue >> Edge(label="recv()") >> collector

    # Flow: collector → state
    collector >> Edge(label="register\ndependencies") >> state
