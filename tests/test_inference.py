"""Tests for inference handler functions."""

import json
import pytest

from src.serving.inference import input_fn, output_fn


class TestInputFn:
    def test_single_string_input(self):
        body = json.dumps("Hello world")
        result = input_fn(body)
        assert result["texts"] == ["Hello world"]

    def test_list_input(self):
        body = json.dumps(["text one", "text two"])
        result = input_fn(body)
        assert len(result["texts"]) == 2

    def test_dict_input_with_text_key(self):
        body = json.dumps({"text": "Hello"})
        result = input_fn(body)
        assert result["texts"] == ["Hello"]

    def test_dict_input_with_text_list(self):
        body = json.dumps({"text": ["Hello", "World"]})
        result = input_fn(body)
        assert len(result["texts"]) == 2

    def test_unsupported_content_type_raises(self):
        with pytest.raises(ValueError):
            input_fn("text", "text/plain")


class TestOutputFn:
    def test_json_output(self):
        prediction = [{"label": 0, "text": "test"}]
        result = output_fn(prediction)
        assert json.loads(result) == prediction

    def test_unsupported_type_raises(self):
        with pytest.raises(ValueError):
            output_fn([], "text/xml")
