import os
import subprocess
import sys


def _is_enabled(env_var: str, default: str = "true") -> bool:
    return os.getenv(env_var, default).strip().lower() in {"1", "true", "yes", "on"}


def _run_step(name: str, command: list[str], enabled: bool) -> None:
    if not enabled:
        print(f"[bootstrap] Skipping {name}.")
        return

    print(f"[bootstrap] Running {name}: {' '.join(command)}")
    subprocess.run(command, check=True)
    print(f"[bootstrap] Completed {name}.")


def main() -> int:
    try:
        _run_step(
            "database migrations",
            ["alembic", "upgrade", "head"],
            enabled=_is_enabled("RUN_DB_MIGRATIONS_ON_STARTUP", "true"),
        )
        _run_step(
            "database seed",
            [sys.executable, "scripts/seed_data.py"],
            enabled=_is_enabled("RUN_DB_SEED_ON_STARTUP", "true"),
        )
        return 0
    except subprocess.CalledProcessError as exc:
        print(f"[bootstrap] Failed with exit code {exc.returncode}.")
        return exc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
