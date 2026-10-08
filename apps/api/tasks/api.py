from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.security import SessionAuth

from .models import SchedulerConfig, Task
from .schemas import (
    SchedulerConfigOut,
    SchedulerConfigUpdate,
    TaskCreate,
    TaskOut,
    TaskUpdate,
)
import django_rq

from .jobs import send_task_completed_email


router = Router(auth=SessionAuth(csrf=False), tags=["tasks"])


@router.get("/", response=list[TaskOut])
def list_tasks(request):
    return Task.objects.filter(user=request.user)


@router.get("/{task_id}", response=TaskOut)
def get_task(request, task_id: int):
    return get_object_or_404(
        Task,
        id=task_id,
        user=request.user,
    )


@router.post("/", response=TaskOut)
def create_task(request, payload: TaskCreate):
    return Task.objects.create(
        user=request.user,
        **payload.model_dump(),
    )


@router.get("/settings/deadline-notification", response=SchedulerConfigOut)
def get_scheduler_config(request):
    """Get the shared deadline notification timing, in hours."""
    return SchedulerConfig.load()


@router.put("/settings/deadline-notification", response=SchedulerConfigOut)
def update_scheduler_config(request, payload: SchedulerConfigUpdate):
    """Set how many hours before a deadline notifications are sent."""
    config = SchedulerConfig.load()
    config.notify_hours_before = payload.notify_hours_before
    config.save()
    return config


@router.put("/{task_id}", response=TaskOut)
def update_task(request, task_id: int, payload: TaskUpdate):
    task = get_object_or_404(
        Task,
        id=task_id,
        user=request.user,
    )

    for field, value in payload.model_dump().items():
        setattr(task, field, value)

    task.save()

    return task


@router.delete("/{task_id}")
def delete_task(request, task_id: int):
    task = get_object_or_404(
        Task,
        id=task_id,
        user=request.user,
    )

    task.delete()

    return {"success": True}


@router.post("/{task_id}/complete", response=TaskOut)
def complete_task(request, task_id: int):
    task = get_object_or_404(
        Task,
        id=task_id,
        user=request.user,
    )

    task.status = Task.Status.COMPLETED
    task.save(update_fields=["status"])
    queue = django_rq.get_queue("default")
    queue.enqueue(
        send_task_completed_email,
        task.id,
    )

    return task
