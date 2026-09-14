"""The legacy checkout must give useful guidance without starting a partial run."""
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize("script", ["run_local_pipeline.py", "trigger_training.py"])
def test_retired_training_entrypoint_has_no_data_or_cloud_side_effects(tmp_path, script):
    completed = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / script)],
        cwd=tmp_path, capture_output=True, text=True, check=False,
    )
    assert completed.returncode == 2
    assert "ai-engineering-lab/tree/main/newssnap" in completed.stdout
    assert "uv run python -m src.models.train --help" in completed.stdout
    assert list(tmp_path.iterdir()) == []
