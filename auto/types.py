from dataclasses import asdict, dataclass
from datetime import date
from enum import StrEnum
from json import dumps as write_json
import os
from pathlib import Path
from shutil import copy2
from typing import Callable, ParamSpec, TypeVar

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

SPEC_DIR = DOCS_ROOT / "src" / "content" / "specs"


class SpecStatus(StrEnum):
    Draft = "draft"

    Proposed = "proposed"

    Accepted = "accepted"
    Rejected = "rejected"

    Unstable = "unstable"
    Stable = "stable"

    Deprecated = "deprecated"


class Serde:
    @classmethod
    def load_from_dict(cls, data: dict) -> T:
        return cls(**data)

    @classmethod
    def write_to_dict(cls, instance: T) -> dict:
        return asdict(instance)

    @classmethod
    def read_many(cls, data: list[dict]) -> list[T]:
        return list(map(cls.load_from_dict, data))

    @classmethod
    def dump_many(cls, data: list[T]) -> list[dict]:
        return list(map(cls.write_to_dict, data))


@dataclass
class Meta:
    id: str
    name: str
    description: str


@dataclass
class Component(Meta, Serde):
    code: str


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
        out = "## References\n\n<!-- Remove un-necessary sections -->\n\n"
        for sec in self.references:
            # help_text = lang.get_spec_kind(sec).reference_help
            out += f"- [{sec}-000n](../{sec.lower()}/{sec}-000n.md)\n"
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
class Language:
    current_version: str

    versions: list[str]
    components: list[Component]
    spec_kinds: list[SpecKind]
    spec_categories: list[SpecCategory]

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
    def dump(const_path: Path, data: T, dump: Callable[[T], any]):
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
    def write_handle(const_path: Path, dump: Callable[[T], any]) -> Callable[[T], None]:
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

    def validate(self):
        category_ids = {c.id for c in self.spec_categories}
        for kind in self.spec_kinds:
            if kind.category not in category_ids:
                raise ValueError(
                    f"SpecKind {kind.id} has unknown category {kind.category}"
                )

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
        kintsu = Language(
            versions=versions,
            current_version=versions[-1],
            spec_kinds=Language.load_spec_kinds(),
            spec_categories=Language.load_spec_categories(),
            components=Language.load_components(),
        )
        kintsu.validate()
        return kintsu

    def write(self):
        Language.write_versions(self.versions)
        Language.write_spec_kinds(self.spec_kinds)
        Language.write_components(self.components)
        Language.write_spec_categories(self.spec_categories)
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
        data: dict[str, any] = load_yaml(first)
        updates = [SpecUpdate(**u) for u in data.pop("updates", [])]
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
