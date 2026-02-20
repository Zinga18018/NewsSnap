"""Tests for model training utilities."""

import pytest
import torch
from unittest.mock import MagicMock, patch

from src.models.train import TextClassificationDataset


class TestTextClassificationDataset:
    @pytest.fixture
    def mock_tokenizer(self):
        tokenizer = MagicMock()
        tokenizer.return_value = {
            "input_ids": torch.ones(3, 128, dtype=torch.long),
            "attention_mask": torch.ones(3, 128, dtype=torch.long),
        }
        return tokenizer

    def test_dataset_length(self, mock_tokenizer):
        texts = ["text one", "text two", "text three"]
        labels = [0, 1, 2]
        dataset = TextClassificationDataset(texts, labels, mock_tokenizer, max_length=128)
        assert len(dataset) == 3

    def test_dataset_item_shape(self, mock_tokenizer):
        texts = ["text one", "text two"]
        labels = [0, 1]
        dataset = TextClassificationDataset(texts, labels, mock_tokenizer, max_length=128)

        item = dataset[0]
        assert "input_ids" in item
        assert "attention_mask" in item
        assert "labels" in item
        assert item["input_ids"].shape == (128,)
        assert item["labels"].dtype == torch.long

    def test_labels_are_correct(self, mock_tokenizer):
        texts = ["a", "b", "c"]
        labels = [3, 1, 0]
        dataset = TextClassificationDataset(texts, labels, mock_tokenizer, max_length=128)

        assert dataset[0]["labels"].item() == 3
        assert dataset[1]["labels"].item() == 1
        assert dataset[2]["labels"].item() == 0
