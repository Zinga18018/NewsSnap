"""Tests for data preprocessing module."""

import json
import os
import tempfile

import pandas as pd
import pytest

from src.data.preprocessing import clean_text, load_jsonl, create_splits


class TestCleanText:
    def test_removes_extra_whitespace(self):
        assert clean_text("hello   world") == "hello world"

    def test_returns_empty_for_short_text(self):
        assert clean_text("hi") == ""

    def test_handles_none(self):
        assert clean_text(None) == ""

    def test_normal_text_unchanged(self):
        text = "This is a normal news article about technology."
        assert clean_text(text) == text


class TestLoadJsonl:
    def test_loads_valid_jsonl(self, tmp_path):
        filepath = tmp_path / "test.jsonl"
        records = [
            {"text": "Article one", "label": 0},
            {"text": "Article two", "label": 1},
        ]
        with open(filepath, "w") as f:
            for r in records:
                f.write(json.dumps(r) + "\n")

        df = load_jsonl(str(filepath))
        assert len(df) == 2
        assert list(df.columns) == ["text", "label"]


class TestCreateSplits:
    def test_split_proportions(self):
        df = pd.DataFrame({
            "text": [f"text {i}" for i in range(100)],
            "label": [i % 4 for i in range(100)],
        })

        train_df, val_df, test_df = create_splits(df, val_size=0.1, test_size=0.1)

        assert len(train_df) + len(val_df) + len(test_df) == 100
        assert len(test_df) == 10  # 10%
        assert len(val_df) == 10   # ~10% of remaining

    def test_stratification(self):
        df = pd.DataFrame({
            "text": [f"text {i}" for i in range(200)],
            "label": [i % 4 for i in range(200)],
        })

        train_df, val_df, test_df = create_splits(df)

        # Each split should have all 4 labels
        assert set(train_df["label"].unique()) == {0, 1, 2, 3}
        assert set(val_df["label"].unique()) == {0, 1, 2, 3}
        assert set(test_df["label"].unique()) == {0, 1, 2, 3}
