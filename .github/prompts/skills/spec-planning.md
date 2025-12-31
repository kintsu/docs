---
name: spec-planning
title: "Spec Planning Workflow"
description: "Iterative workflow for planning updates to existing Kintsu specifications through research, design refinement, and implementation document generation. Use this for adding types/forms/errors to existing specs rather than creating new specifications."
tags: ["specs", "documentation", "workflow", "kintsu", "planning", "design"]
updated: 2025-12-31
---

# Spec Planning Workflow

A structured workflow for planning updates to existing Kintsu specifications. This workflow emphasizes research-driven design, iterative refinement with stakeholders, and comprehensive implementation documentation.

## When to Use This Workflow

| Scenario                                   | Workflow                               |
| ------------------------------------------ | -------------------------------------- |
| Net-new language feature                   | spec-planning + specification-workflow |
| Update existing specs with new types/forms | spec-planning only                     |
| Add error codes to existing domain         | spec-planning only                     |
| New specification from scratch             | specification-workflow only            |

**Key distinction**: spec-planning focuses on **updating existing specifications** by analyzing how new features fit into the existing language context.

---

## Phase 1: Context Analysis

### 1.1 Knowledge Base Query

Before any research, query existing knowledge:

```
search_facts tags=["kintsu", "type-system", "<feature-domain>"]
search_skills query="<feature-domain>"
```

**What to look for:**

- Previous design decisions that may constrain options
- Related features that should be consistent
- Exclusion rationale from prior discussions
- Existing form/type patterns to follow

### 1.2 Specification Archaeology

Identify which specifications are affected by asking these questions:

| Question                                      | If Yes, Review      |
| --------------------------------------------- | ------------------- |
| Does this affect primitive type definitions?  | TSY-0001            |
| Does this add or modify form attributes?      | TSY-0015            |
| Does this need design rationale documented?   | RFC-0032            |
| Does this add validation that can fail?       | ERR-0018            |
| Does this affect compilation/semantic phases? | SPEC-0024           |
| Does this affect type resolution?             | TSY-0012            |
| Does this add new syntax?                     | TSY-0002, SPEC-0001 |

**Read the affected specs** to understand:

- Current structure and conventions
- How similar features are documented
- Frontmatter format and update conventions
- Cross-reference patterns used

### 1.3 External Research

Gather authoritative sources for the feature domain:

**Priority order for sources:**

1. **Standards bodies** (IEEE, ISO, IETF, W3C) - normative references
2. **Industry specifications** (OCP, ONNX, protobuf) - de facto standards
3. **Reference implementations** (Apache Arrow, NumPy) - practical semantics
4. **Academic papers** (arxiv) - theoretical foundation

**For each source fetched:**

```
add_resources uri="<url>" type="url" tags=["<domain>", "standards"]
submit_facts content="<key finding>" tags=["kintsu", "<domain>"]
```

### 1.4 Gap Analysis

Create a comparison matrix:

| Category | Kintsu Current | Source A | Source B | Gap/Action          |
| -------- | -------------- | -------- | -------- | ------------------- |
| Type X   | No             | Yes      | Yes      | Add                 |
| Type Y   | Yes            | Yes      | No       | Keep                |
| Type Z   | No             | No       | Yes      | Exclude (rationale) |

**For each gap, determine:**

- Is this semantically valuable for Kintsu users?
- Is there a stable standard to reference?
- What are the implementation implications?
- Does this conflict with existing features?

---

## Phase 2: Design Iteration

### 2.1 Initial Proposal Structure

Present findings in this format:

```markdown
## Types/Forms to Add

| Type | Form Required | Description | Standard |
| ---- | ------------- | ----------- | -------- |
| ...  | ...           | ...         | ...      |

## Types/Forms to Exclude

| Type | Rationale |
| ---- | --------- |
| ...  | ...       |

## Open Questions

1. [Question about design choice]
2. [Question about scope]
```

### 2.2 Decision Points to Iterate On

For each proposed type/form, get stakeholder input on:

**Type Classification:**

- Core builtin vs form attribute?
- Semantic distinctness criterion: Does it represent a fundamentally different value space?
- If form: which base type does it extend?

**Form Requirements:**

- Required form (must specify) vs optional form (has default)?
- Ambiguity criterion: Is the type meaningless without form specification?

**Parameter Syntax:**

- Positional vs named parameters?
- What are valid ranges/values?
- Are there interdependencies (e.g., scale <= precision)?

**Codegen Behavior:**

- Hard error vs warning vs silent on unsupported targets?
- Security criterion: Does silent handling create vulnerabilities?
- Library-as-support criterion: Does library support count?

**Capture every decision:**

```
submit_facts content="<decision>" tags=["kintsu", "design-decision", "<feature>"] verified=true
```

### 2.3 Design Principles to Apply

Evaluate each decision against these principles:

