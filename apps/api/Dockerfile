# ---- Build stage ----
FROM python:3.12-slim AS builder

# uv install
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy workspace manifests before source code so dependency layers can be cached
COPY pyproject.toml uv.lock ./
COPY apps/api/pyproject.toml ./apps/api/pyproject.toml

# Install the backend's locked dependencies into the root workspace venv
RUN uv sync --frozen --package backend --no-dev

# The backend is a source application, so it needs no package build step
COPY apps/api ./apps/api


FROM python:3.12-slim AS runtime

WORKDIR /app/apps/api

# Copy the Python environment and backend source into the runtime image
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/apps/api /app/apps/api

# Create the data directory for the SQLite volume mount
RUN mkdir -p /app/data

# Place the venv's bin at the front of PATH
ENV PATH="/app/.venv/bin:$PATH"

# settings
ENV DJANGO_SETTINGS_MODULE=config.settings

EXPOSE 8000

# Check that model changes have migrations, apply them, then start the dev server
CMD ["sh", "-c", "python manage.py makemigrations --check --dry-run --noinput && python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
