"""Locate maintained training; stop before downloading or changing artifacts."""
import argparse

TRAINING_URL = "https://github.com/Zinga18018/ai-engineering-lab/tree/main/newssnap"
MIGRATION_MESSAGE = (
    "Training has moved to the maintained NewsSnap project:\n"
    f"{TRAINING_URL}\n"
    "Clone ai-engineering-lab, change into newssnap, then run:\n"
    "  uv sync --group dev\n"
    "  uv run python -m src.models.train --help\n"
    "Follow that README to prepare data and choose a run size.\n"
    "This legacy checkout supports the inference API and clients."
)


def main() -> int:
    parser = argparse.ArgumentParser(description=MIGRATION_MESSAGE,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.parse_known_args()
    print(MIGRATION_MESSAGE)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
