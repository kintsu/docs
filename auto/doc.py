import re
import typer
import difflib
from pathlib import Path
from typing import Dict

from auto.types import ROOT, SPEC_DIR, RSC, Language, Spec, DOCS_ROOT, ISSUE_TEMPLATES_MARKDOWN, GITHUB_ISSUE_TEMPLATE_DIR, SpecStatus
from yaml import safe_dump as write_yaml
import yaml


# Custom string class to force YAML literal block scalar style (|)
class literal_str(str):
    """String subclass that renders as YAML literal block scalar"""
    pass


def literal_str_representer(dumper, data):
    """Representer that forces literal block scalar style for multi-line strings"""
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')


# Register the custom representer
yaml.add_representer(literal_str, literal_str_representer, Dumper=yaml.SafeDumper)

app = typer.Typer(
    name="doc-manager",
    help="Manage Kintsu documentation schemas and specifications.",
)

TEMPLATE_PATH = ROOT / "templates"

TEMPLATES = {
    "ad": TEMPLATE_PATH / "ad.md",
}


@app.command()
def spec_guide():
    lang = Language.get()
    lang.write_spec()


@app.command()
def collect_refs():
    """Collect cross-references between specifications and write to references.yaml.

    Also processes external references from frontmatter and markdown content:
    - Reads optional 'references' field from frontmatter
    - Scans content for external https links
    - Updates frontmatter with discovered external references
    - Filters URLs based on global ignore-refs.yaml
    """
    # Load global ignore list
    from auto.types import Language
    global_ignore_urls = Language.load_ignore_refs()

    # Pattern to match spec references like [RFC-0001](/specs/rfc/rfc-0001)
    # Case insensitive for spec kind
    internal_pattern = re.compile(
        r'\[([A-Z]+)-0*(\d+)\]\(/specs/[a-z]+/[a-z]+-0*\d+\)',
        re.IGNORECASE
    )

    # Pattern to match external https links: [text](https://url) or just https://url
    external_link_pattern = re.compile(
        r'\[([^\]]+)\]\((https://[^\)]+)\)|(?<!\()(https://[^\s\)]+)',
        re.IGNORECASE
    )

    # Pattern to match frontmatter
    frontmatter_pattern = re.compile(
        r'^---\n(.*?)\n---\n',
        re.DOTALL | re.MULTILINE
    )

    internal_references: dict[str, set[str]] = {}
    external_references: dict[str, list[dict]] = {}
    updated_files = 0

    # Walk all markdown files in specs directory
    for spec_file in SPEC_DIR.rglob("*.md"):
        content = spec_file.read_text()

        # Parse frontmatter
        fm_match = frontmatter_pattern.match(content)
        if not fm_match:
            continue

        frontmatter_text = fm_match.group(1)
        frontmatter = yaml.safe_load(frontmatter_text)
        markdown_body = content[fm_match.end():]

        # Extract spec ID from filename (e.g., RFC-0001.md -> rfc-0001)
        filename = spec_file.stem  # e.g., RFC-0001
        parts = filename.split("-")
        if len(parts) == 2:
            source_kind = parts[0].lower()
            source_num = int(parts[1])
            source_id = f"{source_kind}-{source_num:04d}"

            # Find all internal references in this file
            matches = internal_pattern.findall(markdown_body)
            if matches:
                refs = set()
                for kind, num in matches:
                    ref_id = f"{kind.lower()}-{int(num):04d}"
                    # Don't include self-references
                    if ref_id != source_id:
                        refs.add(ref_id)

                if refs:
                    internal_references[source_id] = sorted(refs)

            # Process external references
            existing_refs = frontmatter.get('references', [])
            existing_urls = {ref.get('url') for ref in existing_refs if isinstance(ref, dict) and 'url' in ref}

            # Find external links in markdown body
            discovered_refs = []
            for match in external_link_pattern.finditer(markdown_body):
                if match.group(1) and match.group(2):
                    # [text](url) format
                    title = match.group(1)
                    url = match.group(2)
                    is_bare = False
                elif match.group(3):
                    # bare url format
                    url = match.group(3)
                    title = url
                    is_bare = True
                else:
                    continue

                # Clean URL - strip trailing quotes, backticks, commas, and other invalid characters
                url = url.rstrip('"`\',')
                title = title.rstrip('"`\',')

                # Skip if already in frontmatter
                if url in existing_urls:
                    continue

                # Skip globally ignored URLs (substring match)
                if any(ignore_pattern in url for ignore_pattern in global_ignore_urls):
                    continue


                discovered_refs.append({
                    'title': title,
                    'desc': '',  # Empty desc, documentor should fill in
                    'url': url
                })
                existing_urls.add(url)

            # Clean existing frontmatter references and remove globally ignored ones
            needs_update = False
            if 'references' in frontmatter and frontmatter['references']:
                cleaned_refs = []
                for ref in frontmatter['references']:
                    if not isinstance(ref, dict) or 'url' not in ref:
                        continue

                    # Clean URL and title
                    original_url = ref['url']
                    cleaned_url = original_url.rstrip('""`\',')
                    cleaned_title = ref.get('title', '').rstrip('""`\',')

                    # Skip globally ignored URLs (remove from frontmatter)
                    if any(ignore_pattern in cleaned_url for ignore_pattern in global_ignore_urls):
                        needs_update = True
                        continue

                    # Update if URL was cleaned
                    if cleaned_url != original_url or cleaned_title != ref.get('title', ''):
                        ref['url'] = cleaned_url
                        ref['title'] = cleaned_title
                        needs_update = True

                    cleaned_refs.append(ref)

                if needs_update:
                    frontmatter['references'] = cleaned_refs

            # Update frontmatter if we discovered new external refs
            if discovered_refs:
                if 'references' not in frontmatter:
                    frontmatter['references'] = []
                frontmatter['references'].extend(discovered_refs)
                needs_update = True

            # Write updated file if needed
            if needs_update:
                new_frontmatter = yaml.safe_dump(frontmatter, sort_keys=False, default_flow_style=False, allow_unicode=True)
                new_content = f"---\n{new_frontmatter}---\n{markdown_body}"
                spec_file.write_text(new_content)
                updated_files += 1

            # Collect external references from frontmatter for references.yaml
            # Filter out kintsu.dev URLs, globally ignored URLs, and per-ref ignored
            if frontmatter.get('references'):
                filtered_refs = []
                for ref in frontmatter['references']:
                    if not isinstance(ref, dict) or 'url' not in ref:
                        continue

                    # Skip if marked as ignored in frontmatter
                    if ref.get('ignore', False):
                        continue

                    url = ref['url']

                    # Clean URL - strip trailing quotes, backticks, commas
                    cleaned_url = url.rstrip('""`\',')
                    cleaned_title = ref.get('title', '').rstrip('""`\',')

                    # Skip globally ignored URLs (substring match - ignore-refs.yaml supersedes all)
                    if any(ignore_pattern in cleaned_url for ignore_pattern in global_ignore_urls):
                        continue

                    # Skip kintsu.dev URLs
                    if 'kintsu.dev' in cleaned_url:
                        continue

                    # Create cleaned reference
                    cleaned_ref = {
                        'title': cleaned_title,
                        'desc': ref.get('desc', ''),
                        'url': cleaned_url
                    }

                    filtered_refs.append(cleaned_ref)

                if filtered_refs:
                    external_references[source_id] = filtered_refs

    # Write to references.yaml with both internal and external sections
    refs_data = {
        'internal': dict(sorted(internal_references.items())),
        'external': dict(sorted(external_references.items()))
    }

    refs_path = RSC / "references.yaml"
    refs_path.write_text(
        "# @autogenerated - DO NOT EDIT\n\n" +
        write_yaml(refs_data, sort_keys=False, default_flow_style=False, allow_unicode=True)
    )

    print(f"Wrote references to {refs_path}")
    print(f"Collected {len(internal_references)} specs with internal cross-references")
    print(f"Collected {len(external_references)} specs with external references")
    if updated_files > 0:
        print(f"Updated {updated_files} spec files with discovered external references")


