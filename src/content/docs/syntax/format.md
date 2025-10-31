---
title: "Format"
---

The formatter ensures consistent code style across operation protocol definition files.

## Configuration

Format configuration is stored in `op-fmt.toml`:

```toml
# maximum line width before wrapping (default: 120)
max_width = 120

# use tabs for indentation (default: true)
indent_with_tabs = true

# number of spaces/tabs per indent level (default: 4)
indent_width = 4

# preserve multiple adjacent blank lines (default: true)
preserve_adjacent_blank_lines = true
```

## Indentation

The formatter uses tabs by default for all indentation:

```kintsu
struct User {
	id: i64,
	name: str,
	nested: {
		field: i32,
	},
}
```

## Spacing

### Operators

Union types use `&` (space-ampersand-space) as separator:

```kintsu
type Combined = Foo & Bar & Baz;
```

Oneof types use `|` (space-pipe-space) as separator:

```kintsu
oneof Result {
	Ok(i32),
	Err(str),
}

type Value = oneof i32 | str | bool;
```

### Commas

Commas separate items in structs, enums, and variants. No trailing comma on the last item:

```kintsu
struct Point {
	x: i32,
	y: i32,
};

enum Status {
	Active = 1,
	Inactive = 2,
};

use foo::{
	Bar,
	Baz,
};
```

## Blank Lines

Single blank line between top-level items:

```kintsu
namespace foo;

struct A {
	field: i32,
}

struct B {
	field: str,
}

operation get() -> A;
```

## Comments

### Single-line

Single-line comments are preserved as-is:

```kintsu
// this is a comment
struct Foo {
	bar: i32,
}
```

### Multi-line

Multi-line comments with newlines are indented to match surrounding context:

```kintsu
/*
	Multi-line comment
	with indented content
*/
struct Foo {
	/*
		Field documentation
		spans multiple lines
	*/
	bar: i32,
}
```

Single-line multi-line comments remain on one line:

```kintsu
/* brief comment */ struct Foo {}
```

## Module-level Attributes

Module-level attributes appear before other items:

```kintsu
#![err(MyError)]
namespace foo;

error MyError {
	Unknown(never),
}
```

Item-level attributes apply to the following item:

```kintsu
#[version(1)]
struct Foo {
	bar: i32,
}
```

## Use Statements

Single-item use statements are formatted inline without braces:

```kintsu
use foo::bar::Baz;
```

Multiple items from the same path are collapsed into a single use statement with braces, formatted over multiple lines:

```kintsu
use foo::bar::{
	Baz,
	Qux,
	Another,
}
```

The formatter will combine separate use statements from the same path into a single multi-line statement.
