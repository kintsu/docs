---
title: "Licensing Structure"
---

# Licensing Structure

## Overview

The Kintsu project uses a dual-licensing approach to balance open-source principles with commercial sustainability:

- **Core Components**: Licensed under GNU AGPL-3.0 (strong copyleft)
- **Registry Components**: Licensed under Sustainable Use License (permits self-hosting, restricts commercial services)

## Rationale

### Why AGPL-3.0 for Core?

The AGPL-3.0 ensures that:

- Users have complete freedom to use, modify, and distribute the compiler and tooling
- Any modifications or derivative works must be shared back to the community
- Network use (SaaS) is treated like distribution (closing the "ASP loophole")
- The type system and tooling remain open and collaborative

### Why Sustainable Use License for Registry?

The registry is dual-licensed to:

- **Protect users' rights**: Explicitly permits self-hosting for personal or internal organizational use
- **Restrict commercial exploitation**: Prevents third parties from offering the registry as a paid service without permission
- **Encourage contribution**: Creates a sustainable model where commercial users support development
- **Maintain accessibility**: Free for non-commercial and internal business use

## Licensing by Component

### AGPL-3.0 Components (Core)

All crates **except** registry components are licensed under AGPL-3.0:

- `kintsu-cli` - Command-line interface
- `kintsu-cli-core` - CLI core functionality
- `kintsu-core` - Type system and code generation
- `kintsu-derives` - Derive macros
- `kintsu-env` - Environment management
- `kintsu-env-client` - Environment client
- `kintsu-errors` - Error handling
- `kintsu-events` - Event system
- `kintsu-fs` - Filesystem abstraction
- `kintsu-manifests` - Manifest parsing
- `kintsu-parser` - Schema parsing
- `kintsu-parser-ast` - AST definitions
- `kintsu-sdk` - Software development kit
- `kintsu-test-macros` - Testing macros
- `kintsu-test-suite` - Test suite
- `kintsu-testing` - Testing utilities
- _... and all non-registry components as explicitly listed below_

### Sustainable Use License Components (Registry)

All `kintsu-registry*` crates are licensed under the Sustainable Use License:

- `kintsu-registry` - Main registry service
- `kintsu-registry-auth` - Authentication
- `kintsu-registry-core` - Core registry types
- `kintsu-registry-db` - Database layer
- `kintsu-registry-errors` - Registry errors
- `kintsu-registry-events` - Registry events
- `kintsu-registry-storage` - Storage backends

## Cargo Configuration

### Workspace-Level

The workspace `Cargo.toml` defines:

```toml
[workspace.package]
license-file = "../LICENSE.md"  # Default: AGPL-3.0

[workspace.metadata.licenses]
default = "../LICENSE.md"         # AGPL-3.0
registry = "../LICENSE-REGISTRY.md"  # Sustainable Use License
```

### Package-Level

**Core packages** inherit from workspace:

```toml
[package]
license-file.workspace = true  # Inherits AGPL-3.0
```

**Registry packages** explicitly specify:

```toml
[package]
license-file = "../LICENSE-REGISTRY.md"  # Sustainable Use License
```

## Use Cases

### Permitted Use Cases

**Core (AGPL-3.0)**:

- Use Kintsu for any project (commercial or non-commercial)
- Modify the compiler and tooling
- Distribute modified versions (must share source under AGPL-3.0)
- Build SaaS applications using Kintsu (must share modifications)

**Registry (Sustainable Use)**:

- Self-host the registry for personal use
- Self-host the registry for your organization's internal use
- Modify the registry code for internal purposes
- Distribute free-of-charge for non-commercial purposes

### Restricted Use Cases

**Registry (Sustainable Use)**:

- Offering the registry as a paid commercial service to third parties
- Providing the registry as part of a commercial SaaS offering
- Selling or licensing the registry software

_Note: Commercial use requires explicit permission from the licensor._

## FAQ

**Q: Can I use Kintsu in my commercial product?**
A: Yes! The compiler and tooling are AGPL-3.0, so you can use them freely. If you modify them, you must share those modifications.

**Q: Can I self-host the registry for my company?**
A: Yes! The Sustainable Use License explicitly permits self-hosting for internal business purposes.

**Q: Can I offer a hosted Kintsu registry service?**
A: Only with explicit written permission from the licensor. The Sustainable Use License restricts commercial service offerings.

**Q: What if I want to build a commercial service around Kintsu?**
A: The compiler and tooling are freely available under AGPL-3.0. If you need to offer registry hosting as a service, please contact us about commercial licensing.

**Q: Can I fork the project?**
A: Yes! Both licenses permit forking:

- AGPL-3.0 components can be forked freely (must remain AGPL-3.0)
- Sustainable Use components can be forked for non-commercial use

## License Files

- [`LICENSING.md`](https://github.com/kintsu/kintsu/blob/main/LICENSING.md) - This document (licensing structure overview)
- [`LICENSE.md`](https://github.com/kintsu/kintsu/blob/main/LICENSE.md) - GNU AGPL-3.0 (default for core components)
- [`LICENSE-REGISTRY.md`](https://github.com/kintsu/kintsu/blob/main/LICENSE-REGISTRY.md) - Sustainable Use License (registry components)

## Contact

> [!IMPORTANT]
> For commercial licensing inquiries or permissions:
> Joshua Auchincloss <josh@kintsu.dev>, <joshua-auchincloss@proton.me>
