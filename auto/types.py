from dataclasses import asdict, dataclass
from datetime import date
from enum import StrEnum
from json import dumps as write_json
import os
from pathlib import Path
from shutil import copy2
from typing import Any, Callable, ParamSpec, Self, TypeVar

from yaml import safe_dump as write_yaml
from yaml import safe_load as load_yaml

P = ParamSpec("P")
T = TypeVar("T")

ROOT = Path(__file__).parent
DOCS_ROOT = Path(__file__).parent.parent

# simple assert for runtime sanity check
assert DOCS_ROOT.name == "kintsu-docs" or (DOCS_ROOT.name == "docs" if "CI" in os.environ else False)

RSC = ROOT / "resource"

KINTSU_SPEC = ROOT / "kintsu.yaml"
DOC_SPEC = DOCS_ROOT / "src" / "assets" / "kintsu.json"

COMPONENTS = RSC / "components.yaml"
SPEC_CATEGORIES = RSC / "spec-categories.yaml"
SPEC_KINDS = RSC / "spec-kinds.yaml"
VERSIONS = RSC / "versions.yaml"
REFERENCES = RSC / "references.yaml"
IGNORE_REFS = RSC / "ignore-refs.yaml"
SYNTAX_JSON = RSC / "syntax.json"
ERROR_DOMAINS = RSC / "error-domains.yaml"
ISSUE_TEMPLATES_DIR = RSC / "issue-templates"
ISSUE_TEMPLATES = ISSUE_TEMPLATES_DIR / "templates.yaml"
ISSUE_TEMPLATES_MARKDOWN = ISSUE_TEMPLATES_DIR / "markdown"

SPEC_DIR = DOCS_ROOT / "src" / "content" / "specs"
GITHUB_ISSUE_TEMPLATE_DIR = DOCS_ROOT / ".github" / "ISSUE_TEMPLATE"


class SpecStatus(StrEnum):
    Draft = "draft"

    Proposed = "proposed"

    Accepted = "accepted"
    Rejected = "rejected"

    Unstable = "unstable"
    Stable = "stable"

    Deprecated = "deprecated"

    Superseded = "superseded"


class Serde:
    @classmethod
    def load_from_dict(cls, data: dict) -> Self:
        return cls(**data)

    @classmethod
    def write_to_dict(cls, instance: Self) -> dict:
        return asdict(instance)

    @classmethod
    def read_many(cls, data: list[dict]) -> list[Self]:
        return list(map(cls.load_from_dict, data))

    @classmethod
    def dump_many(cls, data: list[Self]) -> list[dict]:
        return list(map(cls.write_to_dict, data))


@dataclass
class Meta:
    id: str
    name: str
    description: str


@dataclass
class SyntaxToken(Serde):
    token: str
    description: str


@dataclass
class SyntaxSpec(Serde):
    builtin: list[SyntaxToken]
    keywords: list[SyntaxToken]
    tokens: list[SyntaxToken]

    @classmethod
    def load_from_dict(cls, data: dict) -> "SyntaxSpec":
        return cls(
            builtin=[SyntaxToken(**t) for t in data.get("builtin", [])],
            keywords=[SyntaxToken(**t) for t in data.get("keywords", [])],
            tokens=[SyntaxToken(**t) for t in data.get("tokens", [])],
        )

    @classmethod
    def write_to_dict(cls, instance: "SyntaxSpec") -> dict:
        return {
            "builtin": [asdict(t) for t in instance.builtin],
            "keywords": [asdict(t) for t in instance.keywords],
            "tokens": [asdict(t) for t in instance.tokens],
        }


@dataclass
class Component(Meta, Serde):
    code: str


@dataclass
class ErrorDomain(Serde):
    """Error domain mapping for linking errors to specifications."""
    code: str  # Two-letter code, e.g., "LX", "TR"
    name: str  # Human-readable name, e.g., "Lexical", "Type Resolution"
    err_spec: str  # ERR spec reference, e.g., "ERR-0002"
    description: str  # Short description of the domain
    phase: str  # Compilation phase: lexing, parsing, compilation, etc.

    @property
    def full_code(self) -> str:
        """Return the full error code prefix (K + domain code)."""
        return f"K{self.code}"

    @property
    def err_spec_path(self) -> str:
        """Return the path to the ERR spec page."""
        return f"/specs/err/{self.err_spec.lower()}"