@app.command()
def new_spec(
    spec_kind: str = typer.Option(help="Specification kind ID"),
    title: str = typer.Option(help="Title of the new specification"),
    author: str = typer.Option(help="Author of the specification (github username)"),
    components: list[str] = typer.Option(
        help="Component IDs included in the specification"
    ),
):
    lang = Language.get()
    next_number = Spec.next_spec_number(spec_kind)

    spec = Spec.new(
        kind=spec_kind,
        number=next_number,
        title=title,
        author=author,
        components=components,
        version_after=lang.current_version,
    )

    lang.validate_spec(spec)

    print(f"Creating new spec {spec_kind}-{next_number} titled '{title}'")

    spec_kind_data = lang.get_spec_kind(spec_kind)
    template = spec_kind_data.template_for(lang)

    qualified_spec = f"{spec.kind}-{spec.number:04d}"

    out = spec.as_markdown_head() + template.format(
        qualified_spec=qualified_spec, **Spec.write_to_dict(spec)
    )

    path = spec.path_for()

    if not path.parent.exists():
        path.parent.mkdir()

    path.write_text(out)


@app.command()
def reference_tables(
    dry_run: bool = typer.Option(False, "--dry-run", help="Show diffs without writing files")
):
    """Update ## References sections in all specification files based on references.yaml"""

    lang = Language.get()
    refs = lang.references
    external_refs = lang.external_references

    # Pattern to match the entire References section
    refs_section_pattern = re.compile(
        r'^## References\n(?:(?!^## ).*\n)*',
        re.MULTILINE
    )

    # Pattern to match existing reference lines
    ref_line_pattern = re.compile(
        r'- \[([A-Z]+-\d+)\]\(/specs/[a-z]+/[a-z]+-\d+\)',
        re.IGNORECASE
    )

    updated_count = 0

    for spec_file in SPEC_DIR.rglob("*.md"):
        content = spec_file.read_text()

        # Extract spec ID from filename
        filename = spec_file.stem
        parts = filename.split("-")
        if len(parts) != 2:
            continue

        source_kind = parts[0].lower()
        source_num = int(parts[1])
        source_id = f"{source_kind}-{source_num:04d}"

        # Check if this spec has internal or external references
        has_internal = source_id in refs
        has_external = source_id in external_refs

        if not has_internal and not has_external:
            continue

        # Find existing References section
        match = refs_section_pattern.search(content)
        if not match:
            # No References section found, skip
            continue

        existing_section = match.group(0)

        # Extract manually added references (ones not in references.yaml)
        existing_refs = set()
        for ref_match in ref_line_pattern.finditer(existing_section):
            ref_id = ref_match.group(1).lower()
            # Normalize to 4-digit format
            ref_parts = ref_id.split("-")
            if len(ref_parts) == 2:
                normalized = f"{ref_parts[0]}-{int(ref_parts[1]):04d}"
                existing_refs.add(normalized)

        # Get references from references.yaml
        yaml_refs = set(refs.get(source_id, []))

        # Find manually added refs (in file but not in yaml)
        manual_refs = existing_refs - yaml_refs

        # Combine: yaml refs + manual refs, sorted
        all_internal_refs = sorted(yaml_refs | manual_refs)

        # Build new References section with proper titles
        new_section = "## References\n\n"

        # Add internal references (spec-to-spec)
        for ref_id in all_internal_refs:
            # Find the spec to get its title
            ref_parts = ref_id.split("-")
            ref_kind = ref_parts[0]
            ref_num = int(ref_parts[1])

            ref_path = SPEC_DIR / ref_kind / f"{ref_kind.upper()}-{ref_num:04d}.md"
            if ref_path.exists():
                # Extract title from the spec file
                ref_content = ref_path.read_text()
                try:
                    ref_spec = Spec.from_markdown_head(ref_content)
                    title = ref_spec.title
                except (IndexError, KeyError, TypeError, ValueError) as _:
                    # Fallback if parsing fails
                    title = "Unknown"
            else:
                title = "Unknown"

            # Format: [RFC-0001](/specs/rfc/rfc-0001) - Title
            display_id = f"{ref_kind.upper()}-{ref_num:04d}"
            url_id = f"{ref_kind.lower()}-{ref_num:04d}"
            new_section += f"- [{display_id}](/specs/{ref_kind}/{url_id}) - {title}\n"

        # Add external references
        if has_external:
            ext_refs = external_refs[source_id]
            for ref in ext_refs:
                title = ref.get('title', 'Untitled')
                url = ref.get('url', '')
                desc = ref.get('desc', '')

                # Format: [Title](url) - description or just [Title](url)
                if desc:
                    new_section += f"- [{title}]({url}) - {desc}\n"
                else:
                    new_section += f"- [{title}]({url})\n"

        new_section += "\n"

        # Replace the old References section
        new_content = refs_section_pattern.sub(new_section, content)

        if new_content != content:
            if dry_run:
                # Show diff
                old_lines = content.splitlines(keepends=True)
                new_lines = new_content.splitlines(keepends=True)
                diff = difflib.unified_diff(
                    old_lines,
                    new_lines,
                    fromfile=f"a/{spec_file.relative_to(DOCS_ROOT)}",
                    tofile=f"b/{spec_file.relative_to(DOCS_ROOT)}",
                    lineterm=""
                )
                print("".join(diff))
            else:
                spec_file.write_text(new_content)
                print(f"Updated references in {spec_file.name}")
            updated_count += 1

    if dry_run:
        print(f"\nWould update {updated_count} specification files (dry-run mode)")
    else:
        print(f"\nUpdated {updated_count} specification files")


