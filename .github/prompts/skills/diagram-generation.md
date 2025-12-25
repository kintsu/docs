---
name: diagram-generation
title: "Diagram Generation"
description: "Process for generating architectural diagrams using Python diagrams library"
tags: ["diagrams", "documentation", "automation"]
updated: 2025-12-25
---
# Diagram Generation

This skill documents the process for creating diagrams using the Python diagrams library.

## Overview

Diagrams visualize Kintsu compiler architecture, workflows, and processes. They are generated using Python and the `diagrams` library.

## Before Generating

1. Check existing diagrams: `search_facts` with tags `["diagrams"]`
2. Review `gen_diagrams/common.py` for shared helpers
3. Understand what you're documenting

## Directory Structure

```
gen_diagrams/
  __init__.py
  common.py              # Shared utilities
  compilation.py         # Compilation flow
  type_resolution.py     # Type resolution
  ...
diagrams/                # Generated PNG output
```

## Creating a Diagram

### 1. Create the Python File

```python
# gen_diagrams/my_diagram.py
from diagrams import Diagram, Cluster
from diagrams.generic.compute import Rack
from diagrams.programming.flowchart import Action

with Diagram("My Diagram", filename="diagrams/my_diagram", show=False):
    # Your diagram code
    pass
```

### 2. Run Generation

```bash
python -m gen_diagrams.my_diagram
```

### 3. Log Execution

After successful generation: `submit_execution_logs`

## Best Practices

- Use `diagrams.programming`, `diagrams.generic`, or `diagrams.c4` node types
- Do NOT use cloud-specific diagrams (S3, etc.) unless documenting cloud infra
- Break large diagrams into smaller helper functions
- Generate sub-graphs for complex diagrams
- Follow `.github/prompts/diagram.md` guidelines

## Large Diagrams

For complex diagrams:

1. Create helper functions in the diagram file
2. Call helpers within the main diagram scope
3. Add separate smaller diagrams calling each helper
4. This ensures both full and sub-graph versions exist

## After Generating

1. Log command: `submit_execution_logs`
2. Submit facts about new diagram: `submit_facts`
3. Reference diagram in relevant documentation

## Key Resources

- [.github/prompts/diagram.md](.github/prompts/diagram.md) - Generation guide
- [gen_diagrams/common.py](gen_diagrams/common.py) - Shared utilities
- [diagrams/](diagrams/) - Generated output
