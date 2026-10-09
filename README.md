# Task List Project

A minimal task manager with a React and TypeScript frontend utilizing Tanstack Router for
routing and TanStack Query for managing data from the backend, a Django API,
and RQ jobs and RQ scheduler for completion emails and approaching-deadline reminders.

## Monorepo and workspaces

The frontend and backend live in one Git repository, with dependency management
coordinated from the repository root:

```text
task_list_project/
├── pyproject.toml          # uv workspace: apps/api
├── uv.lock                 # Python dependencies for the whole uv workspace
├── package.json            # Root commands and pinned pnpm version
├── pnpm-workspace.yaml     # pnpm workspace: apps/web
├── pnpm-lock.yaml          # JavaScript dependencies for the pnpm workspace
├── .dockerignore           # Exclusions for both Docker build contexts
├── docker-compose.yml
└── apps/
    ├── api/
    │   ├── pyproject.toml  # Backend's own Python dependencies
    │   ├── Dockerfile
    │   └── manage.py
    └── web/
        ├── package.json   # Frontend's own dependencies and scripts
        ├── Dockerfile
        └── src/
```

A monorepo keeps related applications together so an API change and the matching
UI change can be reviewed and committed together. A workspace tells a package
manager which projects belong together. uv manages the Python projects; pnpm
manages the JavaScript projects. Each app keeps its dependency declarations,
while each package manager resolves them into one root lockfile.

The root `pyproject.toml` declares `apps/api` as a uv member named `backend`.
The root is a workspace configuration, with no Python application of its own.
uv installs Python dependencies into the root `.venv`, and `--package backend`
selects the backend. The Django application runs directly from its source, so
`package = false` avoids building or installing it as a Python distribution.

`pnpm-workspace.yaml` declares `apps/web` as a member named `@task-list/web`.
The root `package.json` pins pnpm to 11.9.0 and provides commands such as
`pnpm build` and `pnpm dev:web`, which delegate to that member's scripts.
`--filter @task-list/web` selects the frontend; pnpm runs its scripts from the
frontend directory.

This gives contributors consistent installation commands, reproducible locked
dependencies, and a place to add shared libraries later. A future JavaScript
library can be linked with a `workspace:*` dependency; a Python library can use
uv's workspace sources. Add those directories to the relevant workspace's
member list. All Python members must resolve compatible dependency requirements
because they share a lockfile and development environment.
If an app depends on a new local library, also copy that library's manifest and
source in the relevant Dockerfile.

Commit both root lockfiles when dependencies change. There are no app-local
lockfiles now. Existing `apps/api/.venv` environments are no longer used by the
documented uv commands; the workspace environment is `.venv` at the root.

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

## How the workspace changes Docker builds

Both Docker build contexts are the repository root (`context: .`). The
Dockerfiles remain beside their applications, selected with
`dockerfile: apps/api/Dockerfile` and `dockerfile: apps/web/Dockerfile`.
Docker's `COPY` source paths are relative to the build context, so an app-only
context could not access the new root manifests or lockfiles.

The backend builder copies the root uv files and the backend manifest first,
then runs `uv sync --frozen --package backend --no-dev`. It copies the backend
source afterward. The runtime image contains `/app/.venv` and
`/app/apps/api`, with `/app/apps/api` as its working directory. This keeps the
existing `python manage.py ...` commands working for Django and the workers.
The database stays at `/app/data/db.sqlite3` in the existing SQLite volume.

The frontend copies the root pnpm files and frontend manifest first, then runs
`pnpm install --frozen-lockfile --filter @task-list/web`. It copies frontend
source afterward and starts Vite from `/app/apps/web`. The root pnpm dependency
store and member links remain in the image so frontend packages can be resolved.

Copying dependency manifests before source lets Docker reuse dependency layers
when only application code changes. Frozen installs use the committed lockfiles;
the backend startup also checks that model changes have migrations. The root
`.dockerignore` excludes host environments, `node_modules`, build output,
database files, and `.env` files from the build context. Compose still supplies
environment variables at runtime.

The services continue communicating through the Compose network: browser to
Vite, Vite to `backend:8000`, and backend/worker/scheduler to `redis:6379`.
Workspace configuration controls dependencies and builds; Compose controls
containers, networking, startup order, ports, and volumes.

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

## Local workspace commands

With Python 3.12+, uv, Node 24+, and pnpm 11.9.0 installed, run from the
repository root:

```bash
uv sync --all-packages --locked
pnpm install --frozen-lockfile
pnpm check:api
pnpm build
pnpm lint
```

For local development, run `pnpm migrate`, then `pnpm dev:api` and
`pnpm dev:web` in separate terminals. Django's local database is
`apps/api/db.sqlite3`. Local API email jobs need Redis and an RQ worker;
`docker compose up --build` runs the complete stack with those services.
uv commands do not automatically load the root `.env`; export the needed
environment variables when running the API directly on your host.

To add a dependency to the appropriate application:

```bash
uv add --package backend <python-package>
pnpm --filter @task-list/web add <javascript-package>
```

These commands update the member manifest and its package manager's root
lockfile. Root scripts are conveniences; you can also run commands directly,
for example `uv run --package backend python apps/api/manage.py makemigrations`
or `pnpm --filter @task-list/web build`.

## For running frontend outside of docker

If you want Vite on your host machine, start the API services without the
frontend container:

```bash
docker compose up -d --build backend rq-worker rq-scheduler deadline-scheduler
pnpm install --frozen-lockfile
pnpm dev:web
```

If the frontend container is already running, stop it with
`docker compose stop frontend` first to free port 5173. Outside Docker, Vite's
proxy defaults to `http://127.0.0.1:8000`. Inside Docker, Compose sets
`API_PROXY_TARGET=http://backend:8000`.

## Deadline times in reminder emails

The task form interprets deadlines in your browser's local timezone and saves
that timezone with the task. Reminder emails show the deadline in that timezone,
including its name and UTC offset. Deadlines stay stored as UTC instants so the
scheduler can compare them consistently.

Tasks created before this change have no recorded local timezone and default
to UTC. Edit and save an existing task in the frontend to record your browser's
timezone for its reminder emails.
