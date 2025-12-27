---
title: "User Configuration"
---

The Kintsu compiler supports user configuration for registry discovery, authentication, and default settings. Configuration is loaded from TOML files and can be overridden via environment variables.

## KINTSU_HOME

`KINTSU_HOME` is the base directory for Kintsu configuration, cache, and data. When not explicitly set, it defaults to:

| Platform | Default Location                                                         |
| -------- | ------------------------------------------------------------------------ |
| macOS    | `~/.kintsu/`                                                             |
| Linux    | `$XDG_DATA_HOME/kintsu/` (fallback: `~/.local/share/kintsu/` if not set) |
| Windows  | `%APPDATA%\kintsu\`                                                      |

When resolved, the following directory structure is created:

```text title="KINTSU_HOME structure"
$KINTSU_HOME/
 |--- kintsu.toml          # User configuration
 |--- cache/               # Downloaded packages
 |--- templates/           # Custom scaffolding templates
 |--- credentials/         # Keychain fallback (if OS keychain unavailable)
```

When `KINTSU_HOME` is explicitly set via environment variable, it overrides the platform default:

```bash title="Custom KINTSU_HOME"
export KINTSU_HOME=/opt/kintsu
# Config at: /opt/kintsu/kintsu.toml
# Cache at:  /opt/kintsu/cache/
```

## Configuration Locations

Configuration is loaded from two locations and merged:

### Home Configuration

Global user defaults stored at:

- **Unix/macOS**: `$KINTSU_HOME/kintsu.toml` (or `$HOME/.config/kintsu.toml`)
- **Windows**: `%APPDATA%\kintsu\config.toml`

Override with the `KINTSU_CONFIG` environment variable.

### Project Configuration

Project-specific overrides at `.config/kintsu.toml` relative to your project root (the directory containing `schema.toml`).

Project configuration adds to and overrides home configuration. All home-defined registries remain accessible even when a project customizes specific ones.

## Configuration Structure

```toml title="kintsu.toml"
# Default registry for dependencies without explicit registry
default_registry = "kintsu-public"

# Registry configurations
[[registries]]
name = "kintsu-public"
url = "https://registry.kintsu.dev"

[[registries]]
name = "internal"
url = "https://registry.example.com"
token = { credentials = true }  # Use OS credential store
```

### Fields

| Field              | Type   | Description                                                                              |
| ------------------ | ------ | ---------------------------------------------------------------------------------------- |
| `default_registry` | string | Registry to use for dependencies without explicit registry. Defaults to `kintsu-public`. |
| `registries`       | array  | Array of registry configurations.                                                        |

### Registry Configuration

Each registry entry supports:

| Field   | Type   | Description                                                          |
| ------- | ------ | -------------------------------------------------------------------- |
| `name`  | string | **Required.** Registry identifier used in dependency specifications. |
| `url`   | string | **Required.** Base URL of the registry API.                          |
| `token` | object | Optional authentication configuration.                               |

### Token Configuration

The `token` field specifies how to obtain credentials. Use exactly one method:

```toml title="Token Methods"
# Method 1: OS credential store (most secure)
token = { credentials = true }

# Method 2: Environment variable
token = { env = "MY_REGISTRY_TOKEN" }

# Method 3: File path
token = { file = "/path/to/token" }
```

| Method        | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `credentials` | Use the OS credential store. Looks up `kintsu:{registry_name}`.    |
| `env`         | Name of an environment variable containing the token.              |
| `file`        | Path to a file containing the token (trailing whitespace trimmed). |

## Built-in Registry

The `kintsu-public` registry is always available without configuration:

- **URL**: `https://registry.kintsu.dev`
- **Authentication**: None required for public packages

You can override this by defining your own `kintsu-public` entry.

## Cache Configuration

The `[cache]` table configures where Kintsu stores downloaded packages and git checkouts:

```toml title="kintsu.toml"
[cache]
dir = "/custom/cache/path"    # Override default cache directory
```

### Cache Location Resolution

Cache directory is resolved in precedence order:

| Priority | Source                  | Value                     |
| -------- | ----------------------- | ------------------------- |
| 1 (high) | `KINTSU_CACHE_DIR` env  | Environment variable path |
| 2        | `[cache].dir` in config | Explicit configuration    |
| 3        | `KINTSU_HOME` env       | `$KINTSU_HOME/cache/`     |
| 4 (low)  | Platform default        | See below                 |

**Platform Defaults:**

| Platform | Default Cache Location           |
| -------- | -------------------------------- |
| macOS    | `~/.cache/kintsu/`               |
| Linux    | `~/.cache/kintsu/` (follows XDG) |
| Windows  | `%LOCALAPPDATA%\kintsu\cache\`   |

### Cache Directory Structure

```text title="Cache structure"
~/.cache/kintsu/
 |--- git/
|    |--- {host}-{owner}-{repo}/
|        |--- {commit-sha}/             # Git checkout at specific commit
|            |--- schema/
|                |--- *.ks
 |--- packages.db                       # SQLite database for registry packages