@app.command()
def collect_specs():
    """Generate specification summary with nested sub-references"""
    lang = Language.get()
    specs = lang.specs()
    refs = lang.references

    summary = "---\n# @autogenerated - DO NOT EDIT\n\ntitle: Specifications\n---\n\n"
    by_category: dict[str, list[Spec]] = {}
    for spec in specs:
        if spec.kind in by_category:
            by_category[spec.kind].append(spec)
        else:
            by_category[spec.kind] = [spec]

    for spec_kind, specs_list in by_category.items():
        category = lang.get_spec_kind(spec_kind)

        summary += f"- [{category.name}](/specs/{spec_kind.lower()})\n"
        for spec in specs_list:
            spec_id = spec.qualified_id()
            spec_id_lower = spec_id.lower()  # Match references.yaml format
            summary += f"  - [{spec_id} - {spec.title}]({spec.url_for()})\n"

            # Add sub-references if they exist (references.yaml uses lowercase)
            if spec_id_lower in refs:
                for ref_id in refs[spec_id_lower]:
                    # Find referenced spec to get its title
                    ref_parts = ref_id.split("-")
                    ref_kind = ref_parts[0]
                    ref_num = int(ref_parts[1])

                    ref_path = SPEC_DIR / ref_kind / f"{ref_kind.upper()}-{ref_num:04d}.md"
                    if ref_path.exists():
                        try:
                            ref_content = ref_path.read_text()
                            ref_spec = Spec.from_markdown_head(ref_content)
                            title = ref_spec.title
                        except (IndexError, KeyError, TypeError, ValueError) as _:
                            title = "Unknown"
                    else:
                        title = "Unknown"

                    display_id = f"{ref_kind.upper()}-{ref_num:04d}"
                    url = f"/specs/{ref_kind}/{ref_id}"
                    # Use 4 spaces and hyphen for proper nesting (not 6 spaces and asterisk)
                    summary += f"    - [{display_id} - {title}]({url})\n"
        summary += "\n"

    summary_path = SPEC_DIR / "../docs" / "summary.md"
    summary_path.write_text(summary)
    print(f"Wrote spec summary to {summary_path}")


