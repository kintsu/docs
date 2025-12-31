"""
Generate syntax documentation from syntax.json with enhanced formatting.

This script reads from auto/resource/syntax.json and generates enhanced documentation
files in src/content/docs/syntax/ with preserved frontmatter, descriptions, and references.
"""

from json import loads
from pathlib import Path


ROOT = Path(__file__).parent.parent
SYNTAX_JSON = ROOT / "auto" / "resource" / "syntax.json"
DOCS_DIR = ROOT / "src" / "content" / "docs" / "syntax"


def load_syntax() -> dict[str, list[dict[str, str]]]:
    """Load syntax.json with builtin, keywords, and tokens."""
    return loads(SYNTAX_JSON.read_text())


def extract_frontmatter(content: str) -> tuple[str, str]:
    """Extract YAML frontmatter and body from markdown content."""
    if not content.startswith("---"):
        return "", content

    parts = content.split("---", 2)
    if len(parts) < 3:
        return "", content

    return f"---{parts[1]}---", parts[2].strip()


def capitalize_first_sentence(text: str) -> str:
    """Capitalize first letter of text and ensure it ends with a period."""
    text = text.strip()
    if not text:
        return text
    text = text[0].upper() + text[1:]
    if not text.endswith("."):
        text += "."
    return text


def format_builtin_table(items: list[dict[str, str]]) -> str:
    """Format builtin types into categorized tables."""
    # Categories based on the enhanced version
    primitives = ["bool", "str"]
    integers = ["i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64"]
    floats = ["f8", "f16", "f32", "f64", "complex"]
    special = ["datetime", "date", "week", "never"]
    binary = ["binary"]

    def get_category(token: str) -> str:
        if token in primitives:
            return "primitives"
        if token in integers:
            return "integers"
        if token in floats:
            return "floats"
        if token in special:
            return "special"
        if token in binary:
            return "binary"
        return "other"

    categorized = {
        "primitives": [],
        "integers": [],
        "floats": [],
        "special": [],
        "binary": [],
        "other": []
    }

    for item in items:
        cat = get_category(item["token"])
        categorized[cat].append(item)

    output = []

    if categorized["primitives"]:
        output.append("## Primitives\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["primitives"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["integers"]:
        output.append("## Integers\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["integers"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["floats"]:
        output.append("## Floating Point\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["floats"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["special"]:
        output.append("## Special Types\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["special"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["binary"]:
        output.append("## Binary Data\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["binary"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["other"]:
        output.append("## Other Types\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["other"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    return "\n".join(output)


def format_keywords_table(items: list[dict[str, str]]) -> str:
    """Format keywords into categorized tables."""
    # Categories
    type_decl = ["namespace", "use", "struct", "enum", "type", "oneof", "error", "operation"]
    reference = ["schema"]

    def get_category(token: str) -> str:
        if token in type_decl:
            return "type_decl"
        if token in reference:
            return "reference"
        return "other"

    categorized = {
        "type_decl": [],
        "reference": [],
        "other": []
    }

    for item in items:
        cat = get_category(item["token"])
        categorized[cat].append(item)

    output = []

    if categorized["type_decl"]:
        output.append("## Type Declaration Keywords\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["type_decl"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["reference"]:
        output.append("## Reference Keywords\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["reference"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    if categorized["other"]:
        output.append("## Other Keywords\n")
        output.append("| Token | Description |")
        output.append("| :---- | :---------- |")
        for item in categorized["other"]:
            desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
            output.append(f"| `{item['token']}` | {desc} |")
        output.append("")

    return "\n".join(output)


def format_tokens_table(items: list[dict[str, str]]) -> str:
    """Format tokens into a simple table."""
    output = []
    output.append("| Token | Description |")
    output.append("| :---- | :---------- |")

    for item in items:
        desc = capitalize_first_sentence(item["description"]).replace("|", "\\|")
        output.append(f"| `{item['token']}` | {desc} |")

    return "\n".join(output)


def generate_doc(kind: str, items: list[dict[str, str]]) -> str:
    """Generate documentation for a specific kind (builtin, keywords, tokens)."""
    doc_path = DOCS_DIR / f"{kind}.md"

    # Read existing file to preserve frontmatter and references
    existing_content = ""
    frontmatter = ""
    references_section = ""

    if doc_path.exists():
        existing_content = doc_path.read_text()
        frontmatter, body = extract_frontmatter(existing_content)

        # Extract references section if it exists
        if "## References" in body:
            parts = body.split("## References")
            references_section = "## References" + parts[-1]

    # Generate table based on kind
    if kind == "builtin":
        table = format_builtin_table(items)
    elif kind == "keywords":
        table = format_keywords_table(items)
    else:
        table = format_tokens_table(items)

    # Combine parts
    parts = [frontmatter, "", table]

    if references_section:
        parts.append("")
        parts.append(references_section.strip())

    return "\n".join(parts).strip() + "\n"


def main():
    """Generate all syntax documentation files."""
    syntax_data = load_syntax()

    for kind in ["builtin", "keywords", "tokens"]:
        if kind in syntax_data:
            content = generate_doc(kind, syntax_data[kind])
            output_path = DOCS_DIR / f"{kind}.md"
            output_path.write_text(content)
            print(f"Generated {output_path}")


if __name__ == "__main__":
    main()