@dataclass
class ErrorDomainRegistry(Serde):
    """Collection of error domains with lookup helpers."""
    domains: list[ErrorDomain]
    categories: dict[str, str]  # digit -> name mapping
    severities: dict[str, str]  # severity -> description mapping

    @classmethod
    def load_from_dict(cls, data: dict) -> "ErrorDomainRegistry":
        domains = [ErrorDomain(**d) for d in data.get("domains", [])]
        # Categories come as {0: "Syntax", ...} - convert keys to strings
        categories = {str(k): v for k, v in data.get("categories", {}).items()}
        severities = data.get("severities", {})
        return cls(domains=domains, categories=categories, severities=severities)

    @classmethod
    def write_to_dict(cls, instance: "ErrorDomainRegistry") -> dict:
        return {
            "domains": [asdict(d) for d in instance.domains],
            "categories": {int(k): v for k, v in instance.categories.items()},
            "severities": instance.severities,
        }

    def get_domain_by_code(self, code: str) -> ErrorDomain | None:
        """Look up domain by two-letter code (e.g., 'LX', 'TR')."""
        for d in self.domains:
            if d.code == code:
                return d
        return None

    def get_domain_by_full_code(self, full_code: str) -> ErrorDomain | None:
        """Look up domain by full code prefix (e.g., 'KLX', 'KTR')."""
        if full_code.startswith("K") and len(full_code) >= 3:
            return self.get_domain_by_code(full_code[1:3])
        return None

    def get_category_name(self, digit: int | str) -> str | None:
        """Get category name by digit."""
        return self.categories.get(str(digit))

    def parse_error_code(self, error_code: str) -> dict | None:
        """Parse an error code like KTR1002 into components.

        Returns:
            dict with keys: domain, category, sequence, domain_obj, category_name
            or None if invalid format
        """
        if not error_code or len(error_code) < 7:
            return None
        if not error_code.startswith("K"):
            return None

        domain_code = error_code[1:3]
        try:
            category_digit = int(error_code[3])
            sequence = int(error_code[4:7])
        except (ValueError, IndexError):
            return None

        domain_obj = self.get_domain_by_code(domain_code)
        category_name = self.get_category_name(category_digit)

        return {
            "domain_code": domain_code,
            "full_code": f"K{domain_code}",
            "category": category_digit,
            "sequence": sequence,
            "domain": domain_obj,
            "category_name": category_name,
        }


@dataclass
class SpecCategory(Meta, Serde):
    pass


@dataclass
class SpecKind(Meta, Serde):
    # SpecCategory.id
    category: str
    references: list[str]  # SpecKind.id
    sections: list[str]

    @property
    def reference_help(self):
        return f"The following {self.name} ({self.id}) specifications are relevant to this specification"

    def reference_section(self, lang: "Language") -> str:
        out = "## References\n\n<!-- this section is autogenerated; populate any references here using basic markdown links and additional metadata will be populated by running python -m auto.doc suite -->\n\n"
        for sec in self.references:
            # help_text = lang.get_spec_kind(sec).reference_help
            out += f"- [{sec}-000n](/specs/{sec.lower()}/{sec}-000n.md)\n"
        return out

    def help_for_section(self, section: str) -> str | None:
        helps = {
            "Abstract": "Provide a brief summary of the specification's purpose and goals.",
            "Motivation": "Explain the problem or need that the specification addresses.",
            "Architecture": "Describe the overall architecture and design of the proposed solution. Include diagrams where appropriate.",
            "Design Principles": "Outline the key design principles and considerations that guided the specification.",
            "Implications": "Discuss the potential implications, trade-offs, and impact of the specification.",
            "Benchmarks": "Provide performance benchmarks and comparisons relevant to the specification. Provide specific metrics and diagrams / graphs when providing evidence.",
            "Test Cases": "Enumerate the test cases and scenarios that validate the specification's implementation.",
            "Acceptance Criteria": "Enumerate the criteria that must be met for the specification to be considered complete and accepted. These will be referenced as `<spec_id>.AC-1`.\n\n- [ ] AC-1: _does what_\n- [ ] AC-2: _does what else_",
            "Specification": "Detail the technical specifications, requirements, and implementation details. Diagrams and code snippets are required.",
            "Rationale": "Explain the reasoning and justification behind the design choices made in the specification. Code snippets are encouraged.",
            "Backwards Compatibility": "Discuss how the specification maintains compatibility with previous versions and systems. Code snippets are **required** for breaking changes.",
        }
        return helps.get(section)

    def template_for(self, lang: "Language") -> str:
        # intentional here - we use format later
        template = "# {qualified_spec}: {title}\n\n"
        for sec in self.sections:
            if sec.lower() == "references":
                template += self.reference_section(lang)
                continue
            template += f"## {sec}\n\n{self.help_for_section(sec)}\n\n"
        return template

    @staticmethod
    def load_all_of_kind(kind_id: str) -> list["Spec"]:
        specs = []
        for p in SPEC_DIR.glob(f"{kind_id.lower()}/{kind_id}*.md"):
            md = p.read_text()
            spec = Spec.from_markdown_head(md)
            specs.append(spec)
        specs.sort(key=lambda s: s.number)
        return specs