@app.command()
def collect_spec_summaries():
    """Collect spec frontmatter and write summaries to kintsu.yaml/kintsu.json.

    This command reads all spec files, extracts their frontmatter (title, status,
    created date, last updated date), and adds this data to the Language object
    so it can be used by llms.txt generation and other tooling.
    """
    lang = Language.get()

    # Collect spec summaries from all spec files
    summaries = lang.collect_spec_summaries()

    # Update the language object with spec summaries
    lang.spec_summaries = summaries

    # Write to kintsu.yaml and kintsu.json
    lang.write_spec()

    # Print summary by kind
    by_kind: dict[str, int] = {}
    for s in summaries:
        by_kind[s.kind] = by_kind.get(s.kind, 0) + 1

    print(f"Collected {len(summaries)} spec summaries:")
    for kind, count in sorted(by_kind.items()):
        print(f"  {kind}: {count}")
    print(f"\nWrote to {ROOT}/kintsu.yaml and src/assets/kintsu.json")


@app.command()
def generate_issue_templates():
    """Generate GitHub issue templates from resource definitions"""
    lang = Language.get()

    # Ensure output directory exists
    GITHUB_ISSUE_TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)

    generated_count = 0
    for template in lang.issue_templates:
        yml_content = _build_template_yml(template, lang)
        output_path = GITHUB_ISSUE_TEMPLATE_DIR / f"{template.id}.yml"
        output_path.write_text(yml_content)
        print(f"Generated {output_path.relative_to(DOCS_ROOT)}")
        generated_count += 1

    print(f"\nSuccessfully generated {generated_count} issue template(s)")


