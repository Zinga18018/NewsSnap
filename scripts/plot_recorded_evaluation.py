"""Plot the archived NewsSnap confusion matrix; no training or network calls."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import math
import os
import re
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evidence/evaluation_results.json"
OUTPUT = ROOT / "docs/images/recorded-confusion-matrix.svg"
SOURCE_SHA256 = "467ccbb0f6cdbd2d09721f7f5a6c7857db5581a52217203b443caad8ba632385"


def recorded_counts():
    raw = SOURCE.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise ValueError("Evaluation record changed; review its provenance before plotting.")
    record = json.loads(raw)
    labels, counts = record["label_names"], record["confusion_matrix"]
    assert labels == ["World", "Sports", "Business", "Sci/Tech"]
    assert len(counts) == 4 and all(len(row) == 4 for row in counts)
    assert all(type(n) is int and n >= 0 for row in counts for n in row)
    assert sum(map(sum, counts)) == record["test_samples"] == 12000
    assert all(sum(row) == record["classification_report"][label]["support"] for row, label in zip(counts, labels))
    accuracy = sum(counts[i][i] for i in range(4)) / 12000
    assert math.isclose(accuracy, record["classification_report"]["accuracy"], abs_tol=1e-12)
    return labels, counts


def render(png=None):
    labels, counts = recorded_counts()
    os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "newssnap-mpl"))
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    if matplotlib.__version__ != "3.10.8":
        raise RuntimeError("Use requirements-visuals.txt for reproducible rendering.")
    with plt.rc_context({"font.family": "DejaVu Sans", "font.size": 11,
                         "svg.fonttype": "none", "svg.hashsalt": "newssnap-recorded-evaluation",
                         "axes.spines.top": False, "axes.spines.right": False}):
        fig, ax = plt.subplots(figsize=(6.4, 5.3), layout="constrained")
        im = ax.imshow(counts, cmap="Blues", vmin=0, vmax=3000)
        ax.set(xticks=range(4), xticklabels=labels, yticks=range(4), yticklabels=labels,
               xlabel="Predicted topic", ylabel="Recorded topic",
               title="Recorded test confusion matrix (12,000 examples)")
        ax.tick_params(length=0)
        for i, row in enumerate(counts):
            for j, value in enumerate(row):
                ax.text(j, i, str(value), ha="center", va="center",
                        color="white" if value > 1500 else "#222222", fontsize=12)
        fig.colorbar(im, ax=ax, shrink=.82, label="Examples")
        buf = io.StringIO()
        fig.savefig(buf, format="svg", metadata={"Date": None}, facecolor="white")
        if png:
            fig.savefig(png, dpi=160, facecolor="white")
        plt.close(fig)
    svg = buf.getvalue().replace('<svg ', '<svg role="img" aria-labelledby="title desc" ', 1)
    match = re.search(r"<svg\b[^>]*>", svg)
    description = ('<title id="title">Recorded NewsSnap confusion matrix</title>'
                   '<desc id="desc">Counts from the February 2026 archived evaluation: '
                   '12,000 examples, 3,000 per topic. This is a project-created AG News split '
                   'with unresolved overlap history, not a new or leakage-free evaluation.</desc>')
    svg = svg[:match.end()] + description + svg[match.end():]
    ET.fromstring(svg)
    return svg.encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--png", type=Path, help="Optional local review image")
    args = parser.parse_args()
    data = render(args.png)
    if args.check:
        assert OUTPUT.read_bytes() == data, "The SVG differs from fresh Matplotlib output."
        print("PASS: pinned evidence, all 16 counts, sample total, accuracy and exact SVG rerender")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(data)
        print(OUTPUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
