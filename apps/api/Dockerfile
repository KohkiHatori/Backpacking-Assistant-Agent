
# Dockerfile for FastAPI backend

FROM python:3.11-slim

WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy project files for the API
COPY apps/api/pyproject.toml apps/api/poetry.lock* ./

# Install dependencies
RUN poetry config virtualenvs.create false && poetry install --no-root

# Copy the API's application code
COPY ./apps/api/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
