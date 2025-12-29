---
title: "Attributes"
---

Attributes provide metadata that controls compilation behavior. Kintsu supports two attribute types: **outer attributes** (`#[...]`) apply to the following item, and **inner attributes** (`#![...]`) apply to the enclosing scope.

## Error Attributes

Associate error types with operations using `#[err(...)]`:

```kintsu
error ApiError {
    NotFound { id: i64 },
    Unauthorized
};

#[err(ApiError)]
operation get_user(id: i64) -> User!;
```

Namespace-level default:

```kintsu
namespace api {
    #![err(ApiError)]

    operation get_user(id: i64) -> User!;
    operation delete_user(id: i64) -> bool!;
}
```

## Form Attributes

Control serialization format and encoding for fields using `#[form(...)]`:

### Complex Numbers

Complex fields require explicit form with precision:

```kintsu
#[form(polar, precision = f64)] angle: complex
#[form(cartesian, precision = f32)] position: complex
```

| Variant     | Description                     |
| ----------- | ------------------------------- |
| `polar`     | Magnitude and phase (r, θ)      |
| `cartesian` | Real and imaginary parts (a+bi) |
| `tuple`     | Array format [real, imag]       |

### f8 Minifloat

f8 fields require explicit format variant:

```kintsu
#[form(e4m3)] weight: f8   // Higher precision (±448)
#[form(e5m2)] gradient: f8 // Larger range (±57344)
```

### DateTime Variants

Customize datetime representation:

```kintsu
#[form(iso8601)] timestamp: datetime  // Full ISO 8601 (default)
#[form(date)] day: date               // YYYY-MM-DD
#[form(week)] period: week            // YYYY-Www
#[form(week_day)] start: week         // YYYY-Www-D
```

### Serialization Formats

Specify wire format for fields:

```kintsu
#[form(json)] config: Config
#[form(msgpack)] data: Data
#[form(yaml)] settings: Settings
```

### Format Chaining

Compose multiple transformations using `=` (right-to-left evaluation):

```kintsu
#[form(base64 = gzip = json)] cursor: Cursor
```

Evaluation order:

1. `json`: Serialize `Cursor` to JSON (text)
2. `gzip`: Compress JSON to binary
3. `base64`: Encode binary as base64 text

```sh title="Equivalent To"
echo '{"page":1,"next_page":2,"size":25}' | gzip | base64
# > "H4sIAJwCUmkAA6tWKkhMT1WyMtRRykutKImH8Ix0lIozq0AM01ouAANOcQsjAAAA"

echo "H4sIAJwCUmkAA6tWKkhMT1WyMtRRykutKImH8Ix0lIozq0AM01ouAANOcQsjAAAA" | base64 -D | gzip -d | jq .next_page
# > 2
```

### Namespace Defaults

Set defaults for all fields in a namespace:

```kintsu
namespace physics {
    #![form(polar, precision = f64)]

    struct Signal {
        amplitude: complex,  // Inherits polar, f64
        phase: complex,      // Inherits polar, f64
    };
}
```

### Custom Formats

Declare custom compression or encoding with explicit category:

```kintsu
#[form(compress(lzo, binary))] data: binary
#[form(encode(base58, text))] hash: binary
#[form(mime(application_pdf, binary))] document: binary
```

## Tag Attributes

Control variant serialization for oneof types:

```kintsu
// External: { "success": { "data": "..." } }
#[tag(external)]
type ResponseA = oneof Success | Error;

// Internal: { "kind": "success", "data": "..." }
#[tag(name = "kind")]
type ResponseB = oneof Success | Error;

// Adjacent: { "t": "success", "c": { "data": "..." } }
#[tag(adjacent, tag = "t", content = "c")]
type ResponseC = oneof Success | Error;
```

## References

- [RFC-0012](/specs/rfc/RFC-0012) - Metadata System
- [RFC-0032](/specs/rfc/RFC-0032) - Form Metadata Design
- [RFC-0017](/specs/rfc/RFC-0017) - Variant Tagging Design
- [TSY-0012](/specs/tsy/TSY-0012) - Metadata
- [TSY-0015](/specs/tsy/TSY-0015) - Form Metadata Rules
