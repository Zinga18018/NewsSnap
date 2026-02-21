"""Centralized logging configuration for app modules."""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional, Union


DEFAULT_LOG_LEVEL = "INFO"
DEFAULT_LOG_DIR = "logs"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def _resolve_level(level: Union[str, int, None]) -> int:
    """Normalize string/int levels to a valid logging level."""
    if level is None:
        level = os.getenv("LOG_LEVEL", DEFAULT_LOG_LEVEL)
    if isinstance(level, int):
        return level
    return getattr(logging, str(level).upper(), logging.INFO)


def setup_logging(
    name: str,
    level: Union[str, int, None] = None,
    log_dir: Optional[str] = None,
    propagate: bool = False,
) -> logging.Logger:
    """
    Configure and return a logger instance.

    Args:
        name: Logger name (typically __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL), int, or None
        log_dir: Directory for log files (falls back to LOG_DIR env var, then "logs")
        propagate: Whether records should bubble up to parent loggers
    """
    logger = logging.getLogger(name)
    logger.setLevel(_resolve_level(level))
    logger.propagate = propagate

    # Idempotent setup for repeat imports.
    if getattr(logger, "_llmops_configured", False):
        return logger

    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logger.level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    resolved_log_dir = log_dir or os.getenv("LOG_DIR", DEFAULT_LOG_DIR)
    try:
        Path(resolved_log_dir).mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            Path(resolved_log_dir) / f"{name.replace('.', '_')}.log",
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(logger.level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except OSError as exc:
        logger.warning("File logging disabled for %s: %s", name, exc)

    logger._llmops_configured = True  # type: ignore[attr-defined]
    return logger


def get_logger(
    name: str,
    level: Union[str, int, None] = None,
    log_dir: Optional[str] = None,
) -> logging.Logger:
    """Convenience alias that ensures centralized logger setup is applied."""
    return setup_logging(name=name, level=level, log_dir=log_dir)
