"""
Input Validation and Configuration Validation Utilities
Ensures data integrity and proper configuration at runtime.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional


class ValidationError(ValueError):
    """Custom exception for validation failures."""
    pass


def validate_file_exists(path: str, name: str = "File") -> Path:
    """
    Validate that a file exists.

    Args:
        path: Path to file
        name: Name for error message

    Returns:
        Path object if valid

    Raises:
        ValidationError: If file doesn't exist
    """
    p = Path(path)
    if not p.exists():
        raise ValidationError(f"{name} not found: {path}")
    if not p.is_file():
        raise ValidationError(f"{name} is not a file: {path}")
    return p


def validate_directory_exists(path: str, name: str = "Directory", create: bool = False) -> Path:
    """
    Validate that a directory exists (optionally create it).

    Args:
        path: Path to directory
        name: Name for error message
        create: Create directory if missing

    Returns:
        Path object if valid or created

    Raises:
        ValidationError: If directory doesn't exist and create=False
    """
    p = Path(path)
    if not p.exists():
        if create:
            p.mkdir(parents=True, exist_ok=True)
            return p
        raise ValidationError(f"{name} not found: {path}")
    if not p.is_dir():
        raise ValidationError(f"{name} is not a directory: {path}")
    return p


def validate_env_vars(required_vars: List[str]) -> Dict[str, str]:
    """
    Validate that required environment variables are set.

    Args:
        required_vars: List of variable names

    Returns:
        Dict of variable names to values

    Raises:
        ValidationError: If any required variable is missing
    """
    missing = []
    result = {}

    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing.append(var)
        else:
            result[var] = value

    if missing:
        raise ValidationError(f"Missing required environment variables: {', '.join(missing)}")

    return result


def validate_numeric_range(value: Any, min_val: Optional[float] = None,
                           max_val: Optional[float] = None, name: str = "Value") -> float:
    """
    Validate that a value is numeric and within range.

    Args:
        value: Value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        name: Name for error message

    Returns:
        Converted float value

    Raises:
        ValidationError: If value is invalid or out of range
    """
    try:
        num = float(value)
    except (ValueError, TypeError):
        raise ValidationError(f"{name} must be numeric, got: {value}")

    if min_val is not None and num < min_val:
        raise ValidationError(f"{name} must be >= {min_val}, got: {num}")
    if max_val is not None and num > max_val:
        raise ValidationError(f"{name} must be <= {max_val}, got: {num}")

    return num


def validate_text(text: str, min_length: int = 1, max_length: Optional[int] = None,
                  name: str = "Text") -> str:
    """
    Validate text input.

    Args:
        text: Text to validate
        min_length: Minimum length
        max_length: Maximum length
        name: Name for error message

    Returns:
        Validated text

    Raises:
        ValidationError: If text is invalid
    """
    if not isinstance(text, str):
        raise ValidationError(f"{name} must be a string, got: {type(text)}")

    text = text.strip()

    if len(text) < min_length:
        raise ValidationError(f"{name} must be at least {min_length} characters")
    if max_length and len(text) > max_length:
        raise ValidationError(f"{name} cannot exceed {max_length} characters")

    return text


def validate_list_items(items: List, item_type: type, name: str = "List") -> List:
    """
    Validate that all items in a list are of a specific type.

    Args:
        items: List to validate
        item_type: Expected type of items
        name: Name for error message

    Returns:
        Validated list

    Raises:
        ValidationError: If any item is wrong type
    """
    if not isinstance(items, list):
        raise ValidationError(f"{name} must be a list, got: {type(items)}")

    for i, item in enumerate(items):
        if not isinstance(item, item_type):
            raise ValidationError(
                f"{name}[{i}] must be {item_type.__name__}, got: {type(item)}"
            )

    return items


def validate_config_dict(config: Dict, required_keys: List[str], name: str = "Config") -> Dict:
    """
    Validate a configuration dictionary.

    Args:
        config: Configuration dict
        required_keys: Required keys
        name: Name for error message

    Returns:
        Validated config

    Raises:
        ValidationError: If required keys are missing
    """
    if not isinstance(config, dict):
        raise ValidationError(f"{name} must be a dictionary, got: {type(config)}")

    missing = [k for k in required_keys if k not in config]
    if missing:
        raise ValidationError(f"{name} missing required keys: {', '.join(missing)}")

    return config
