import typer

from auto.types import ROOT, SPEC_DIR, Language, Spec

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
def collect_specs():
    lang = Language.get()
    specs = lang.specs()

    summary = "---\ntitle: Specifications\n---\n\n"
    by_category: dict[str, list[Spec]] = {}
    for spec in specs:
        if spec.kind in by_category:
            by_category[spec.kind].append(spec)
        else:
            by_category[spec.kind] = [spec]

    for spec_kind, specs in by_category.items():
        category = lang.get_spec_kind(spec_kind)

        summary += f"- {category.name}\n"
        for spec in specs:
            summary += f"\t- [{spec.qualified_id()} - {spec.title}]({spec.url_for()})\n"
        summary += "\n"
    summary_path = SPEC_DIR / "../docs" / "summary.md"
    summary_path.write_text(summary)
    print(f"Wrote spec summary to {summary_path}")


if __name__ == "__main__":
    app()
