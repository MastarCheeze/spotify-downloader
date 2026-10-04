FROM python:3.14-slim

# Copy uv binary directly from Astral's official image (recommended method)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY pyproject.toml ./
COPY uv.lock ./
RUN uv sync --no-dev --frozen || uv sync --no-dev

# Download spotdl dependencies
ENV PATH="/app/.venv/bin:$PATH"
RUN spotdl --download-ffmpeg && spotdl --download-deno

COPY . /app

EXPOSE 8000
CMD ["python", "main.py"]
