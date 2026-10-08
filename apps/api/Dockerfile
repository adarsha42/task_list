# ---- Build stage ----
FROM python:3.12-slim AS builder

# uv install
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies into the project venv
RUN uv sync --frozen --no-install-project

# Copy the rest of the application code
COPY . .

# Sync again to install the project itself
RUN uv sync --frozen


FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy the entire app 
COPY --from=builder /app /app

# Create the data directory for the SQLite volume mount
RUN mkdir -p /app/data

# Place the venv's bin at the front of PATH
ENV PATH="/app/.venv/bin:$PATH"

# settings
ENV DJANGO_SETTINGS_MODULE=config.settings

EXPOSE 8000

# Run migrations then start the dev server
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
