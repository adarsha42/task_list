from ninja import NinjaAPI

from tasks.api import router as tasks_router
from users.api import router as users_router

api = NinjaAPI()

api.add_router("/auth/", users_router)
api.add_router("/tasks/", tasks_router)