1. **Semantic Accuracy**: Does this model the data correctly for its domain?
2. **Security Consciousness**: Does silent handling create overflow/truncation vulnerabilities?
3. **Standards Compliance**: Is there an authoritative standard (IEEE, ISO)?
4. **Implementation Flexibility**: Can codegen targets choose reasonable approaches?
5. **Future Compatibility**: Does this allow extension without breaking changes?
6. **Consistency**: Does this follow patterns established by similar features?

### 2.4 Codegen Contract Definition

For each type/form, define the contract:

```markdown
**Codegen requirements:**

- Targets MUST [required behavior]
- Targets MAY [optional behavior]
- Targets SHOULD [recommended behavior]
- Silent [action] is forbidden (security risk)
- [Fallback] support counts as target support
```

**Contract categories:**

| Type Category           | Typical Contract                            |
| ----------------------- | ------------------------------------------- |
| Extended-width integers | Hard error on unsupported, library counts   |
| Quantization forms      | May fallback with documented behavior       |
| Decimal types           | May upcast, must preserve minimum precision |
| Duration/temporal       | Form determines underlying representation   |

---

## Phase 3: Implementation Planning

### 3.1 Implementation Document Structure

Create an implementation guide following this template:

````markdown
# [Feature] - Implementation Guide

## Agent Preferences

- **Tone**: Neutral
- **Verbosity**: Concise
- **Emojis**: Banned
- **Code comments**: Minimal, critical only

## Design Philosophy

[2-4 key principles that guided this design]

## Codegen Contract

### [Category 1]

[MAY/MUST/SHOULD requirements]

### [Category 2]

[MAY/MUST/SHOULD requirements]

## Scope: New Core Types

### Types to Add

| Type | Form Required | Description |
| ---- | ------------- | ----------- |

### Types Explicitly Excluded

| Type | Rationale |
| ---- | --------- |

## Scope: New Form Attributes

### Forms to Add

| Form | Applies To | Description |
| ---- | ---------- | ----------- |

## Reference URLs

```yaml
references:
  - title: Standard Name
    desc: What it defines
    url: https://...
```
````

## Use Cases

### [Type/Form Name]

**[Use Case Title]:**

```kintsu
[Example code]
```

[Explanation of the use case]

## 1. TSY-0001 Changes (Primitive Types)

**File**: `src/content/specs/tsy/TSY-0001.md`

### 1.1 Frontmatter Update

```yaml
updates:
  - author: joshua-auchincloss
    date: YYYY-MM-DD
    description: Added [types]
```

### 1.2 [Section] Update

Add after [existing section]:

```markdown
[Exact content to add]
```

## 2. TSY-0015 Changes (Form Metadata Rules)

[Same structure]

## 3. RFC-0032 Changes (Design Rationale)

[Same structure]

## 4. ERR-0018 Changes (Error Codes)

### 4.1 Frontmatter Update

### 4.2 New Error Codes

| Code | Name | Severity | Phase |
| ---- | ---- | -------- | ----- |

### [Error Code]: [Name]

**Message**: `template with {placeholders}`
**Primary span**: [What to highlight]
**Help**: `suggestion text`

## 5. SPEC-0024 Changes (Compilation Rules)

[Same structure]

## Planning Notes

### Standards Referenced

| Standard | Types/Features Affected |
| -------- | ----------------------- |

### Future Considerations

[Potential extensions]

## Summary Checklist

### Core Type Changes

- [ ] TSY-0001: Add [type] definition
- [ ] ...

### Form Attribute Changes

- [ ] TSY-0015: Add Rule [N] ([form])
- [ ] ...

### Design Rationale

- [ ] RFC-0032: Add rationale for [feature]
- [ ] ...

### Error Codes

- [ ] ERR-0018: Add [code] ([name])
- [ ] ...

````

### 3.2 Writing Specification Changes

**For each spec section, provide:**

1. **File path**: Exact location
2. **Frontmatter update**: YAML to add to `updates` array
3. **Content location**: "Add after X" or "Add new section"
4. **Exact content**: Markdown-formatted, ready to paste
5. **Valid/invalid examples**: With `del={}` markers for invalid

**Type definition template:**
```markdown
### [type] ([Description])

[One sentence description].

| Property | Value |
|----------|-------|
| Size | X bits (Y bytes) |
| Range | [min] to [max] |
| Default | [value] |

**Standard**: [IEEE/ISO reference if applicable]

**Codegen requirements:**
- [MUST/MAY/SHOULD statements]

**Use cases:**
- [Use case 1]
- [Use case 2]
````

**Form rule template:**

````markdown
### Rule N: [form] form [requirement]

[Description of what the rule requires].

**Syntax**: `#[form(...)]`

| Parameter | Type | Range | Description |
| --------- | ---- | ----- | ----------- |

**Valid usage:**

```kintsu
#[form(...)] field: type
```
````

**Invalid usage:**

```kintsu del={1}
field: type  // Error: [reason]
```

**Codegen contract:**

- [Statements]

````

