---
title: "Tokens"
---

| Token | Description                                                                                                                                                                                 |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[]`  | brackets are paired between spans. brackets are permitted in array types, meta fields, and spanned namespace declarations.                                                                  |
| `{}`  | braces are paired between spans. braces are permitted in: named structs, anonymous structs, enums, oneofs, and errors                                                                       |
| `()`  | parentheses are paired between spans. parentheses are permitted in: meta fields, types, operations, and errors                                                                              |
| `&`   | amp tokens are supported in union types to separate type variants.                                                                                                                          |
| `::`  | scope resolution operators are used to access named declarations of external namespaces, with no whitespace, and no trailing operator.                                                      |
| `;`   | semicolons are used to terminate a top-level declaration (item).                                                                                                                            |
| `:`   | colons are used to separate a field from its type in arguments. there should be no proceeding whitespace between the proceeding `ident`, with a following space before the subsequent type. |
| `,`   | commas are used to separate fields, enum and error variants, and arguments. trailing commas are permitted.                                                                                  |
| `?`   | used to indicate an optional type.                                                                                                                                                          |
| `=`   | equals is used to declare a named type, or provide a static value to an enum member.                                                                                                        |
| `#`   | pound tokens are used in meta. e.g. `#[...]`                                                                                                                                                |
| `!`   | bang tokens are used to set meta as inner meta, or declare a return type may raise an error. e.g. `-> i32!`.                                                                                |
| `\|`  | pipe tokens are supported in oneof types to separate type variants.                                                                                                                         |
| `//`  | used to start a single-line comment, terminated by a new line.                                                                                                                              |
| `/*`  | used to start a multi-line comment, terminated by `*/`                                                                                                                                      |
| `*/`  | used to end a multi-line comment                                                                                                                                                            |
