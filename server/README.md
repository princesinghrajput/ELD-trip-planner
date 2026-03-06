# ELD Trip Planner - Backend API

Django REST Framework backend for the ELD Trip Planner application.

## Setup

~~~bash
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
~~~

## API Endpoints

| Method | Endpoint | Description |
| ------ | ----------------- | ------------------------- |
| GET    | /api/health/    | Health check              |
| POST   | /api/plan-trip/ | Plans the route and daily HOS log |

## Render deployment

1. Create a Web Service in Render that builds from this server directory.
2. Set environment variables from .env.example (production values only). Provide DJANGO_SECRET_KEY, OPENROUTESERVICE_API_KEY, and update DJANGO_ALLOWED_HOSTS if you own a custom domain.
3. Render automatically injects RENDER_EXTERNAL_HOSTNAME. The app reads that value and appends it to ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, and CORS_ALLOWED_ORIGINS, so hitting https://<your-service>.onrender.com/api/health/ will no longer return Bad Request (400).
4. Redeploy after changing env vars or code. Use the /api/health/ endpoint to confirm the container is serving traffic.

## Tech Stack

- Django 4.2
- Django REST Framework
- django-cors-headers
- python-dotenv
