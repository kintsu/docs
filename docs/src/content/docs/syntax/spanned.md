---
title: "Spanned Statements"
---

> [!TIP]
> Spanned Statements refers to a block of content which has a clear start and end boundary. E.g. `{..}` (braced), `(..)` (parenthesized), `[..]` (bracketed).

## Spanned Statements

Nested Spanned Statements should be split between new lines for each item, with increasing tab indentation to display nesting levels. Root token spans (e.g. top-level declarations) are separated by new lines and indented. Operators are trailing.

e.g.

```kintsu
// top level declaration
type Abc = (
    i32 |
    i64
);

message Foo {
    // single tab for brace
    field_a: i32,
    // double tab for braced -> parenthesized
    field_b: (
        oneof
        abc |
        u32 |
        u64 |
        str
    )
};

error ServerError {
    Internal(str)
}
```
