---
name: rust-conventions
title: "Rust Coding Conventions"
description: "Rust coding conventions and best practices for Kintsu compiler development"
tags: ["rust", "kintsu", "project"]
updated: 2025-12-25
---
# Rust Coding Conventions

Standard Rust coding conventions for the Kintsu compiler and related crates.

## References

- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [RFC 430 Naming Conventions](https://github.com/rust-lang/rfcs/blob/master/text/0430-finalizing-naming-conventions.md)

## Core Principles

- Prioritize readability, safety, and maintainability
- Use strong typing and Rust's ownership system
- Handle errors gracefully with `Result<T, E>`
- Use consistent naming per RFC 430
- Verify with `cargo build -p {packageName}`

## Patterns to Follow

### Ownership and Borrowing

- Prefer borrowing (`&T`) over cloning
- Use `&mut T` for mutable access
- Annotate lifetimes when compiler cannot infer
- Use `Arc<T>` for thread-safe reference counting
- Use `RefCell<T>` single-threaded, `Mutex<T>` or `RwLock<T>` multi-threaded

### Code Organization

- Use modules (`mod`) and `pub` for encapsulation
- Split binary (`main.rs`) and library (`lib.rs`) code
- Imports at top of files
- If struct has deeply nested fields (`foo.value.value.bar`), add helper methods

### Error Handling

- Use `?` operator over `unwrap()` or `expect()`
- Use `serde` for serialization
- Use `thiserror` or `anyhow` for custom errors
- Return `Result` in library code; never panic

### Performance

- Use iterators instead of index-based loops
- Use `&str` over `String` for parameters when ownership not needed
- Prefer borrowing and zero-copy operations
- Use `rayon` for data parallelism
- Avoid premature `collect()`; keep iterators lazy

### Async

- Use `async/await` with `tokio`
- Prefer enums over flags for type safety
- Use builders for complex objects (prefer `bon::Builder`)

## Patterns to Avoid

- `unwrap()` or `expect()` except in tests
- Global mutable state
- Deeply nested logic
- `unsafe` without full documentation
- Overusing `clone()`
- Unnecessary allocations

## API Design

### Trait Implementation

Eagerly implement where appropriate:
- `Copy`, `Clone`, `Eq`, `PartialEq`, `Ord`, `PartialOrd`
- `Hash`, `Debug`, `Display`, `Default`
- `From`, `AsRef`, `AsMut`
- Collections: `FromIterator`, `Extend`

### Type Safety

- Use newtypes for static distinctions
- Prefer specific types over generic `bool` parameters
- Functions with clear receiver should be methods
- Only smart pointers implement `Deref`/`DerefMut`
- Use type aliases for multi-parameter generics

### Future Proofing

- Use sealed traits for downstream protection
- Validate arguments with `validator::Validate`
- All public types must implement `Debug`
- Add accessor helpers; getters return references

## Style

- Use `rustfmt` for formatting
- Keep lines under 100 characters
- Use `cargo clippy` for linting
- Function/struct docs immediately before item with `///`

## Comments

- Comments should be brief and direct
- Never use em dashes; use simple dash (`-`) or semicolon (`;`)
- Most functions do not need explicit docstrings
- Document control flows and major algorithms

## Logging

- Use `tracing::trace` where appropriate
- Only `tracing::info` where absolutely required
- Avoid field slop; single-line displays
- Types with `ToTokens`: use `var.display()` for formatting

## Testing

- Write unit tests in `#[cfg(test)]` modules
- Integration tests in `tests/` directory
- Use `#[test_case::test_case(..)]` for repetitive tests
- Examples use `?` operator, not `unwrap()`

## Quality Checklist

- [ ] Follows RFC 430 naming conventions
- [ ] Implements `Debug`, `Clone`, `PartialEq` where appropriate
- [ ] Uses `Result<T, E>` with meaningful error types
- [ ] Public items have rustdoc comments
- [ ] Comprehensive test coverage
- [ ] No `unsafe` code without documentation
- [ ] Efficient iterators, minimal allocations
- [ ] Passes `cargo test`