**Error definition template:**
```markdown
### [CODE]: [Name]

**Message**: `[template with {placeholders}]`

**Primary span**: [What gets highlighted]

**Help**: `[actionable suggestion]`

**Example**:
```kintsu del={N}
[code that triggers error]
````

```

### 3.3 Specification Update Matrix

Create a matrix mapping changes to specs:

| Change | TSY-0001 | TSY-0015 | RFC-0032 | ERR-0018 | SPEC-0024 |
|--------|----------|----------|----------|----------|-----------|
| New type X | Definition | - | Rationale | - | Validation |
| New form Y | - | Rule N | Rationale | Errors | Validation |
| Exclude Z | - | - | Rationale | - | - |

### 3.4 Error Code Planning

For each validation that can fail:

| Code | Name | Trigger | Message |
|------|------|---------|---------|
| KFM20XX | ErrorName | When X happens | Template |

**Error code naming:**
- KFM = Kintsu Form Metadata domain
- Number sequence follows existing codes in ERR-0018

### 3.5 Checklist Completeness

The summary checklist MUST have entries for:
- Every type added (TSY-0001)
- Every form rule added (TSY-0015)
- Every type/form with rationale (RFC-0032)
- Every error code added (ERR-0018)
- Every compilation rule added (SPEC-0024)

---

## Factsets Integration

### During Phase 1 (Context Analysis)
```

search_facts tags=["kintsu", "<domain>"]
search_skills query="<domain>"
add_resources uri="<url>" type="url" tags=[...]
submit_facts content="<research finding>" tags=[...] verified=false

```

### During Phase 2 (Design Iteration)
```

submit_facts content="<design decision>" tags=["design-decision", ...] verified=true
infer_preference key="<pref>" value="<value>" reason="<why>" explicit=true

```

### During Phase 3 (Implementation Planning)
```

submit_execution_logs (for any commands run)
submit_facts content="<implementation detail>" tags=[...] verified=true

```

### After Completion
```

sync_skill name="spec-planning" (if skill file modified)

```

### Fact Tagging Convention

| Tag | When to Use |
|-----|-------------|
| `kintsu` | All Kintsu-related facts |
| `type-system` | Type definitions, semantics |
| `design-decision` | Explicit stakeholder decisions |
| `<type-name>` | Specific type (e.g., `decimal`, `f128`) |
| `excluded` | Explicitly excluded features |
| `standards` | IEEE, ISO references |
| `codegen` | Codegen contract facts |
| `form` | Form attribute facts |

---

## Implementation Document Requirements

### MUST Include

1. **Agent preferences** - Tone, verbosity, style constraints
2. **Design philosophy** - 2-4 guiding principles
3. **Codegen contract** - MAY/MUST/SHOULD per category
4. **Scope: Types to Add** - Table with form requirement, description
5. **Scope: Types Excluded** - Table with rationale for each
6. **Reference URLs** - YAML block for spec frontmatter
7. **Use cases** - Kintsu code examples for each type/form
8. **Per-spec change sections** - With:
   - Frontmatter updates
   - Exact content to add
   - Valid/invalid examples
9. **Error definitions** - Code, name, severity, phase, message, help
10. **Summary checklist** - All changes as checkboxes

### SHOULD Include

11. **Target compatibility table** - For types with limited support
12. **Standards reference table** - Mapping standards to features
13. **Future considerations** - Potential extensions
14. **Type comparison table** - Kintsu vs protobuf/arrow/numpy

### MUST NOT Include

- **Autogenerated file changes** - syntax.json, test-suite.jsonl are generated
- **Actual spec file content** - Provide instructions, not full files
- **Implementation code** - Specs describe behavior, not compiler code

---

## Related Skills

- [specification-workflow](specification-workflow.md) - Creating new specifications
- [quantum-cognitive-workflow](quantum-cognitive-workflow.md) - Problem-solving methodology
- [diagram-generation](diagram-generation.md) - Creating visual aids for specs

---

## Example: Scalar Types Planning Session

**Phase 1 - Context Analysis:**
1. `search_facts tags=["kintsu", "type-system"]` - Found existing type decisions
2. Fetched protobuf.dev, arrow.apache.org, numpy.org documentation
3. `add_resources` for each URL
4. Created gap analysis: i128, u128, f128, decimal, duration found as gaps

**Phase 2 - Design Iteration:**
1. Presented types to add/exclude with rationale
2. Stakeholder: "Add i256/u256 for EVM compatibility"
3. `submit_facts` for EVM decision
4. Stakeholder: "Use named params for decimal form"
5. `submit_facts` for syntax decision
6. Stakeholder: "Hard errors on unsupported targets"
7. `submit_facts` for security decision

**Phase 3 - Implementation Planning:**
1. Created `form-and-core-types-changes.md` implementation guide
2. Defined codegen contracts per type category
3. Mapped all changes to TSY-0001, TSY-0015, RFC-0032, ERR-0018, SPEC-0024
4. Defined 7 new error codes (KFM2015-KFM2021)
5. Created summary checklist with 40+ items
```
