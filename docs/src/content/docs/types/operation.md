---
title: "operation"
---

Represents a remote operation with input parameters and a return type. Operations are the primary interface definitions for RPC-style APIs. They may be infallible (always succeed) or fallible (may return errors).

## Syntax

```kintsu
namespace api;

error ApiError {
    NotFound { id: i64 },
    Unauthorized,
    Internal { message: str }
};

// Infallible operation (no error handling)
operation get_config() -> str;

// Operation with parameters
operation add(a: i32, b: i32) -> i32;

// Fallible operation (result type with !)
#[err(ApiError)]
operation get_user(id: i64) -> User!;

// Operation with optional parameters
operation search(query: str, limit?: i32) -> SearchResult[];
```

## Resolution Behavior

### Parameter Types

All parameter types must resolve to valid types during compilation. The compiler validates each parameter type:

```kintsu
operation process(user: User, config: Config) -> bool;
```

Both `User` and `Config` must exist in the type registry or compilation fails.

### Return Types

Return types follow the same validation rules as parameters. The return type must be a valid type:

```kintsu
operation get_data() -> CustomData;  // CustomData must exist
```

### Optional Parameters

Parameters can be marked optional with `?`:

```kintsu
operation query(
    search: str,
    limit?: i32,
    offset?: i32
) -> Result[];
```

Optional parameters may be omitted by callers. In generated code, this typically maps to language-specific optional/nullable types.

### Result Types

Operations that may fail use the result type syntax (return type with `!`):

```kintsu
#[err(ValidationError)]
operation validate(data: str) -> bool!;
```

The `!` suffix indicates the operation returns a `Result<T, E>` where `E` is the associated error type.

### Error Association

Fallible operations (those with result return types) must have an associated error type. The error type is specified using the `#[err(...)]` attribute.

**Operation-level attribute:**

```kintsu
error MyError { Unknown };

#[err(MyError)]
operation process() -> i64!;
```

**Namespace-level attribute:**

```kintsu
#![err(DefaultError)]
namespace api;

error DefaultError { Unknown };

// All fallible operations inherit DefaultError
operation task1() -> str!;
operation task2() -> i32!;
```

Operation-level attributes take precedence over namespace-level attributes.

### Error Resolution

During compilation, the compiler:

1. Identifies all operations with result return types
2. Resolves the error type from attributes (operation or namespace level)
3. Validates that the error type exists in the type registry
4. Stores error metadata using PascalCase operation names

**Error name lookup:**

Operations are stored in the errors HashMap using PascalCase names:

```kintsu
#[err(MyError)]
operation fetch_user(id: i64) -> User!;
```

The compiler converts `fetch_user` to `FetchUser` when storing error metadata. This ensures consistency with struct and error type naming conventions.

### Missing Error Attribute

If an operation has a result return type but no error attribute (at operation or namespace level), compilation fails:

```kintsu
operation process() -> i64!;  // ERROR: no error type specified
```

The compiler reports this error during compilation.

### Infallible Operations

Operations without the `!` suffix are infallible and never return errors:

```kintsu
operation calculate(a: i32, b: i32) -> i32;
```

Infallible operations do not require error attributes.

## Parameter and Return Type Forms

Operations accept and return the full range of type expressions:

**Primitives:**

```kintsu
operation add(a: i32, b: i32) -> i32;
```

**Named types:**

```kintsu
operation get_user(id: i64) -> User;
```

**Arrays:**

```kintsu
operation list_items() -> Item[];
```

**Oneof:**

```kintsu
operation process(data: oneof str | bytes) -> bool;
```

**Optional:**

```kintsu
operation find(id: i64) -> User?;  // May return no value
```

**Result:**

```kintsu
#[err(AppError)]
operation fetch(id: i64) -> Data!;  // May return error
```

## Compilation

Operations are registered during compilation and their error associations are resolved:

1. Parse operation definitions (parameters, return type)
2. Register operations in the namespace
3. Scan for result return types
4. Resolve error attributes and validate error types exist
5. Store error metadata using PascalCase operation names

## Validation Rules

The compiler enforces:

- Operation names must be unique within their namespace
- Parameter names must be unique within the operation
- All parameter types must resolve to valid types
- Return types must resolve to valid types
- Fallible operations (result types) must have an associated error type
- Error types specified in attributes must exist in the type registry
- Error metadata uses PascalCase operation names

> [!TIP]
>
> - You must provide the error type either as a namespace meta attribute (`#![err(MyError)]`) or an item attribute (`#[err(MyError)]`)
> - Operations with result return types (`T!`) are fallible and must have error types
> - Operation names are converted to PascalCase for error metadata storage
