"""Adapt recorded metric field names to the dashboard without creating scores."""


def dashboard_history(payload: dict | list) -> dict:
    rows = payload if isinstance(payload, list) else payload.get("metrics", [])
    aliases = {"train_accuracy": "train_acc", "val_accuracy": "val_acc"}
    normalized = []
    for row in rows:
        converted = dict(row)
        for original, display in aliases.items():
            if original in row and display not in row:
                converted[display] = row[original]
        normalized.append(converted)
    return {**(payload if isinstance(payload, dict) else {}), "metrics": normalized}
