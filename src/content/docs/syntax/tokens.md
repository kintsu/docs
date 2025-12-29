---
title: "Tokens"
---

| Token | Description                                                                                                                                                                                 |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[]`  | Brackets are paired between spans. brackets are permitted in array types, meta fields, and spanned namespace declarations.                                                                  |
| `{}`  | Braces are paired between spans. braces are permitted in: named structs, anonymous structs, enums, oneofs, and errors.                                                                      |
| `()`  | Parentheses are paired between spans. parentheses are permitted in: meta fields, types, operations, and errors.                                                                             |
| `&`   | Amp tokens are supported in union types to separate type variants.                                                                                                                          |
| `::`  | Scope resolution operators are used to access named declarations of external namespaces, with no whitespace, and no trailing operator.                                                      |
| `;`   | Semicolons are used to terminate a top-level declaration (item).                                                                                                                            |
| `:`   | Colons are used to separate a field from its type in arguments. there should be no proceeding whitespace between the proceeding `ident`, with a following space before the subsequent type. |
| `,`   | Commas are used to separate fields, enum and error variants, and arguments. trailing commas are permitted.                                                                                  |
| `?`   | Used to indicate an optional type.                                                                                                                                                          |
| `=`   | Equals is used to declare a named type, or provide a static value to an enum member.                                                                                                        |
| `#`   | Pound tokens are used in meta. e.g. `#[...]`.                                                                                                                                               |
| `!`   | Bang tokens are used to set meta as inner meta, or declare a return type may raise an error. e.g. `-> i32!`.                                                                                |
| `\|`  | Pipe tokens are supported in oneof types to separate type variants.                                                                                                                         |
| `//`  | Used to start a single-line comment, terminated by a new line.                                                                                                                              |
| `/*`  | Used to start a multi-line comment, terminated by `*/`.                                                                                                                                     |
| `*/`  | Used to end a multi-line comment.                                                                                                                                                           |
