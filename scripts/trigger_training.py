"""Compatibility entry point for the retired training launcher."""
try:
    from .run_local_pipeline import main
except ImportError:  # Direct script execution.
    from run_local_pipeline import main


if __name__ == "__main__":
    raise SystemExit(main())
