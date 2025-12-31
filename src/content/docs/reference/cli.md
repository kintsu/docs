---
title: "CLI Reference"
description: "Kintsu Command Line Interface Reference"
---

# Cli Reference

This document contains the help content for the `` command-line program.

**Command Overview:**

* [``↴](#)
* [` generate`↴](#generate)
* [` check`↴](#check)
* [` init`↴](#init)
* [` fmt`↴](#fmt)
* [` registry`↴](#registry)
* [` registry publish`↴](#registry-publish)
* [` list`↴](#list)
* [` tree`↴](#tree)
* [` inspect`↴](#inspect)

## ``

**Usage:** `[OPTIONS] <COMMAND>`

###### **Subcommands:**

* `generate` — generates models as defined in `op-gen.toml`
* `check` — checks models for soundness
* `init` — initializes a new schema project
* `fmt` — formats schemas
* `registry` — registry sub commands
* `list` — list dependencies or workspace schemas
* `tree` — display dependency tree
* `inspect` — inspect manifests (derived virtual or canonical)

###### **Options:**

* `--log-level <LOG_LEVEL>` — the verbosity level to print logs at.

  Default value: `off`

  Possible values:
  - `debug`
  - `trace`
  - `info`
  - `error`
  - `warn`
  - `off`:
    Disable all logging output




## ` generate`

generates models as defined in `op-gen.toml`

**Usage:** ` generate [OPTIONS]`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `--no-progress` — disable progress output

  Default value: `false`



## ` check`

checks models for soundness

**Usage:** ` check [OPTIONS]`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `-s`, `--schema <SCHEMA>` — Target a specific workspace schema by alias. Only valid in workspace contexts.
* `--no-progress` — disable progress output

  Default value: `false`



## ` init`

initializes a new schema project

**Usage:** ` init [OPTIONS] --name <NAME>`

###### **Options:**

* `-n`, `--name <NAME>` — the name of the package to create.
* `-d`, `--dir <DIR>` — the directory to create the new package in.



## ` fmt`

formats schemas

**Usage:** ` fmt [OPTIONS] [INCLUDE]...`

###### **Arguments:**

* `<INCLUDE>` — a list of paths or globs to include in formatting

  Default value: `./**/*.ks`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `--no-progress` — disable progress output

  Default value: `false`
* `--dry` — if --dry, no edits will be written to files

  Default value: `false`
* `--safe` — if --safe=false, unsafe edits will be applied

  Default value: `true`
* `-e`, `--exclude <EXCLUDE>` — a list of paths or globs to exclude from formatting.
* `-W`, `--warn-is-fail` — fail if warnings are encountered



## ` registry`

registry sub commands

**Usage:** ` registry <COMMAND>`

###### **Subcommands:**

* `publish` — Shared progress configuration for CLI commands. Use with `#[clap(flatten)]` in command arg structs



## ` registry publish`

Shared progress configuration for CLI commands. Use with `#[clap(flatten)]` in command arg structs

**Usage:** ` registry publish [OPTIONS] --base-url <BASE_URL> --token <TOKEN>`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `-r`, `--base-url <BASE_URL>` — the base url of the registry.
* `--token <TOKEN>` — the API key for the registry.
* `--no-progress` — disable progress output

  Default value: `false`



## ` list`

list dependencies or workspace schemas

**Usage:** ` list [OPTIONS]`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `--no-progress` — disable progress output

  Default value: `false`
* `--json` — Output in JSON format
* `-o`, `--outdated` — Show only outdated packages
* `--depth <DEPTH>` — Maximum dependency depth (default: 1)

  Default value: `1`
* `-w`, `--workspace` — List workspace schemas instead of dependencies
* `--no-color` — Disable coloured output



## ` tree`

display dependency tree

**Usage:** ` tree [OPTIONS]`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `--no-progress` — disable progress output

  Default value: `false`
* `--depth <DEPTH>` — Maximum tree depth (unlimited by default)
* `-i`, `--invert` — Show reverse dependencies
* `-p`, `--package <PACKAGE>` — Focus on specific package
* `--duplicates` — Only show packages appearing multiple times
* `--json` — Output in JSON format
* `-w`, `--workspace` — Show workspace dependency graph
* `--no-color` — Disable coloured output



## ` inspect`

inspect manifests (derived virtual or canonical)

**Usage:** ` inspect [OPTIONS]`

###### **Options:**

* `-d`, `--config-dir <CONFIG_DIR>`
* `--no-progress` — disable progress output

  Default value: `false`
* `-s`, `--schema <SCHEMA>` — Show specific schema's derived manifest
* `--json` — Output in JSON format
* `--no-color` — Disable coloured output