def list_read(data) -> list[str]:
    return data


def list_write(data) -> list[str]:
    return data


@dataclass
class IssueTemplateCheckboxOption(Serde):
    label: str


@dataclass
class IssueTemplateSection(Serde):
    type: str  # markdown, textarea, input, dropdown, checkboxes
    id: str
    label: str | None = None
    description: str | None = None
    markdown_file: str | None = None  # For markdown type - relative to markdown/
    markdown_placeholder: str | None = None  # For textarea - placeholder from markdown file
    placeholder: str | None = None  # Static placeholder
    required: bool = False
    multiple: bool = False
    render: str | None = None  # markdown, etc
    source: str | None = None  # Reference to Language data: components, spec_kinds, spec_status
    format: str | None = None  # Python format string for options: "{id}", "{name}", "{id.upper()}"
    default: int | None = None  # Default index for dropdown
    prefix_label: bool = False  # For checkboxes - whether to use label prefix
    options: list[IssueTemplateCheckboxOption] | None = None  # Static checkbox options

    def validate(self, markdown_dir: Path, lang: "Language"):
        """Validate this section's configuration"""
        # Validate markdown file exists
        if self.markdown_file:
            md_path = markdown_dir / self.markdown_file
            if not md_path.exists():
                raise ValueError(f"Section {self.id}: markdown file not found: {md_path}")

        # Validate markdown placeholder exists
        if self.markdown_placeholder:
            md_path = markdown_dir / self.markdown_placeholder
            if not md_path.exists():
                raise ValueError(f"Section {self.id}: markdown placeholder file not found: {md_path}")

        # Validate source references
        if self.source:
            valid_sources = ["components", "spec_kinds", "spec_status"]
            if self.source not in valid_sources:
                raise ValueError(f"Section {self.id}: invalid source '{self.source}'. Must be one of: {', '.join(valid_sources)}")

            # Validate format string if provided
            if self.format:
                self._validate_format_string(lang)

        # Validate type-specific requirements
        if self.type == "markdown" and not self.markdown_file:
            raise ValueError(f"Section {self.id}: markdown type requires markdown_file")

        if self.type == "dropdown" and not self.source and not self.options:
            raise ValueError(f"Section {self.id}: dropdown type requires source or static options")

        if self.type == "checkboxes" and not self.source and not self.options:
            raise ValueError(f"Section {self.id}: checkboxes type requires source or static options")

    def _validate_format_string(self, lang: "Language"):
        """Validate format string against actual data"""
        try:
            if self.source == "components":
                # Test with first component if available
                if lang.components:
                    test_obj = lang.components[0]
                    self.format.format(
                        id=test_obj.id, ID=test_obj.id.upper(),
                        name=test_obj.name, NAME=test_obj.name.upper(),
                        description=test_obj.description, DESCRIPTION=test_obj.description.upper(),
                        code=test_obj.code, CODE=test_obj.code.upper()
                    )
            elif self.source == "spec_kinds":
                # Test with first spec kind if available
                if lang.spec_kinds:
                    test_obj = lang.spec_kinds[0]
                    self.format.format(
                        id=test_obj.id, ID=test_obj.id.upper(),
                        name=test_obj.name, NAME=test_obj.name.upper(),
                        description=test_obj.description, DESCRIPTION=test_obj.description.upper(),
                        category=test_obj.category, CATEGORY=test_obj.category.upper()
                    )
            elif self.source == "spec_status":
                # Test with first status value
                test_value = list(SpecStatus)[0]
                self.format.format(value=test_value.value)
        except (KeyError, AttributeError, IndexError) as e:
            raise ValueError(f"Section {self.id}: invalid format string '{self.format}': {e}")


