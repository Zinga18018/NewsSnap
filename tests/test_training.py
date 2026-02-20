"""Tests for model training utilities."""

import pytest


class TestTextClassificationDataset:
    """Test the dataset class independently to avoid heavy torch/transformers imports."""

    def test_import_config(self):
        """Verify config module loads correctly."""
        import config
        assert config.NUM_LABELS == 4
        assert config.MODEL_NAME == "distilbert-base-uncased"
        assert config.BATCH_SIZE == 32

    def test_label_map(self):
        """Verify AG News label mapping."""
        import config
        assert config.LABEL_MAP[0] == "World"
        assert config.LABEL_MAP[1] == "Sports"
        assert config.LABEL_MAP[2] == "Business"
        assert config.LABEL_MAP[3] == "Sci/Tech"
        assert len(config.LABEL_MAP) == 4

    def test_training_hyperparameters(self):
        """Verify hyperparameter defaults."""
        import config
        assert config.LEARNING_RATE == 2e-5
        assert config.NUM_EPOCHS == 3
        assert config.MAX_SEQ_LENGTH == 128

    def test_dataset_class_importable(self):
        """Test that the dataset module is importable (may skip on torch issues)."""
        try:
            from src.models.train import TextClassificationDataset
            assert TextClassificationDataset is not None
        except ImportError as e:
            if "torch" in str(e).lower() or "transformers" in str(e).lower():
                pytest.skip(f"torch/transformers not available on this Python version: {e}")
            raise

    def test_data_files_exist(self):
        """Verify processed data files exist after preprocessing."""
        import os
        processed_dir = os.path.join("data", "processed")
        if os.path.exists(processed_dir):
            assert os.path.exists(os.path.join(processed_dir, "train.jsonl"))
            assert os.path.exists(os.path.join(processed_dir, "val.jsonl"))
            assert os.path.exists(os.path.join(processed_dir, "test.jsonl"))
        else:
            pytest.skip("Processed data not yet available")