```

Registry packages are stored in a SQLite database (`packages.db`) for efficient lookups. Git dependencies are checked out to the filesystem.

## Environment Variables

| Variable                  | Description                                  |
| ------------------------- | -------------------------------------------- |
| `KINTSU_HOME`             | Override base directory for config and cache |
| `KINTSU_CONFIG`           | Override home configuration file path        |
| `KINTSU_CACHE_DIR`        | Override cache directory location            |
| `KINTSU_DEFAULT_REGISTRY` | Override default registry name               |
| `KINTSU_REGISTRY_TOKEN`   | Universal token for all registries           |
| `KINTSU_NO_CREDENTIALS`   | Disable credential store access              |

> **Tip:** `KINTSU_CONFIG` and `KINTSU_CACHE_DIR` override their respective `KINTSU_HOME` paths if you need finer control.

### Token Resolution Order

When authentication is needed:

1. `--token` CLI flag (if provided)
2. `KINTSU_REGISTRY_TOKEN` environment variable
3. Registry-specific `token` configuration
4. No authentication

The CLI flag and environment variable enable CI/CD pipelines to authenticate with a single token.

## Examples

### Personal Configuration

Store in `~/.config/kintsu.toml`:

```toml title="~/.config/kintsu.toml"
default_registry = "internal"

[[registries]]
name = "internal"
url = "https://registry.mycompany.com"
token = { credentials = true }

[[registries]]
name = "partner"
url = "https://registry.partner.com"
token = { env = "PARTNER_TOKEN" }
```

### Project Override

Store in `.config/kintsu.toml` in your project:

```toml title=".config/kintsu.toml"
# Use internal registry by default for this project
default_registry = "internal"

# Override partner registry URL for this project
[[registries]]
name = "partner"
url = "https://staging.partner.com"
token = { env = "PARTNER_STAGING_TOKEN" }
```

### CI/CD Pipeline

Use environment variables for authentication:

```bash
export KINTSU_REGISTRY_TOKEN="$CI_REGISTRY_TOKEN"
kintsu check
kintsu registry publish
```

Or pass the token directly:

```bash
kintsu registry publish --token "$CI_REGISTRY_TOKEN"
```

## Security Considerations

- **Avoid plaintext tokens**: Use the credential store (`credentials = true`) when possible.
- **Token files**: Ensure restricted filesystem permissions (e.g., `chmod 600`).
- **Environment variables**: Visible to child processes; prefer credential store for sensitive tokens.

## Credential Store Setup

### macOS (Keychain)

```bash
security add-generic-password -s "kintsu:internal" -a "$USER" -w "your-token"
```

### Linux (Secret Service)

```bash
secret-tool store --label="Kintsu internal registry" service kintsu:internal
```

### Windows (Credential Manager)

```powershell
cmdkey /add:kintsu:internal /user:kintsu /pass:your-token
```

## Authentication Commands

Kintsu provides CLI commands for managing registry authentication.

### kintsu login

Authenticates with a package registry using a token.

```bash title="kintsu login"
# Interactive login (prompts for token with masking)
kintsu login

# Login to specific registry
kintsu login --registry corp

# Login with token directly (CI environment)
kintsu login --token "$KINTSU_TOKEN"

# Login without keychain storage
kintsu login --no-keychain

# Login with token from stdin
echo "$TOKEN" | kintsu login --stdin --registry corp
```

| Option              | Short | Description                                      |
| ------------------- | ----- | ------------------------------------------------ |
| `--registry <NAME>` | `-r`  | Registry to authenticate with (default: default) |
| `--token <TOKEN>`   | `-t`  | Use token directly instead of interactive prompt |
| `--stdin`           |       | Read token from stdin                            |
| `--no-keychain`     |       | Don't store credentials in system keychain       |

### kintsu logout

Removes stored credentials for a registry.

```bash title="kintsu logout"
# Logout from default registry
kintsu logout

# Logout from specific registry
kintsu logout --registry corp

# Logout from all registries
kintsu logout --all
```

| Option              | Short | Description                                 |
| ------------------- | ----- | ------------------------------------------- |
| `--registry <NAME>` | `-r`  | Registry to log out from (default: default) |
| `--all`             |       | Log out from all registries                 |

### kintsu whoami

Displays the currently authenticated user.

```bash title="kintsu whoami"
# Check default registry
kintsu whoami

# Check specific registry
kintsu whoami --registry corp

# Check all registries
kintsu whoami --all

# JSON output for scripting
kintsu whoami --json
```

| Option              | Short | Description                                |
| ------------------- | ----- | ------------------------------------------ |
| `--registry <NAME>` | `-r`  | Check specific registry (default: default) |
| `--all`             |       | Show authentication for all registries     |
| `--json`            |       | Output in JSON format                      |

## References

- [RFC-0022](/specs/rfc/RFC-0022) - User Configuration Format
- [RFC-0026](/specs/rfc/RFC-0026) - CLI Authentication Commands
- [SPEC-0021](/specs/spec/SPEC-0021) - User Configuration Implementation
