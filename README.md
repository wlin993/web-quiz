# Web Quiz

A full-stack quiz app built with FastAPI and React. No login required — sessions are tracked via a cookie.

## Features

- Browse and create quizzes with any number of questions and options
- Take quizzes with a progress bar and free question navigation
- See your score and a full answer review after submitting
- History page showing all past attempts (persisted by session cookie)

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite |
| Frontend | React, TypeScript, Vite |
| Package mgmt | uv (Python), npm (Node) |
| Deployment | Docker, nginx |

## Development

**Prerequisites:** Python 3.13+, Node 22+, [uv](https://github.com/astral-sh/uv)

```bash
# Install dependencies
cd backend && uv sync && cd ..
cd frontend && npm install && cd ..

# Start both servers (backend :8000, frontend :5173)
./dev.sh
```

Seed sample quizzes (optional, requires backend running):

```bash
cd backend && uv run python seed.py
```

## Deployment

**Prerequisites:** Docker, Docker Compose

```bash
docker compose up -d
```

App runs at **http://localhost** (port 80). The SQLite database is persisted in a Docker volume.

```bash
docker compose down       # stop (data preserved)
docker compose down -v    # stop and wipe database
docker compose logs -f    # view logs
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./quiz.db` | SQLAlchemy DB connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

## Project Structure

```
web-quiz/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── database.py      # DB setup
│   └── seed.py          # Sample data
├── frontend/
│   └── src/
│       ├── api/         # API client
│       └── pages/       # Home, CreateQuiz, TakeQuiz, Results, History
├── docker-compose.yml
└── dev.sh               # Dev startup script
```
