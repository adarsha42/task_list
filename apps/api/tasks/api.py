from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.security import SessionAuth

from .models import Task
from .schemas import TaskCreate, TaskUpdate, TaskOut


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

    return task
