# NewsSnap legacy serving workflow

The API loads an available sequence-classification checkpoint and returns four
topic scores. When weights are absent, it explicitly identifies keyword demo
mode. New training belongs to the maintained AI Engineering Lab project.

```mermaid
flowchart TD
    A["JSON news text"] --> B["Validate size and input shape"]
    B --> C{"Weights available?"}
    C -->|Yes| D["Tokenize and classify"]
    C -->|No| E["Report keyword demo mode"]
    D --> F["Topic scores and model mode"]
    E --> F
    G["Legacy training command"] --> H["Exit with maintained training instructions"]
    I["Supplied evaluation files"] --> J["Validate values and hash files"]
    J --> K{"Explicit upload requested?"}
    K -->|No| L["Print manifest locally"]
    K -->|Yes| M["Publish supplied values and manifest"]
```

## Follow the implementation

- [API and explicit inference mode](src/serving/api.py)
- [Inference handlers](src/serving/inference.py)
- [Training migration entry point](scripts/run_local_pipeline.py)
- [Measured-file publisher](scripts/run_pipeline.py)
- [Publication regression tests](tests/test_artifact_publication.py)
- [Checkpoint provenance and limitations](evidence/provenance.json)
- [Maintained training implementation](https://github.com/Zinga18018/ai-engineering-lab/tree/main/newssnap)

## What this establishes

The legacy scripts no longer reference absent training modules or fabricate
evaluation scores. The recovered checkpoint records **512 training examples**,
not the prepared 96,000-example pool. Its original sampled IDs are missing.
File hashes support traceability, not independent proof of training. No cloud
deployment or fresh model-quality evaluation is established by this diagram.