def _build_template_yml(template, lang: Language) -> str:
    """Build GitHub issue template YAML from template definition"""
    data = {
        "name": template.name,
        "description": template.description,
        "title": template.title_prefix,
        "labels": template.labels,
        "body": []
    }

    for section in template.sections:
        field = {"type": section.type, "id": section.id}

        if section.type == "markdown":
            md_path = ISSUE_TEMPLATES_MARKDOWN / section.markdown_file
            markdown_content = md_path.read_text().strip()
            field["attributes"] = {"value": literal_str(markdown_content)}
        else:
            field["attributes"] = {}

            if section.label:
                field["attributes"]["label"] = section.label
            if section.description:
                field["attributes"]["description"] = section.description

            if section.markdown_placeholder:
                placeholder_path = ISSUE_TEMPLATES_MARKDOWN / section.markdown_placeholder
                placeholder_content = placeholder_path.read_text().strip()
                field["attributes"]["placeholder"] = literal_str(placeholder_content)
            elif section.placeholder:
                if '\n' in section.placeholder:
                    field["attributes"]["placeholder"] = literal_str(section.placeholder)
                else:
                    field["attributes"]["placeholder"] = section.placeholder

            if section.render:
                field["attributes"]["render"] = section.render

            if section.source:
                options = _generate_options(section, lang)
                if section.type == "dropdown":
                    field["attributes"]["options"] = options
                    if section.multiple:
                        field["attributes"]["multiple"] = section.multiple
                elif section.type == "checkboxes":
                    field["attributes"]["options"] = [{"label": opt} for opt in options]
            elif section.options:
                field["attributes"]["options"] = [{"label": opt.label} for opt in section.options]

            if section.type == "dropdown" and section.default is not None:
                field["attributes"]["default"] = section.default

            field["validations"] = {"required": section.required}

        data["body"].append(field)

    return write_yaml(data, sort_keys=False, default_flow_style=False)


def _generate_options(section, lang: Language) -> list[str]:
    """Generate options from Language data sources"""
    options = []

    if section.source == "components":
        source_data = lang.components
    elif section.source == "spec_kinds":
        source_data = lang.spec_kinds
    elif section.source == "spec_status":
        source_data = list(SpecStatus)
    else:
        raise ValueError(f"Unknown source: {section.source}")

    for item in source_data:
        if section.format:
            if section.source == "spec_status":
                ns = {"value": item.value}
            else:
                ns = {
                    "id": item.id,
                    "ID": item.id.upper() if hasattr(item.id, 'upper') else item.id,
                    "name": item.name,
                    "NAME": item.name.upper() if hasattr(item.name, 'upper') else item.name,
                    "description": getattr(item, 'description', ''),
                    "DESCRIPTION": getattr(item, 'description', '').upper() if hasattr(getattr(item, 'description', ''), 'upper') else getattr(item, 'description', ''),
                    "code": getattr(item, 'code', ''),
                    "CODE": getattr(item, 'code', '').upper() if hasattr(getattr(item, 'code', ''), 'upper') else getattr(item, 'code', ''),
                    "category": getattr(item, 'category', ''),
                    "CATEGORY": getattr(item, 'category', '').upper() if hasattr(getattr(item, 'category', ''), 'upper') else getattr(item, 'category', ''),
                }

            try:
                formatted = section.format.format(**ns)
                options.append(formatted)
            except KeyError as e:
                raise ValueError(f"Format string '{section.format}' missing key {e} for {section.source}")
        else:
            if section.source == "components":
                options.append(item.id)
            elif section.source == "spec_kinds":
                options.append(f"{item.id.upper()} ({item.name})")
            elif section.source == "spec_status":
                options.append(item.value)

    return options


