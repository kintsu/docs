from docs.auto.types import Spec


def test_spec_from_md():
    md = """
---
kind: "AD"
number: 1
title: "Test Specification"
created: "2024-06-10"
components: ["compiler"]
author: "testgh"
version_after: "0.1.0"
updates: []
---
"""
    s = Spec.from_markdown_head(md)

    assert s.kind == "AD"
    assert s.number == 1
    assert s.title == "Test Specification"
    assert s.created == "2024-06-10"
    assert s.components == ["compiler"]
    assert s.author == "testgh"
    assert s.version_after == "0.1.0"
    assert s.updates == []

    md_out = s.as_markdown_head()
    in_md = Spec.from_markdown_head(md_out)
    assert in_md == s
