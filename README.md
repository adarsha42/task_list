## Task_List Project

Create a simple to-do list with features like:
- Create, Read, Update and Delete tasks
- Set assignee and deadlines for tasks
- Send mail when task is completed and when the task is approaching deadline 


## Steps to run

- Make an .env file(see env.example for reference) on the root directory
- Run the commands below
```bash
docker compose up --build
```
- Test from url: http://127.0.0.1:8000/api/docs

### Frontend

With the backend running, start the frontend in another terminal:

```bash
cd apps/web
pnpm install
pnpm dev
```

Open http://localhost:5173 and sign in with a username or email. The current API
creates an account automatically if needed. Create, edit, complete, and delete
tasks on the Tasks page. Completing a task queues its email notification through
the API. Set the shared notification window on the Notification settings page.
Deadlines are entered and displayed in your browser's local time.

Vite proxies `/api` to `http://127.0.0.1:8000`, keeping session cookies on the
frontend origin. Rebuild the backend after API changes with
`docker compose up -d --build`.

Run `pnpm build` and `pnpm lint` in `apps/web` to validate the frontend. For a
production deployment, serve `apps/web/dist`, route `/api` to Django on the same
origin, and fall back to `index.html` for client routes such as `/settings`.
