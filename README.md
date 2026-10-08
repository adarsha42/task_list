# Task List Project

A minimal task manager with a React and TypeScript frontend utilizing Tanstack Router for
routing and Tanstack queue for managing data from the backend, a Django API,
and RQ jobs and RQ scheduler for completion emails and approaching-deadline reminders.

## Running the app

Create `.env` in the repository root using `.env.example` as a template. Set
`EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` for email delivery.

From the repository root, start every service with command:

```bash
docker compose up --build
```

To run in the background instead:

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- API documentation: http://localhost:8000/api/docs

Node, pnpm, Python, and the application dependencies are installed inside the
images. No seperate `pnpm dev` is needed. Plain `docker compose up`
starts the existing images and builds images that do not exist yet. Use
`--build` after saving source or dependency changes so the containers get them.
If another frontend process already uses port 5173, stop it before starting
Compose.

## How the services connect

| Service | Role |
| --- | --- |
| `frontend` | Vite serves the UI on port 5173 and forwards `/api` requests to Django. |
| `backend` | Django runs migrations, then serves the API on port 8000. |
| `redis` | Stores queued and scheduled jobs. |
| `rq-worker` | Runs email and deadline-check jobs. |
| `rq-scheduler` | Moves due scheduled jobs into the queue. |
| `deadline-scheduler` | Registers the repeating deadline check every 60 seconds, then exits successfully. |

Compose puts the services on one network. Containers reach each other using
service names: Vite connects to `http://backend:8000`, and the API and workers
connect to `redis://redis:6379/0`.

The browser sends API requests to the frontend origin, for example
`http://localhost:5173/api/tasks/`. Vite proxies these to
`http://backend:8000/api/tasks/`. The UI includes session cookies in requests.
Django accepts the internal `backend` host through `DJANGO_ALLOWED_HOSTS`.

Redis must pass its health check before the backend starts. The backend must
respond successfully at `/api/openapi.json` before the frontend, worker, and
deadline registration service start. Docker Compose manages this order
so that the backend does not launch the frontend. 

The existing `sqlite_data` and `redis_data` volumes preserve database and queue
data across container replacements.

## Using the app

User can login(without any password) and use the todo list app. One user can't see the task 
created by other user.
Users can also adjust the the timing before which they get the deadline notification through
Notification Settings.

## Useful commands

```bash
docker compose ps --all
docker compose logs -f frontend backend rq-worker
docker compose down
```

`docker compose down` stops the stack and preserves named volumes. Adding `-v`
would delete those volumes and their data.


## Commands useful for migrations
```bash
docker compose up -d --build
docker compose exec backend python manage.py showmigrations tasks
```
All task migrations should show `[X]`. 

## For running frontend outside of docker

If you want Vite on your host machine, start the API services without the
frontend container:

```bash
docker compose up -d --build backend rq-worker rq-scheduler deadline-scheduler
cd apps/web
pnpm install
pnpm dev
```

If the frontend container is already running, stop it with
`docker compose stop frontend` first to free port 5173. Outside Docker, Vite's
proxy defaults to `http://127.0.0.1:8000`. Inside Docker, Compose sets
`API_PROXY_TARGET=http://backend:8000`.