@dataclass
class IssueTemplate(Serde):
    id: str
    name: str
    description: str
    title_prefix: str
    labels: list[str]
    sections: list[IssueTemplateSection]

    def validate(self, markdown_dir: Path, lang: "Language"):
        """Validate entire template configuration"""
        # Validate all sections
        for section in self.sections:
            section.validate(markdown_dir, lang)

        # Validate no duplicate section IDs
        section_ids = [s.id for s in self.sections]
        if len(section_ids) != len(set(section_ids)):
            duplicates = [sid for sid in section_ids if section_ids.count(sid) > 1]
            raise ValueError(f"Template {self.id}: duplicate section IDs: {duplicates}")

    @staticmethod
    def load_from_dict(data: dict) -> "IssueTemplate":
        """Custom loader to handle nested objects"""
        sections_data = data.pop("sections", [])
        sections = []
        for sec_data in sections_data:
            options_data = sec_data.pop("options", None)
            options = None
            if options_data:
                options = [IssueTemplateCheckboxOption(**opt) for opt in options_data]
            sections.append(IssueTemplateSection(**sec_data, options=options))

        return IssueTemplate(**data, sections=sections)


@dataclass
class SpecSummary(Serde):
    """Summary of a specification for inclusion in kintsu.json/kintsu.yaml."""
    id: str  # e.g., "RFC-0001"
    kind: str  # e.g., "RFC"
    number: int
    title: str
    status: str
    created: str  # ISO date string
    updated: str | None = None  # ISO date of most recent update

    @classmethod
    def from_spec(cls, spec: "Spec") -> "SpecSummary":
        """Create a SpecSummary from a full Spec object."""
        # Get the most recent update date
        updated = None
        if spec.updates:
            # Updates are ordered, get the most recent one
            most_recent = max(spec.updates, key=lambda u: u.date)
            updated = most_recent.date.isoformat()

        return cls(
            id=spec.qualified_id(),
            kind=spec.kind,
            number=spec.number,
            title=spec.title,
            status=spec.status,
            created=spec.created.isoformat(),
            updated=updated,
        )