@app.command()
def normalize_ascii(
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be changed without modifying files"),
    path: str = typer.Option(None, "--path", help="Specific file or directory to process (default: all markdown)")
):
    """
    Normalize Unicode box-drawing and special characters to ASCII equivalents in markdown files.

    This ensures maximum compatibility across editors, terminals, and documentation systems.
    """
    # Character replacement mapping
    REPLACEMENTS: Dict[str, str] = {
        # Box drawing characters
        '├': '|--',
        '│': '|',
        '└': '`--',
        '─': '-',
        '┤': '--|',
        '┬': '--+',
        '┴': '--+',
        '┼': '--+',
        '┌': ',--',
        '┐': '--.',
        '╭': ',--',
        '╮': '--.',
        '╰': '`--',
        '╯': '--\'',

        # Arrows
        '→': '->',
        '←': '<-',
        '↑': '^',
        '↓': 'v',
        '⇒': '=>',
        '⇐': '<=',

        # Bullets
        '•': '*',
        '◦': '-',
        '▪': '*',
        '▫': '-',
    }

    # Determine which files to process
    if path:
        target_path = Path(path)
        if not target_path.is_absolute():
            target_path = DOCS_ROOT / target_path
        if target_path.is_file():
            markdown_files = [target_path]
        elif target_path.is_dir():
            markdown_files = list(target_path.rglob("*.md"))
        else:
            typer.echo(f"Error: Path {path} does not exist", err=True)
            raise typer.Exit(1)
    else:
        # Process all markdown files in the repository
        markdown_files = list(DOCS_ROOT.rglob("*.md"))

    files_modified = 0
    total_replacements = 0

    for md_file in markdown_files:
        # Skip certain directories
        if any(skip in md_file.parts for skip in ['.git', 'node_modules', 'dist', '.next']):
            continue

        try:
            content = md_file.read_text(encoding='utf-8')
            original_content = content

            # Track replacements for this file
            file_replacements = []

            # Apply all replacements
            for unicode_char, ascii_equiv in REPLACEMENTS.items():
                if unicode_char in content:
                    count = content.count(unicode_char)
                    if count > 0:
                        file_replacements.append((unicode_char, ascii_equiv, count))
                        content = content.replace(unicode_char, ascii_equiv)

            # Only process if changes were made
            if content != original_content:
                files_modified += 1

                # Get relative path for display
                try:
                    display_path = md_file.relative_to(DOCS_ROOT)
                except ValueError:
                    display_path = md_file

                if dry_run:
                    typer.echo(f"\n{display_path}:")
                    for unicode_char, ascii_equiv, count in file_replacements:
                        total_replacements += count
                        typer.echo(f"  {unicode_char!r} -> {ascii_equiv!r} ({count} occurrence{'s' if count > 1 else ''})")
                else:
                    md_file.write_text(content, encoding='utf-8')
                    typer.echo(f"Normalized {display_path}")
                    for unicode_char, ascii_equiv, count in file_replacements:
                        total_replacements += count

        except Exception as e:
            typer.echo(f"Error processing {md_file}: {e}", err=True)

    if dry_run:
        typer.echo(f"\nDry run complete: {total_replacements} replacements in {files_modified} file(s)")
        typer.echo("Run without --dry-run to apply changes")
    else:
        typer.echo(f"\nNormalized {files_modified} file(s) with {total_replacements} total replacements")


