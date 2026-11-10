# Stack profile: Python (Django / Flask / FastAPI / scripts)

Run tools inside the project env: `uv run <tool>`, `poetry run <tool>`, or `.venv` bins. Don't install new tools without asking.

Excluded: `.venv/`, `venv/`, `__pycache__/`, `.mypy_cache/`, `.tox/`, `build/`, `dist/`, `*.egg-info/`, `migrations/` (for size/naming).

| Domain | Tools (prefer what exists) | Notes |
|---|---|---|
| types | `mypy --strict` / `pyright --outputjson`, `ruff check --select ANN` | Missing hints on public functions, `Any`, `cast()`, `# type: ignore` without code/reason, raw `dict` at boundaries (use Pydantic/dataclasses/TypedDict) |
| dead | `vulture --min-confidence 80`, `ruff check --select F401,F841,ERA` | `print()`/`breakpoint()`/`pdb` left in code |
| deps | `pip-audit -f json`, `uv pip list --outdated`, `deptry .` | Unpinned deps in apps, dev tools in main deps |
| tests | `pytest -q --cov --cov-report=term-missing` | `@pytest.mark.skip` without reason, bare `assert x`, `time.sleep`, real network |
| secrets | `gitleaks`, Grep | `SECRET_KEY`/`DEBUG=True` in Django settings, keys in `settings.py`/notebooks |
| arch | Grep imports, `import-linter` if configured | Cycles, ORM queries in views/templates, business logic in routers/views |
| naming | `ruff check --select N` | PEP 8: `snake_case` functions/modules, `PascalCase` classes, `UPPER_CASE` constants |
| size | `scripts/measure.mjs` | — |

Framework notes: Django (fat models/services, not fat views; `select_related` for N+1), FastAPI (Pydantic models for I/O, dependencies for auth/db), Flask (blueprints, app factory).

Verify after fixes: `ruff check` → `mypy`/`pyright` → `pytest`.
