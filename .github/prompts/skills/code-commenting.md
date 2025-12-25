---
name: code-commenting
title: "Self-Explanatory Code Commenting"
description: "Guidelines for writing self-documenting code with minimal, purposeful comments"
tags: ["commenting", "rust", "project"]
updated: 2025-12-25
---
# Self-Explanatory Code Commenting

Guidelines for writing code that speaks for itself with minimal comments.

## Core Principle

Write code that speaks for itself. Comment only to explain WHY, not WHAT.

## Decision Framework

Before writing a comment, ask:

1. Is the code self-explanatory? -> No comment needed
2. Would a better variable/function name eliminate the need? -> Refactor instead
3. Does this explain WHY, not WHAT? -> Good comment
4. Will this help future maintainers? -> Good comment

## Comments to AVOID

### Obvious Comments

```javascript
// Bad
let counter = 0; // Initialize counter to zero
counter++; // Increment counter by one
```

### Redundant Comments

```javascript
// Bad
function getUserName() {
  return user.name; // Return the user's name
}
```

### Outdated Comments

```javascript
// Bad - comment doesn't match code
// Calculate tax at 5% rate
const tax = price * 0.08; // Actually 8%
```

### Dead Code Comments

```javascript
// Bad - don't comment out code
// const oldFunction = () => { ... };
```

### Changelog Comments

```javascript
// Bad - use version control
// Modified by John on 2023-01-15
```

### Divider Comments

```javascript
// Bad
//=====================================
// UTILITY FUNCTIONS
//=====================================
```

## Comments to WRITE

### Complex Business Logic

```javascript
// Good: explains WHY
// Apply progressive tax brackets: 10% up to 10k, 20% above
const tax = calculateProgressiveTax(income, [0.1, 0.2], [10000]);
```

### Non-obvious Algorithms

```javascript
// Good: explains algorithm choice
// Using Floyd-Warshall for all-pairs shortest paths
// because we need distances between all nodes
```

### Regex Patterns

```javascript
// Good: explains what regex matches
// Match email format: username@domain.extension
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

### API Constraints

```javascript
// Good: explains external constraint
// GitHub API rate limit: 5000 requests/hour for authenticated users
await rateLimiter.wait();
```

### Configuration Constants

```javascript
// Good: explains reasoning
const MAX_RETRIES = 3; // based on network reliability studies
const API_TIMEOUT = 5000; // AWS Lambda timeout is 15s, leaving buffer
```

## Annotations

Use these for specific purposes:

- `todo:` - Future work
- `fixme:` - Known bug to address
- `hack:` - Workaround for external issue
- `note:` - Important context
- `warning:` - Potential gotcha
- `perf:` - Performance consideration
- `sec:` - Security consideration
- `bug:` - Known issue under investigation
- `refactor:` - Code improvement needed
- `deprecated:` - Will be removed

## Rust-Specific

### Prefer Doc Comments

Bad - inline comments:
```rust
fn add_if(a: Option<i32>, b: Option<i32>) -> i32 {
  match (a, b) {
    // if both, add a + b
    (Some(a), Some(b)) => a + b,
    // if a, return a
    (Some(a), None) => a,
    ...
  }
}
```

Good - top-level doc comment:
```rust
/// Adds two optional numbers.
///
/// ## Control Flow
/// - if a and b -> `a + b`
/// - if a -> `a`
/// - if b -> `b`
/// - otherwise, return 0
fn add_if(a: Option<i32>, b: Option<i32>) -> i32 {
  match (a, b) {
    (Some(a), Some(b)) => a + b,
    (Some(a), None) => a,
    ...
  }
}
```

### Casing

- Public documentation (`///`): proper casing
- Private comments (`//`, `/* */`): lowercase

## Quality Checklist

- [ ] Explains WHY, not WHAT
- [ ] Grammatically correct and clear
- [ ] Will remain accurate as code evolves
- [ ] Adds genuine value
- [ ] Placed above code it describes
- [ ] Professional language
- [ ] Never uses emojis
