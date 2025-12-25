---
title: "error"
---

Errors group named variants representing failure cases. Each variant may carry structured data either as an inline anonymous struct or a reference to an existing type. Error types are used to model the failure modes of operations.

## Syntax

```kintsu
error NetworkError {
    // Variant with anonymous struct
    Timeout {
        duration_ms: i64,
        endpoint: str
    },
    // Variant with named type reference
    Io(IoError),
    // Variant with no data
    Unknown
};

enum IoErrorCode {
    ReadFail,
    WriteFail,
    PipeBroken
};

struct IoError {
    code: IoErrorCode,
    message?: str
};

error ServerError {
    Unknown {
        report_id: str,
        timestamp: datetime
    },
    Io(IoError),
    Database {
        query: str,
        error_code: i32
    }
};
```

## Resolution Behaviour

### Variant Types

Error variants can have three forms:

**Struct variant:**
Contains inline fields (anonymous struct):

```kintsu
error AppError {
    ValidationFailed {
        field: str,
        reason: str
    }
};
```

**Tuple variant:**
Contains a reference to an existing type:

```kintsu
error AppError {
    Io(IoError)
};
```

**Unit variant:**
Contains no data:

```kintsu
error AppError {
    Unknown
};
```

### Anonymous Struct Extraction

Struct variants with inline fields are treated as anonymous structs during compilation. The compiler extracts them and generates named struct types:

```kintsu
error RequestError {
    InvalidInput {
        field: str,
        expected: str,
        got: str
    }
};
```

After extraction:

```kintsu
struct RequestErrorInvalidInput {
    field: str,
    expected: str,
    got: str
};

error RequestError {
    InvalidInput(RequestErrorInvalidInput)
};
```

The generated struct name is formed by concatenating the error name and variant name in PascalCase.

### Type Reference Validation

For tuple variants that reference existing types, the compiler validates that the referenced type exists during compilation:

```kintsu
error AppError {
    Database(DbError)  // DbError must exist
};
```

If `DbError` is not found in the type registry, compilation fails with an error.

### Optional Fields

Fields in struct variants can be marked optional with `?`:

```kintsu
error ApiError {
    Timeout {
        endpoint: str,
        retry_after?: i64
    }
};
```

Optional fields follow the same rules as struct fields.

## Error Association

### Operation Errors

Errors are associated with operations using the `#[err(...)]` attribute. This can be specified at the operation level or namespace level:

**Operation-level:**

```kintsu
error ValidationError {
    InvalidInput { field: str }
};

#[err(ValidationError)]
operation validate(data: str) -> bool!;
```

**Namespace-level:**

```kintsu
#![err(DefaultError)]
namespace api;

error DefaultError {
    Unknown
};

// All operations use DefaultError by default
operation process(value: i32) -> str!;
```

### Error Resolution

Errors are resolved during compilation, where the compiler:

1. Scans all operations for result types (return type with `!`)
2. Resolves the error type from `#[err(...)]` attributes
3. Validates that the error type exists in the type registry
4. Stores the error metadata in the namespace resolution

Operations with result types must have an associated error type, either explicitly via attribute or inherited from namespace metadata.

### Error Validation

The error type specified in `#[err(...)]` must be the path to the error as defined:

```kintsu
error MyError {
    Unknown { report_id: str }
};

#[err(MyError)]
operation test() -> i64!;
```

## Compilation

Error definitions are registered in the type registry during compilation like other named types. Error resolution happens during compilation:

1. Operations with result types are identified
2. Error attributes are resolved (operation-level takes precedence over namespace-level)
3. Error types are validated to exist in the type registry
4. Error metadata is stored for code generation

## Validation Rules

The compiler enforces:

- Error names must be unique within their namespace
- Variant names must be unique within the error
- Tuple variant types must exist in the type registry
- Operations with result types must have an associated error type
- Error attribute values must use PascalCase names
- Struct variant fields follow the same rules as struct fields

> [!TIP]
>
> - Variants are top-level declarations with the `error` keyword.
> - Fields use the same rules as struct fields, including optional `?`.
> - Anonymous struct variants are automatically extracted and named.
> - Use `#[err(...)]` at operation or namespace level to associate errors with operations.