@app.command()
def autolink_refs(
    dry_run: bool = typer.Option(False, "--dry-run", help="Show changes without writing files"),
    path: str = typer.Option(None, "--path", help="Process a specific file or directory"),
):
    """Auto-link bare spec references in markdown files.

    Converts bare spec references like `RFC-0001` or `TSY-0015` to markdown links
    like `[RFC-0001](/specs/rfc/rfc-0001)`.

    Skips references that are:
    - Already linked: [RFC-0001](/specs/...)
    - Inside code blocks or inline code
    - Inside existing markdown links
    """
    lang = Language.get()

    # Get valid spec kinds from Language
    spec_kinds = [sk.id.upper() for sk in lang.spec_kinds]
    spec_kinds_pattern = "|".join(spec_kinds)

    # Pattern to match bare spec references (not already linked)
    # Matches: RFC-0001, TSY-15, SPEC-0024, etc.
    # Uses word boundaries and captures the kind and number
    bare_ref_pattern = re.compile(
        rf'\b({spec_kinds_pattern})-0*(\d+)\b',
        re.IGNORECASE
    )

    # Pattern to detect if we're inside a markdown link
    # Matches: [anything](url) - we want to skip refs inside these
    link_pattern = re.compile(r'\[[^\]]*\]\([^)]*\)')

    # Pattern to detect code blocks (``` ... ```)
    code_block_pattern = re.compile(r'```[\s\S]*?```', re.MULTILINE)

    # Pattern to detect inline code (`...`)
    inline_code_pattern = re.compile(r'`[^`]+`')

    # Pattern to detect markdown headings (# ... or ## ... etc.)
    heading_pattern = re.compile(r'^#+\s+.*$', re.MULTILINE)

    # Determine which files to process
    if path:
        target_path = Path(path)
        if not target_path.is_absolute():
            target_path = SPEC_DIR / target_path
        if target_path.is_file():
            markdown_files = [target_path]
        elif target_path.is_dir():
            markdown_files = list(target_path.rglob("*.md"))
        else:
            typer.echo(f"Error: Path {path} does not exist", err=True)
            raise typer.Exit(1)
    else:
        # Process all markdown files in specs directory
        markdown_files = list(SPEC_DIR.rglob("*.md"))

    files_modified = 0
    total_links_added = 0

    for md_file in markdown_files:
        try:
            content = md_file.read_text(encoding='utf-8')
            original_content = content

            # Parse frontmatter to skip it
            frontmatter_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
            if frontmatter_match:
                frontmatter = content[:frontmatter_match.end()]
                body = content[frontmatter_match.end():]
            else:
                frontmatter = ""
                body = content

            # Find all regions to skip (code blocks, inline code, existing links, headings)
            skip_regions = []

            for match in code_block_pattern.finditer(body):
                skip_regions.append((match.start(), match.end()))

            for match in inline_code_pattern.finditer(body):
                skip_regions.append((match.start(), match.end()))

            for match in link_pattern.finditer(body):
                skip_regions.append((match.start(), match.end()))

            for match in heading_pattern.finditer(body):
                skip_regions.append((match.start(), match.end()))

            # Sort regions by start position
            skip_regions.sort(key=lambda x: x[0])

            def in_skip_region(pos):
                for start, end in skip_regions:
                    if start <= pos < end:
                        return True
                return False

            # Find all bare references and replace them
            links_added = 0
            new_body = []
            last_end = 0

            for match in bare_ref_pattern.finditer(body):
                # Skip if inside a skip region
                if in_skip_region(match.start()):
                    continue

                # Check if this is already part of a markdown link
                # Look at surrounding context
                before = body[max(0, match.start() - 2):match.start()]
                after = body[match.end():min(len(body), match.end() + 2)]

                # Skip if preceded by [ (start of link text) or followed by ]( (link syntax)
                if before.endswith('[') or after.startswith(']('):
                    continue

                # Extract the reference details
                kind = match.group(1).upper()
                num = int(match.group(2))

                # Build the markdown link
                display_id = f"{kind}-{num:04d}"
                url_kind = kind.lower()
                url_id = f"{url_kind}-{num:04d}"
                link = f"[{display_id}](/specs/{url_kind}/{url_id})"

                # Add text before this match and the link
                new_body.append(body[last_end:match.start()])
                new_body.append(link)
                last_end = match.end()
                links_added += 1

            # Add remaining text
            new_body.append(body[last_end:])

            # Reconstruct content
            new_content = frontmatter + "".join(new_body)

            if new_content != original_content:
                files_modified += 1
                total_links_added += links_added

                # Get relative path for display
                try:
                    display_path = md_file.relative_to(SPEC_DIR)
                except ValueError:
                    display_path = md_file

                if dry_run:
                    typer.echo(f"{display_path}: {links_added} reference(s) would be linked")
                    # Show diff
                    old_lines = original_content.splitlines(keepends=True)
                    new_lines = new_content.splitlines(keepends=True)
                    diff = difflib.unified_diff(
                        old_lines,
                        new_lines,
                        fromfile=f"a/{display_path}",
                        tofile=f"b/{display_path}",
                        lineterm=""
                    )
                    diff_text = "".join(diff)
                    if diff_text:
                        typer.echo(diff_text)
                        typer.echo()
                else:
                    md_file.write_text(new_content, encoding='utf-8')
                    typer.echo(f"Linked {links_added} reference(s) in {display_path}")

        except Exception as e:
            typer.echo(f"Error processing {md_file}: {e}", err=True)

    if dry_run:
        typer.echo(f"\nDry run complete: {total_links_added} links would be added in {files_modified} file(s)")
        typer.echo("Run without --dry-run to apply changes")
    else:
        typer.echo(f"\nAuto-linked {total_links_added} reference(s) in {files_modified} file(s)")


if __name__ == "__main__":
    app()
