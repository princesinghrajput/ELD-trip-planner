# ELD Trip Planner — Backend API

Django REST Framework backend for the ELD Trip Planner application.

## Setup

```bash
# Create virtual environment
uv venv

# Install dependencies
uv pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

## API Endpoints

| Method | Endpoint          | Description               |
| ------ | ----------------- | ------------------------- |
| GET    | `/api/health/`    | Health check              |
| POST   | `/api/plan-trip/` | Plan a trip (coming soon) |

## Tech Stack

- Django 6.x
- Django REST Framework
- django-cors-headers
- python-dotenv
