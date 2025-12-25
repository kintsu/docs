---
title: "User Configuration"
---

The Kintsu compiler supports user configuration for registry discovery, authentication, and default settings. Configuration is loaded from TOML files and can be overridden via environment variables.

## Configuration Locations

Configuration is loaded from two locations and merged:

### Home Configuration

Global user defaults stored at:

- **Unix/macOS**: `$HOME/.config/kintsu.toml`
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

## Environment Variables

| Variable                  | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `KINTSU_CONFIG`           | Override home configuration file path.                 |
| `KINTSU_DEFAULT_REGISTRY` | Override default registry name.                        |
| `KINTSU_REGISTRY_TOKEN`   | Universal token for all registries (highest priority). |
| `KINTSU_NO_CREDENTIALS`   | Disable credential store access.                       |

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

## References

- [RFC-0022](/specs/rfc/RFC-0022) - User Configuration Format
- [SPEC-0021](/specs/spec/SPEC-0021) - User Configuration Implementation