@dataclass
class Language:
    current_version: str

    versions: list[str]
    components: list[Component]
    spec_kinds: list[SpecKind]
    spec_categories: list[SpecCategory]
    references: dict[str, list[str]]
    external_references: dict[str, list[dict]]  # External references with title, desc, url
    issue_templates: list[IssueTemplate]
    syntax: SyntaxSpec
    error_domains: ErrorDomainRegistry | None = None  # Error domain registry
    spec_summaries: list[SpecSummary] | None = None  # Spec summaries for llms.txt

    def get_spec_kind(self, kind_id: str) -> SpecKind | None:
        for k in self.spec_kinds:
            if k.id == kind_id:
                return k
        raise ValueError(f"Unknown SpecKind id {kind_id}")

    @staticmethod
    def load(const_path: Path, init: Callable[P, T]) -> T:
        data = load_yaml(const_path.read_text())
        return init(data)

    @staticmethod
    def dump(const_path: Path, data: T, dump: Callable[[T], Any]):
        const_path.with_suffix(".yaml").write_text(
            write_yaml(dump(data), sort_keys=False, default_flow_style=False)
        )

    @staticmethod
    def load_handle(const_path: Path, init: Callable[P, T]) -> Callable[[], T]:
        @staticmethod
        def loader() -> T:
            return Language.load(const_path, init)

        return loader

    @staticmethod
    def write_handle(const_path: Path, dump: Callable[[T], Any]) -> Callable[[T], None]:
        def dumper(data: T):
            copy2(const_path, const_path.with_suffix(const_path.suffix + ".bak"))
            Language.dump(const_path, data, dump)

        return dumper

    load_versions = load_handle(VERSIONS, list_read)
    write_versions = write_handle(VERSIONS, list_write)

    load_components = load_handle(COMPONENTS, Component.read_many)
    write_components = write_handle(COMPONENTS, Component.dump_many)

    load_spec_kinds = load_handle(SPEC_KINDS, SpecKind.read_many)
    write_spec_kinds = write_handle(SPEC_KINDS, SpecKind.dump_many)

    load_spec_categories = load_handle(SPEC_CATEGORIES, SpecCategory.read_many)
    write_spec_categories = write_handle(SPEC_CATEGORIES, SpecCategory.dump_many)

    @staticmethod
    def load_issue_templates() -> list[IssueTemplate]:
        if not ISSUE_TEMPLATES.exists():
            return []
        data = load_yaml(ISSUE_TEMPLATES.read_text())
        templates_data = data.get("templates", [])
        return [IssueTemplate.load_from_dict(t) for t in templates_data]

    @staticmethod
    def write_issue_templates(templates: list[IssueTemplate]):
        data = {"templates": [asdict(t) for t in templates]}
        Language.dump(ISSUE_TEMPLATES, data, lambda x: x)

    @staticmethod
    def load_ignore_refs() -> set[str]:
        """Load ignored reference URLs from ignore-refs.yaml.

        Returns:
            set: Set of URLs to ignore globally
        """
        if IGNORE_REFS.exists():
            data = load_yaml(IGNORE_REFS.read_text())
            if isinstance(data, dict) and 'urls' in data:
                return set(data['urls'])
            elif isinstance(data, list):
                return set(data)
        return set()

    @staticmethod
    def load_references() -> tuple[dict[str, list[str]], dict[str, list[dict]]]:
        """Load references from references.yaml.

        Returns:
            tuple: (internal_references, external_references)
        """
        if REFERENCES.exists():
            data = load_yaml(REFERENCES.read_text())
            if not data:
                return {}, {}

            # Handle new structure with internal/external sections
            if isinstance(data, dict) and 'internal' in data:
                internal = data.get('internal', {})
                external = data.get('external', {})
                return internal, external
            else:
                # Backward compatibility: treat old format as internal only
                return data, {}
        return {}, {}

    @staticmethod
    def write_references(internal_refs: dict[str, list[str]], external_refs: dict[str, list[dict]]):
        """Write references to references.yaml in new structure."""
        refs_data = {
            'internal': internal_refs,
            'external': external_refs
        }
        Language.dump(REFERENCES, refs_data, lambda x: x)

    @staticmethod
    def load_syntax() -> SyntaxSpec:
        if SYNTAX_JSON.exists():
            from json import loads
            data = loads(SYNTAX_JSON.read_text())
            return SyntaxSpec.load_from_dict(data)
        return SyntaxSpec(builtin=[], keywords=[], tokens=[])

    @staticmethod
    def write_syntax(syntax: SyntaxSpec):
        from json import dumps
        SYNTAX_JSON.write_text(
            dumps(SyntaxSpec.write_to_dict(syntax), indent=2)
        )

    @staticmethod
    def load_error_domains() -> ErrorDomainRegistry | None:
        """Load error domain registry from error-domains.yaml."""
        if ERROR_DOMAINS.exists():
            data = load_yaml(ERROR_DOMAINS.read_text())
            if data:
                return ErrorDomainRegistry.load_from_dict(data)
        return None

    @staticmethod
    def write_error_domains(registry: ErrorDomainRegistry):
        """Write error domain registry to error-domains.yaml."""
        Language.dump(ERROR_DOMAINS, registry, ErrorDomainRegistry.write_to_dict)

    def validate(self):
        category_ids = {c.id for c in self.spec_categories}
        for kind in self.spec_kinds:
            if kind.category not in category_ids:
                raise ValueError(
                    f"SpecKind {kind.id} has unknown category {kind.category}"
                )

        # Validate issue templates
        for template in self.issue_templates:
            template.validate(ISSUE_TEMPLATES_MARKDOWN, self)

    def validate_spec(self, spec: "Spec"):
        kind_ids = {k.id for k in self.spec_kinds}
        component_ids = {c.id for c in self.components}

        if spec.kind not in kind_ids:
            raise ValueError(f"Spec has unknown kind {spec.kind}")

        for comp_id in spec.components:
            if comp_id not in component_ids:
                raise ValueError(f"Spec has unknown component {comp_id}")

    @staticmethod
    def get() -> "Language":
        versions = Language.load_versions()
        internal_refs, external_refs = Language.load_references()
        kintsu = Language(
            versions=versions,
            current_version=versions[-1],
            spec_kinds=Language.load_spec_kinds(),
            spec_categories=Language.load_spec_categories(),
            components=Language.load_components(),
            references=internal_refs,
            external_references=external_refs,
            issue_templates=Language.load_issue_templates(),
            syntax=Language.load_syntax(),
            error_domains=Language.load_error_domains(),
            spec_summaries=None,  # Populated by collect-spec-summaries command
        )
        kintsu.validate()
        return kintsu

    def collect_spec_summaries(self) -> list[SpecSummary]:
        """Collect spec summaries from all spec files."""
        summaries = []
        for spec in self.specs():
            summaries.append(SpecSummary.from_spec(spec))
        # Sort by kind, then by number
        summaries.sort(key=lambda s: (s.kind, s.number))
        return summaries

    def write(self):
        Language.write_versions(self.versions)
        Language.write_spec_kinds(self.spec_kinds)
        Language.write_components(self.components)
        Language.write_spec_categories(self.spec_categories)
        Language.write_references(self.references, self.external_references)
        Language.write_issue_templates(self.issue_templates)
        Language.write_syntax(self.syntax)
        if self.error_domains:
            Language.write_error_domains(self.error_domains)
        self.write_spec()

    def write_spec(self):
        KINTSU_SPEC.write_text(
            "# @autogenerated - DO NOT EDIT\n\n"
            + write_yaml(asdict(self), sort_keys=False)
        )
        DOC_SPEC.write_text(write_json(asdict(self)))

    def specs(self) -> list["Spec"]:
        specs = []
        for kind in self.spec_kinds:
            kind_specs = SpecKind.load_all_of_kind(kind.id)
            specs.extend(kind_specs)
        return specs


