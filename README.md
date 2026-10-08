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

To see the frontend app open up localhost:5173.