@dataclass
class SpecUpdate(Serde):
    author: str
    date: date
    description: str


@dataclass
class Spec(Serde):
    kind: str  # SpecKind.id
    number: int
    title: str
    author: str
    created: date
    status: SpecStatus
    components: list[str]  # Component.id
    updates: list[SpecUpdate]
    version_after: str
    version_before: str | None = None
    references: list[dict] | None = None

    @classmethod
    def new(
        cls,
        kind: str,
        number: int,
        title: str,
        components: list[str],
        author: str,
        version_after: str,
    ) -> "Spec":
        return cls(
            kind=kind,
            number=number,
            title=title,
            author=author,
            created=date.today(),
            components=components,
            status=SpecStatus.Draft,
            updates=[
                SpecUpdate(
                    author=author,
                    date=date.today(),
                    description="Created specification",
                )
            ],
            version_after=version_after,
        )

    def as_markdown_head(self) -> str:
        return f"""---\n{write_yaml(Spec.write_to_dict(self))}\n---\n\n"""

    def from_markdown_head(md: str) -> "Spec":
        first = md.split("---")[1]
        data: dict[str, Any] = load_yaml(first)
        updates = [SpecUpdate(**u) for u in data.pop("updates", [])]
        # Remove references from frontmatter - it's managed by collect_refs command
        data.pop("references", None)
        return Spec(**data, updates=updates)

    def update_markdown_head(self, md: str) -> str:
        parts = md.split("---")
        head = self.as_markdown_head()
        return head + "---".join(parts[2:])

    def qualified_id(self) -> str:
        return f"{self.kind}-{self.number:04d}"

    def path_for(self) -> Path:
        return SPEC_DIR / self.kind.lower() / f"{self.qualified_id()}.md"

    def url_for(self) -> str:
        return f"/specs/{self.kind.lower()}/{self.qualified_id()}"

    @staticmethod
    def existing_spec_numbers(spec_kind: str) -> list[str]:
        specs = []
        for p in SPEC_DIR.glob(f"{spec_kind.lower()}/{spec_kind}*.md"):
            specs.append(int(p.stem.split("-")[-1]))
        specs.sort()
        return specs

    @staticmethod
    def next_spec_number(spec_kind: str) -> int:
        nums = Spec.existing_spec_numbers(spec_kind)
        if not nums:
            return 1
        return nums[-1] + 1

    @classmethod
    def write_to_dict(cls, instance: "Spec") -> dict:
        instance_dict = super().write_to_dict(instance)
        instance_dict["status"] = str(instance.status.value)
        return instance_dict
